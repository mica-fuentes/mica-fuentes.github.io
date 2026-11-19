/* =========================================================
   Vigente · demo — helpers de interfaz compartidos
   ========================================================= */
(function () {
  const V = (window.V = window.V || {});
  const U = (V.ui = {});

  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const esc = U.esc;

  // sin tildes, minúsculas: para buscar "perez" y encontrar "Pérez"
  U.norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  U.shape = (k, cls) => `<i class="sh sh-${k}${cls ? ' ' + cls : ''}" aria-hidden="true"></i>`;
  U.check = '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  U.checkIcon = (w) => `<svg width="${w || 12}" height="${w || 12}" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  const BADGE = {
    urgente: ['tri', 'Urgente'], proximo: ['ring', 'Próximo'], vencido: ['sq', 'Vencido'],
    presentado: ['dot', 'Presentado'], nuevo: ['dia', 'Nuevo'], prorroga: ['pent', 'Prórroga'], programado: ['ring', 'Programado'],
    aldia: ['dot', 'Al día'], adherido: ['dot', 'Adherido'], pendiente: ['tri', 'Pendiente'],
  };
  U.badge = (kind, opts) => {
    const b = BADGE[kind] || BADGE.proximo; const o = opts || {};
    return `<span class="badge b-${kind}${o.caps ? ' caps' : ''}">${U.shape(b[0])}${esc(o.label || b[1])}</span>`;
  };

  U.avatar = (name, tint, cls) => `<span class="avatar t${tint == null ? 0 : tint}${cls ? ' ' + cls : ''}" aria-hidden="true">${esc(V.q.initials(name))}</span>`;
  U.userAvatar = (cls) => {
    const u = V.S().user;
    return `<span class="avatar me${cls ? ' ' + cls : ''}">${u.photo ? `<img src="${u.photo}" alt="">` : esc(u.initials)}</span>`;
  };

  /* ---------- toast ---------- */
  U.toast = (msg, ms) => {
    let wrap = document.querySelector('.toast-wrap');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `<i></i><span>${esc(msg)}</span>`;
    wrap.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, ms || 2600);
  };

  /* ---------- modal ---------- */
  U.modal = (opts) => {
    const prevFocus = document.activeElement;
    const scrim = document.createElement('div');
    scrim.className = 'scrim modal-scrim';
    scrim.innerHTML = `<div class="modal ${opts.cls || ''}" role="dialog" aria-modal="true">${opts.html}</div>`;
    document.body.appendChild(scrim);
    const box = scrim.firstElementChild;
    const labelled = box.querySelector('h2'); if (labelled) { labelled.id = 'mdl-title'; box.setAttribute('aria-labelledby', 'mdl-title'); }
    let closed = false;
    const api = {
      el: box,
      $: (s) => box.querySelector(s),
      $$: (s) => Array.from(box.querySelectorAll(s)),
      close() {
        if (closed) return; closed = true;
        document.removeEventListener('keydown', onKey);
        scrim.remove();
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
        if (opts.onClose) opts.onClose();
      },
    };
    function onKey(e) {
      if (e.key === 'Escape' && opts.dismissible !== false) { e.stopPropagation(); api.close(); }
      if (e.key === 'Tab') { // trampa de foco simple
        const f = Array.from(box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((x) => !x.disabled && x.offsetParent !== null);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKey);
    scrim.addEventListener('mousedown', (e) => { if (e.target === scrim && opts.dismissible !== false) api.close(); });
    box.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) api.close(); });
    if (opts.onMount) opts.onMount(api);
    const af = box.querySelector('[autofocus]') || box.querySelector('input:not([type=hidden]), textarea, select');
    if (af) setTimeout(() => af.focus(), 30);
    return api;
  };

  /* ---------- descargas ---------- */
  U.download = (filename, text, mime) => {
    const blob = new Blob(['﻿' + text], { type: (mime || 'text/csv') + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 500);
  };
  U.csvCell = (v) => { const s = String(v == null ? '' : v); return /[";\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

  /* ---------- imagen → dataURL chica (para la foto de perfil) ---------- */
  U.readImage = (file, size) => new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('El archivo tiene que ser una imagen (JPG, PNG o WebP).'));
    if (file.size > 8 * 1024 * 1024) return reject(new Error('La imagen pesa más de 8 MB.'));
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('No pudimos leer la imagen.'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('No pudimos abrir la imagen.'));
      img.onload = () => {
        const s = size || 256; const c = document.createElement('canvas'); c.width = c.height = s;
        const ctx = c.getContext('2d'); const m = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        resolve(c.toDataURL('image/jpeg', 0.86));
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });

  /* ---------- barra de demo ---------- */
  U.demoBar = (page) => {
    const wrap = document.createElement('div'); wrap.className = 'demo';
    const cur = (p) => (p === page ? ' <small>actual</small>' : '');
    wrap.innerHTML = `
      <button class="demo-btn" aria-haspopup="true" aria-expanded="false"><i></i>Demo</button>
      <div class="demo-menu" hidden role="menu">
        <h6>Ver la demo en</h6>
        <a role="menuitem" href="index.html#/hoy" data-open="web">Web (escritorio)${cur('web')}</a>
        <a role="menuitem" href="app.html" data-open="app">App móvil${cur('app')}</a>
        <a role="menuitem" href="watch.html" data-open="watch">Smartwatch${cur('watch')}</a>
        <hr>
        <h6>Escenarios</h6>
        <button role="menuitem" data-d="reset">Reiniciar la demo</button>
        <button role="menuitem" data-d="empty">Empezar desde cero (primer día)</button>
        <button role="menuitem" data-d="offline">Simular sin conexión con la fuente</button>
        <button role="menuitem" data-d="logout">Cerrar sesión</button>
      </div>`;
    document.body.appendChild(wrap);
    const btn = wrap.querySelector('.demo-btn'); const menu = wrap.querySelector('.demo-menu');
    const set = (open) => { menu.hidden = !open; btn.setAttribute('aria-expanded', String(open)); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); set(menu.hidden); });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) set(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
    const POP = { app: ['vigente-app', 'popup=yes,width=560,height=940'], watch: ['vigente-watch', 'popup=yes,width=1000,height=820'] };
    wrap.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
      const k = a.dataset.open;
      if (k === page) { e.preventDefault(); set(false); return; }
      if (POP[k]) { const w = window.open(a.getAttribute('href'), POP[k][0], POP[k][1]); if (w) { e.preventDefault(); w.focus(); } }
      set(false);
    }));
    wrap.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => {
      const k = b.dataset.d; set(false);
      if (k === 'reset') { V.reset('full'); U.toast('Demo reiniciada'); if (page === 'web') location.hash = '#/hoy'; }
      if (k === 'empty') { V.reset('empty'); U.toast('Empezamos desde cero: primer día'); if (page === 'web') location.hash = '#/calendario'; }
      if (k === 'offline') { V.set((S) => { S.offline = !S.offline; }); U.toast(V.S().offline ? 'Sin conexión con AFIP/ARCA (simulado)' : 'Conexión restablecida'); }
      if (k === 'logout') { V.set((S) => { S.loggedIn = false; }); if (page === 'web') location.hash = '#/login'; else location.href = page === 'app' ? 'app.html' : 'watch.html'; }
    }));
  };
})();
