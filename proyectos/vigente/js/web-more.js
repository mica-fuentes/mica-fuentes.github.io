/* =========================================================
   Vigente · demo web — novedades y cursos, foro, configuración
   ========================================================= */
(function () {
  const V = window.V, W = V.web, Q = V.q, A = V.act, D = V.date, U = V.ui;
  const { esc, badge, shape, avatar } = U;
  const ui = W.ui;
  ui.nfilter = 'todas'; ui.foro = { cat: null, tab: 'recientes' };

  /* =========================================================
     Novedades y cursos
     ========================================================= */
  const NFILTERS = [['todas', 'Todas'], ['afectan', 'Te afectan'], ['prorroga', 'Prórrogas'], ['norma', 'Cambios de norma'], ['curso', 'Cursos']];
  const nov = (id) => V.NOVEDADES.find((n) => n.id === id);
  const novTag = (n) => `<span class="chip-tag ${n.type}">${esc(n.label)}</span>`;

  W.route('/novedades', () => {
    const f = ui.nfilter; const affected = V.NOVEDADES.filter((n) => n.affects > 0).length;
    const list = V.NOVEDADES.filter((n) => f === 'todas' || (f === 'afectan' && n.affects > 0) || (f === 'curso' ? n.course : n.type === f));
    return {
      nav: 'novedades', title: 'Novedades y cursos',
      html: `<div class="page-h" style="margin-bottom:18px"><div><h1>Novedades y cursos</h1><p class="sub">Cambios normativos que afectan a tus clientes. Todo el contenido proviene de fuentes oficiales.</p></div></div>
        <div class="chips" role="group" aria-label="Filtrar novedades">${NFILTERS.map(([k, l]) => `<button class="chip${f === k ? ' on' : ''}" data-act="nfilter" data-k="${k}" aria-pressed="${f === k}">${l}${k === 'afectan' ? ` (${affected})` : ''}</button>`).join('')}</div>
        ${list.length ? list.map((n) => `<article class="card nov"><div class="t"><div class="top">${novTag(n)}<span class="d">${D.dmy(n.date)}</span></div><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p>
          <div class="src">Fuente: ${esc(n.src)}${n.affects ? `<span class="sep">·</span><button data-go="#/novedades/${n.id}/clientes">Afecta a ${n.affects} de tus clientes</button>` : ''}</div></div>
          <div><button class="btn btn-green" data-go="#/novedades/${n.id}${n.cta === 'curso' ? '/curso' : '/clientes'}">${n.cta === 'curso' ? `Ver curso de ${n.mins} min →` : 'Ver clientes afectados →'}</button></div></article>`).join('') : '<div class="empty" style="padding:48px 24px"><h3>No hay novedades en esta categoría</h3><p>Probá con otro filtro.</p></div>'}`,
    };
  });
  W.acts.nfilter = (el) => { ui.nfilter = el.dataset.k; W.render(); };

  function novDetail(id) {
    const n = nov(id); if (!n) return { redirect: '#/novedades' };
    const secs = V.NOV_SECTIONS[id] || [['Qué cambió', n.body], ['Qué tenés que hacer', 'Revisá qué clientes están afectados y actualizá su perfil impositivo si hace falta. El calendario se recalcula solo.']];
    const mins = n.mins || 3;
    return {
      nav: 'novedades', title: n.title,
      html: `<div class="crumbs"><a href="#/novedades">Novedades</a><i>/</i><b>${esc(n.title.length > 40 ? n.title.slice(0, 38) + '…' : n.title)}</b></div>
        <h1 class="big" style="margin-bottom:8px">${esc(n.title)}</h1>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;font-size:13px;color:var(--muted)"><span class="badge caps ${n.type === 'norma' ? 'b-urgente' : n.type === 'prorroga' ? 'b-prorroga' : n.type === 'recat' ? 'b-presentado' : 'b-proximo'}" style="border-radius:6px">${n.type === 'norma' ? shape('tri') : ''}${esc(n.mLabel)}</span>Publicado el ${D.dmy(n.date)} &nbsp;·&nbsp; ${mins} min de lectura</div>
        <div class="grid-2 wide" style="grid-template-columns:minmax(0,1fr) 340px"><div class="stack" style="gap:20px">
          <section class="card" style="padding:26px">${secs.map(([h, b], i) => `<div class="sec-num"><i>${i + 1}</i>${esc(h)}</div><p class="sec-body">${esc(b)}</p>`).join('')}</section>
          <div class="src-bar"><span class="dot"></span><span class="grow">Fuente oficial: ${esc(n.src)}. Verificado el 12/08/2026.</span><button class="link" data-act="open-bulletin" style="font-size:13px">Ver en el boletín ↗</button></div></div>
        <div class="stack" style="gap:20px"><section class="card"><h3 style="font-size:15px">A quién le afecta</h3><div class="big-violet">${n.affects ? `${n.affects} clientes` : 'Todos los clientes'}</div><p class="card-sub" style="line-height:1.45;margin:0 0 18px">${n.affects ? 'Todos los responsables inscriptos de tu cartera con IVA mensual.' : 'Es contenido general: sirve para cualquier cliente de tu cartera.'}</p>${n.affects ? `<button class="btn btn-primary btn-block btn-lg" data-go="#/novedades/${n.id}/clientes">Ver los ${n.affects} clientes</button>` : ''}</section>
          <section class="card"><h3 style="font-size:15px;margin-bottom:12px">Próximo vencimiento afectado</h3><div style="font-size:18px;font-weight:600;margin-bottom:8px">26 de agosto de 2026</div><p class="card-sub" style="line-height:1.45">IVA — DDJJ mensual, período 07/2026, ya con la prórroga aplicada.</p></section></div></div>`,
    };
  }
  W.route('/novedades/:id', (p) => novDetail(p.id));
  W.route('/novedades/:id/curso', (p) => novDetail(p.id));
  W.acts['open-bulletin'] = () => U.toast('En la versión real se abre el boletín oficial en otra pestaña');

  W.route('/novedades/:id/clientes', (p) => {
    const n = nov(p.id); if (!n) return { redirect: '#/novedades' };
    const S = V.S(); const rows = V.AFFECTED.slice(0, n.affects || 6); const isPortal = n.id === 'n2';
    return {
      nav: 'novedades', title: 'Clientes afectados',
      html: `<div class="crumbs"><a href="#/novedades">Novedades</a><i>/</i><b>Clientes afectados</b></div>
        <div class="page-h" style="margin-bottom:18px"><div><h1 class="big">${rows.length} clientes afectados</h1><p class="sub">${isPortal ? 'Responsables inscriptos con IVA mensual, alcanzados por el cambio de portal de presentación.' : esc(n.title) + '.'}</p></div></div>
        <div class="banner info" style="margin-bottom:20px">${shape('pent', 'sh-lg')}<span class="grow">El calendario de estos clientes ya se actualizó${n.type === 'prorroga' || n.id === 'n2' ? ' con la prórroga al 26 de agosto' : ''}.</span><button class="link" data-act="notify-all" data-n="${n.id}">Notificar a todos por email</button></div>
        <div class="table-list"><div class="aff-row h aff-head"><span>CLIENTE</span><span>${isPortal ? 'ADHESIÓN AL NUEVO SERVICIO' : 'ESTADO DEL CALENDARIO'}</span><span>PRÓXIMA PRESENTACIÓN</span></div>
        ${rows.map((c) => { const ok = isPortal ? !!S.adhesion[c.id] : true; return `<div class="aff-row"><span class="cl"><span class="avatar plain" style="width:36px;height:36px">${esc(Q.initials(c.name))}</span><span><b>${esc(c.name)}</b><span>${esc(c.cuit)}</span></span></span>
          <span>${isPortal ? `<button class="badge caps ${ok ? 'b-adherido' : 'b-pendiente'}" style="border:0" data-act="adhesion" data-id="${c.id}" title="${ok ? 'Marcar como pendiente' : 'Marcar como adherido'}">${shape(ok ? 'dot' : 'tri')}${ok ? 'ADHERIDO' : 'PENDIENTE'}</button>` : `<span class="badge caps b-adherido">${shape('dot')}ACTUALIZADO</span>`}</span><span class="dt">26 ago 2026</span></div>`; }).join('')}</div>`,
    };
  });
  W.acts.adhesion = (el) => V.set((S) => { S.adhesion[el.dataset.id] = !S.adhesion[el.dataset.id]; });
  W.acts['notify-all'] = () => U.toast('Aviso por email enviado a los clientes afectados (simulado)');

  /* =========================================================
     Foro
     ========================================================= */
  const catOf = (id) => V.FORUM_CATS.find((c) => c.id === id);
  const catTag = (id) => `<span class="tag ${catOf(id).tag}">${esc(catOf(id).name)}</span>`;
  const catCount = (c) => c.n + V.S().forum.threads.filter((t) => t.cat === c.id && t.mine).length;

  W.route('/foro', () => {
    const F = ui.foro; let th = V.S().forum.threads.slice();
    if (F.cat) th = th.filter((t) => t.cat === F.cat);
    if (F.tab === 'sinresp') th = th.filter((t) => t.replies === 0);
    if (F.tab === 'comentados') th.sort((a, b) => b.replies - a.replies);
    return {
      nav: 'foro', title: 'Foro',
      html: `<div class="page-h" style="margin-bottom:18px"><div><h1>Foro de contadores</h1><p class="sub">Consultas entre colegas. No reemplaza a las fuentes oficiales de Novedades.</p></div><button class="btn btn-primary btn-lg" data-act="new-topic">+&nbsp; Abrir un tema</button></div>
        <div class="foro-grid"><aside aria-label="Categorías"><div class="cats-k">CATEGORÍAS</div>${V.FORUM_CATS.map((c) => `<button class="cat${F.cat === c.id ? ' on' : ''}" data-act="foro-cat" data-id="${c.id}" aria-pressed="${F.cat === c.id}"><i style="background:${c.color}"></i><span class="grow">${esc(c.name)}</span><em>${catCount(c)}</em></button>`).join('')}</aside>
        <div><div class="chips" role="group" aria-label="Ordenar">${[['recientes', 'Recientes'], ['sinresp', 'Sin responder'], ['comentados', 'Más comentados']].map(([k, l]) => `<button class="chip${F.tab === k ? ' on' : ''}" data-act="foro-tab" data-k="${k}" aria-pressed="${F.tab === k}">${l}</button>`).join('')}</div>
        ${th.length ? `<div class="table-list">${th.map((t) => `<button class="thread" data-go="#/foro/${t.id}"><span class="avatar plain">${esc(t.ini)}</span><span class="tt"><span class="m">${catTag(t.cat)}<span>${esc(t.author)} &nbsp;·&nbsp; ${esc(t.when)}</span>${t.isNew ? '<span class="new-tag">NUEVO</span>' : ''}</span><h4>${esc(t.title)}</h4><p>${esc(t.excerpt)}</p></span><span class="cnt"><b>${t.replies}</b><span>respuestas</span></span></button>`).join('')}</div>`
          : `<div class="empty" style="padding:48px 24px"><h3>${F.tab === 'sinresp' ? 'No hay temas sin responder' : 'Todavía no hay temas acá'}</h3><p>${F.tab === 'sinresp' ? 'Todas las consultas tienen al menos una respuesta.' : 'Abrí el primero con “Abrir un tema”.'}</p></div>`}</div></div>`,
    };
  });
  W.acts['foro-cat'] = (el) => { ui.foro.cat = ui.foro.cat === el.dataset.id ? null : el.dataset.id; W.render(); };
  W.acts['foro-tab'] = (el) => { ui.foro.tab = el.dataset.k; W.render(); };

  W.route('/foro/:id', (p) => {
    const t = V.S().forum.threads.find((x) => x.id === p.id); if (!t) return { redirect: '#/foro' };
    const me = V.S().user; const c = catOf(t.cat);
    const others = V.S().forum.threads.filter((x) => x.cat === t.cat && x.id !== t.id).slice(0, 3);
    const n = t.rel ? nov(t.rel) : null;
    return {
      nav: 'foro', title: t.title,
      html: `<div class="crumbs"><a href="#/foro">Foro</a><i>/</i><b>${esc(c.name)}</b></div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">${catTag(t.cat)}<span style="font-size:13px;color:var(--faint)">${t.replies} respuestas &nbsp;·&nbsp; ${esc(t.whenFull)}</span></div>
        <h1 class="big" style="margin-bottom:20px">${esc(t.title)}</h1>
        <div class="grid-2" style="grid-template-columns:minmax(0,1fr) 320px"><div>
          ${t.posts.map((po, i) => `<article class="post${i === 0 ? ' author' : ''}"><div class="ph"><span class="avatar plain">${esc(po.ini)}</span><span class="nm"><b>${esc(po.author)}</b>${i === 0 ? `<span class="badge-aut">${esc(t.authorTag || 'AUTOR/A')}</span>` : ''}<small>${esc(po.when)}</small></span><span class="grow"></span>${po.useful ? `<span class="badge-util">${shape('dot')}RESPUESTA ÚTIL</span>` : ''}</div><p>${esc(po.text)}</p>
            <div class="acts"><button class="me${po.liked ? ' on' : ''}" data-act="post-like" data-t="${t.id}" data-p="${po.id}" aria-pressed="${!!po.liked}">${po.liked ? '✓ ' : ''}Me sirve${po.likes ? ' · ' + po.likes : ''}</button><button data-act="post-reply" data-who="${esc(po.author.split(' ')[0])}">Responder</button></div></article>`).join('')}
          <form class="reply-box" data-form="reply" data-t="${t.id}"><span class="avatar">${me.photo ? `<img src="${me.photo}" alt="">` : esc(me.initials)}</span><input id="reply-in" placeholder="Escribí tu respuesta…" aria-label="Tu respuesta" maxlength="1000" autocomplete="off"><button class="btn btn-primary" type="submit">Responder</button></form>
        </div><aside>
          <div class="side-note"><h5>${shape('tri', 'sh-lg')}Opiniones de colegas</h5><p>Lo que se comenta acá no es información oficial. Para la normativa vigente, mirá la sección Novedades.</p></div>
          ${n ? `<div class="side-card"><div class="k">NOVEDAD RELACIONADA</div><h5>${esc(n.title)}</h5><small>${esc(n.src.replace('AFIP/ARCA', 'ARCA').replace(' — ', ' · '))}</small><button class="link" data-go="#/novedades/${n.id}">Ver la novedad oficial →</button></div>` : ''}
          ${others.length ? `<div class="side-card"><div class="k">OTROS TEMAS DE LA CATEGORÍA</div>${others.map((o) => `<button class="lk" data-go="#/foro/${o.id}">${esc(o.title)}</button>`).join('')}</div>` : ''}
        </aside></div>`,
    };
  });
  W.acts['post-like'] = (el) => V.set((S) => {
    const po = S.forum.threads.find((x) => x.id === el.dataset.t).posts.find((x) => x.id === el.dataset.p);
    po.liked = !po.liked; po.likes = Math.max(0, (po.likes || 0) + (po.liked ? 1 : -1));
  });
  W.acts['post-reply'] = (el) => { const i = document.getElementById('reply-in'); if (i) { i.value = `@${el.dataset.who} `; i.focus(); i.scrollIntoView({ block: 'center', behavior: 'smooth' }); } };
  W.forms.reply = (f) => {
    const i = f.querySelector('input'); const v = i.value.trim(); if (!v) { i.focus(); return; }
    const me = V.S().user;
    V.set((S) => { const t = S.forum.threads.find((x) => x.id === f.dataset.t); t.posts.push({ id: V.uid('p'), author: me.name.split(' ')[0] + ' ' + me.name.split(' ').slice(-1)[0][0] + '.', ini: me.initials, text: v, when: 'ahora', likes: 0, liked: false }); t.replies += 1; });
    U.toast('Publicaste tu respuesta');
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 30);
  };
  W.acts['new-topic'] = () => {
    U.modal({
      cls: 'w-lg',
      html: `<h2>Abrir un tema</h2><p class="lead">Contale a tus colegas qué necesitás. Evitá datos de clientes: el foro es público entre contadores.</p>
        <form id="ntf" novalidate><div class="field"><label for="ntc">Categoría</label><select id="ntc" class="select">${V.FORUM_CATS.map((c) => `<option value="${c.id}"${ui.foro.cat === c.id ? ' selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="ntt">Título</label><input id="ntt" class="input" maxlength="120" placeholder="Ej: ¿Cómo lo resuelven cuando el cliente no entrega a tiempo?" autofocus><div class="err-msg" id="ntt-e" hidden></div></div>
        <div class="field"><label for="ntb">Detalle</label><textarea id="ntb" class="textarea" maxlength="1500" placeholder="Contá el caso con el mayor detalle posible."></textarea><div class="err-msg" id="ntb-e" hidden></div></div>
        <div class="foot"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Publicar tema</button></div></form>`,
      onMount: (m) => m.$('#ntf').addEventListener('submit', (e) => {
        e.preventDefault(); const title = m.$('#ntt').value.trim(); const body = m.$('#ntb').value.trim();
        const set = (id, msg) => { const el = m.$('#' + id); el.textContent = msg || ''; el.hidden = !msg; };
        set('ntt-e', title.length >= 8 ? '' : 'Ponele un título de al menos 8 caracteres.'); set('ntb-e', body ? '' : 'Contá un poco más del caso.');
        if (title.length < 8 || !body) return;
        const me = V.S().user; const id = V.uid('th'); const cat = m.$('#ntc').value;
        m.close();
        V.set((S) => { S.forum.threads.unshift({ id, cat, title, excerpt: body.length > 90 ? body.slice(0, 88) + '…' : body, author: me.name.split(' ')[0] + ' ' + me.name.split(' ').slice(-1)[0][0] + '.', ini: me.initials, when: 'ahora', whenFull: 'abierto ahora', replies: 0, isNew: true, mine: true, posts: [{ id: V.uid('p'), author: me.name.split(' ')[0] + ' ' + me.name.split(' ').slice(-1)[0][0] + '.', ini: me.initials, text: body, when: 'ahora', likes: 0, liked: false }] }); });
        U.toast('Tema publicado'); W.go('#/foro/' + id);
      }),
    });
  };

  /* =========================================================
     Configuración
     ========================================================= */
  const CTABS = [['cuenta', 'Cuenta'], ['alertas', 'Alertas'], ['fuentes', 'Fuentes oficiales'], ['plan', 'Plan']];
  const CHEAD = {
    cuenta: ['Configuración', 'Datos de tu cuenta, estudio y preferencias generales.'],
    alertas: ['Configuración de alertas', 'Definí con cuánta anticipación querés que te avisemos y por qué medio.'],
    fuentes: ['Fuentes oficiales', 'De dónde salen las fechas de tu calendario y cuándo se verificaron por última vez.'],
    plan: ['Plan', 'Tu plan actual y qué incluye cada uno.'],
  };
  W.route('/config', () => ({ redirect: '#/config/alertas' }));
  W.route('/config/:tab', (p) => {
    const tab = p.tab; if (!CHEAD[tab]) return { redirect: '#/config/alertas' };
    const body = { cuenta: cfgCuenta, alertas: cfgAlertas, fuentes: cfgFuentes, plan: cfgPlan }[tab]();
    return {
      nav: 'config', title: CHEAD[tab][0],
      html: `<div class="page-h" style="margin-bottom:18px"><div><h1>${CHEAD[tab][0]}</h1><p class="sub">${CHEAD[tab][1]}</p></div></div>
        <nav class="chips" aria-label="Secciones de configuración">${CTABS.map(([k, l]) => `<a class="chip${tab === k ? ' on' : ''}" href="#/config/${k}"${tab === k ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>${body}`,
    };
  });

  /* ---------- Cuenta ---------- */
  const twofaText = (u) => (u.twofa.on ? `Activada por ${u.twofa.method === 'SMS' ? 'SMS' : 'app autenticadora'}` : 'Desactivada');
  function cfgCuenta() {
    const S = V.S(); const u = S.user; const st = Q.stats();
    const av = u.photo ? `<span class="avatar lg" style="background:none"><img src="${u.photo}" alt="Tu foto de perfil"></span>` : `<span class="avatar lg" aria-hidden="true">${esc(u.initials)}</span>`;
    return `<div class="grid-2" style="grid-template-columns:minmax(0,1fr) 380px"><div class="stack" style="gap:20px">
      <section class="card" style="padding:26px"><h3>Datos personales</h3><div class="profile-row">${av}<div class="t"><h3>${esc(u.name)}</h3><div class="s">${esc(u.title)}</div></div><button class="btn btn-soft" data-act="change-photo">Cambiar foto</button></div>
        <div class="kv" style="margin-top:6px"><div class="row"><span>Email</span><b>${esc(u.email)}</b></div><div class="row"><span>Teléfono</span><b>${esc(u.phone)}</b></div><div class="row"><span>CUIT</span><b>${esc(u.cuit)}</b></div></div></section>
      <section class="card" style="padding:26px"><h3>Seguridad</h3>
        <div class="sec-row" style="margin-top:8px"><div><b>Contraseña</b><span>${esc(u.passwordChanged)}</span></div><button class="link" data-act="change-pass">Cambiar</button></div>
        <div class="sec-row"><div><b>Verificación en dos pasos</b><span>${twofaText(u)}</span></div><button class="link" data-act="manage-2fa">Administrar</button></div>
        <div class="sec-row"><div><b>Sesión</b><span>Salí de Vigente en este navegador</span></div><button class="link" data-act="logout">Cerrar sesión</button></div></section></div>
      <div class="stack" style="gap:20px"><section class="card" style="padding:26px"><h3>Estudio</h3><div class="kv" style="margin-top:10px"><div class="row"><span>Nombre</span><b>${esc(S.estudio.nombre)}</b></div><div class="row"><span>Clientes activos</span><b>${st.clientes}</b></div><div class="row"><span>Plan</span><b>${esc(S.estudio.plan)}</b></div><div class="row"><span>Miembro desde</span><b>${esc(S.estudio.desde)}</b></div></div></section>
        <section class="card" style="padding:26px"><h3>Tus datos</h3><p class="card-sub" style="margin:10px 0 16px;line-height:1.45">Podés exportar toda la información de tu cartera en cualquier momento.</p><button class="btn btn-ghost btn-block" data-act="export">Exportar cartera (.csv)</button></section></div></div>`;
  }

  W.acts.export = () => {
    const S = V.S(); const head = ['Nombre', 'CUIT', 'Tipo de contribuyente', 'Jurisdicciones', 'Actividad', 'Email', 'Teléfono', 'Trámites activos', 'Próximo vencimiento'];
    const rows = S.clients.map((c) => { const pend = Q.byDate(Q.pending().filter((t) => t.clientId === c.id)); return [c.name, c.cuit, c.type, c.juris.map((j) => V.JURIS.find((x) => x.id === j).ambit).join(' + '), c.activity, c.email, c.phone, pend.length, pend[0] ? D.dmy(pend[0].due) : '']; });
    U.download('cartera-vigente.csv', [head].concat(rows).map((r) => r.map(U.csvCell).join(';')).join('\r\n'));
    U.toast(`Exportamos ${rows.length} clientes`);
  };

  W.acts['change-photo'] = () => {
    const u = V.S().user; let pending; // undefined = sin cambios; null = quitar; string = nueva
    U.modal({
      cls: 'w-md',
      html: `<h2>Cambiar foto</h2><p class="lead">Elegí una imagen cuadrada para que se vea bien. En esta demo la foto queda guardada sólo en este navegador.</p>
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:6px"><span class="avatar lg" id="pprev" style="width:88px;height:88px;font-size:30px">${u.photo ? `<img src="${u.photo}" alt="">` : esc(u.initials)}</span>
        <div style="display:flex;flex-direction:column;align-items:flex-start;gap:10px"><button class="btn btn-ghost" id="ppick" type="button">Elegir imagen</button><button class="link" id="prm" type="button"${u.photo ? '' : ' hidden'}>Quitar foto</button></div></div>
        <input type="file" id="pfile" accept="image/*" hidden><div class="err-msg" id="perr" role="alert" hidden></div><p class="hint">JPG, PNG o WebP · hasta 8 MB</p>
        <div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="psave" disabled>Guardar foto</button></div>`,
      onMount: (m) => {
        const prev = m.$('#pprev'), save = m.$('#psave'), err = m.$('#perr'), rm = m.$('#prm');
        m.$('#ppick').addEventListener('click', () => m.$('#pfile').click());
        m.$('#pfile').addEventListener('change', async (e) => {
          const f = e.target.files[0]; if (!f) return; err.hidden = true;
          try { pending = await U.readImage(f, 256); prev.innerHTML = `<img src="${pending}" alt="">`; save.disabled = false; rm.hidden = false; }
          catch (x) { err.textContent = x.message; err.hidden = false; }
        });
        rm.addEventListener('click', () => { pending = null; prev.textContent = u.initials; save.disabled = false; rm.hidden = true; });
        save.addEventListener('click', () => { if (pending === undefined) return; m.close(); V.set((S) => { S.user.photo = pending; }); U.toast(pending ? 'Foto actualizada' : 'Quitaste tu foto'); });
      },
    });
  };

  W.acts['change-pass'] = () => U.modal({
    cls: 'w-md',
    html: `<h2>Cambiar contraseña</h2><p class="lead">Elegí una contraseña de al menos 8 caracteres, con letras y números.</p>
      <form id="pwf" novalidate><div class="field"><label for="pw0">Contraseña actual</label><input id="pw0" class="input" type="password" autocomplete="current-password" autofocus></div>
      <div class="field"><label for="pw1">Contraseña nueva</label><input id="pw1" class="input" type="password" autocomplete="new-password"><div class="hint" id="pwh">Mínimo 8 caracteres.</div></div>
      <div class="field"><label for="pw2">Repetí la contraseña nueva</label><input id="pw2" class="input" type="password" autocomplete="new-password"></div>
      <div class="err-msg" id="pwe" role="alert" hidden></div>
      <div class="foot"><button type="button" class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" type="submit">Guardar contraseña</button></div></form>`,
    onMount: (m) => {
      const strength = (s) => { let n = 0; if (s.length >= 8) n++; if (/[A-Za-z]/.test(s) && /\d/.test(s)) n++; if (s.length >= 12 || /[^A-Za-z0-9]/.test(s)) n++; return n; };
      m.$('#pw1').addEventListener('input', (e) => { const s = e.target.value; m.$('#pwh').textContent = !s ? 'Mínimo 8 caracteres.' : ['Muy corta: sumá más caracteres.', 'Floja: combiná letras y números.', 'Aceptable.', 'Fuerte.'][strength(s)]; });
      m.$('#pwf').addEventListener('submit', (e) => {
        e.preventDefault(); const a = m.$('#pw0').value, b = m.$('#pw1').value, c = m.$('#pw2').value; const err = m.$('#pwe');
        const fail = (t) => { err.textContent = t; err.hidden = false; };
        if (!a) return fail('Ingresá tu contraseña actual.');
        if (b.length < 8 || !/[A-Za-z]/.test(b) || !/\d/.test(b)) return fail('La nueva contraseña necesita al menos 8 caracteres, con letras y números.');
        if (b === a) return fail('La nueva contraseña tiene que ser distinta de la actual.');
        if (b !== c) return fail('Las dos contraseñas nuevas no coinciden.');
        m.close(); V.set((S) => { S.user.passwordChanged = 'Actualizada hoy'; }); U.toast('Contraseña actualizada');
      });
    },
  });

  W.acts['manage-2fa'] = () => {
    const u = V.S().user;
    U.modal({
      cls: 'w-md',
      html: `<h2>Verificación en dos pasos</h2><p class="lead">Además de la contraseña, te pedimos un código cada vez que ingresás desde un dispositivo nuevo.</p>
        <div class="set-row" style="padding:4px 0 16px"><div><b>Verificación en dos pasos</b><span id="tf-s">${u.twofa.on ? 'Activada' : 'Desactivada'}</span></div><label class="toggle"><input type="checkbox" id="tf-on"${u.twofa.on ? ' checked' : ''} aria-label="Verificación en dos pasos"><i></i></label></div>
        <div id="tf-m"${u.twofa.on ? '' : ' hidden'}><div class="lbl">Cómo querés recibir el código</div>
          <label class="radio-card${u.twofa.method === 'SMS' ? ' on' : ''}" data-m="SMS"><input type="radio" name="tfm" value="SMS"${u.twofa.method === 'SMS' ? ' checked' : ''}><span class="rd"></span><span><b>Mensaje de texto (SMS)</b><span class="s">${esc(u.phone.slice(0, -4).replace(/\d/g, (d, i) => (i > 6 ? '•' : d)) + u.phone.slice(-4))}</span></span></label>
          <label class="radio-card${u.twofa.method === 'App' ? ' on' : ''}" data-m="App"><input type="radio" name="tfm" value="App"${u.twofa.method === 'App' ? ' checked' : ''}><span class="rd"></span><span><b>App autenticadora</b><span class="s">Google Authenticator, Authy o similar</span></span></label></div>
        <div class="callout warn" id="tf-w" style="margin:0 0 4px"${u.twofa.on ? ' hidden' : ''}><p>Sin verificación en dos pasos, tu cuenta queda protegida sólo con la contraseña.</p></div>
        <div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="tf-save">Guardar</button></div>`,
      onMount: (m) => {
        const on = m.$('#tf-on');
        on.addEventListener('change', () => { m.$('#tf-m').hidden = !on.checked; m.$('#tf-w').hidden = on.checked; m.$('#tf-s').textContent = on.checked ? 'Activada' : 'Desactivada'; });
        m.$$('.radio-card').forEach((r) => r.addEventListener('click', () => { m.$$('.radio-card').forEach((x) => x.classList.toggle('on', x === r)); r.querySelector('input').checked = true; }));
        m.$('#tf-save').addEventListener('click', () => {
          const method = (m.$('input[name=tfm]:checked') || {}).value || 'SMS'; const enabled = on.checked; m.close();
          V.set((S) => { S.user.twofa = { on: enabled, method }; }); U.toast(enabled ? `Verificación activada por ${method === 'SMS' ? 'SMS' : 'app autenticadora'}` : 'Desactivaste la verificación en dos pasos');
        });
      },
    });
  };

  /* ---------- Alertas ---------- */
  const ANT = [[15, '15 días antes'], [7, '7 días antes'], [3, '3 días antes'], [1, '1 día antes'], [0, 'El mismo día']];
  const CHANNELS = [['app', 'Dentro de la aplicación', 'Aparecen en el panel de notificaciones.'], ['email', 'Correo electrónico', 'Un resumen diario a las 8:00 con lo que vence esa semana.'], ['push', 'Notificaciones push en el celular', 'Requiere tener instalada la app móvil.'], ['watch', 'Smartwatch', 'Solo para vencimientos del día y prórrogas.']];
  const TOPICS = [['proximos', 'Vencimientos próximos', 'Según la anticipación configurada arriba.'], ['prorrogas', 'Prórrogas detectadas', 'Cuando un organismo posterga una fecha y actualizamos tu calendario.'], ['normativos', 'Cambios normativos', 'Cuando cambia la forma de presentar un trámite de tus clientes.'], ['sinpresentar', 'Vencimientos sin presentar', 'Si pasó la fecha y el trámite sigue pendiente.'], ['resumen', 'Resumen semanal', 'Todos los lunes, un panorama de la semana.']];
  const tgl = (grp, k, on, label) => `<label class="toggle"><input type="checkbox" data-ch="setting" data-g="${grp}" data-k="${k}"${on ? ' checked' : ''} aria-label="${esc(label)}"><i></i></label>`;
  function cfgAlertas() {
    const s = V.S().settings;
    return `<div class="stack" style="gap:20px">
      <section class="card" style="padding:26px"><h3>Anticipación de los avisos</h3><p class="card-sub">Podés elegir más de una. Vas a recibir un aviso en cada momento seleccionado.</p><div class="ant-chips" role="group" aria-label="Anticipación">${ANT.map(([k, l]) => `<button class="chip sq${s.ant[k] ? ' on' : ''}" data-act="ant" data-k="${k}" aria-pressed="${!!s.ant[k]}">${s.ant[k] ? '<i class="sh"></i>' : ''}${l}</button>`).join('')}</div></section>
      <section class="card" style="padding:26px"><h3>Por dónde querés recibirlos</h3><div class="set-list">${CHANNELS.map(([k, t, d]) => `<div class="set-row"><div><b>${t}</b><span>${d}</span></div>${tgl('channels', k, s.channels[k], t)}</div>`).join('')}</div></section>
      <section class="card" style="padding:26px"><h3>Qué querés que te avisemos</h3><div class="set-list">${TOPICS.map(([k, t, d]) => `<div class="set-row"><div><b>${t}</b><span>${d}</span></div>${tgl('topics', k, s.topics[k], t)}</div>`).join('')}</div></section></div>`;
  }
  W.acts.ant = (el) => { const k = el.dataset.k; V.set((S) => { S.settings.ant[k] = !S.settings.ant[k]; }); U.toast('Preferencias guardadas', 1400); };
  W.chs.setting = (el) => { V.set((S) => { S.settings[el.dataset.g][el.dataset.k] = el.checked; }); U.toast('Preferencias guardadas', 1400); };

  /* ---------- Fuentes oficiales ---------- */
  const SOURCES = [['AFIP/ARCA', 'Calendario nacional de vencimientos, prórrogas y resoluciones generales.'], ['ARBA', 'Ingresos Brutos y tributos de la provincia de Buenos Aires.'], ['AGIP', 'Ingresos Brutos de la Ciudad Autónoma de Buenos Aires.'], ['CPCECABA', 'Consejo Profesional de Ciencias Económicas: normativa y cursos.']];
  function cfgFuentes() {
    const S = V.S(); const off = S.offline;
    return `<section class="card" style="padding:26px">${off ? offBanner() : ''}<h3>Fuentes que usamos</h3><p class="card-sub" style="margin-bottom:8px">Vigente cruza el perfil impositivo de cada cliente con estas fuentes para armar y actualizar tu calendario.</p>
      ${SOURCES.map(([n, d], i) => `<div class="src-row"><span class="avatar plain" style="width:40px;height:40px">${n.slice(0, 2)}</span><span class="t"><b>${n}</b><span>${d}</span></span><span class="badge ${off && i === 0 ? 'b-pendiente' : 'b-presentado'}">${shape(off && i === 0 ? 'tri' : 'dot')}${off && i === 0 ? 'Sin conexión' : 'Verificada 04/08, 09:14'}</span><button class="btn btn-ghost btn-sm" data-act="verify" data-s="${n}">Verificar ahora</button></div>`).join('')}</section>
      <section class="card" style="padding:26px;margin-top:20px"><h3>Cómo se aplican los cambios</h3><div class="set-list"><div class="set-row"><div><b>Aplicar prórrogas automáticamente</b><span>Cuando un organismo posterga una fecha, actualizamos el calendario y te avisamos.</span></div>${tgl('topics', 'prorrogas', V.S().settings.topics.prorrogas, 'Aplicar prórrogas automáticamente')}</div></div></section>`;
  }
  const offBanner = () => `<div class="callout warn" style="margin-bottom:20px"><h4>${shape('tri', 'sh-lg')}Sin conexión con AFIP/ARCA</h4><p>Seguimos usando la última información verificada (04/08/2026, 09:14).</p></div>`;
  W.acts.verify = (el) => { if (V.S().offline && el.dataset.s === 'AFIP/ARCA') V.set((S) => { S.offline = false; }); U.toast(`${el.dataset.s}: fechas verificadas, sin cambios nuevos`); };

  /* ---------- Plan ---------- */
  const PLANS = [['Inicial', '$12.000', 'hasta 15 clientes', ['Calendario automático', 'Avisos por email', 'Foro de contadores']], ['Profesional', '$28.000', 'hasta 100 clientes', ['Todo lo de Inicial', 'Pedido de documentación', 'App móvil y smartwatch', 'Importación desde Excel']], ['Estudio', '$65.000', 'clientes ilimitados', ['Todo lo de Profesional', 'Varios usuarios', 'Soporte prioritario', 'Exportaciones avanzadas']]];
  function cfgPlan() {
    const cur = V.S().estudio.plan;
    return `<div class="plan-grid">${PLANS.map(([n, p, c, f]) => `<article class="plan${n === cur ? ' cur' : ''}"><h4>${n}${n === cur ? ' <span class="tag violet" style="margin-left:6px">Tu plan</span>' : ''}</h4><div class="pr">${p} <small>/ mes</small></div><div class="card-sub" style="margin:0">${c}</div><ul>${f.map((x) => `<li>${x}</li>`).join('')}</ul>${n === cur ? '<button class="btn btn-ghost btn-block" disabled>Plan actual</button>' : `<button class="btn btn-primary btn-block" data-act="plan" data-n="${n}">Cambiar a ${n}</button>`}</article>`).join('')}</div>
      <p class="hint" style="margin-top:14px">Los precios son de ejemplo para la demo.</p>`;
  }
  W.acts.plan = (el) => U.modal({
    cls: 'w-md', html: `<h2>Cambiar a ${esc(el.dataset.n)}</h2><p class="lead">El cambio se aplica desde tu próxima facturación y no pierde ningún dato.</p><div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="pl-ok">Confirmar cambio</button></div>`,
    onMount: (m) => m.$('#pl-ok').addEventListener('click', () => { m.close(); V.set((S) => { S.estudio.plan = el.dataset.n; }); U.toast(`Ahora estás en el plan ${el.dataset.n}`); }),
  });
})();
