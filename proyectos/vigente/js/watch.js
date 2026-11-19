/* =========================================================
   Vigente · demo — smartwatch (pantallas I·48 e I·49 del Figma)
   Es una vista previa interactiva: marcar "Ya lo presenté" en el reloj
   presenta el trámite de verdad (se ve en la web y en la app).
   ========================================================= */
(function () {
  const V = window.V, Q = V.q, A = V.act, D = V.date, U = V.ui;
  const { esc, shape } = U;
  const root = document.getElementById('watch-root');
  const st = { cur: null, last: null };

  const short = (n) => n.replace(/\s+(y Asoc\.|S\.A\.|SRL|SA)$/i, '');
  const ddjj = (n) => n.replace('Declaración jurada', 'DDJJ').replace('Declaración mensual', 'DDJJ mensual');
  const STATES = [
    ['vence', 'Vencimiento del día', 'Interrumpe en la muñeca: vence hoy'],
    ['prorroga', 'Prórroga detectada', 'Avisa que una fecha se corrió'],
    ['presentado', 'Confirmación tras marcar', 'Se muestra al tocar “Ya lo presenté”'],
    ['todo', 'Sin vencimientos hoy', 'No hay nada pendiente'],
  ];

  function screen() {
    const today = Q.dueToday(); const t = today[0] || null;
    const iva = V.S().tramites.find((x) => x.id === 't_iva_ep');
    if (st.cur === 'vence' && !t) st.cur = 'todo';
    if (!st.cur) st.cur = t ? 'vence' : 'todo';
    const who = (x) => esc(short(Q.client(x.clientId).name).split(' ').slice(0, 2).join(' '));
    switch (st.cur) {
      case 'vence':
        return { time: '9:41', html: `<span class="w-chip lime">${shape('tri')}VENCE HOY</span><h2>${who(t)}</h2><div class="s">${esc(ddjj(t.name))}</div>
          <div class="w-box"><b>${D.short1(t.due)}</b><span>•</span><span class="l">quedan 6 h</span></div>${today.length > 1 ? `<p class="w-note">Hoy vencen ${today.length} trámites</p>` : ''}
          <button class="w-btn lime" data-act="w-present" data-id="${t.id}">Ya lo presenté</button>` };
      case 'prorroga':
        return { time: '8:02', html: `<span class="w-chip dark">${shape('pent')}PRÓRROGA</span><h2>Se corrió una fecha</h2><div class="s">IVA de Estudio Pérez</div>
          <div class="w-box"><s>12 ago</s><span style="color:var(--lime)">→</span><b>26 ago</b></div><p class="w-note">Tu calendario ya se actualizó.</p>
          <button class="w-btn soft" data-act="w-ok">Entendido</button>` };
      case 'presentado': {
        const x = st.last ? Q.tramite(st.last) : iva;
        return { time: '11:24', html: `<div class="w-center" style="display:flex;flex-direction:column;flex:1"><div class="w-big fill"></div><h2>Presentado</h2><div class="s">${x ? `${esc(/^IVA/.test(x.name) ? 'IVA' : ddjj(x.name))} de ${who(x)}` : 'El trámite'} quedó registrado.</div>
          <button class="w-btn soft" data-act="w-undo">Deshacer</button></div>` };
      }
      default: {
        const nx = Q.upcoming(1)[0];
        return { time: '20:10', html: `<div class="w-center" style="display:flex;flex-direction:column;flex:1"><div class="w-big ring"></div><h2>Todo al día</h2><div class="s">No tenés vencimientos hoy.</div>
          ${nx ? `<div class="w-box c"><small>Próximo</small><b>${D.short1(nx.due)} · ${esc(short(Q.client(nx.clientId).name))}</b></div>` : ''}</div>` };
      }
    }
  }

  function render() {
    const s = screen();
    root.innerHTML = `<div class="watch-page"><h1>Smartwatch · avisos</h1>
      <p class="sub">Sólo dos avisos justifican interrumpir en la muñeca: un vencimiento del día y una prórroga que corrió una fecha. Lo demás se ve en la app.</p>
      <div class="w-layout"><div><div class="w-device" role="img" aria-label="Vista previa del reloj"><div class="w-body"><div class="w-screen"><div class="w-time">${s.time}</div>${s.html}</div></div><div class="w-crown"></div></div></div>
        <div class="w-states" role="group" aria-label="Estados del reloj"><h3>Probá los estados</h3>${STATES.map(([k, l, d]) => `<button class="w-state${st.cur === k ? ' on' : ''}" data-act="w-state" data-k="${k}" aria-pressed="${st.cur === k}"><i></i><span>${l}<small>${d}</small></span></button>`).join('')}
          <p class="w-help">Esto es una vista previa de cómo se vería Vigente en el reloj. Tocar <b>Ya lo presenté</b> marca el trámite como presentado de verdad: abrí la web o la app en otra ventana y vas a ver el cambio.</p></div></div></div>`;
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]'); if (!a) return; const k = a.dataset.act;
    if (k === 'w-state') { st.cur = a.dataset.k; render(); }
    else if (k === 'w-present') { st.last = a.dataset.id; st.cur = 'presentado'; A.present(a.dataset.id); }
    else if (k === 'w-undo') { if (st.last) A.undo(st.last); st.cur = 'vence'; render(); }
    else if (k === 'w-ok') { st.cur = Q.dueToday().length ? 'vence' : 'todo'; render(); }
  });
  V.onChange(render);
  U.demoBar('watch');
  render();
})();
