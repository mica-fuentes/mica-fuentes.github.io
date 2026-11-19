/* =========================================================
   Vigente · demo — app móvil (pantallas H·37 a H·47 del Figma)
   ========================================================= */
(function () {
  const V = window.V, Q = V.q, A = V.act, D = V.date, U = V.ui;
  const { esc, shape } = U;
  const root = document.getElementById('screen');
  const ui = { month: V.TODAY, sel: V.TODAY, nf: 'todas', ff: 'todas', q: '' };

  const mb = (kind, label) => U.badge(kind, { label }).replace('class="badge', 'class="badge m-badge');
  const status = (light) => `<div class="status${light ? ' light' : ''}"><span>9:41</span><span class="dots" aria-hidden="true">•••</span></div>`;
  const ICON = {
    hoy: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="19" height="17" rx="3.5"/><path d="M3.5 10.5h19M8.5 3v4M17.5 3v4"/><rect x="9.5" y="13.5" width="5" height="5" rx="1.2" fill="currentColor" stroke="none"/></svg>',
    calendario: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="19" height="17" rx="3.5"/><path d="M3.5 10.5h19M8.5 3v4M17.5 3v4M8.5 15h.01M13 15h.01M17.5 15h.01M8.5 18.5h.01M13 18.5h.01"/></svg>',
    clientes: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="9" r="3.8"/><path d="M3.5 22c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2"/><path d="M17 5.4a3.6 3.6 0 0 1 0 7M19.5 16c2 .8 3.2 2.8 3.2 5.2"/></svg>',
    novedades: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5v5h3.5L16 20.5v-15L7.5 10.5H4zM19.5 9.5c1.3 1 1.3 6 0 7M7.5 15.5l1.2 5h2.6"/></svg>',
    foro: '<svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5h12a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H9l-4 3.5V15a2 2 0 0 1-1-1.7V7.5a2 2 0 0 1 2-2z"/><path d="M20.5 9.5H21a2 2 0 0 1 2 2v7l-3-2.5h-5.5a2 2 0 0 1-2-1.6"/></svg>',
  };
  const TABS = [['hoy', 'Hoy'], ['calendario', 'Calendario'], ['clientes', 'Clientes'], ['novedades', 'Novedades'], ['foro', 'Foro']];
  const tabbar = (cur) => `<nav class="tabbar" aria-label="Secciones">${TABS.map(([k, l]) => `<button class="tab${cur === k ? ' on' : ''}" data-go="#/${k}"${cur === k ? ' aria-current="page"' : ''}>${ICON[k]}<span>${l}</span></button>`).join('')}</nav>`;
  const topbar = (title, back) => `<div class="m-top">${status(false)}<div class="m-bar">${back ? `<button class="back" data-back="${back}" aria-label="Volver">←</button>` : ''}<h1>${esc(title)}</h1></div></div>`;
  const plainName = (n) => n.replace(/\s+(y Asoc\.|S\.A\.|SRL|SA)$/i, '');
  const ddjj = (n) => n.replace('Declaración jurada', 'DDJJ').replace('Declaración mensual', 'DDJJ mensual');
  const av = (name, tint) => `<span class="avatar${tint != null ? ' t' + tint : ''}" aria-hidden="true">${esc(Q.initials(name))}</span>`;

  function parse() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [p] = h.split('?'); return { path: p.replace(/\/+$/, '') || '/', parts: p.split('/').filter(Boolean) };
  }

  /* ---------- vistas ---------- */
  function vLogin() {
    return `${status(false)}<form class="m-login" data-form="login" novalidate>
      <div class="m-brand"><img src="assets/logo-mark.svg" alt=""><div><b>vigente</b><span>vencimientos impositivos</span></div></div>
      <h1>Entrá a tu cuenta</h1><p class="lead">Consultá tus vencimientos desde donde estés.</p>
      <label class="lbl" for="e">Email</label><input id="e" class="m-input" type="email" placeholder="nombre@estudio.com.ar" autocomplete="username" style="margin-bottom:16px">
      <label class="lbl" for="p">Contraseña</label><input id="p" class="m-input" type="password" placeholder="••••••••" autocomplete="current-password" style="margin-bottom:20px">
      <div class="err-msg" id="le" role="alert" hidden style="margin:-8px 0 12px"></div>
      <button class="m-btn primary" type="submit">Ingresar</button>
      <p style="text-align:center;margin-top:20px"><button type="button" class="link" data-act="forgot" style="font-size:14px">¿Olvidaste tu contraseña?</button></p></form>`;
  }

  function vHoy() {
    const S = V.S(); const st = Q.stats(); const today = Q.dueToday(); const over = Q.overdue(); const done = Q.presentedToday();
    const d = D.parse(V.TODAY); const unread = Q.unread();
    return `<div class="m-hero">${status(true)}<div class="row"><span class="logo"><img src="assets/logo-mark.svg" alt="">vigente</span><span style="display:flex;gap:8px"><button class="bell" data-act="logout" aria-label="Cerrar sesión">Salir</button><button class="bell" data-go="#/notificaciones" aria-label="Notificaciones, ${unread} sin leer"><i></i>${unread}</button></span></div>
        <div class="dow">${D.DIAS[d.getDay()].toUpperCase()}</div><div class="date">${d.getDate()} de ${D.MES[d.getMonth()]}</div>
        <div class="sums"><span><b style="color:var(--lime)">${st.hoy}</b>vencen hoy</span><span><b>${st.vencidos}</b>${st.vencidos === 1 ? 'vencido' : 'vencidos'}</span><span><b style="color:#d3c6ee">${st.semana}</b>esta semana</span></div></div>
      <div class="m-scroll">
        ${today.length ? `<div class="m-label">Vencen hoy</div>${today.map((t) => { const c = Q.client(t.clientId); return `<div class="m-card"><button class="top" style="border:0;background:none;padding:0;width:100%;text-align:left" data-go="#/tramite/${t.id}">${av(c.name)}<span class="t"><b>${esc(c.name)}</b><span class="s">${esc(ddjj(t.name))}</span></span>${mb('urgente', 'Urgente')}</button><button class="m-btn lime" data-act="present" data-id="${t.id}">Marcar como presentado</button></div>`; }).join('')}` : ''}
        ${done.length ? `<div class="m-label">Presentado hoy</div>${done.map((t) => { const c = Q.client(t.clientId); return `<div class="m-card done row"><div class="top"><span class="tick">${U.checkIcon(15)}</span><span class="t"><b>${esc(c.name)}</b><span class="s">${esc(ddjj(t.name))}</span></span><button class="link" data-act="undo" data-id="${t.id}" style="color:var(--green);font-size:13px">Deshacer</button></div></div>`; }).join('')}` : ''}
        ${!today.length && !done.length ? `<div class="m-label">Vencen hoy</div><div class="m-empty">No tenés vencimientos hoy. Todo al día.</div>` : ''}
        ${over.length ? `<div class="m-label">Vencido sin presentar</div>${over.map((t) => `<button class="m-dark" style="margin-bottom:10px" data-go="#/tramite/${t.id}"><b><i></i>${esc(Q.client(t.clientId).name)}</b><span>${esc(t.name)} · venció ${D.dm(t.due)}</span></button>`).join('')}` : ''}
      </div>${tabbar('hoy')}`;
  }

  function vCal() {
    const S = V.S(); const first = D.addMonths(ui.month, 0); const fd = D.parse(first);
    const start = D.mondayOf(first); const dim = new Date(fd.getFullYear(), fd.getMonth() + 1, 0).getDate();
    const rows = Math.ceil((D.diffDays(first, start) + dim) / 7); const ym = first.slice(0, 7);
    const cells = Array.from({ length: rows * 7 }, (_, i) => D.addDays(start, i));
    const dayItems = Q.byDate(S.tramites.filter((t) => t.due === ui.sel));
    const sd = D.parse(ui.sel);
    return `${topbar(D.monthYear(ui.month))}<div class="m-scroll">
      <div class="m-month"><button data-act="month" data-d="-1" aria-label="Mes anterior">‹</button><span>${D.monthYear(ui.month)}</span><button data-act="month" data-d="1" aria-label="Mes siguiente">›</button></div>
      <div class="m-grid"><div class="w">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((x) => `<div>${x}</div>`).join('')}</div>
      <div class="d">${cells.map((d) => { const out = d.slice(0, 7) !== ym; const its = out ? [] : S.tramites.filter((t) => t.due === d); const k = its.length ? Q.status(Q.sorted(its)[0]) : '';
        return `<button class="${out ? 'out' : ''}${d === V.TODAY ? ' today' : ''}${d === ui.sel ? ' sel' : ''}" data-act="pick-day" data-d="${d}" aria-label="${D.long(d)}${its.length ? ', ' + its.length + ' vencimientos' : ''}"><span class="n">${D.parse(d).getDate()}</span><span class="dot${k ? ' k-' + k : ''}"></span></button>`; }).join('')}</div></div>
      <div class="m-label">${D.DIAS[sd.getDay()]} ${sd.getDate()} · ${dayItems.length} ${dayItems.length === 1 ? 'vencimiento' : 'vencimientos'}</div>
      ${dayItems.length ? dayItems.map((t) => { const c = Q.client(t.clientId); const s = Q.status(t); return `<button class="m-card row" data-go="#/tramite/${t.id}"><span class="top">${av(c.name)}<span class="t"><b>${esc(plainName(c.name))}</b><span class="s">${esc(ddjj(t.name))}</span></span>${mb(s === 'nuevo' ? 'nuevo' : s, s === 'proximo' ? 'Próximo' : undefined)}</span></button>`; }).join('') : '<div class="m-empty">Sin vencimientos este día.</div>'}
    </div>${tabbar('calendario')}`;
  }

  function vTramite(id) {
    const t = Q.tramite(id); if (!t) return null; const c = Q.client(t.clientId); const st = Q.status(t); const days = D.diffDays(t.due, V.TODAY);
    const head = st === 'presentado' ? mb('presentado', 'Presentado') : st === 'vencido' ? mb('vencido', `Vencido hace ${-days} días`) : st === 'urgente' ? mb('urgente', 'Vence hoy') : mb('proximo', Q.dueLabel(t));
    const hist = Q.history(t);
    const isIva = /^IVA/.test(t.name);
    const kv = `<div class="m-kv"><div><span>Vencimiento</span><b>${D.short1(t.due)} ${D.parse(t.due).getFullYear()}</b></div><div><span>Organismo</span><b>${esc(t.org.replace('AFIP/ARCA', 'AFIP / ARCA'))}</b></div><div><span>Período</span><b>${esc(t.period)}</b></div><div><span>Term. CUIT</span><b>${esc(c.cuit.slice(-1))}</b></div></div>`;
    const notes = t.notes.length ? `<div class="m-hist"><div class="k">NOTAS INTERNAS</div>${t.notes.map((n) => `<div class="r"><span style="color:var(--ink)">${esc(n.text)}</span></div>`).join('')}</div>` : '';
    let body;
    if (st === 'presentado') {
      body = `<div class="m-done"><h3><i></i>Trámite presentado</h3><p>Registrado el ${D.dmy(t.presentedOn)}${t.presentedAt && t.presentedOn === V.TODAY ? ' a las ' + t.presentedAt : ''}. Salió del listado de pendientes.</p><button class="m-btn soft-green" data-act="undo" data-id="${t.id}">Deshacer</button></div>
        <div class="m-hist"><div class="k">HISTORIAL</div>${hist.map((h) => `<div class="r ${h.cls}"><span>${esc(h.label)}</span><b>${esc(h.text.replace('Presentado el', 'presentado'))}</b></div>`).join('')}</div>${notes}
        <button class="m-btn primary" data-go="#/hoy">Volver a Hoy</button>`;
    } else {
      body = `${kv}${isIva ? `<div class="m-note"><b>${shape('tri')}Cambió la forma de presentación</b>Desde 07/2026 se presenta por el nuevo portal de ARCA.<br><button data-go="#/novedad/n2">Ver curso · 4 min →</button></div>` : ''}
        ${st === 'vencido' ? `<div class="m-note" style="background:var(--red-bg);border-color:#f0b7b7;color:var(--red)"><b>${shape('sq')}Venció sin presentarse</b>La presentación fuera de término puede generar intereses y una multa por infracción formal.</div>` : ''}
        <button class="m-btn ${st === 'vencido' ? '' : 'green'}" style="${st === 'vencido' ? 'background:var(--red);color:#fff;' : ''}margin-bottom:12px" data-act="present" data-id="${t.id}" data-open="1">${st === 'vencido' ? 'Presentar fuera de término' : `${U.checkIcon(15)} Marcar como presentado`}</button>
        <button class="m-btn ghost" data-go="#/nota/${t.id}">Agregar nota</button>${notes}
        <div class="m-hist" style="margin-top:16px"><div class="k">HISTORIAL</div>${hist.map((h) => `<div class="r ${h.cls}"><span>${esc(h.label)}</span><b>${esc(h.text.replace('Presentado el', 'presentado'))}</b></div>`).join('')}</div>`;
    }
    return `${topbar('Detalle', '#/hoy')}<div class="m-scroll"><div>${head}</div><h1 class="m-title">${esc(t.name)}</h1><p class="m-sub">${esc(c.name)} &nbsp;·&nbsp; ${esc(c.cuit)}</p>${body}</div>`;
  }

  function vNota(id) {
    const t = Q.tramite(id); if (!t) return null; const c = Q.client(t.clientId);
    return `${topbar('Nota interna', '#/tramite/' + id)}<div class="m-scroll"><div style="font-size:17px;font-weight:700;margin-bottom:6px">${esc(ddjj(t.name).replace('Declaración', 'DDJJ'))}</div><p class="m-sub" style="margin-bottom:14px">${esc(plainName(c.name))} &nbsp;·&nbsp; ${esc(t.period)}</p>
      <label class="sr-only" for="nt">Nota</label><textarea id="nt" class="m-text" maxlength="500" placeholder="Ej: Falta que el cliente mande la factura 4521 para cerrar el período." data-in="note"></textarea>
      <div class="m-info"><i></i>Sólo la ves vos. El cliente no la recibe.</div><button class="m-btn primary" id="save-note" data-act="save-note" data-id="${id}" disabled>Guardar nota</button></div>`;
  }

  function clientBadge(c) {
    const s = Q.byDate(Q.pending().filter((t) => t.clientId === c.id)); if (!s.length) return mb('aldia', 'Al día');
    const first = s[0]; const k = Q.status(first);
    if (k === 'vencido') return mb('vencido', 'Vencido'); if (k === 'urgente') return mb('urgente', 'Hoy');
    return mb('proximo', D.short(first.due));
  }
  function clientList(q) {
    const n = U.norm(q);
    const list = V.S().clients.filter((c) => !n || U.norm(c.name).includes(n) || c.cuit.replace(/-/g, '').includes(n.replace(/\D/g, '') || '§'));
    const ord = (c) => { const s = Q.byDate(Q.pending().filter((t) => t.clientId === c.id)); return s.length ? s[0].due : '9'; };
    list.sort((a, b) => ord(a).localeCompare(ord(b)));
    return list.length ? list.map((c) => { const n2 = Q.pending().filter((t) => t.clientId === c.id).length; return `<button class="m-card row" data-go="#/cliente/${c.id}"><span class="top">${av(c.name)}<span class="t"><b>${esc(c.name)}</b><span class="s">${esc(c.type.replace('Responsable Inscripto', 'Resp. Inscripto'))} · ${n2} ${n2 === 1 ? 'trámite' : 'trámites'}</span></span>${clientBadge(c)}</span></button>`; }).join('') : '<div class="m-empty">No encontramos clientes con ese nombre.</div>';
  }
  function vClientes() {
    return `${topbar('Clientes')}<div class="m-scroll"><div class="m-search"><i></i><input placeholder="Buscar por nombre o CUIT" aria-label="Buscar cliente" data-in="csearch" value="${esc(ui.q)}"></div>
      <div class="m-label">${Q.stats().clientes} clientes</div><div id="clist">${clientList(ui.q)}</div></div>${tabbar('clientes')}`;
  }
  function vCliente(id) {
    const c = Q.client(id); if (!c) return null; const ts = Q.clientTramites(id);
    return `${topbar(plainName(c.name), '#/clientes')}<div class="m-scroll"><p class="m-sub">${esc(c.type)} &nbsp;·&nbsp; CUIT ${esc(c.cuit)}</p>
      <div class="m-label" style="margin-top:0">Trámites</div>${ts.map((t) => { const s = Q.status(t); return `<button class="m-card row" data-go="#/tramite/${t.id}"><span class="top"><span class="t"><b>${esc(ddjj(t.name))}</b><span class="s">${D.short1(t.due)} · ${esc(t.org)}</span></span>${mb(s === 'nuevo' ? 'nuevo' : s, s === 'proximo' ? 'Próximo' : undefined)}</span></button>`; }).join('') || '<div class="m-empty">Todavía no tiene trámites.</div>'}
      ${c.email ? `<div class="m-src"><small>EMAIL DE CONTACTO</small><span>${esc(c.email)}</span></div>` : ''}</div>`;
  }

  const TAG = { prorroga: ['pent', 'violet', 'PRÓRROGA'], norma: ['tri', 'amber', 'CAMBIO DE NORMA'], recat: ['dot', 'green', 'RECATEGORIZACIÓN'], curso: ['ring', 'violet', 'CURSO'] };
  const novTag = (n) => { const [s, c, l] = TAG[n.type]; return `<span class="tag ${c}" style="display:inline-flex;gap:6px;align-items:center;font-size:11px;letter-spacing:.03em">${shape(s)}${l}</span>`; };
  function vNovedades() {
    return `${topbar('Novedades')}<div class="m-scroll"><div class="m-pill"><i></i>Verificado con ARCA hoy 08:14</div>
      ${V.NOVEDADES.map((n) => `<button class="m-nov" data-go="#/novedad/${n.id}"><div class="top">${novTag(n)}<small>${D.dm(n.date)}</small></div><h3>${esc(n.title)}</h3><p>${esc(n.short)}</p>${n.affects ? `<div class="aff"><i></i>Afecta a ${n.affects} clientes</div>` : `<div class="aff"><i></i>Curso de ${n.mins} min</div>`}</button>`).join('')}</div>${tabbar('novedades')}`;
  }
  function vNovedad(id) {
    const n = V.NOVEDADES.find((x) => x.id === id); if (!n) return null;
    const secs = V.NOV_SECTIONS[id] || [['Qué cambió', n.body]];
    return `${topbar('Novedad', '#/novedades')}<div class="m-scroll"><div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">${novTag(n)}<small style="color:var(--faint)">${D.dmy(n.date)}</small></div><h1 class="m-title" style="font-size:22px">${esc(n.title)}</h1>
      ${n.affects ? `<div class="m-info"><i></i><b>Afecta a ${n.affects} clientes de tu cartera</b></div>` : ''}
      <div class="m-sec">${secs.map(([h, b]) => `<h4>${esc(h)}</h4><p>${esc(b)}</p>`).join('')}</div>
      <div class="m-src"><small>FUENTE OFICIAL</small><span>${esc(n.src.replace('AFIP/ARCA', 'ARCA'))} · verificado el 12/08/2026</span></div>
      ${n.affects ? `<button class="m-btn ghost" data-go="#/clientes">Ver los ${n.affects} clientes</button>` : ''}</div>`;
  }

  const FF = [['todas', 'Todas'], ['imp', 'Impuestos'], ['mono', 'Monotributo']];
  const catTag = (id) => { const c = V.FORUM_CATS.find((x) => x.id === id); return `<span class="tag ${c.tag}" style="font-size:11.5px">${esc(V.FORUM_SHORT[id] === 'Impuestos' ? 'Impuestos y vencimientos' : c.name.split(' y ')[0] === 'Honorarios' ? 'Honorarios' : V.FORUM_SHORT[id])}</span>`; };
  function vForo() {
    const th = V.S().forum.threads.filter((t) => ui.ff === 'todas' || t.cat === ui.ff);
    return `${topbar('Foro')}<div class="m-scroll"><div class="m-chips" role="group" aria-label="Filtrar">${FF.map(([k, l]) => `<button class="m-chip${ui.ff === k ? ' on' : ''}" data-act="ff" data-k="${k}" aria-pressed="${ui.ff === k}">${l}</button>`).join('')}</div>
      ${th.map((t) => `<button class="m-thread" data-go="#/hilo/${t.id}">${catTag(t.cat)}<h3>${esc(t.title)}</h3><div class="by"><span class="avatar plain">${esc(t.ini)}</span><span>${esc(t.author)} · ${esc(t.when)}</span><b>${t.replies} resp.</b></div></button>`).join('') || '<div class="m-empty">No hay temas en esta categoría.</div>'}</div>${tabbar('foro')}`;
  }
  function vHilo(id) {
    const t = V.S().forum.threads.find((x) => x.id === id); if (!t) return null;
    return `${topbar('Foro', '#/foro')}<div class="m-scroll">${catTag(t.cat)}<h1 class="m-title" style="font-size:21px;margin-top:12px">${esc(t.title)}</h1><p class="m-sub">${t.replies} respuestas · ${esc(t.whenFull)}</p>
      ${t.posts.map((p) => `<div class="m-post"><div class="h"><span class="avatar plain">${esc(p.ini)}</span><b>${esc(p.author)}</b><small>${esc(p.when)}</small></div><p>${esc(p.text)}</p></div>`).join('')}
      <form class="m-reply" data-form="reply" data-t="${t.id}"><input class="m-input" placeholder="Escribí tu respuesta…" maxlength="500" aria-label="Tu respuesta"><button class="m-btn primary" type="submit">Enviar</button></form></div>`;
  }

  const NI = { prorroga: ['pent', '#5c339e'], semana: ['tri', '#a86b05'], vencido: ['sq', '#b31a1a'], norma: ['ring', '#5b2fd1'], sync: ['ring', '#8a8f98'] };
  function vNotifs() {
    return `${topbar('Notificaciones', '#/hoy')}<div class="m-scroll flush" style="padding:0;background:#fff">${V.S().notifs.map((n) => `<button class="m-n${n.read ? ' read' : ''}" data-act="notif" data-id="${n.id}"><span class="ic"><i class="sh sh-${NI[n.kind][0]}" style="color:${NI[n.kind][1]};width:12px;height:12px"></i></span><span><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${esc(n.when)}</small></span></button>`).join('')}</div>`;
  }

  /* ---------- render ---------- */
  function render() {
    const S = V.S(); const { path, parts } = parse();
    if (!S.loggedIn && path !== '/login') { location.replace('#/login'); return; }
    if (S.loggedIn && (path === '/login' || path === '/')) { location.replace('#/hoy'); return; }
    const arg = parts[1]; let html = null;
    switch (parts[0]) {
      case 'login': html = vLogin(); break; case 'hoy': html = vHoy(); break; case 'calendario': html = vCal(); break;
      case 'tramite': html = vTramite(arg); break; case 'nota': html = vNota(arg); break; case 'clientes': html = vClientes(); break;
      case 'cliente': html = vCliente(arg); break; case 'novedades': html = vNovedades(); break; case 'novedad': html = vNovedad(arg); break;
      case 'foro': html = vForo(); break; case 'hilo': html = vHilo(arg); break; case 'notificaciones': html = vNotifs(); break;
      default: html = null;
    }
    if (!html) { location.replace('#/hoy'); return; }
    const sc = root.querySelector('.m-scroll'); const y = sc ? sc.scrollTop : 0; const same = root.dataset.path === path; root.dataset.path = path;
    root.innerHTML = '<div class="notch"></div>' + html;
    const ns = root.querySelector('.m-scroll'); if (ns && same) ns.scrollTop = y;
    document.title = 'Vigente · app';
  }
  window.addEventListener('hashchange', render);
  V.onChange(render);

  /* ---------- eventos ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-back]'); if (b) { location.hash = b.dataset.back; return; }
    const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); location.hash = g.dataset.go; return; }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const id = a.dataset.id; const k = a.dataset.act;
    if (k === 'logout') { V.set((S) => { S.loggedIn = false; }); location.hash = '#/login'; return; }
    if (k === 'present') { A.present(id); U.toast('Presentado. Quedó registrado en el historial'); if (a.dataset.open) location.hash = '#/tramite/' + id; }
    else if (k === 'undo') { A.undo(id); U.toast('Deshiciste la presentación'); }
    else if (k === 'month') { ui.month = D.addMonths(ui.month, +a.dataset.d); render(); }
    else if (k === 'pick-day') { ui.sel = a.dataset.d; render(); }
    else if (k === 'ff') { ui.ff = a.dataset.k; render(); }
    else if (k === 'forgot') U.toast('En la app real te mandamos un enlace por mail (demo: no se envía)');
    else if (k === 'save-note') { const t = document.getElementById('nt'); A.addNote(id, t.value); U.toast('Nota guardada'); location.hash = '#/tramite/' + id; }
    else if (k === 'notif') {
      const n = V.S().notifs.find((x) => x.id === id); A.readNotif(id);
      const map = (n.link || '').replace(/\?.*$/, '').replace('#/novedades/', '#/novedad/');
      if (n.link) location.hash = map;
    }
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-in]'); if (!el) return;
    if (el.dataset.in === 'note') document.getElementById('save-note').disabled = !el.value.trim();
    if (el.dataset.in === 'csearch') { ui.q = el.value; document.getElementById('clist').innerHTML = clientList(ui.q); }
  });
  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]'); if (!f) return; e.preventDefault();
    if (f.dataset.form === 'login') {
      const em = f.querySelector('#e').value.trim(); const err = f.querySelector('#le');
      if (em && !/^\S+@\S+\.\S+$/.test(em)) { err.textContent = 'Revisá el email.'; err.hidden = false; return; }
      V.set((S) => { S.loggedIn = true; }); location.hash = '#/hoy';
    }
    if (f.dataset.form === 'reply') {
      const i = f.querySelector('input'); const v = i.value.trim(); if (!v) return; const me = V.S().user;
      V.set((S) => { const t = S.forum.threads.find((x) => x.id === f.dataset.t); t.posts.push({ id: V.uid('p'), author: me.name.split(' ')[0] + ' ' + me.name.split(' ').slice(-1)[0][0] + '.', ini: me.initials, text: v, when: 'ahora', likes: 0, liked: false }); t.replies += 1; });
      U.toast('Publicaste tu respuesta');
    }
  });

  U.demoBar('app');
  if (!location.hash) location.replace(V.S().loggedIn ? '#/hoy' : '#/login');
  render();
})();
