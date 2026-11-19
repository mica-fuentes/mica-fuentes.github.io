/* =========================================================
   Vigente · demo web — clientes, alta, onboarding, importación,
   ficha del cliente y documentación pendiente
   ========================================================= */
(function () {
  const V = window.V, W = V.web, Q = V.q, A = V.act, D = V.date, U = V.ui;
  const { esc, badge, shape, avatar } = U;
  const ui = W.ui;
  ui.cfilter = 'todos';

  /* ---------- utilidades ---------- */
  const keyOf = (t) => /^IVA/.test(t.name) ? 'iva' : /^IIBB/.test(t.name) ? 'iibb-' + String(t.org || '').toLowerCase() : /anual/i.test(t.name) ? 'gan-anual' : /^Ganancias/.test(t.name) ? 'gan' : /monotributo/i.test(t.name) ? 'mono' : /Recateg/i.test(t.name) ? 'recat' : /^Aportes/.test(t.name) ? 'aportes' : /^Presentaciones/.test(t.name) ? 'info' : /^Bienes/.test(t.name) ? 'bp' : t.name;
  function formatCuit(raw) {
    const d = String(raw || '').replace(/\D/g, '');
    if (d.length !== 11) return null;
    return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
  }
  const validEmail = (s) => !s || /^\S+@\S+\.\S+$/.test(s);
  const jurisLabel = (ids) => ids.map((j) => V.JURIS.find((x) => x.id === j).label).join(' + ').replace('Nacional (AFIP/ARCA)', 'Nacional').replace('Provincial (ARBA)', 'Provincial (ARBA)');
  function perfilItems(type, juris, withExtras) {
    const base = A.generate(type, juris);
    if (withExtras) {
      if (type === 'Responsable Inscripto') base.push({ name: 'Ganancias — DDJJ anual', short: 'Ganancias anual', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Anual', due: '2027-05-12', period: 'Ejercicio 2026' });
    }
    return base.map((g) => Object.assign({ key: keyOf(g), auto: true }, g));
  }
  const BP = { name: 'Bienes Personales', short: 'Bienes Pers.', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Anual', due: '2027-06-15', period: 'Ejercicio 2026', key: 'bp', auto: false };
  const chipToggle = (on, label, act, data) => `<button class="chip sq${on ? ' on' : ''}" data-act="${act}" ${data || ''} aria-pressed="${on}">${esc(label)}</button>`;

  /* =========================================================
     Listado de clientes y búsqueda
     ========================================================= */
  const FILTERS = [['todos', 'Todos'], ['pend', 'Con pendientes'], ['venc', 'Vencidos'], ['mono', 'Monotributo'], ['ri', 'Resp. Inscripto']];
  function filterClients(list, f) {
    return list.filter((c) => {
      const pend = Q.pending().filter((t) => t.clientId === c.id);
      if (f === 'pend') return pend.length > 0;
      if (f === 'venc') return pend.some((t) => Q.status(t) === 'vencido');
      if (f === 'mono') return c.type === 'Monotributo';
      if (f === 'ri') return c.type === 'Responsable Inscripto';
      return true;
    });
  }
  const sortClients = (list) => list.slice().sort((a, b) => {
    const ra = W.clientStatus(a.id).next, rb = W.clientStatus(b.id).next;
    return (ra ? ra.due : '9') .localeCompare(rb ? rb.due : '9') || a.name.localeCompare(b.name);
  });
  const clientRow = (c) => {
    const pend = Q.byDate(Q.pending().filter((t) => t.clientId === c.id));
    const n = pend.length;
    return `<button class="t-row client" data-go="#/clientes/${c.id}"><span class="who">${avatar(c.name, c.tint)}<span><b>${esc(c.name)}</b></span></span>
      <span class="what meta">${esc(c.type)}</span><span class="meta" style="min-width:140px;text-align:right">${n} ${n === 1 ? 'trámite activo' : 'trámites activos'}</span>
      <span class="right" style="min-width:118px">${n ? 'Próx: ' + D.short(pend[0].due) : 'Sin pendientes'}</span></button>`;
  };

  W.route('/clientes', () => {
    const S = V.S(); const st = Q.stats();
    const list = filterClients(sortClients(S.clients), ui.cfilter);
    return {
      nav: 'clientes', title: 'Clientes',
      html: `<div class="page-h"><div><h1>Clientes</h1><p class="sub">${st.clientes} clientes activos en tu cartera.</p></div><button class="btn btn-primary" data-act="newclient">+&nbsp; Agregar cliente</button></div>
        <div class="search-sm"><label class="sr-only" for="csearch">Buscar cliente</label><input id="csearch" class="input" style="background:#fff" placeholder="Buscar cliente por nombre o CUIT…" data-in="client-search" autocomplete="off"></div>
        <div class="chips" role="group" aria-label="Filtros">${FILTERS.map(([k, l]) => `<button class="chip${ui.cfilter === k ? ' on' : ''}" data-act="cfilter" data-k="${k}" aria-pressed="${ui.cfilter === k}">${l}</button>`).join('')}
          <span style="flex:1"></span><button class="link" data-go="#/documentacion">Documentación pendiente →</button></div>
        ${list.length ? `<div class="table-list">${list.map(clientRow).join('')}</div>` : `<div class="empty" style="padding:48px 24px"><h3>${S.clients.length ? 'Ningún cliente coincide con el filtro' : 'Todavía no cargaste clientes'}</h3><p>${S.clients.length ? 'Probá con otro filtro.' : 'Cargá el primero y armamos su calendario.'}</p></div>`}`,
    };
  });
  W.acts.cfilter = (el) => { ui.cfilter = el.dataset.k; W.render(); };
  W.ins['client-search'] = (el) => { const v = el.value; if (v) W.go('#/clientes/busqueda?q=' + encodeURIComponent(v)); };

  W.route('/clientes/busqueda', (p, q) => {
    const term = q.q || ''; const n = U.norm(term);
    const res = V.S().clients.filter((c) => U.norm(c.name).includes(n) || c.cuit.replace(/-/g, '').includes(n.replace(/\D/g, '') || '§'));
    return {
      nav: 'clientes', title: 'Buscar cliente',
      html: `<div class="search-big"><span class="ring"></span><label class="sr-only" for="bq">Buscar cliente</label><input id="bq" value="${esc(term)}" placeholder="Buscar por nombre o CUIT…" data-in="search-page" autocomplete="off" autofocus><button data-act="search-clear" aria-label="Borrar búsqueda">×</button></div>
        <div class="res-count">${res.length} ${res.length === 1 ? 'resultado' : 'resultados'} para “${esc(term)}”</div>
        ${res.length ? `<div class="table-list">${res.map((c) => { const s = W.clientStatus(c.id);
          return `<button class="t-row client" data-go="#/clientes/${c.id}"><span class="who">${avatar(c.name, c.tint)}<span><b>${esc(c.name)}</b><span style="font-size:11.5px;color:var(--faint)">${esc(c.cuit)}</span></span></span><span class="what meta">${esc(c.type)}</span><span class="right" style="min-width:130px">${s.next ? 'Próx: ' + D.short(s.next.due) : ''}</span><span class="st">${s.kind === 'aldia' ? badge('aldia', { caps: true, label: 'AL DÍA' }) : badge(s.kind)}</span></button>`; }).join('')}</div>`
          : `<div class="empty" style="padding:48px 24px"><h3>No encontramos a nadie con ese nombre</h3><p>Revisá la ortografía o buscá por CUIT.</p><div class="row"><button class="btn btn-primary" data-act="newclient">+&nbsp; Agregar cliente</button></div></div>`}`,
      mount: () => { const i = document.getElementById('bq'); if (i) { i.focus(); const l = i.value.length; i.setSelectionRange(l, l); } },
    };
  });
  W.ins['search-page'] = (el) => {
    const v = el.value;
    const pos = el.selectionStart;
    history.replaceState(null, '', '#/clientes/busqueda?q=' + encodeURIComponent(v));
    W.render();
    const i = document.getElementById('bq'); if (i) { i.focus(); i.setSelectionRange(pos, pos); }
  };
  W.acts['search-clear'] = () => W.go('#/clientes');
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && e.target && e.target.id === 'bq') W.go('#/clientes'); });

  /* =========================================================
     Alta de cliente: modal → perfil → generando → calendario
     ========================================================= */
  W.acts.newclient = () => { if (!V.S().clients.length) W.go('#/primer-cliente'); else openNewClient(); };
  function newDraft(d) { return Object.assign({ name: '', cuit: '', email: '', type: 'Monotributo', juris: ['nacional', 'arba'], activity: '', off: [] }, d || {}); }

  function openNewClient() {
    U.modal({
      cls: 'w-md',
      html: `<h2>Nuevo cliente</h2><p class="lead">Cargá los datos básicos para empezar. Después vas a poder completar su perfil impositivo completo.</p>
        <form id="ncf" novalidate>
        <div class="field"><label for="ncn">Nombre o razón social</label><input id="ncn" class="input" placeholder="Ej: Panadería del Sol" maxlength="80" autocomplete="off" autofocus><div class="err-msg" data-e="name" hidden></div></div>
        <div class="field"><label for="ncc">CUIT</label><input id="ncc" class="input" placeholder="20-12345678-9" inputmode="numeric" maxlength="13" autocomplete="off"><div class="err-msg" data-e="cuit" hidden></div></div>
        <div class="field" style="margin-bottom:0"><label for="nce">Email del cliente</label><input id="nce" class="input" type="email" placeholder="contacto@estudioperez.com.ar" autocomplete="off"><div class="err-msg" data-e="email" hidden></div>
          <p class="hint">Se usa para avisar de presentaciones y pedirle documentación. Podés cargarlo después.</p></div>
        <div class="foot"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button type="submit" class="btn btn-primary">Continuar →</button></div></form>`,
      onMount: (m) => {
        m.$('#ncf').addEventListener('submit', (e) => {
          e.preventDefault();
          const name = m.$('#ncn').value.trim(); const cuitRaw = m.$('#ncc').value.trim(); const email = m.$('#nce').value.trim();
          const err = (k, msg) => { const el = m.$(`[data-e="${k}"]`); el.textContent = msg || ''; el.hidden = !msg; };
          const cuit = cuitRaw ? formatCuit(cuitRaw) : '';
          err('name', name ? '' : 'Poné el nombre o la razón social.');
          err('cuit', cuitRaw && !cuit ? 'El CUIT tiene 11 dígitos, por ejemplo 20-12345678-9.' : '');
          err('email', validEmail(email) ? '' : 'Revisá el email: parece que le falta algo.');
          if (!name || (cuitRaw && !cuit) || !validEmail(email)) return;
          ui.draft = newDraft({ name, cuit, email }); m.close(); W.go('#/clientes/nuevo');
        });
      },
    });
  }

  function profileForm(d) {
    const items = perfilItems(d.type, d.juris, false);
    return `<div class="card" style="padding:28px">
      <h3 style="font-size:16px;margin-bottom:16px">Tipo de contribuyente</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px" role="group" aria-label="Tipo de contribuyente">${V.TYPES.map((t) => chipToggle(d.type === t, t, 'draft-type', `data-v="${esc(t)}"`)).join('')}</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px"><div class="field" style="width:260px;max-width:100%;margin:0"><label for="dc">CUIT</label><input id="dc" class="input" value="${esc(d.cuit)}" placeholder="20-12345678-9" data-in="draft-cuit" maxlength="13"></div>
        <div class="field" style="width:340px;max-width:100%;margin:0"><label for="da">Actividad principal</label><input id="da" class="input" value="${esc(d.activity)}" placeholder="Elaboración de productos de panadería" data-in="draft-act" maxlength="80"></div></div>
      <h3 style="font-size:16px;margin-bottom:16px">Jurisdicciones</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:24px" role="group" aria-label="Jurisdicciones">${V.JURIS.filter((j) => j.id !== 'caba').map((j) => chipToggle(d.juris.includes(j.id), j.label, 'draft-juris', `data-v="${j.id}"`)).join('')}</div>
      <h3 style="font-size:16px;margin-bottom:12px">Trámites recurrentes que le corresponden</h3>
      <div style="display:flex;flex-direction:column;gap:10px;margin:18px 0 10px 16px">${items.map((it) => `<label class="check muted" style="font-size:13px"><input type="checkbox" data-ch="draft-item" data-k="${it.key}"${d.off.includes(it.key) ? '' : ' checked'}><span class="bx">${U.check}</span>${esc(it.name)}</label>`).join('')}</div>
      <p class="hint" style="margin-left:16px">Se determinan automáticamente según el tipo de contribuyente y las jurisdicciones seleccionadas.</p></div>`;
  }

  W.route('/clientes/nuevo', () => {
    const d = ui.draft; if (!d) return { redirect: '#/clientes' };
    return {
      nav: 'clientes', title: 'Nuevo cliente',
      html: `<div class="crumbs"><a href="#/clientes">Clientes</a><i>/</i><b>Nuevo cliente</b></div>
        <div class="page-h" style="margin-bottom:20px"><div><h1 class="big">${esc(d.name)}</h1><p class="sub">Completá el perfil impositivo para que generemos su calendario de vencimientos automáticamente.</p></div></div>
        ${profileForm(d)}
        <div class="form-foot"><button class="btn btn-ghost btn-lg" data-go="#/clientes">← Volver</button><button class="btn btn-primary btn-lg" data-act="draft-generate">Generar calendario automáticamente →</button></div>`,
    };
  });
  W.acts['draft-type'] = (el) => { ui.draft.type = el.dataset.v; ui.draft.off = []; W.render(); };
  W.acts['draft-juris'] = (el) => {
    const d = ui.draft; const v = el.dataset.v;
    d.juris = d.juris.includes(v) ? d.juris.filter((x) => x !== v) : d.juris.concat(v); d.off = []; W.render();
  };
  W.ins['draft-cuit'] = (el) => { ui.draft.cuit = el.value; };
  W.ins['draft-act'] = (el) => { ui.draft.activity = el.value; };
  W.chs['draft-item'] = (el) => { const d = ui.draft; const k = el.dataset.k; d.off = el.checked ? d.off.filter((x) => x !== k) : d.off.concat(k); };
  W.acts['draft-generate'] = () => {
    const d = ui.draft; const cuit = d.cuit ? formatCuit(d.cuit) : '';
    if (d.cuit && !cuit) { U.toast('El CUIT tiene que tener 11 dígitos, por ejemplo 20-12345678-9'); document.getElementById('dc').focus(); return; }
    d.cuit = cuit || '';
    d.tramites = perfilItems(d.type, d.juris, false).filter((it) => !d.off.includes(it.key)).map(({ key, auto, ...g }) => g);
    if (!d.tramites.length) { U.toast('Dejá al menos un trámite marcado para generar el calendario'); return; }
    ui.gen = { step: 0, started: false }; W.go('#/clientes/generando');
  };

  /* ---------- generando el calendario ---------- */
  const GEN_BAR = [10, 35, 62, 100];
  function genSteps(d) {
    const s = ['Perfil impositivo analizado', 'Consultando calendario AFIP/ARCA 2026'];
    if (d.juris.includes('arba')) s.push('Consultando vencimientos ARBA (Provincia)');
    s.push('Generando trámites recurrentes');
    return s;
  }
  let genTimers = [];
  W.onLeave.push(() => { genTimers.forEach(clearTimeout); genTimers = []; });
  function paintGen() {
    const d = ui.draft; if (!d || !ui.gen) return; const steps = genSteps(d); const g = ui.gen;
    const ul = document.getElementById('gen-list'); if (!ul) return;
    ul.innerHTML = steps.map((s, i) => `<li class="${i < g.step ? 'done' : i === g.step ? 'cur' : ''}"><i></i>${esc(s)}</li>`).join('');
    const bar = document.getElementById('gen-bar'); if (bar) bar.style.width = Math.round((Math.min(g.step, steps.length) / steps.length) * 100 || 6) + '%';
  }
  W.route('/clientes/generando', () => {
    const d = ui.draft; if (!d || !d.tramites) return { redirect: '#/clientes' };
    return {
      bare: true, title: 'Generando calendario',
      html: `<div class="gen"><div class="box"><div class="ico" aria-hidden="true"></div><h1>Generando el calendario de ${esc(d.name)}</h1><p class="sub">Estamos cruzando el perfil impositivo con las fuentes oficiales.</p>
        <ul id="gen-list" aria-live="polite"></ul><div class="bar" role="progressbar" aria-label="Progreso"><i id="gen-bar"></i></div><small>Las fechas provienen de fuentes oficiales. Vas a poder revisarlas y editarlas antes de guardar.</small></div></div>`,
      mount: () => {
        const g = ui.gen || (ui.gen = { step: 0, started: false });
        paintGen();
        if (g.started) return; g.started = true;
        const total = genSteps(d).length;
        const tick = () => {
          g.step += 1; paintGen();
          if (g.step >= total) {
            genTimers.push(setTimeout(() => {
              A.addClient(d); const n = d.tramites.length;
              ui.flash = `${d.name} fue agregada. Se generaron ${n} ${n === 1 ? 'trámite' : 'trámites'} en su calendario automáticamente.`;
              ui.draft = null; ui.gen = null; ui.onb = null; ui.cal.anchor = V.TODAY;
              W.go('#/calendario');
            }, 650));
          } else genTimers.push(setTimeout(tick, 850));
        };
        genTimers.push(setTimeout(tick, 700));
      },
    };
  });
  // el badge "Nuevo" se apaga cuando salís del calendario después de ver el aviso de alta
  W.onLeave.push((path) => {
    if (ui.flashShown && !path.startsWith('/calendario')) {
      V.S().tramites.forEach((t) => { t.isNew = false; });
      V.save(); ui.flashShown = false;
    }
  });

  /* =========================================================
     Onboarding del primer cliente (3 pasos)
     ========================================================= */
  const PREVIEW = {
    'Monotributo': [['Pago mensual monotributo', 'Todos los meses, día 20'], ['Recategorización semestral', 'Enero y julio'], ['IIBB — DDJJ mensual', 'Si corresponde por jurisdicción']],
    'Responsable Inscripto': [['IVA — DDJJ mensual', 'Todos los meses, según terminación de CUIT'], ['Ganancias — Anticipos', 'Bimestrales'], ['IIBB — DDJJ mensual', 'Si corresponde por jurisdicción']],
    'Autónomo': [['Aportes previsionales', 'Todos los meses'], ['Ganancias — Anticipos', 'Bimestrales']],
    'Exento': [['Presentaciones informativas', 'Una vez al año']],
  };
  function stepper(n) {
    const lab = ['Datos básicos', 'Perfil impositivo', 'Confirmar trámites'];
    return `<div class="steps" aria-label="Paso ${n} de 3">${lab.map((l, i) => {
      const k = i + 1; const cls = k < n ? 'done' : k === n ? 'cur' : '';
      return `<span class="step ${cls}"${k === n ? ' aria-current="step"' : ''}><span class="n">${k < n ? U.checkIcon(15) : k}</span>${l}</span>${i < 2 ? `<span class="step-line${k < n ? ' on' : ''}"></span>` : ''}`;
    }).join('')}</div>`;
  }
  W.route('/primer-cliente', () => {
    if (!ui.onb) ui.onb = { step: 1 };
    if (!ui.draft) ui.draft = newDraft();
    const d = ui.draft; const n = ui.onb.step;
    let body = '';
    if (n === 1) {
      body = `<div class="card" style="padding:28px"><h3 style="margin-bottom:6px">¿Quién es tu primer cliente?</h3><p class="card-sub" style="margin-bottom:20px">Con el nombre y el CUIT alcanza para empezar. El email lo podés cargar después.</p>
        <form data-form="onb1" novalidate><div class="field"><label for="on">Nombre o razón social</label><input id="on" class="input" value="${esc(d.name)}" placeholder="Ej: Panadería del Sol" maxlength="80" autofocus><div class="err-msg" id="on-e" hidden></div></div>
        <div class="field"><label for="oc">CUIT</label><input id="oc" class="input" value="${esc(d.cuit)}" placeholder="20-12345678-9" maxlength="13" inputmode="numeric"><div class="err-msg" id="oc-e" hidden></div></div>
        <div class="field"><label for="oe">Email del cliente (opcional)</label><input id="oe" class="input" type="email" value="${esc(d.email)}" placeholder="contacto@panaderiadelsol.com.ar"><div class="err-msg" id="oe-e" hidden></div></div>
        <div class="form-foot" style="margin-top:6px"><button type="button" class="btn btn-ghost" data-go="#/calendario">Cancelar</button><button class="btn btn-primary" type="submit">Continuar →</button></div></form></div>`;
    } else if (n === 2) {
      body = `<div class="card" style="padding:28px"><h3 style="font-size:17px">¿Qué tipo de contribuyente es ${esc(d.name)}?</h3><p class="card-sub" style="margin:10px 0 22px">Con este dato ya podemos saber qué le corresponde presentar y cuándo.</p>
        ${V.TYPES.map((t) => `<button class="radio-card${d.type === t ? ' on' : ''}" style="width:100%;text-align:left" data-act="onb-type" data-v="${esc(t)}" role="radio" aria-checked="${d.type === t}"><span class="rd"></span><span><b>${esc(t)}</b><span class="s">${esc(V.TYPE_DESC[t])}</span></span></button>`).join('')}
        <div class="form-foot" style="margin-top:6px"><button class="btn btn-ghost" data-act="onb-back">← Atrás</button><button class="btn btn-primary" data-act="onb-next">Continuar →</button></div></div>`;
    } else {
      const items = perfilItems(d.type, d.juris, false);
      body = `<div class="card" style="padding:28px"><h3 style="font-size:17px">Confirmá los trámites de ${esc(d.name)}</h3><p class="card-sub" style="margin:10px 0 20px">Elegí las jurisdicciones y revisá qué trámites vamos a generar.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:22px" role="group" aria-label="Jurisdicciones">${V.JURIS.filter((j) => j.id !== 'caba').map((j) => chipToggle(d.juris.includes(j.id), j.label, 'draft-juris-onb', `data-v="${j.id}"`)).join('')}</div>
        <div class="auto-list">${items.map((it) => `<label class="auto-row" style="cursor:pointer"><span class="check"><input type="checkbox" data-ch="draft-item" data-k="${it.key}"${d.off.includes(it.key) ? '' : ' checked'}><span class="bx">${U.check}</span></span><span class="t"><b>${esc(it.name)}</b><span>${esc(it.freq)} · ${esc(it.org)}</span></span><span class="pill-s auto">automático</span></label>`).join('')}</div>
        <div class="form-foot"><button class="btn btn-ghost" data-act="onb-back">← Atrás</button><button class="btn btn-primary" data-act="onb-generate">Generar calendario →</button></div></div>`;
    }
    const prev = PREVIEW[d.type] || PREVIEW['Monotributo'];
    return {
      nav: 'clientes', title: 'Cargá tu primer cliente',
      html: `<div class="page-h" style="margin-bottom:18px"><div><h1>Cargá tu primer cliente</h1><p class="sub">Son tres pasos. Después de esto, tu calendario se arma solo.</p></div></div>${stepper(n)}
        <div class="onb"><div>${body}</div>${n >= 2 ? `<aside class="preview"><h4>Vista previa</h4><p>Esto es lo que vamos a generar en su calendario:</p>${prev.map(([a, b]) => `<div class="pi"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}<small>Vas a poder revisar y ajustar todo antes de guardar.</small></aside>` : ''}</div>`,
    };
  });
  W.forms.onb1 = (f) => {
    const name = f.querySelector('#on').value.trim(); const cuitRaw = f.querySelector('#oc').value.trim(); const email = f.querySelector('#oe').value.trim();
    const cuit = cuitRaw ? formatCuit(cuitRaw) : '';
    const set = (id, msg) => { const e = f.querySelector('#' + id); e.textContent = msg || ''; e.hidden = !msg; };
    set('on-e', name ? '' : 'Poné el nombre o la razón social.'); set('oc-e', cuitRaw && !cuit ? 'El CUIT tiene 11 dígitos, por ejemplo 20-12345678-9.' : ''); set('oe-e', validEmail(email) ? '' : 'Revisá el email: parece que le falta algo.');
    if (!name || (cuitRaw && !cuit) || !validEmail(email)) return;
    Object.assign(ui.draft, { name, cuit: cuit || '', email }); ui.onb.step = 2; W.render();
  };
  W.acts['onb-type'] = (el) => { ui.draft.type = el.dataset.v; W.render(); };
  W.acts['onb-back'] = () => { ui.onb.step = Math.max(1, ui.onb.step - 1); W.render(); };
  W.acts['onb-next'] = () => { ui.onb.step = 3; W.render(); };
  W.acts['draft-juris-onb'] = (el) => { const d = ui.draft; const v = el.dataset.v; d.juris = d.juris.includes(v) ? d.juris.filter((x) => x !== v) : d.juris.concat(v); d.off = []; W.render(); };
  W.acts['onb-generate'] = () => W.acts['draft-generate']();

  /* =========================================================
     Importar desde Excel
     ========================================================= */
  const TEMPLATE = ['Razón social o nombre', 'CUIT', 'Tipo de contribuyente', 'Jurisdicciones', 'Actividad principal'];
  function parseTipo(s) {
    const n = U.norm(s);
    if (/mono/.test(n)) return 'Monotributo'; if (/resp|inscr|^ri$/.test(n)) return 'Responsable Inscripto'; if (/aut/.test(n)) return 'Autónomo'; if (/exent/.test(n)) return 'Exento'; return null;
  }
  function parseJuris(s) {
    const n = U.norm(s); const j = ['nacional'];
    if (/arba|provinc/.test(n)) j.push('arba'); if (/caba|agip/.test(n)) j.push('caba'); if (/municip/.test(n)) j.push('municipal');
    return j;
  }
  function parseCsv(text) {
    const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
    const delim = (lines[0] || '').split(';').length >= (lines[0] || '').split(',').length ? ';' : ',';
    const split = (l) => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out.map((x) => x.trim()); };
    const rows = lines.map(split);
    if (rows.length && /raz|nombre/i.test(rows[0][0] || '')) rows.shift();
    return rows.slice(0, 500).map((r, i) => {
      const cuit = formatCuit(r[1]); const type = parseTipo(r[2]);
      const errs = []; if (!r[0]) errs.push('falta el nombre'); if (r[1] && !cuit) errs.push('CUIT inválido'); if (!r[1]) errs.push('falta el CUIT'); if (!type) errs.push('tipo de contribuyente no reconocido');
      return { line: i + 2, name: r[0] || '', cuit: cuit || r[1] || '', type, juris: parseJuris(r[3] || ''), activity: r[4] || '', errs };
    });
  }
  W.route('/importar', () => {
    const imp = ui.imp;
    const result = imp ? `<div class="card" style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap"><div><h3>${esc(imp.name)}</h3><p class="card-sub">${imp.demo ? 'Vista previa de demostración: en la versión real se lee tu planilla. ' : ''}${imp.rows.filter((r) => !r.errs.length).length} clientes listos para importar${imp.rows.some((r) => r.errs.length) ? ` · ${imp.rows.filter((r) => r.errs.length).length} con errores (se omiten)` : ''}.</p></div>
        <div style="display:flex;gap:10px"><button class="btn btn-ghost" data-act="imp-clear">Elegir otro archivo</button><button class="btn btn-primary" data-act="imp-go"${imp.rows.some((r) => !r.errs.length) ? '' : ' disabled'}>Importar ${imp.rows.filter((r) => !r.errs.length).length} clientes</button></div></div>
        <div class="table-list" style="margin-top:16px;max-height:260px;overflow:auto">${imp.rows.map((r) => `<div class="t-row" style="padding:10px 16px"><span class="what"><b>${esc(r.name || '(sin nombre)')}</b> <span class="meta">${esc(r.cuit)}</span></span><span class="meta">${esc(r.type || '—')}</span><span class="st">${r.errs.length ? `<span class="badge b-vencido">${shape('sq')}Fila ${r.line}: ${esc(r.errs.join(', '))}</span>` : badge('presentado', { label: 'Listo' })}</span></div>`).join('')}</div></div>` : '';
    return {
      nav: 'clientes', title: 'Importar clientes',
      html: `<div class="page-h" style="margin-bottom:18px"><div><h1>Importar clientes</h1><p class="sub">Subí la planilla que ya usás y creamos los perfiles impositivos automáticamente.</p></div></div>
        ${result}
        <div class="upload-zone" id="dz"><div class="xls" aria-hidden="true">XLS</div><h3>Arrastrá tu planilla acá</h3><p>Formatos aceptados: .xlsx y .csv &nbsp;·&nbsp; hasta 500 clientes por archivo</p>
          <button class="btn btn-primary" data-act="imp-pick">Elegir archivo</button><input type="file" id="impfile" accept=".xlsx,.xls,.csv" hidden></div>
        <div class="two"><section class="card"><h3>Columnas que necesitamos</h3><div class="set-list" style="gap:0;margin-top:14px">${[['Razón social o nombre', 'Obligatoria'], ['CUIT', 'Obligatoria'], ['Tipo de contribuyente', 'Obligatoria'], ['Jurisdicciones', 'Opcional — si falta, asumimos nacional'], ['Actividad principal', 'Opcional']].map(([a, b]) => `<div class="col-row"><b style="font-weight:500">${a}</b><span>${b}</span></div>`).join('')}</div></section>
          <section class="card"><h3>¿No tenés el formato?</h3><p class="card-sub" style="margin:10px 0 16px;line-height:1.45">Descargá la plantilla, completala con tus clientes y volvé a subirla.</p><button class="btn btn-ghost btn-block" data-act="imp-template">Descargar plantilla (.csv)</button><p class="hint" style="margin-top:14px">También podés cargar los clientes de a uno desde “Agregar cliente”.</p></section></div>`,
      mount: () => {
        const dz = document.getElementById('dz'); const inp = document.getElementById('impfile'); if (!dz) return;
        ['dragenter', 'dragover'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('drag'); }));
        ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('drag'); }));
        dz.addEventListener('drop', (e) => { const f = e.dataTransfer.files[0]; if (f) handleFile(f); });
        inp.addEventListener('change', () => { if (inp.files[0]) handleFile(inp.files[0]); });
      },
    };
  });
  function handleFile(f) {
    if (!/\.(csv|xlsx|xls)$/i.test(f.name)) { U.toast('Ese formato no sirve: subí un .xlsx o un .csv'); return; }
    if (f.size > 5 * 1024 * 1024) { U.toast('El archivo pesa más de 5 MB'); return; }
    if (/\.csv$/i.test(f.name)) {
      const fr = new FileReader(); fr.onload = () => { const rows = parseCsv(String(fr.result)); if (!rows.length) { U.toast('El archivo no tiene filas para importar'); return; } ui.imp = { name: f.name, rows, demo: false }; W.render(); }; fr.readAsText(f);
    } else {
      ui.imp = { name: f.name, demo: true, rows: [
        { line: 2, name: 'Panadería del Sol', cuit: '20-27654321-8', type: 'Monotributo', juris: ['nacional', 'arba'], activity: 'Panadería', errs: [] },
        { line: 3, name: 'Librería El Faro', cuit: '30-71234000-5', type: 'Responsable Inscripto', juris: ['nacional'], activity: 'Librería', errs: [] },
        { line: 4, name: 'Taller Mecánico Sur', cuit: '20-30111222-3', type: 'Autónomo', juris: ['nacional'], activity: 'Taller', errs: [] }] };
      W.render();
    }
  }
  W.acts['imp-pick'] = () => document.getElementById('impfile').click();
  W.acts['imp-clear'] = () => { ui.imp = null; W.render(); };
  W.acts['imp-template'] = () => {
    const rows = [TEMPLATE, ['Panadería del Sol', '20-27654321-8', 'Monotributo', 'Nacional; ARBA', 'Elaboración de productos de panadería'], ['Constructora Alfa S.A.', '30-70998877-1', 'Responsable Inscripto', 'Nacional; ARBA', 'Construcción']];
    U.download('plantilla-clientes-vigente.csv', rows.map((r) => r.map(U.csvCell).join(';')).join('\r\n'));
    U.toast('Plantilla descargada');
  };
  W.acts['imp-go'] = () => {
    const ok = ui.imp.rows.filter((r) => !r.errs.length); let total = 0;
    const existing = new Set(V.S().clients.map((c) => c.cuit));
    const fresh = ok.filter((r) => !existing.has(r.cuit)); const dup = ok.length - fresh.length;
    fresh.forEach((r) => { const before = V.S().tramites.length; A.addClient({ name: r.name, cuit: r.cuit, email: '', type: r.type, juris: r.juris, activity: r.activity }); total += V.S().tramites.length - before; });
    ui.flash = `Se importaron ${fresh.length} clientes y se generaron ${total} trámites automáticamente.${dup ? ` Omitimos ${dup} que ya estaban cargados.` : ''}`;
    ui.clearNewOnLeave = true; ui.imp = null; ui.cal.anchor = V.TODAY; W.go('#/calendario');
  };

  /* =========================================================
     Ficha del cliente
     ========================================================= */
  const TABS = [['resumen', 'Resumen'], ['perfil', 'Perfil impositivo'], ['documentacion', 'Documentación'], ['contacto', 'Contacto']];
  function fichaHead(c, tab) {
    return `<div class="crumbs"><a href="#/clientes">Clientes</a><i>/</i><b>${esc(c.name)}</b></div>
      <div class="ficha-h">${avatar(c.name, c.tint, 'xl')}<div class="t"><h1>${esc(c.name)}</h1><p class="s">${esc(c.type)} &nbsp;·&nbsp; CUIT ${esc(c.cuit)} &nbsp;·&nbsp; Cliente desde ${esc(c.since)}</p></div>
      <button class="btn btn-soft" data-go="#/clientes/${c.id}/perfil">Editar perfil impositivo</button></div>
      <nav class="chips" aria-label="Secciones del cliente">${TABS.map(([k, l]) => `<a class="chip${tab === k ? ' on' : ''}" href="#/clientes/${c.id}${k === 'resumen' ? '' : '/' + k}"${tab === k ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;
  }
  W.route('/clientes/:id', (p) => fichaView(p.id, 'resumen'));
  W.route('/clientes/:id/:tab', (p) => fichaView(p.id, p.tab));
  function fichaView(id, tab) {
    const c = Q.client(id); if (!c) return { redirect: '#/clientes' };
    if (!TABS.some((t) => t[0] === tab)) return { redirect: '#/clientes/' + id };
    const body = { resumen: tabResumen, perfil: tabPerfil, documentacion: tabDocs, contacto: tabContacto }[tab](c);
    return { nav: 'clientes', title: c.name, html: fichaHead(c, tab) + body.html, mount: body.mount };
  }

  function tabResumen(c) {
    const ts = Q.clientTramites(c.id);
    const lost = ts.filter((t) => !t.presentedOn && t.due < V.TODAY).length;
    const pct = Math.round((12 / (12 + lost)) * 100);
    const active = ts.filter((t) => !t.presentedOn).length;
    const rec = [];
    ts.forEach((t) => { if (t.freq === 'Mensual' || t.freq === 'Bimestral') { Q.history(t).filter((h) => /^Presentado/.test(h.text)).slice(0, 2).forEach((h, i) => rec.push({ n: W.ddjj(t.name).replace(/ — (Declaración|Anticipo).*/, '').replace('DDJJ mensual', 'DDJJ'), l: h.label, t: h.text, k: i })); } });
    const pres = rec.slice(0, 3);
    const stOf = (t) => { const s = Q.status(t); if (s === 'presentado') return 'presentado'; if (D.diffDays(t.due, V.TODAY) > 60) return 'programado'; return s; };
    return { html: `<div class="grid-2 wide" style="grid-template-columns:minmax(0,1fr) 340px"><div class="stack">
      <section class="card"><h3 class="mini-h" style="margin-bottom:6px">Trámites del año</h3>${ts.length ? ts.map((t) => `<button class="tram-row" data-go="#/tramite/${t.id}"><span><b>${esc(t.name)}</b><span>${esc(t.freq)} · ${esc(t.org)}</span></span><span class="r">${D.parse(t.due).getFullYear() !== 2026 ? `${D.short1(t.due)} ${D.parse(t.due).getFullYear()}` : D.short1(t.due)}${badge(stOf(t))}</span></button>`).join('') : '<p class="card-sub" style="padding:14px 0">Todavía no tiene trámites.</p>'}</section>
      <section class="card"><h3 class="mini-h">Últimas presentaciones</h3>${pres.length ? pres.map((r) => `<div class="pres-row"><span style="margin:0"><b style="font-weight:500;color:var(--ink)">${esc(r.n)}</b> <span>${esc(r.l)}</span></span><em>${esc(r.t)}</em></div>`).join('') : '<p class="card-sub">Todavía no hay presentaciones registradas.</p>'}</section></div>
      <div class="stack"><section class="card"><h3 class="mini-h">Perfil impositivo</h3><div class="perf-k">Tipo</div><div class="perf-v">${esc(c.type)}</div><div class="perf-k">Actividad</div><div class="perf-v">${esc(c.activity || '—')}</div><div class="perf-k">Jurisdicciones</div><div class="perf-v">${esc(jurisLabel(c.juris))}</div><div class="perf-k">Trámites activos</div><div class="perf-v" style="margin:0">${active} recurrentes</div></section>
      <section class="card"><h3 class="mini-h">Cumplimiento</h3><div style="display:flex;gap:44px"><div><div class="big-pct ${lost ? 'c-amber' : 'green'}">${pct}%</div><div class="perf-k">presentado en fecha</div></div><div><div class="big-pct${lost ? ' c-red' : ''}">${lost}</div><div class="perf-k">vencimientos perdidos</div></div></div></section></div></div>` };
  }

  /* ---------- perfil impositivo (editable) ---------- */
  function perfilState(c) {
    if (!ui.perfil || ui.perfil.cid !== c.id) {
      const cur = new Set(Q.clientTramites(c.id).map(keyOf));
      ui.perfil = { cid: c.id, type: c.type, juris: c.juris.slice(), bp: cur.has('bp'), off: [] };
    }
    return ui.perfil;
  }
  W.onLeave.push(() => { ui.perfil = null; });
  function tabPerfil(c) {
    const P = perfilState(c); const items = perfilItems(P.type, P.juris, true); const last = c.profileLog[c.profileLog.length - 1];
    return { html: `<div class="grid-2 wide" style="grid-template-columns:minmax(0,1fr) 340px"><section class="card" style="padding:28px">
      <div style="display:flex;justify-content:space-between;gap:16px"><div><h3 style="font-size:17px">Lo que cargaste al crear el cliente</h3><p class="card-sub">Si cambia algo, editalo acá y el calendario se recalcula.</p></div><span class="hint" style="margin:0;white-space:nowrap">Editado por última vez el ${esc(last[1])}</span></div>
      <h4 style="font-size:14px;margin:22px 0 12px">Tipo de contribuyente</h4><div style="display:flex;gap:10px;flex-wrap:wrap" role="group">${V.TYPES.map((t) => chipToggle(P.type === t, t, 'perf-type', `data-v="${esc(t)}"`)).join('')}</div>
      <h4 style="font-size:14px;margin:22px 0 12px">Jurisdicciones</h4><div style="display:flex;gap:10px;flex-wrap:wrap" role="group">${V.JURIS.map((j) => chipToggle(P.juris.includes(j.id), j.label, 'perf-juris', `data-v="${j.id}"`)).join('')}</div>
      <h4 style="font-size:14px;margin:22px 0 12px">Trámites que le corresponden</h4>
      <div class="auto-list">${items.concat([BP]).map((it) => { const on = it.auto ? !P.off.includes(it.key) : P.bp; return `<label class="auto-row" style="cursor:pointer;${it.auto ? '' : 'opacity:.9'}"><span class="check"><input type="checkbox" data-ch="perf-item" data-k="${it.key}"${on ? ' checked' : ''}><span class="bx">${U.check}</span></span><span class="t"><b>${esc(it.name.replace('Declaración mensual', 'DDJJ mensual'))}</b><span>${esc(it.freq)} · ${esc(it.org)}</span></span><span class="pill-s ${it.auto ? 'auto' : 'opt'}">${it.auto ? 'automático' : 'opcional'}</span></label>`; }).join('')}</div>
      <p class="hint" style="margin-top:12px;font-size:12px">Los marcados como automáticos se determinan según el tipo de contribuyente y las jurisdicciones. Podés desmarcarlos si este cliente no los presenta.</p>
      <div class="form-foot"><button class="btn btn-ghost" data-act="perf-cancel">Descartar cambios</button><button class="btn btn-primary" data-act="perf-save">Guardar cambios</button></div></section>
      <div class="stack" style="gap:16px"><div class="callout warn" style="margin:0"><h4 style="font-size:14px">${shape('tri', 'sh-lg')}Al guardar</h4><p style="font-size:13px">Se recalculan los vencimientos futuros de este cliente. Los trámites ya presentados no se tocan.</p></div>
      <section class="card" style="padding:22px"><div class="log-k">CAMBIOS DEL PERFIL</div>${c.profileLog.map(([a, b]) => `<div class="log-i"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</section></div></div>` };
  }
  W.acts['perf-type'] = (el) => { const P = ui.perfil; P.type = el.dataset.v; P.off = []; W.render(); };
  W.acts['perf-juris'] = (el) => { const P = ui.perfil; const v = el.dataset.v; if (v === 'nacional' && P.juris.includes(v) && P.juris.length === 1) return; P.juris = P.juris.includes(v) ? P.juris.filter((x) => x !== v) : P.juris.concat(v); P.off = []; W.render(); };
  W.chs['perf-item'] = (el) => { const P = ui.perfil; const k = el.dataset.k; if (k === 'bp') { P.bp = el.checked; return; } P.off = el.checked ? P.off.filter((x) => x !== k) : P.off.concat(k); };
  W.acts['perf-cancel'] = () => { ui.perfil = null; W.render(); U.toast('Descartaste los cambios'); };
  W.acts['perf-save'] = () => {
    const P = ui.perfil; const c = Q.client(P.cid);
    const wanted = perfilItems(P.type, P.juris, true).filter((it) => !P.off.includes(it.key)); if (P.bp) wanted.push(BP);
    const keys = new Set(wanted.map((w) => w.key));
    let added = 0, removed = 0;
    const log = []; if (P.type !== c.type) log.push([`Cambió de ${c.type} a ${P.type}`, D.dmy(V.TODAY)]);
    P.juris.filter((j) => !c.juris.includes(j)).forEach((j) => log.push([`Se agregó jurisdicción ${V.JURIS.find((x) => x.id === j).ambit}`, D.dmy(V.TODAY)]));
    c.juris.filter((j) => !P.juris.includes(j)).forEach((j) => log.push([`Se quitó jurisdicción ${V.JURIS.find((x) => x.id === j).ambit}`, D.dmy(V.TODAY)]));
    V.set((S) => {
      const cl = S.clients.find((x) => x.id === P.cid); cl.type = P.type; cl.juris = P.juris.slice(); cl.profileLog.push(...log);
      S.tramites = S.tramites.filter((t) => { if (t.clientId !== cl.id || t.presentedOn) return true; if (keys.has(keyOf(t))) return true; removed++; return false; });
      const have = new Set(S.tramites.filter((t) => t.clientId === cl.id).map(keyOf));
      wanted.forEach((w) => { if (!have.has(w.key)) { const { key, auto, ...g } = w; S.tramites.push(Object.assign({ id: V.uid('t'), clientId: cl.id, presentedOn: null, isNew: true, notes: [], extraHist: [] }, g)); added++; } });
      delete S.docLists[cl.id];
    });
    ui.perfil = null;
    U.toast(`Perfil guardado. Se recalcularon los vencimientos (${added} nuevos, ${removed} quitados).`, 3400);
    W.go('#/clientes/' + P.cid);
  };

  /* ---------- documentación del cliente ---------- */
  const REMIND = [['#a9adb5', '15 días antes', 'Primer pedido', '1 mail', '#6b7280'], ['#7a9bd0', '7 días antes', 'Recordatorio suave', '1 mail', '#4f7ac0'], ['#a86b05', '3 días antes', 'Se pone urgente', 'cada 2 días', '#a86b05'], ['#b31a1a', '1 día antes', 'Última chance', 'todos los días', '#b31a1a']];
  function tabDocs(c) {
    const groups = A.docList(c.id); const S = V.S();
    const names = Object.keys(groups);
    return { html: `<div class="grid-2" style="grid-template-columns:minmax(0,1fr) 360px"><section class="card" style="padding:28px">
        <h3 style="font-size:17px">Qué documentación pedirle a este cliente</h3><p class="card-sub">Se define una vez. Después, cada vencimiento usa esta lista sin que tengas que armarla de nuevo.</p>
        ${names.map((g) => `<div class="docgrp"><header>${esc(g)}<span>${groups[g].length} ${groups[g].length === 1 ? 'documento' : 'documentos'}</span></header>
          ${groups[g].map((it, i) => `<div class="it"><label class="check" style="flex:1"><input type="checkbox" data-ch="doc-toggle" data-g="${esc(g)}" data-i="${i}"${it.on ? ' checked' : ''}><span class="bx">${U.check}</span>${esc(it.l)}</label><button class="x" data-act="doc-del" data-g="${esc(g)}" data-i="${i}" aria-label="Quitar ${esc(it.l)}">×</button></div>`).join('')}
          ${ui.docAdd === g ? `<form class="add-inline" data-form="doc-add" data-g="${esc(g)}"><input class="input" placeholder="Nombre del documento" maxlength="80" autofocus><button class="btn btn-primary btn-sm" type="submit">Agregar</button><button class="btn btn-ghost btn-sm" type="button" data-act="doc-add-cancel">Cancelar</button></form>` : `<div class="add"><button class="link" data-act="doc-add-open" data-g="${esc(g)}" style="font-size:12.5px">+&nbsp; Agregar documento</button></div>`}</div>`).join('')}
      </section><div><section class="card" style="padding:26px"><h3 style="font-size:17px">Recordatorios por mail</h3><p class="card-sub">Si el cliente no entrega, le insistimos cada vez más seguido a medida que se acerca el vencimiento.</p>
        <div class="remind">${REMIND.map(([bar, a, b, cc, col]) => `<div><i style="background:${bar}"></i><span><b>${a}</b><span>${b}</span><em style="color:${col}">${cc}</em></span></div>`).join('')}</div>
        <div style="display:flex;flex-direction:column;gap:14px"><label class="check muted"><input type="checkbox" data-ch="rem" data-k="stop"${S.reminders.stop ? ' checked' : ''}><span class="bx">${U.check}</span>Frenar los recordatorios apenas entregue</label><label class="check muted"><input type="checkbox" data-ch="rem" data-k="notifyMe"${S.reminders.notifyMe ? ' checked' : ''}><span class="bx">${U.check}</span>Avisarme a mí si llega al último recordatorio</label></div></section>
        <div class="mails-to"><small>LOS MAILS VAN A</small><b>${esc(c.email || 'Sin email cargado')}</b><button class="link" data-go="#/clientes/${c.id}/contacto">Cambiar en la pestaña Contacto</button></div>
        <button class="btn btn-primary" style="margin-top:16px" data-act="doc-save">Guardar</button></div></div>`,
      mount: () => { const i = document.querySelector('.add-inline input'); if (i) i.focus(); } };
  }
  const gOf = (el) => el.dataset.g;
  W.chs['doc-toggle'] = (el) => { const cid = location.hash.split('/')[2]; V.set((S) => { S.docLists[cid][gOf(el)][+el.dataset.i].on = el.checked; }); };
  W.acts['doc-del'] = (el) => { const cid = location.hash.split('/')[2]; V.set((S) => { S.docLists[cid][gOf(el)].splice(+el.dataset.i, 1); }); };
  W.acts['doc-add-open'] = (el) => { ui.docAdd = gOf(el); W.render(); };
  W.acts['doc-add-cancel'] = () => { ui.docAdd = null; W.render(); };
  W.forms['doc-add'] = (f) => {
    const v = f.querySelector('input').value.trim(); const cid = location.hash.split('/')[2]; if (!v) return;
    ui.docAdd = null; V.set((S) => { S.docLists[cid][f.dataset.g].push({ l: v, on: true }); });
  };
  W.chs.rem = (el) => V.set((S) => { S.reminders[el.dataset.k] = el.checked; });
  W.acts['doc-save'] = () => U.toast('Lista de documentación guardada');
  W.onLeave.push(() => { ui.docAdd = null; });

  /* ---------- contacto ---------- */
  function tabContacto(c) {
    return { html: `<section class="card" style="padding:28px;max-width:640px"><h3 style="font-size:17px">Datos de contacto</h3><p class="card-sub" style="margin-bottom:20px">A este mail van los avisos de presentación y los pedidos de documentación.</p>
      <form data-form="contact" data-id="${c.id}" novalidate><div class="field"><label for="ce">Email</label><input id="ce" class="input" type="email" value="${esc(c.email)}" placeholder="contacto@cliente.com.ar"><div class="err-msg" id="ce-e" hidden></div></div>
      <div class="field"><label for="cp">Teléfono</label><input id="cp" class="input" value="${esc(c.phone || '')}" placeholder="+54 11 5555-0000" maxlength="30"></div>
      <div class="form-foot"><button class="btn btn-primary" type="submit">Guardar contacto</button></div></form></section>` };
  }
  W.forms.contact = (f) => {
    const email = f.querySelector('#ce').value.trim(); const e = f.querySelector('#ce-e');
    if (!validEmail(email)) { e.textContent = 'Revisá el email: parece que le falta algo.'; e.hidden = false; return; }
    V.set((S) => { const c = S.clients.find((x) => x.id === f.dataset.id); c.email = email; c.phone = f.querySelector('#cp').value.trim(); });
    U.toast('Contacto guardado');
  };

  /* =========================================================
     Documentación pendiente
     ========================================================= */
  W.route('/documentacion', () => {
    const S = V.S(); const rows = S.docRequests;
    const done = (r) => r.items.filter((i) => i.d).length;
    const sin = rows.filter((r) => done(r) === 0).length, comp = rows.filter((r) => done(r) === r.items.length).length, par = rows.length - sin - comp;
    return {
      nav: 'clientes', title: 'Documentación pendiente',
      html: `<div class="page-h" style="margin-bottom:18px"><div><h1>Documentación pendiente</h1><p class="sub">Qué le pediste a cada cliente y quién todavía no respondió.</p></div></div>
        <div class="stats three"><div class="stat"><b class="c-red">${sin}</b><span>clientes sin responder</span></div><div class="stat"><b class="c-green">${comp}</b><span>entregaron completo</span></div><div class="stat"><b class="c-amber">${par}</b><span>entregó parcial</span></div></div>
        ${rows.length ? `<table class="dp-table"><thead><tr><th>CLIENTE</th><th>PEDIDO PARA</th><th>ENTREGADO</th><th>LÍMITE</th><th><span class="sr-only">Acción</span></th></tr></thead><tbody>${rows.map((r) => { const c = Q.client(r.clientId); const n = done(r); const col = n === r.items.length ? 'var(--green)' : n === 0 ? (r.due < V.TODAY ? 'var(--red)' : 'var(--muted)') : 'var(--amber)'; const late = n === 0 && r.due < V.TODAY; const act = n === r.items.length ? ['Ver', 'doc-view'] : n === 0 ? [r.due < V.TODAY ? 'Reenviar' : 'Recordar', 'doc-remind'] : ['Recordar', 'doc-remind'];
          return `<tr><td><span class="cl"><span class="avatar plain" style="width:36px;height:36px">${esc(Q.initials(c.name))}</span>${esc(c.name)}</span></td><td class="d">${esc(r.label)}</td><td><span class="dpstate" style="color:${col}"><i></i>${n} de ${r.items.length}</span></td><td style="${late ? 'color:var(--red)' : ''}">${D.short(r.due)}</td><td><button class="link" data-act="${act[1]}" data-id="${r.id}">${act[0]}</button></td></tr>`; }).join('')}</tbody></table>`
          : `<div class="empty"><h3>No pediste documentación todavía</h3><p>Cuando pidas documentación desde un trámite, vas a seguir acá quién respondió y quién no.</p><div class="row"><button class="btn btn-primary" data-go="#/calendario">Ir al calendario</button></div></div>`}`,
    };
  });
  W.acts['doc-remind'] = (el) => { const r = V.S().docRequests.find((x) => x.id === el.dataset.id); const c = Q.client(r.clientId); U.toast(`Recordatorio enviado a ${c.name} (simulado)`); };
  W.acts['doc-view'] = (el) => docViewModal(el.dataset.id);
  function docViewModal(id) {
    const r = V.S().docRequests.find((x) => x.id === id); const c = Q.client(r.clientId);
    U.modal({
      cls: 'w-md', html: `<h2>${esc(c.name)}</h2><p class="lead">${esc(r.label)} · límite ${D.short(r.due)}. Marcá lo que ya te entregó.</p>
        <div class="doc-pick">${r.items.map((it, i) => `<label class="check muted"><input type="checkbox" data-i="${i}"${it.d ? ' checked' : ''}><span class="bx">${U.check}</span>${esc(it.l)}</label>`).join('')}</div>
        <div class="foot"><button class="btn btn-ghost" data-close>Cerrar</button><button class="btn btn-primary" id="dvs">Guardar</button></div>`,
      onMount: (m) => m.$('#dvs').addEventListener('click', () => { const checks = m.$$('input[data-i]'); m.close(); V.set((S) => { const x = S.docRequests.find((y) => y.id === id); checks.forEach((ch, i) => { x.items[i].d = ch.checked; }); }); U.toast('Entregas actualizadas'); }),
    });
  }
})();
