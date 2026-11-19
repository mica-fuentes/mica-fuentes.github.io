/* =========================================================
   Vigente · demo web — núcleo: router, shell, login, Hoy,
   Calendario, detalle del trámite y sus modales
   ========================================================= */
(function () {
  const V = window.V, Q = V.q, A = V.act, D = V.date, U = V.ui;
  const { esc, badge, shape, avatar } = U;
  const W = (V.web = { routes: [], ui: { cal: { anchor: V.TODAY }, notifOpen: false }, acts: {}, ins: {}, forms: {}, chs: {} });
  const ui = W.ui;
  const root = () => document.getElementById('root');

  /* ---------- helpers de texto ---------- */
  W.ddjj = (n) => n.replace('Declaración jurada', 'DDJJ').replace('Declaración mensual', 'DDJJ mensual');
  W.plainName = (n) => n.replace(/\s+(y Asoc\.|S\.A\.|SRL|SA)$/i, '');
  W.weekLabel = (t) => W.ddjj(t.name).replace('Pago mensual monotributo', 'Pago monotributo').replace('Recategorización semestral', 'Recategorización');
  W.orgLabel = (t) => `${t.org.replace('AFIP/ARCA', 'AFIP / ARCA')} — ${t.ambit}`;
  W.go = (h) => { location.hash = h; };
  W.clientStatus = (cid) => {
    const ts = V.S().tramites.filter((t) => t.clientId === cid && !t.presentedOn);
    if (!ts.length) return { kind: 'aldia', next: null };
    const s = Q.byDate(ts);
    const worst = s.some((t) => Q.status(t) === 'vencido') ? 'vencido' : s.some((t) => Q.status(t) === 'urgente') ? 'urgente' : 'proximo';
    return { kind: worst, next: s[0] };
  };

  /* ---------- router ---------- */
  W.route = (pattern, fn) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:[a-z]+/gi, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    W.routes.push({ re, keys, fn });
  };
  function parseHash() {
    const h = location.hash.replace(/^#/, '') || '/';
    const [p, qs] = h.split('?'); const q = {};
    (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { path: p.replace(/\/+$/, '') || '/', q };
  }
  W.query = () => parseHash().q;
  let lastPath = null;
  W.onLeave = [];
  W.render = () => {
    const { path, q } = parseHash();
    const S = V.S();
    if (!S.loggedIn && path !== '/login' && path !== '/recuperar') { location.replace('#/login'); return; }
    if (S.loggedIn && (path === '/login' || path === '/')) { location.replace(S.clients.length ? '#/hoy' : '#/calendario'); return; }
    let hit = null;
    for (const r of W.routes) { const m = r.re.exec(path); if (m) { const params = {}; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); hit = { r, params }; break; } }
    const changed = path !== lastPath;
    if (changed) { W.onLeave.forEach((f) => f(path)); closePopover(); }
    if (!hit) { root().innerHTML = shell('', `<div class="empty"><h3>No encontramos esa pantalla</h3><p>El link que abriste no existe en la demo.</p><div class="row"><a class="btn btn-primary" href="#/hoy">Ir a Hoy</a></div></div>`); lastPath = path; return; }
    const out = hit.r.fn(hit.params, q);
    if (!out) return;
    if (out.redirect) { location.replace(out.redirect); return; }
    const y = window.scrollY;
    root().innerHTML = out.bare ? out.html : shell(out.nav, out.html);
    document.title = (out.title ? out.title + ' · ' : '') + 'Vigente';
    if (changed) { window.scrollTo(0, 0); const m = document.getElementById('main'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }); } } else window.scrollTo(0, y);
    lastPath = path;
    syncPopover();
    if (out.mount) out.mount(root());
  };
  window.addEventListener('hashchange', W.render);
  V.onChange(() => W.render());

  /* ---------- shell ---------- */
  function shell(nav, inner) {
    const S = V.S(); const unread = Q.unread();
    const item = (id, label, href) => `<a class="nav-item${nav === id ? ' active' : ''}" href="${href}"${nav === id ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<div class="app">
      <aside class="sidebar" id="sidebar" aria-label="Navegación principal">
        <a class="brand" href="#/hoy" aria-label="Vigente, ir a Hoy"><img src="assets/logo-mark.svg" alt=""><span>vigente</span></a>
        <nav style="display:flex;flex-direction:column;gap:4px">
          ${item('hoy', 'Hoy', '#/hoy')}${item('calendario', 'Calendario', '#/calendario')}${item('clientes', 'Clientes', '#/clientes')}
          ${item('novedades', 'Novedades y cursos', '#/novedades')}${item('foro', 'Foro', '#/foro')}${item('config', 'Configuración', '#/config')}
          <button class="nav-item${ui.notifOpen ? ' active' : ''}" data-act="notifs" aria-haspopup="dialog"><span class="grow">Notificaciones</span>${unread ? `<span class="nav-badge" aria-label="${unread} sin leer">${unread}</span>` : ''}</button>
        </nav>
        <div class="spacer"></div>
        <a class="user-chip" href="#/config/cuenta">${U.userAvatar()}<span class="who"><b>${esc(S.user.name)}</b><span>${esc(S.user.role)}</span></span></a>
        <button class="nav-item logout" data-act="logout"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 2.5H3.5a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1H6M10.5 5 13.5 8l-3 3M13.5 8H6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>Cerrar sesión</button>
      </aside>
      <div class="sb-scrim" data-act="menu"></div>
      <div style="min-width:0">
        <header class="topbar">
          <button class="tb-btn" data-act="menu" aria-label="Abrir menú" aria-controls="sidebar"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M3.5 6h15M3.5 11h15M3.5 16h15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
          <a class="tb-brand" href="#/hoy" aria-label="Vigente, ir a Hoy"><img src="assets/logo-mark.svg" alt=""><span>vigente</span></a>
          <button class="tb-btn" data-act="notifs" aria-label="Notificaciones${unread ? ', ' + unread + ' sin leer' : ''}"><svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true"><path d="M5 16.5h12l-1.4-1.9V10a4.6 4.6 0 0 0-9.2 0v4.6L5 16.5zM9 18.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>${unread ? `<span class="nav-badge">${unread}</span>` : ''}</button>
        </header>
        <main class="main" id="main">${inner}</main>
      </div>
    </div>`;
  }
  W.shell = shell;

  /* ---------- eventos globales ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (a && W.acts[a.dataset.act]) { e.preventDefault(); W.acts[a.dataset.act](a, e); return; }
    const g = e.target.closest('[data-go]');
    if (g) { e.preventDefault(); W.go(g.dataset.go); }
  });
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-go][role="link"]')) { e.preventDefault(); W.go(e.target.dataset.go); }
  });
  document.addEventListener('input', (e) => { const el = e.target.closest('[data-in]'); if (el && W.ins[el.dataset.in]) W.ins[el.dataset.in](el, e); });
  document.addEventListener('change', (e) => { const el = e.target.closest('[data-ch]'); if (el && W.chs[el.dataset.ch]) W.chs[el.dataset.ch](el, e); });
  document.addEventListener('submit', (e) => { const f = e.target.closest('[data-form]'); if (f && W.forms[f.dataset.form]) { e.preventDefault(); W.forms[f.dataset.form](f, e); } });

  W.acts.logout = () => {
    closePopover();
    V.set((S) => { S.loggedIn = false; });
    U.toast('Cerraste sesión');
  };
  W.acts.menu = () => { const sb = document.getElementById('sidebar'); if (sb) sb.classList.toggle('open'); };
  document.addEventListener('click', (e) => { const sb = document.getElementById('sidebar'); if (sb && sb.classList.contains('open') && !e.target.closest('#sidebar') && !e.target.closest('[data-act="menu"]')) sb.classList.remove('open'); });

  /* ---------- notificaciones (popover) ---------- */
  const NOTIF_ICON = { prorroga: shape('pent', 'sh-lg') .replace('class="sh', 'style="color:#5c339e" class="sh'), semana: shape('tri', 'sh-lg').replace('class="sh', 'style="color:#a86b05" class="sh'), vencido: shape('sq', 'sh-lg').replace('class="sh', 'style="color:#b31a1a" class="sh'), norma: shape('ring', 'sh-lg').replace('class="sh', 'style="color:#5b2fd1" class="sh'), sync: shape('ring', 'sh-lg').replace('class="sh', 'style="color:#8a8f98" class="sh') };
  function popoverHtml() {
    const S = V.S();
    return `<div class="scrim" data-act="notifs-close"></div>
      <section class="popover" role="dialog" aria-label="Notificaciones">
        <header><b>Notificaciones</b><button class="link" data-act="notifs-readall">Marcar todas como leídas</button></header>
        ${S.notifs.map((n) => `<button class="notif${n.read ? ' read' : ''}" data-act="notif-open" data-id="${n.id}"><span class="ic">${NOTIF_ICON[n.kind] || ''}</span><span><b>${esc(n.title)}</b><p>${esc(n.body)}</p><small>${esc(n.when)}</small></span></button>`).join('')}
      </section>`;
  }
  function closePopover() { ui.notifOpen = false; const p = document.getElementById('popover-host'); if (p) p.remove(); }
  function syncPopover() {
    let host = document.getElementById('popover-host');
    if (!ui.notifOpen) { if (host) host.remove(); return; }
    if (!host) { host = document.createElement('div'); host.id = 'popover-host'; document.body.appendChild(host); }
    host.innerHTML = popoverHtml();
  }
  W.acts.notifs = () => { ui.notifOpen = !ui.notifOpen; W.render(); };
  W.acts['notifs-close'] = () => { closePopover(); W.render(); };
  W.acts['notifs-readall'] = () => { A.markAllRead(); U.toast('Marcaste todas como leídas'); };
  W.acts['notif-open'] = (el) => {
    const n = V.S().notifs.find((x) => x.id === el.dataset.id); if (!n) return;
    ui.notifOpen = false; A.readNotif(n.id);
    if (n.link) W.go(n.link);
  };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && ui.notifOpen && !document.querySelector('.modal-scrim')) { closePopover(); W.render(); } });

  /* =========================================================
     Auth
     ========================================================= */
  W.route('/login', () => ({
    bare: true, title: 'Iniciar sesión',
    html: `<div class="auth-wrap"><form class="auth-card" data-form="login" novalidate>
      <div class="auth-brand"><img src="assets/logo-mark.svg" alt=""><span>vigente</span></div>
      <h1>Iniciar sesión</h1>
      <p class="lead">Accedé al calendario de vencimientos de tus clientes.</p>
      <div class="field"><label for="em">Email</label><input id="em" class="input" type="email" placeholder="nombre@estudio.com.ar" autocomplete="username" autofocus></div>
      <div class="field"><label for="pw">Contraseña</label><input id="pw" class="input" type="password" placeholder="••••••••" autocomplete="current-password"></div>
      <div class="err-msg" id="login-err" role="alert" hidden></div>
      <button class="btn btn-primary" type="submit">Ingresar</button>
      <p class="below"><a href="#/recuperar">¿Olvidaste tu contraseña?</a></p>
    </form></div>`,
  }));
  W.forms.login = (f) => {
    const em = f.querySelector('#em').value.trim(); const err = f.querySelector('#login-err');
    if (em && !/^\S+@\S+\.\S+$/.test(em)) { err.textContent = 'Revisá el email: parece que le falta algo.'; err.hidden = false; f.querySelector('#em').classList.add('err'); return; }
    V.set((S) => { S.loggedIn = true; });
    W.go(V.S().clients.length ? '#/hoy' : '#/calendario');
  };
  W.route('/recuperar', () => ({
    bare: true, title: 'Recuperar contraseña',
    html: `<div class="auth-wrap"><form class="auth-card" data-form="recover" novalidate>
      <div class="auth-brand"><img src="assets/logo-mark.svg" alt=""><span>vigente</span></div>
      <h1>Recuperar contraseña</h1>
      <p class="lead">Ingresá tu correo y te enviamos un enlace para crear una nueva.</p>
      <div id="rec-ok" class="auth-ok" role="status" hidden></div>
      <div class="field"><label for="em">Email</label><input id="em" class="input" type="email" placeholder="nombre@estudio.com.ar" autocomplete="username" autofocus></div>
      <div class="err-msg" id="rec-err" role="alert" hidden></div>
      <button class="btn btn-primary" type="submit">Enviar enlace</button>
      <p class="below"><a class="strong" href="#/login">← Volver a iniciar sesión</a></p>
    </form></div>`,
  }));
  W.forms.recover = (f) => {
    const em = f.querySelector('#em').value.trim(); const err = f.querySelector('#rec-err'); const ok = f.querySelector('#rec-ok');
    if (!/^\S+@\S+\.\S+$/.test(em)) { err.textContent = 'Ingresá un email válido para enviarte el enlace.'; err.hidden = false; return; }
    err.hidden = true; ok.hidden = false;
    ok.textContent = `Listo. Si ${em} está registrado, te enviamos un enlace para crear una contraseña nueva. (Demo: no se envía ningún correo real.)`;
    f.querySelector('button[type=submit]').textContent = 'Enviar de nuevo';
  };

  /* =========================================================
     Hoy
     ========================================================= */
  const rowUpcoming = (t) => {
    const c = Q.client(t.clientId);
    return `<button class="row-sm" data-go="#/tramite/${t.id}">
      <span class="avatar">${esc(Q.initials(c.name))}</span>
      <span class="c"><b>${esc(c.name)}</b><span>${esc(W.ddjj(t.name).replace('Pago mensual', 'Pago mensual'))}</span></span>
      <span class="d"><b>${D.short1(t.due)}</b><span>${D.rel(t.due)}</span></span>
      ${badge(Q.status(t) === 'nuevo' ? 'nuevo' : 'proximo')}
    </button>`;
  };

  W.route('/hoy', () => {
    const S = V.S(); const st = Q.stats();
    const today = Q.dueToday(); const over = Q.overdue()[0]; const done = Q.presentedToday(); const up = Q.upcoming(5);
    const dd = D.parse(V.TODAY).getDate();
    const hasProrroga = S.tramites.some((t) => t.id === 't_iva_ep' && !t.presentedOn);
    const hero = today.length ? `<section class="hero" aria-label="Vencen hoy">
        <div class="hero-head"><div class="l"><span class="lima-chip">VENCEN HOY</span><p>Si no los presentás antes de las 23:59, pasan a vencidos.</p></div>
          <div class="big"><b>${today.length}</b>${today.length === 1 ? 'trámite' : 'trámites'}</div></div>
        ${today.map((t) => { const c = Q.client(t.clientId); return `<div class="hero-row" role="link" tabindex="0" data-go="#/tramite/${t.id}">
          <span class="avatar">${esc(Q.initials(c.name))}</span>
          <div class="c1"><b>${esc(c.name)}</b><span>${esc(c.cuit)}</span></div>
          <div class="c2"><b>${esc(t.name)}</b><span>${esc(t.org)} · ${esc(t.ambit)} · ${esc(t.period)}</span></div>
          <div class="btns"><button class="btn btn-line-dark btn-sm" data-go="#/tramite/${t.id}">Ver detalle</button><button class="btn btn-lime btn-sm" data-act="present" data-id="${t.id}">Marcar presentado</button></div>
        </div>`; }).join('')}
      </section>` : (S.clients.length ? `<div class="banner ok"><span class="dot"></span><span class="grow">No tenés vencimientos para hoy. Todo lo de hoy está presentado.</span></div>` : '');
    const doneBlock = done.length ? `<div class="sec-label">Presentado hoy</div>${done.map((t) => { const c = Q.client(t.clientId); return `<button class="row-done" style="width:100%;border:0;text-align:left" data-go="#/tramite/${t.id}"><span class="tick">${U.checkIcon(16)}</span><span class="c"><b>${esc(c.name)}</b><span>${esc(W.ddjj(t.name).replace('Declaración jurada mensual', 'Declaración jurada mensual'))}</span></span><span class="badge b-presentado">${shape('dot')}Presentado</span></button>`; }).join('')}` : '';
    return {
      nav: 'hoy', title: 'Hoy',
      html: `<div class="page-h"><div><h1>Hoy, ${dd} de agosto</h1><p class="sub">Miércoles, semana 33. Lo que tenés que resolver antes de que termine el día.</p></div>
        <button class="btn btn-primary" data-act="newclient" style="padding:12px 20px">+&nbsp; Agregar cliente</button></div>
        <div class="stats">
          <div class="stat"><b class="c-amber">${st.hoy}</b><span>Vencen hoy</span></div>
          <div class="stat"><b class="c-red">${st.vencidos}</b><span>Vencidos sin presentar</span></div>
          <div class="stat"><b class="c-green">${st.alDia}</b><span>Al día</span></div>
          <div class="stat"><b>${st.clientes}</b><span>Clientes activos</span></div>
        </div>
        ${!S.clients.length ? `<div class="empty"><div class="bars"><i style="width:90px"></i><i style="width:110px"></i><i style="width:130px"></i></div><h3>Tu día empieza cuando cargues un cliente</h3><p>Cargá tu primer cliente con su perfil impositivo y Vigente arma el calendario de vencimientos por vos.</p><div class="row"><button class="btn btn-primary" data-act="newclient">+&nbsp; Cargar mi primer cliente</button></div></div>` : `
        ${hero}
        <div class="hoy-grid">
          <section class="card flush" aria-label="Lo que viene">
            ${doneBlock}
            <div class="list-head" style="${done.length ? 'border-top:0' : ''}"><span>Lo que viene</span><button class="link" data-go="#/calendario">Ver calendario →</button></div>
            ${up.length ? up.map(rowUpcoming).join('') : '<div class="row-sm" style="color:var(--muted)">No hay vencimientos próximos.</div>'}
          </section>
          <div class="stack" style="gap:16px">
            ${over ? `<div class="card-dark"><div class="kicker"><i></i>VENCIDO SIN PRESENTAR</div><h4>${esc(Q.client(over.clientId).name)}</h4><p>${esc(over.name)}</p><p class="s">venció el ${D.dm(over.due)} · hace ${-D.diffDays(over.due, V.TODAY)} días</p><button class="btn btn-white btn-block" data-go="#/tramite/${over.id}">Resolver ahora</button></div>` : ''}
            ${hasProrroga ? `<button class="card-pro" data-go="#/tramite/t_iva_ep?v=prorroga"><div class="kicker">${shape('pent', 'sh-lg')}PRÓRROGA APLICADA</div><h4>El IVA de 6 clientes se corrió al 26 de agosto</h4><div class="dr"><s>12 ago</s><b>→</b><b>26 ago</b><span class="sp"></span><b>+14 días</b></div><small>Fuente: ARCA · RG 5.618/2026</small></button>` : ''}
            <button class="card-norma" data-go="#/novedades/n2"><span class="kicker">CAMBIÓ UNA NORMA</span><h4>Nuevo portal para presentar DDJJ de IVA</h4><p>Afecta a 12 de tus clientes. El circuito de carga cambia desde el período 07/2026.</p></button>
          </div>
        </div>`}`,
    };
  });

  /* =========================================================
     Calendario
     ========================================================= */
  function calToolbar(view, labelHtml) {
    const seg = (v, l) => `<button class="${view === v ? 'on' : ''}" data-go="#/calendario${v === 'lista' ? '' : '/' + v}" aria-pressed="${view === v}">${l}</button>`;
    return `<div class="toolbar"><div class="seg" role="group" aria-label="Vista del calendario">${seg('lista', 'Lista')}${seg('semana', 'Semana')}${seg('mes', 'Mes')}</div>
      <div class="period"><span class="lbl">${labelHtml}</span><div class="pager"><button data-act="cal-prev" aria-label="Anterior">‹</button><button data-act="cal-next" aria-label="Siguiente">›</button></div><button class="btn btn-primary btn-sm" data-act="cal-today" style="padding:10px 16px">Hoy</button></div></div>`;
  }
  W.acts['cal-prev'] = () => calShift(-1);
  W.acts['cal-next'] = () => calShift(1);
  W.acts['cal-today'] = () => { ui.cal.anchor = V.TODAY; W.render(); };
  function calShift(dir) {
    const view = (parseHash().path.split('/')[2]) || 'lista';
    ui.cal.anchor = view === 'semana' ? D.addDays(ui.cal.anchor, 7 * dir) : D.addMonths(ui.cal.anchor, dir);
    W.render();
  }
  function calHead(title, sub, withBtn) {
    return `<div class="page-h"><div><h1>${title}</h1><p class="sub">${sub}</p></div>${withBtn ? '<button class="btn btn-primary" data-act="newclient">+&nbsp; Agregar cliente</button>' : ''}</div>`;
  }
  function calStats(offline) {
    const st = Q.stats(); const cap = offline ? '<small>Según datos del 04/08</small>' : '';
    return `<div class="stats">
      <div class="stat"><b class="c-orange">${st.semana}</b><span>Vencen esta semana</span>${cap}</div>
      <div class="stat"><b class="c-red">${st.vencidos}</b><span>Vencidos sin presentar</span>${cap}</div>
      <div class="stat"><b class="c-green">${st.alDia}</b><span>Al día</span>${cap}</div>
      <div class="stat"><b>${st.clientes}</b><span>Clientes activos</span>${cap}</div></div>`;
  }
  const calEmpty = () => ({
    nav: 'calendario', title: 'Calendario',
    html: `<div class="page-h"><div><h1>Calendario general</h1><p class="sub">Todavía no cargaste ningún cliente.</p></div></div>
      <div class="empty"><div class="bars"><i style="width:90px"></i><i style="width:110px"></i><i style="width:130px"></i></div><h3>Tu calendario se arma solo</h3>
      <p>Cargá tu primer cliente con su perfil impositivo y generamos automáticamente todos sus vencimientos del año. No hace falta que cargues fechas a mano.</p>
      <div class="row"><button class="btn btn-primary btn-lg" data-go="#/primer-cliente">+&nbsp; Cargar mi primer cliente</button><button class="btn btn-ghost btn-lg" data-go="#/importar">Importar desde Excel</button></div></div>`,
  });
  const offlineBanner = () => `<div class="callout warn" role="alert"><h4>${shape('tri', 'sh-lg')}No pudimos verificar las fechas con las fuentes oficiales</h4>
    <p>Estamos sin conexión con AFIP/ARCA desde hace 2 horas. El calendario sigue funcionando con la última información verificada, pero puede no reflejar prórrogas publicadas hoy.</p>
    <div class="actions"><span style="font-size:13px">Última verificación exitosa: 04/08/2026 a las 09:14</span><button class="btn btn-amber btn-sm" data-act="retry-sync">Reintentar ahora</button><button class="btn btn-ghost btn-sm" style="color:var(--amber);border-color:#e8cf94" data-act="open-arca">Consultar el sitio de ARCA ↗</button></div></div>`;
  W.acts['retry-sync'] = () => { V.set((S) => { S.offline = false; }); U.toast('Conexión restablecida: fechas verificadas con AFIP/ARCA'); };
  W.acts['open-arca'] = () => U.toast('En la versión real se abre el sitio de ARCA en otra pestaña');

  W.route('/calendario', () => calendarView('lista'));
  W.route('/calendario/:view', (p) => calendarView(['lista', 'semana', 'mes'].includes(p.view) ? p.view : 'lista'));

  function calendarView(view) {
    const S = V.S();
    if (!S.clients.length) return calEmpty();
    const anchor = ui.cal.anchor;
    if (view === 'semana') return weekView(anchor);
    if (view === 'mes') return monthView(anchor);
    const ym = anchor.slice(0, 7);
    const list = Q.sorted(S.tramites.filter((t) => t.due.slice(0, 7) === ym));
    const flash = ui.flash; ui.flash = null; if (flash) ui.flashShown = true;
    const banner = S.offline ? offlineBanner() : flash ? `<div class="banner ok" role="status"><span class="dot"></span><span class="grow">${esc(flash)}</span></div>` : `<div class="banner info"><span class="dot" style="background:var(--green)"></span><span class="grow">Actualizado automáticamente el 04/08/2026 según AFIP/ARCA y el Consejo Profesional de Ciencias Económicas.</span></div>`;
    return {
      nav: 'calendario', title: 'Calendario',
      html: `${calHead('Calendario general', 'Todos los clientes y vencimientos, ordenados automáticamente por prioridad y fecha.', true)}
        ${calToolbar('lista', D.monthYear(anchor))}${banner}${calStats(S.offline)}
        <div class="table-list" role="list">${list.length ? list.map((t) => { const c = Q.client(t.clientId); const st = Q.status(t); return `<button class="t-row" role="listitem" data-go="#/tramite/${t.id}">
          <span class="who">${avatar(c.name, c.tint, '')}<span><b>${esc(c.name)}</b><span>${esc(c.type)}</span></span></span>
          <span class="what">${esc(t.name)}</span><span class="when">${D.short(t.due)}</span><span class="st">${badge(st)}</span></button>`; }).join('') : `<div class="row-sm" style="color:var(--muted);justify-content:center;padding:40px">No hay vencimientos en ${D.monthYear(anchor)}.</div>`}</div>`,
    };
  }

  function weekView(anchor) {
    const S = V.S(); const m = D.mondayOf(anchor); const days = Array.from({ length: 7 }, (_, i) => D.addDays(m, i));
    const isCur = m === D.mondayOf(V.TODAY);
    const inWeek = S.tramites.filter((t) => t.due >= days[0] && t.due <= days[6]);
    const count = inWeek.length + (isCur ? S.ghost.week : 0);
    const d0 = D.parse(days[0]), d1 = D.parse(days[6]);
    const range = d0.getMonth() === d1.getMonth() ? `${D.DIAS[d0.getDay()]} ${d0.getDate()} al ${D.DIAS[d1.getDay()]} ${d1.getDate()} de ${D.MES[d1.getMonth()]}` : `${D.DIAS[d0.getDay()]} ${d0.getDate()} de ${D.MES[d0.getMonth()]} al ${D.DIAS[d1.getDay()]} ${d1.getDate()} de ${D.MES[d1.getMonth()]}`;
    const lbl = d0.getMonth() === d1.getMonth() ? `Semana del ${d0.getDate()} al ${d1.getDate()} de ${D.MES[d1.getMonth()]}` : `Semana del ${d0.getDate()} ${D.MESC[d0.getMonth()]} al ${d1.getDate()} ${D.MESC[d1.getMonth()]}`;
    return {
      nav: 'calendario', title: 'Calendario · semana',
      html: `<div class="page-h"><div><h1>${isCur ? 'Esta semana' : lbl}</h1><p class="sub">${D.cap(range)} &nbsp;·&nbsp; ${count} ${count === 1 ? 'vencimiento' : 'vencimientos'}</p></div></div>
        ${calToolbar('semana', lbl)}
        <div class="week">${days.map((d) => { const dt = D.parse(d); const today = d === V.TODAY;
          const items = Q.byDate(inWeek.filter((t) => t.due === d));
          return `<section class="wday${today ? ' today' : ''}" aria-label="${D.long(d)}"><div class="h">${D.DIASC[dt.getDay()]}<b>${dt.getDate()}</b>${today ? '<em>hoy</em>' : ''}</div>
            ${items.map((t) => { const c = Q.client(t.clientId); const st = Q.status(t); const k = st === 'nuevo' ? 'proximo' : st; const shp = { urgente: 'tri', vencido: 'sq', presentado: 'dot' }[k] || 'ring';
              return `<button class="wcard k-${k}" data-go="#/tramite/${t.id}"><b>${shape(shp)}<span>${esc(W.plainName(c.name))}</span></b><span>${esc(W.weekLabel(t))}</span></button>`; }).join('')}</section>`; }).join('')}</div>`,
    };
  }

  function monthView(anchor) {
    const S = V.S(); const first = D.addMonths(anchor, 0); const fd = D.parse(first);
    const start = D.mondayOf(first); const daysIn = new Date(fd.getFullYear(), fd.getMonth() + 1, 0).getDate();
    const offset = D.diffDays(first, start); const rows = Math.ceil((offset + daysIn) / 7);
    const cells = Array.from({ length: rows * 7 }, (_, i) => D.addDays(start, i));
    const ym = first.slice(0, 7);
    return {
      nav: 'calendario', title: 'Calendario · mes',
      html: `${calHead('Calendario general', 'Todos los clientes y vencimientos, ordenados automáticamente por prioridad y fecha.', true)}
        ${calToolbar('mes', D.monthYear(anchor))}
        <div class="month"><div class="dow">${['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((x) => `<div>${x}</div>`).join('')}</div>
        <div class="cells">${cells.map((d) => { const dt = D.parse(d); const out = d.slice(0, 7) !== ym; const items = out ? [] : Q.byDate(S.tramites.filter((t) => t.due === d));
          return `<div class="cell${out ? ' out' : ''}${d === V.TODAY ? ' today' : ''}"><b>${dt.getDate()}</b>${items.map((t) => { const c = Q.client(t.clientId); const st = Q.status(t); const k = st === 'nuevo' ? 'proximo' : st; const shp = { urgente: 'tri', vencido: 'sq', presentado: 'dot' }[k] || 'ring';
            return `<button class="mchip k-${k}" data-go="#/tramite/${t.id}" title="${esc(c.name)} — ${esc(t.name)}">${shape(shp)}<span class="mt">${esc(c.short)}<br>${esc(t.short)}</span><span class="mi" aria-hidden="true">${esc(Q.initials(c.name))}</span></button>`; }).join('')}</div>`; }).join('')}</div></div>`,
    };
  }

  /* =========================================================
     Detalle del trámite
     ========================================================= */
  W.route('/tramite/:id', (p, q) => {
    const t = Q.tramite(p.id);
    if (!t) return { redirect: '#/calendario' };
    const c = Q.client(t.clientId); const st = Q.status(t);
    const variant = q.v === 'prorroga' && st !== 'presentado' ? 'prorroga' : st === 'vencido' ? 'vencido' : st === 'presentado' ? 'presentado' : 'normal';
    const days = D.diffDays(t.due, V.TODAY);
    const pro = variant === 'prorroga' ? { from: t.due, to: D.addDays(t.due, 14) } : null;
    const dueShown = pro ? pro.to : t.due;
    const isIva = /^IVA/.test(t.name);
    let badgeHtml;
    if (variant === 'prorroga') badgeHtml = badge('prorroga', { label: 'Prórroga aplicada' });
    else if (st === 'presentado') badgeHtml = badge('presentado');
    else if (st === 'vencido') badgeHtml = badge('vencido', { caps: true, label: `Vencido hace ${-days} días` });
    else badgeHtml = badge(st === 'urgente' ? 'urgente' : 'proximo', { label: Q.dueLabel(t) });

    const dataRows = variant === 'vencido'
      ? [['Fecha de vencimiento', D.long(t.due)], ['Organismo', W.orgLabel(t)], ['Período', t.period], ['Días de atraso', `${-days} días corridos`], ['Frecuencia', t.freq]]
      : [['Fecha de vencimiento', D.long(dueShown), variant === 'prorroga' ? 'violet' : ''], ['Organismo', W.orgLabel(t)], ['Período fiscal', t.period], ['Terminación de CUIT', `${c.cuit.slice(-1)} — vence el día ${D.parse(dueShown).getDate()}`], ['Frecuencia', t.freq]];

    const proBox = variant === 'prorroga' ? `<div class="prorroga-box"><h3>${shape('pent', 'sh-lg')}Este vencimiento se prorrogó automáticamente</h3>
        <div class="cmp"><div><small>Fecha anterior</small><span class="old">${D.short1(pro.from).replace(' ago', ' de agosto')}</span></div><b style="font-size:20px">→</b><div><small>Nueva fecha de vencimiento</small><span class="new">${D.longNoDow(pro.to)}</span></div><div class="left"><small>Tenés</small><b>+14 días</b></div></div>
        <p>Fuente: AFIP/ARCA — Resolución General 5.618/2026, publicada el 06/08/2026.<br>Detectado y aplicado automáticamente el 06/08/2026 a las 09:14.</p>
        <div class="row"><button class="btn btn-violet" data-act="open-resolution">Ver resolución oficial ↗</button><button class="btn btn-line-violet" data-act="fix-date" data-id="${t.id}">Fijar fecha manualmente</button></div></div>` : '';
    const vencBox = variant === 'vencido' ? `<div class="callout err"><h4>${shape('sq', 'sh-lg')}Este trámite venció sin presentarse</h4><p>Venció el ${D.dmy(t.due)}. La presentación fuera de término puede generar intereses y una multa por infracción formal.</p><div class="actions"><button class="btn btn-red" data-act="present" data-id="${t.id}" data-late="1">Marcar como presentado fuera de término</button><button class="btn btn-ghost" data-act="regularize" data-id="${t.id}">Ver cómo regularizar</button></div></div>` : '';

    const actionCard = variant === 'presentado'
      ? `<section class="presented-card"><h3><i></i>Trámite presentado</h3><p>Registrado el ${D.dmy(t.presentedOn)}. Se sacó del listado de pendientes y quedó guardado en el historial del cliente.</p><div class="row"><button class="btn btn-green-ghost" data-act="notify-client" data-id="${t.id}">Avisarle al cliente</button><button class="btn btn-soft" data-act="undo" data-id="${t.id}" style="color:var(--green)">Deshacer</button><button class="btn btn-green" data-go="#/hoy">Volver a Hoy →</button></div></section>`
      : variant === 'vencido' ? ''
      : `<section class="card"><h3>¿Ya presentaste este trámite?</h3><p class="card-sub" style="max-width:560px;line-height:1.45">Al marcarlo como presentado se saca del listado de pendientes y queda registrado en el historial del cliente.</p>
        <div style="display:flex;gap:10px;margin-top:16px;flex-wrap:wrap"><button class="btn btn-green btn-lg" data-act="present" data-id="${t.id}">${U.checkIcon(14)} Marcar como presentado</button><button class="btn btn-soft btn-lg" data-act="add-note" data-id="${t.id}">Agregar nota</button><button class="btn btn-ghost btn-lg" data-act="ask-docs" data-id="${t.id}">Pedir documentación</button></div></section>`;

    const hist = Q.history(t);
    const notes = t.notes.length ? `<section class="card"><h3>Notas internas</h3><div class="notes">${t.notes.map((n) => `<div class="n">${esc(n.text)}<small>${D.dmy(n.at)} · solo las ves vos</small></div>`).join('')}</div></section>` : '';
    return {
      nav: 'calendario', title: `${t.name} · ${c.name}`,
      html: `<div class="crumbs"><a href="#/calendario">Calendario</a><i>/</i><b>${esc(c.name)}</b></div>
        <div class="d-h"><div><h1>${esc(t.name)}</h1><p class="s">${esc(c.name)} &nbsp;·&nbsp; ${esc(c.type)} &nbsp;·&nbsp; CUIT ${esc(c.cuit)}</p></div>${badgeHtml}</div>
        ${proBox}${vencBox}
        <div class="grid-2"><div class="stack">
          <section class="card"><h3>Datos del vencimiento</h3><div class="kv" style="margin-top:12px">${dataRows.map((r) => `<div class="row"><span>${r[0]}</span><b class="${r[2] || ''}">${esc(r[1])}</b></div>`).join('')}</div></section>
          ${actionCard}${notes}
        </div><div class="stack">
          ${variant === 'vencido' ? '' : `<section class="card"><h3>Novedad normativa</h3>${isIva ? `<div class="norma-box"><h5>Cambió la forma de presentación</h5><p>Desde el período 07/2026 la DDJJ se presenta por el nuevo portal. Ver el curso de 4 minutos.</p><button data-go="#/novedades/n2/curso">Ver cómo se presenta →</button></div><p class="src-small">Fuente: AFIP/ARCA — RG 5.612/2026<br>Verificado el 04/08/2026</p>` : `<p class="src-small" style="margin-top:12px">No hay cambios normativos que afecten a este trámite.<br>Verificado el 04/08/2026</p>`}</section>`}
          <section class="card"><h3>Historial del trámite</h3><div style="margin-top:10px">${hist.map((h) => `<div class="hist-row ${h.cls}"><span>${esc(h.label)}</span><b>${esc(h.text)}</b></div>`).join('')}</div></section>
        </div></div>`,
    };
  });

  /* ---------- acciones del trámite ---------- */
  W.acts.present = (el) => W.present(el.dataset.id, { late: el.dataset.late === '1' });
  W.acts.undo = (el) => { A.undo(el.dataset.id); U.toast('Deshiciste la presentación: el trámite volvió a pendientes'); };
  W.acts['add-note'] = (el) => W.noteModal(el.dataset.id);
  W.acts['ask-docs'] = (el) => W.docsModal(el.dataset.id);
  W.acts['notify-client'] = (el) => W.notifyModal(el.dataset.id);
  W.acts['open-resolution'] = () => U.toast('En la versión real se abre la resolución oficial en el boletín de ARCA');
  W.acts['fix-date'] = (el) => W.fixDateModal(el.dataset.id);
  W.acts.regularize = () => W.regularizeModal();

  W.present = (id, opts) => {
    const t = Q.tramite(id); if (!t) return; const c = Q.client(t.clientId); const late = opts && opts.late;
    U.modal({
      cls: 'w-md',
      html: `<h2>${late ? 'Presentar fuera de término' : 'Confirmar presentación'}</h2>
        <p class="lead">${late ? 'Vas a registrar este trámite como presentado fuera de término. Podés deshacerlo desde el historial del cliente.' : 'Vas a marcar este trámite como presentado. Podés deshacerlo desde el historial del cliente.'}</p>
        <div class="kv"><div class="row"><span>Trámite</span><b>${esc(W.ddjj(t.name))}</b></div><div class="row"><span>Cliente</span><b>${esc(c.name)}</b></div><div class="row"><span>Período</span><b>${esc(t.period)}</b></div></div>
        <div class="field"><label for="pdate">Fecha de presentación</label><input id="pdate" class="input date-plain" type="date" value="${V.TODAY}" max="${V.TODAY}" min="2026-01-01"></div>
        <div class="err-msg" id="perr" hidden></div>
        <div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-green" id="pok">${U.checkIcon(14)} Confirmar</button></div>`,
      onMount: (m) => {
        m.$('#pok').addEventListener('click', () => {
          const v = m.$('#pdate').value;
          if (!v || v > V.TODAY) { const e = m.$('#perr'); e.textContent = 'Elegí una fecha que no sea futura.'; e.hidden = false; return; }
          m.close(); A.present(id, v);
          if (V.S().autoNotify) U.toast(`Presentado. Aviso enviado automáticamente a ${c.email || c.name}`);
          else U.toast('Trámite presentado y registrado en el historial del cliente');
        });
      },
    });
  };

  W.noteModal = (id) => {
    const t = Q.tramite(id);
    U.modal({
      cls: 'w-md',
      html: `<h2>Agregar nota interna</h2><p class="lead">Queda guardada en el trámite y sólo la ves vos. El cliente no la recibe.</p>
        <div class="field"><label class="sr-only" for="ntext">Nota</label><textarea id="ntext" class="textarea" placeholder="Ej: Falta que el cliente mande la factura 4521 para cerrar el período." maxlength="500" autofocus></textarea></div>
        <div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="nok" disabled>Guardar nota</button></div>`,
      onMount: (m) => {
        const ta = m.$('#ntext'), ok = m.$('#nok');
        ta.addEventListener('input', () => { ok.disabled = !ta.value.trim(); });
        ok.addEventListener('click', () => { m.close(); A.addNote(id, ta.value); U.toast('Nota guardada'); });
      },
    });
  };

  W.notifyModal = (id) => {
    const t = Q.tramite(id); const c = Q.client(t.clientId); const u = V.S().user;
    const ref = /^(IVA|IIBB)/.test(t.name) ? `la declaración jurada de ${t.name.split(' ')[0]}` : `el trámite «${t.name}»`;
    const subject = `${W.ddjj(t.name).replace(' mensual', '')} de ${t.period.toLowerCase()} presentada`;
    const body = `Hola,\n\nTe confirmamos que ${ref} correspondiente al período ${t.period.toLowerCase()} fue presentada el ${D.dmy(t.presentedOn || V.TODAY)}.\n\nNo necesitás hacer nada. Cualquier duda, respondé este correo.\n\nSaludos,\n${u.name} — ${V.S().estudio.nombre}`;
    U.modal({
      cls: 'w-xl',
      html: `<h2>Avisarle a ${esc(c.name)}</h2><p class="lead">El texto ya está armado. Revisalo y mandalo, o cerrá si preferís no avisar.</p>
        <div class="email-box"><div class="hd"><div><span>Para</span><b>${esc(c.email || 'Sin email cargado')}</b></div><div><span>Asunto</span><b>${esc(subject)}</b></div></div>
        <div class="bd" id="mbody">${esc(body)}</div></div>
        <label class="check muted"><input type="checkbox" id="always"><span class="bx">${U.check}</span>Avisar siempre al presentar, sin preguntarme</label>
        <div class="foot"><button class="btn btn-ghost" data-close>No avisar</button><button class="btn btn-ghost" id="medit">Editar texto</button><button class="btn btn-primary" id="msend"${c.email ? '' : ' disabled'}>Enviar aviso</button></div>`,
      onMount: (m) => {
        m.$('#medit').addEventListener('click', (e) => {
          const bd = m.$('#mbody'); const ta = document.createElement('textarea'); ta.className = 'bd'; ta.id = 'mbody'; ta.value = body; bd.replaceWith(ta); ta.focus(); e.target.disabled = true;
        });
        m.$('#msend').addEventListener('click', () => {
          const always = m.$('#always').checked; m.close();
          if (always) V.set((S) => { S.autoNotify = true; });
          U.toast(`Aviso enviado a ${c.email} (simulado: la demo no manda correos reales)`, 3400);
        });
      },
    });
  };

  W.docsModal = (id) => {
    const t = Q.tramite(id); const c = Q.client(t.clientId); const items = A.requestItems(t);
    const margin = D.addDays(t.due, -5);
    const due = margin < V.TODAY ? V.TODAY : margin;
    U.modal({
      cls: 'w-lg',
      html: `<h2>Pedir documentación</h2><p class="lead">Elegí qué le falta al cliente. Se envía un correo con la lista y una fecha límite.</p>
        <div class="doc-pick" id="dlist">${items.map((it, i) => `<label class="check muted"><input type="checkbox" data-i="${i}"${it.on ? ' checked' : ''}><span class="bx">${U.check}</span>${esc(it.l)}</label>`).join('')}<div class="add"><button class="link" id="dadd">+&nbsp; Agregar otro documento</button></div></div>
        <div class="warn-field"><div><b>Fecha límite de entrega</b><span>El vencimiento es el ${D.dm(t.due)}. Sugerimos pedirlo con 5 días de margen.</span></div><input class="input date-in" id="ddate" type="date" value="${due}" min="${V.TODAY}" aria-label="Fecha límite de entrega"></div>
        <label class="check muted"><input type="checkbox" id="drem" checked><span class="bx">${U.check}</span>Recordarle automáticamente 1 día antes si no entregó</label>
        <div class="err-msg" id="derr" role="alert" hidden></div>
        <div id="dprev" hidden></div>
        <div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-ghost" id="dview">Ver el correo</button><button class="btn btn-primary" id="dsend">Enviar pedido</button></div>`,
      onMount: (m) => {
        m.$('#dadd').addEventListener('click', (e) => {
          const wrap = e.target.closest('.add'); wrap.innerHTML = '<input class="input" id="dnew" placeholder="Nombre del documento" style="padding:8px 12px;font-size:13px" maxlength="80">';
          const inp = wrap.querySelector('input'); inp.focus();
          inp.addEventListener('keydown', (ev) => {
            if (ev.key !== 'Enter') return; ev.preventDefault(); const v = inp.value.trim(); if (!v) return;
            const lab = document.createElement('label'); lab.className = 'check muted'; lab.innerHTML = `<input type="checkbox" data-i="x" data-l="${esc(v)}" checked><span class="bx">${U.check}</span>${esc(v)}`;
            wrap.parentElement.insertBefore(lab, wrap); inp.value = ''; items.push({ l: v, on: true });
          });
        });
        const list = () => m.$$('#dlist input[type=checkbox]').filter((i) => i.checked).map((i) => i.parentElement.textContent.trim());
        m.$('#dview').addEventListener('click', () => {
          const p = m.$('#dprev'); const sel = list();
          p.hidden = !p.hidden; if (p.hidden) return;
          p.innerHTML = `<div class="email-box" style="margin-top:14px"><div class="hd"><div><span>Para</span><b>${esc(c.email || '—')}</b></div><div><span>Asunto</span><b>Documentación para ${esc(W.ddjj(t.name))} — ${esc(t.period)}</b></div></div><div class="bd">${esc(`Hola,\n\nPara presentar ${t.name} (${t.period}) necesitamos que nos envíes:\n${sel.map((x) => '• ' + x).join('\n') || '• (ningún documento elegido)'}\n\nFecha límite: ${D.dmy(m.$('#ddate').value)}.\n\nGracias,\n${V.S().user.name}`)}</div></div>`;
        });
        m.$('#dsend').addEventListener('click', () => {
          const sel = list(); const dd = m.$('#ddate').value; const err = m.$('#derr');
          if (!sel.length) { err.textContent = 'Elegí al menos un documento para pedir.'; err.hidden = false; return; }
          if (!dd) { err.textContent = 'Poné una fecha límite de entrega.'; err.hidden = false; return; }
          m.close();
          V.set((S) => { S.docRequests.unshift({ id: V.uid('r'), clientId: c.id, label: W.ddjj(t.name).replace('Declaración', 'DDJJ'), due: dd, items: sel.map((l) => ({ l, d: false })) }); });
          U.toast(`Pedido enviado a ${c.name} (simulado)`); W.go('#/documentacion');
        });
      },
    });
  };

  W.fixDateModal = (id) => {
    const t = Q.tramite(id);
    U.modal({
      cls: 'w-md',
      html: `<h2>Fijar fecha manualmente</h2><p class="lead">Si el cliente tiene otra fecha (por ejemplo por un plan de facilidades), elegila acá. Vigente deja de actualizar este vencimiento automáticamente.</p>
        <div class="field"><label for="fdate">Nueva fecha de vencimiento</label><input id="fdate" class="input date-plain" type="date" value="${D.addDays(t.due, 14)}" min="${V.TODAY}"></div>
        <div class="foot"><button class="btn btn-ghost" data-close>Cancelar</button><button class="btn btn-primary" id="fok">Guardar fecha</button></div>`,
      onMount: (m) => m.$('#fok').addEventListener('click', () => {
        const v = m.$('#fdate').value; if (!v) return; m.close();
        V.set((S) => { const x = S.tramites.find((y) => y.id === id); if (x) x.due = v; });
        U.toast(`Fecha fijada para el ${D.long(v).toLowerCase()}`); W.go('#/tramite/' + id);
      }),
    });
  };

  W.regularizeModal = () => U.modal({
    cls: 'w-md',
    html: `<h2>Cómo regularizar un vencimiento</h2><p class="lead">Pasos habituales para presentar fuera de término:</p>
      <ol class="steps-list"><li>Presentá la declaración o el pago pendiente en el portal del organismo.</li><li>Calculá los intereses resarcitorios hasta la fecha de pago.</li><li>Registrá acá la presentación con su fecha real, desde «Marcar como presentado fuera de término».</li><li>Avisale al cliente por si corresponde una multa por infracción formal.</li></ol>
      <div class="foot"><button class="btn btn-primary" data-close>Entendido</button></div>`,
  });
})();
