/* =========================================================
   Vigente · demo — datos y estado compartido
   Web, app móvil y smartwatch leen/escriben el mismo estado
   (localStorage), así que marcar algo en una ventana se ve en las otras.
   ========================================================= */
(function () {
  const V = (window.V = window.V || {});
  const KEY = 'vigente-demo-v1';
  V.TODAY = '2026-08-12';

  /* ---------- fechas ---------- */
  const MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const MESC = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DIASC = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pad = (n) => String(n).padStart(2, '0');
  const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / 86400000);
  V.date = {
    MES, MESC, DIAS, DIASC, cap, pad, parse, iso, addDays, diffDays,
    short: (s) => { const d = parse(s); return `${pad(d.getDate())} ${MESC[d.getMonth()]}`; },
    short1: (s) => { const d = parse(s); return `${d.getDate()} ${MESC[d.getMonth()]}`; },
    long: (s) => { const d = parse(s); return `${cap(DIAS[d.getDay()])} ${d.getDate()} de ${MES[d.getMonth()]} de ${d.getFullYear()}`; },
    longNoDow: (s) => { const d = parse(s); return `${d.getDate()} de ${MES[d.getMonth()]} de ${d.getFullYear()}`; },
    dmy: (s) => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; },
    dm: (s) => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; },
    monthYear: (s) => { const d = parse(s); return `${cap(MES[d.getMonth()])} ${d.getFullYear()}`; },
    rel: (s) => {
      const n = diffDays(s, V.TODAY);
      if (n === 0) return 'hoy';
      if (n === 1) return 'mañana';
      if (n > 1) return `en ${n} días`;
      if (n === -1) return 'ayer';
      return `hace ${-n} días`;
    },
    mondayOf: (s) => { const d = parse(s); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return iso(d); },
    addMonths: (s, n) => { const d = parse(s); d.setDate(1); d.setMonth(d.getMonth() + n); return iso(d); },
  };

  /* ---------- datos base ---------- */
  const AUTO = {
    'Monotributo': ['Pago mensual monotributo', 'Recategorización semestral'],
    'Responsable Inscripto': ['IVA — Declaración jurada mensual', 'Ganancias — Anticipo', 'Ganancias — DDJJ anual'],
    'Autónomo': ['Aportes previsionales', 'Ganancias — Anticipo'],
    'Exento': ['Presentaciones informativas'],
  };
  V.TYPES = ['Monotributo', 'Responsable Inscripto', 'Autónomo', 'Exento'];
  V.TYPE_DESC = {
    'Monotributo': 'Pago mensual, recategorización semestral',
    'Responsable Inscripto': 'IVA mensual, Ganancias, IIBB',
    'Autónomo': 'Aportes previsionales, Ganancias',
    'Exento': 'Presentaciones informativas',
  };
  V.JURIS = [
    { id: 'nacional', label: 'Nacional (AFIP/ARCA)', org: 'AFIP/ARCA', ambit: 'Nacional' },
    { id: 'arba', label: 'Provincial (ARBA)', org: 'ARBA', ambit: 'Provincial' },
    { id: 'caba', label: 'CABA (AGIP)', org: 'AGIP', ambit: 'CABA' },
    { id: 'municipal', label: 'Municipal', org: 'Municipio', ambit: 'Municipal' },
  ];

  const T = (id, clientId, name, short, org, ambit, period, due, freq, extra) =>
    Object.assign({ id, clientId, name, short, org, ambit, period, due, freq, presentedOn: null, isNew: false, notes: [], extraHist: [] }, extra || {});

  function seed(mode) {
    const empty = mode === 'empty';
    return {
      v: 1,
      loggedIn: false,
      empty,
      user: {
        name: 'María José Gómez', initials: 'MG', role: 'Contadora',
        title: 'Contadora Pública · Matrícula CPCECABA T° 412 F° 88',
        email: 'mjgomez@estudio.com.ar', phone: '+54 9 11 5555-4321', cuit: '27-28998877-4',
        photo: null, passwordChanged: 'Actualizada hace 3 meses',
        twofa: { on: true, method: 'SMS' },
      },
      estudio: { nombre: 'Gómez & Asociados', plan: 'Profesional', desde: 'Marzo 2023' },
      ghost: empty ? { week: 0, active: 0, alDia: 0 } : { week: 2, active: 30, alDia: 33 },
      clients: empty ? [] : [
        { id: 'c_ep', name: 'Estudio Pérez y Asoc.', short: 'Pérez', cuit: '30-71234567-4', type: 'Responsable Inscripto', juris: ['nacional', 'arba'], activity: 'Servicios profesionales', email: 'contacto@estudioperez.com.ar', phone: '+54 11 4555-0101', since: 'marzo 2023', tint: 0, profileLog: [['Alta del cliente', '14/03/2023'], ['Se agregó jurisdicción ARBA', '02/07/2024'], ['Cambió de Monotributo a RI', '19/01/2026']] },
        { id: 'c_ps', name: 'Panadería del Sol', short: 'Panadería', cuit: '20-27654321-8', type: 'Monotributo', juris: ['nacional', 'arba'], activity: 'Elaboración de productos de panadería', email: 'contacto@panaderiadelsol.com.ar', phone: '+54 11 4555-0102', since: 'junio 2024', tint: 1, profileLog: [['Alta del cliente', '10/06/2024']] },
        { id: 'c_ca', name: 'Constructora Alfa S.A.', short: 'Constr. Alfa', cuit: '30-70998877-1', type: 'Responsable Inscripto', juris: ['nacional', 'arba'], activity: 'Construcción de edificios', email: 'administracion@constructoraalfa.com.ar', phone: '+54 11 4555-0103', since: 'agosto 2022', tint: 2, profileLog: [['Alta del cliente', '22/08/2022']] },
        { id: 'c_rm', name: 'Rodríguez, María', short: 'Rodríguez', cuit: '27-38112233-5', type: 'Autónomo', juris: ['nacional'], activity: 'Diseño gráfico', email: 'maria.rodriguez@correo.com.ar', phone: '+54 9 11 5555-0104', since: 'octubre 2023', tint: 3, profileLog: [['Alta del cliente', '03/10/2023']] },
        { id: 'c_tn', name: 'Textil Norte SRL', short: 'Textil Norte', cuit: '30-71778899-0', type: 'Responsable Inscripto', juris: ['nacional', 'arba'], activity: 'Fabricación de textiles', email: 'contabilidad@textilnorte.com.ar', phone: '+54 11 4555-0105', since: 'febrero 2021', tint: 4, profileLog: [['Alta del cliente', '11/02/2021']] },
        { id: 'c_kd', name: 'Kiosco Don Jorge', short: 'Kiosco', cuit: '20-18334455-6', type: 'Monotributo', juris: ['nacional'], activity: 'Venta al por menor', email: 'donjorge@correo.com.ar', phone: '+54 9 11 5555-0106', since: 'mayo 2025', tint: 5, profileLog: [['Alta del cliente', '08/05/2025']] },
        { id: 'c_gl', name: 'Gráfica Lomas SRL', short: 'Gráfica Lomas', cuit: '30-71332211-6', type: 'Responsable Inscripto', juris: ['nacional'], activity: 'Impresión', email: 'admin@graficalomas.com.ar', phone: '', since: 'abril 2024', tint: 0, profileLog: [['Alta del cliente', '16/04/2024']] },
        { id: 'c_mi', name: 'Metalúrgica Ituzaingó', short: 'Metalúrgica', cuit: '30-71889900-4', type: 'Responsable Inscripto', juris: ['nacional', 'arba'], activity: 'Metalurgia', email: 'info@metalurgicaituzaingo.com.ar', phone: '', since: 'julio 2023', tint: 1, profileLog: [['Alta del cliente', '05/07/2023']] },
        { id: 'c_sr', name: 'Servicios Rivadavia SA', short: 'Rivadavia', cuit: '30-71223344-9', type: 'Responsable Inscripto', juris: ['nacional'], activity: 'Servicios generales', email: 'contacto@serviciosrivadavia.com.ar', phone: '', since: 'enero 2025', tint: 2, profileLog: [['Alta del cliente', '20/01/2025']] },
        { id: 'c_pm', name: 'Pérez, Marcela', short: 'Pérez M.', cuit: '27-30112244-8', type: 'Monotributo', juris: ['nacional'], activity: 'Peluquería', email: 'marcela.perez@correo.com.ar', phone: '', since: 'marzo 2025', tint: 3, profileLog: [['Alta del cliente', '12/03/2025']] },
        { id: 'c_ph', name: 'Pérez Hermanos SRL', short: 'Pérez Hnos.', cuit: '30-71556677-3', type: 'Responsable Inscripto', juris: ['nacional', 'arba'], activity: 'Comercio mayorista', email: 'admin@perezhermanos.com.ar', phone: '', since: 'agosto 2021', tint: 4, profileLog: [['Alta del cliente', '30/08/2021']] },
      ],
      tramites: empty ? [] : [
        T('t_iva_ep', 'c_ep', 'IVA — Declaración jurada mensual', 'IVA DDJJ', 'AFIP/ARCA', 'Nacional', 'Julio 2026', '2026-08-12', 'Mensual', { reg: 'AFIP/ARCA — RG 5.612/2026', verified: '2026-08-04' }),
        T('t_iibb_ca', 'c_ca', 'IIBB — Declaración mensual', 'IIBB DDJJ', 'ARBA', 'Provincial', 'Julio 2026', '2026-08-12', 'Mensual'),
        T('t_mono_ps', 'c_ps', 'Pago mensual monotributo', 'Monotributo', 'AFIP/ARCA', 'Nacional', 'Agosto 2026', '2026-08-14', 'Mensual'),
        T('t_recat_ps', 'c_ps', 'Recategorización semestral', 'Recateg.', 'AFIP/ARCA', 'Nacional', 'Segundo semestre 2026', '2026-08-14', 'Semestral'),
        T('t_gan_ca', 'c_ca', 'Ganancias — Anticipo mensual', 'Ganancias', 'AFIP/ARCA', 'Nacional', 'Julio 2026', '2026-08-18', 'Mensual'),
        T('t_iibb_ep', 'c_ep', 'IIBB — Declaración mensual', 'IIBB', 'ARBA', 'Provincial', 'Julio 2026', '2026-08-18', 'Mensual'),
        T('t_mono_kd', 'c_kd', 'Pago mensual monotributo', 'Monotributo', 'AFIP/ARCA', 'Nacional', 'Agosto 2026', '2026-08-20', 'Mensual'),
        T('t_mono_pm', 'c_pm', 'Pago mensual monotributo', 'Monotributo', 'AFIP/ARCA', 'Nacional', 'Agosto 2026', '2026-08-20', 'Mensual'),
        T('t_iibb_tn', 'c_tn', 'IIBB — Declaración mensual', 'IIBB', 'ARBA', 'Provincial', 'Julio 2026', '2026-08-22', 'Mensual', { presentedOn: '2026-08-04' }),
        T('t_iibb_ph', 'c_ph', 'IIBB — Declaración mensual', 'IIBB', 'ARBA', 'Provincial', 'Julio 2026', '2026-08-22', 'Mensual'),
        T('t_iva_gl', 'c_gl', 'IVA — Declaración jurada mensual', 'IVA DDJJ', 'AFIP/ARCA', 'Nacional', 'Julio 2026', '2026-08-26', 'Mensual'),
        T('t_apo_rm', 'c_rm', 'Aportes previsionales', 'Aportes', 'AFIP/ARCA', 'Nacional', 'Julio 2026', '2026-08-05', 'Mensual'),
        T('t_gan_ep', 'c_ep', 'Ganancias — Anticipo', 'Ganancias', 'AFIP/ARCA', 'Nacional', 'Bimestre 4', '2026-09-15', 'Bimestral'),
        T('t_gananual_ep', 'c_ep', 'Ganancias — DDJJ anual', 'Ganancias anual', 'AFIP/ARCA', 'Nacional', 'Ejercicio 2026', '2027-05-12', 'Anual'),
      ],
      notifs: [
        { id: 'n1', kind: 'prorroga', title: 'Prórroga aplicada automáticamente', body: 'IVA de Estudio Pérez pasó del 12 al 26 de agosto.', when: 'Hace 2 días', read: false, link: '#/tramite/t_iva_ep?v=prorroga' },
        { id: 'n2', kind: 'semana', title: '3 vencimientos esta semana', body: 'Pérez, Panadería del Sol y Constructora Alfa.', when: 'Hoy 08:00', read: false, link: '#/calendario' },
        { id: 'n3', kind: 'vencido', title: 'Vencimiento sin presentar', body: 'Aportes previsionales de María Rodríguez venció el 05/08.', when: 'Hace 3 días', read: false, link: '#/tramite/t_apo_rm' },
        { id: 'n4', kind: 'norma', title: 'Nueva normativa publicada', body: 'Cambió el portal de presentación de DDJJ de IVA.', when: '28/07', read: false, link: '#/novedades/n2' },
        { id: 'n5', kind: 'sync', title: 'Calendario sincronizado', body: 'Se verificaron las fechas con AFIP/ARCA y ARBA.', when: '04/08', read: true, link: null },
      ],
      settings: {
        ant: { 15: false, 7: true, 3: true, 1: true, 0: true },
        channels: { app: true, email: true, push: false, watch: false },
        topics: { proximos: true, prorrogas: true, normativos: true, sinpresentar: true, resumen: false },
      },
      docLists: {},
      docRequests: empty ? [] : [
        { id: 'r1', clientId: 'c_ep', label: 'IVA — DDJJ mensual', due: '2026-08-07', items: [{ l: 'Libro IVA ventas del período', d: false }, { l: 'Libro IVA compras del período', d: false }, { l: 'Extractos bancarios del mes', d: false }] },
        { id: 'r2', clientId: 'c_rm', label: 'Aportes previsionales', due: '2026-08-03', items: [{ l: 'Recibos de cobro del período', d: false }, { l: 'Constancia de pago anterior', d: false }] },
        { id: 'r3', clientId: 'c_ps', label: 'Recategorización', due: '2026-08-09', items: [{ l: 'Facturación de los últimos 6 meses', d: true }, { l: 'Constancia de inscripción', d: false }] },
        { id: 'r4', clientId: 'c_ca', label: 'Ganancias — Anticipo', due: '2026-08-10', items: [{ l: 'Balance parcial', d: true }, { l: 'Libro IVA ventas', d: true }, { l: 'Libro IVA compras', d: true }, { l: 'Extractos bancarios', d: true }] },
        { id: 'r5', clientId: 'c_tn', label: 'IIBB — DDJJ mensual', due: '2026-08-15', items: [{ l: 'Detalle de ventas por jurisdicción', d: true }, { l: 'Comprobantes de retenciones', d: true }, { l: 'Convenio multilateral', d: true }] },
        { id: 'r6', clientId: 'c_kd', label: 'Pago monotributo', due: '2026-08-18', items: [{ l: 'Comprobantes de ingresos del período', d: false }] },
      ],
      reminders: { stop: true, notifyMe: true },
      adhesion: { c_ca: true, c_gl: true, c_sr: true, c_x2: true, c_x4: true },
      novRead: {},
      forum: { threads: seedForum() },
      toast: null,
    };
  }

  function seedForum() {
    const P = (a, i, t, w, extra) => Object.assign({ id: 'p' + Math.random().toString(36).slice(2, 8), author: a, ini: i, text: t, when: w, likes: 0, liked: false }, extra || {});
    return [
      { id: 'th1', cat: 'imp', title: '¿Alguien pudo adherir el nuevo servicio de IVA sin errores?', excerpt: 'Me tira error 3000 al confirmar la relación. ¿Les pasó?', author: 'Laura C.', ini: 'LC', when: 'hace 2 h', whenFull: 'abierto hace 2 h', replies: 14, isNew: true, rel: 'n2', authorTag: 'AUTORA', posts: [
        P('Laura C.', 'LC', 'Estoy intentando adherir el nuevo servicio para tres clientes y en los tres me tira error 3000 al confirmar la relación. Probé con distintos navegadores. ¿A alguien más le pasa o es un tema mío?', 'hace 2 h', { author_flag: true }),
        P('Gabriela A.', 'GA', 'Me pasó lo mismo el lunes. Se soluciona entrando primero al administrador de relaciones y recién después adhiriendo el servicio. Si entrás directo desde el CUIT propio, tira ese error.', 'hace 1 h', { useful: true }),
        P('Martín R.', 'MR', 'Confirmo lo de Gabriela. Además, si el cliente tiene clave fiscal nivel 2, no te va a dejar: necesita nivel 3 sí o sí.', 'hace 40 min'),
      ] },
      { id: 'th2', cat: 'mono', title: 'Recategorización: cliente que se pasó de escala en un solo mes', excerpt: 'Facturó de más por una venta puntual. ¿Conviene esperar al semestre?', author: 'Martín R.', ini: 'MR', when: 'hace 5 h', whenFull: 'abierto hace 5 h', replies: 9, posts: [
        P('Martín R.', 'MR', 'Un cliente monotributista facturó de más por una venta puntual y se pasó de escala en un solo mes. ¿Conviene esperar a la recategorización del semestre o hacerlo ya?', 'hace 5 h', { author_flag: true }),
        P('Ana F.', 'AF', 'Si el exceso es puntual y el acumulado de los 12 meses sigue dentro del tope, esperaría al semestre. Lo que sí: dejalo documentado en el legajo.', 'hace 4 h', { useful: true }),
      ] },
      { id: 'th3', cat: 'hon', title: 'Cómo cobran ustedes el armado de balance', excerpt: 'Estoy revisando honorarios y quiero comparar criterios.', author: 'Silvia V.', ini: 'SV', when: 'ayer', whenFull: 'abierto ayer', replies: 27, posts: [
        P('Silvia V.', 'SV', 'Estoy revisando honorarios y quiero comparar criterios. ¿Cobran por balance cerrado, por hora o un abono mensual todo incluido?', 'ayer', { author_flag: true }),
        P('Juan P.', 'JP', 'Nosotros hacemos abono mensual que incluye balance. Ordena el flujo de caja y el cliente no se sorprende en diciembre.', 'ayer'),
      ] },
      { id: 'th4', cat: 'soft', title: 'Tango vs. Xubio para estudios chicos', excerpt: 'Migré hace poco y quiero contar la experiencia.', author: 'Juan P.', ini: 'JP', when: 'ayer', whenFull: 'abierto ayer', replies: 18, posts: [
        P('Juan P.', 'JP', 'Migré hace poco de Tango a Xubio y quiero contar la experiencia. En general bien, pero la conciliación bancaria me llevó un tiempo.', 'ayer', { author_flag: true }),
        P('Laura C.', 'LC', '¿Y la importación de comprobantes de ARCA? En mi estudio es lo que más tiempo nos ahorra.', 'ayer'),
      ] },
      { id: 'th5', cat: 'sueldos', title: 'Cargas sociales: nueva alícuota desde agosto', excerpt: '¿Se aplica al período devengado o al pagado?', author: 'Ana F.', ini: 'AF', when: 'hace 2 días', whenFull: 'abierto hace 2 días', replies: 6, posts: [
        P('Ana F.', 'AF', 'Con la nueva alícuota de cargas sociales vigente desde agosto: ¿se aplica al período devengado o al pagado?', 'hace 2 días', { author_flag: true }),
        P('Gabriela A.', 'GA', 'Al período devengado. Lo confirmaron en la consulta que hicieron en la cámara la semana pasada.', 'hace 2 días', { useful: true }),
      ] },
      { id: 'th6', cat: 'imp', title: 'Prórroga de IIBB en Provincia: ¿alcanza a CABA?', excerpt: 'Me quedó la duda con los clientes de convenio multilateral.', author: 'Pablo S.', ini: 'PS', when: 'hace 3 días', whenFull: 'abierto hace 3 días', replies: 11, posts: [
        P('Pablo S.', 'PS', 'Salió la prórroga de IIBB en Provincia y me quedó la duda: ¿alcanza también a la parte de CABA en los clientes de convenio multilateral?', 'hace 3 días', { author_flag: true }),
        P('Gabriela A.', 'GA', 'No. La parte de CABA tiene su propio calendario en AGIP. Fijate el cronograma de cada jurisdicción por separado.', 'hace 3 días', { useful: true }),
      ] },
      { id: 'th7', cat: 'imp', title: 'Percepciones bancarias que no aparecen en el portal', excerpt: 'Hace dos meses que no me cargan las percepciones de un cliente.', author: 'Lucía M.', ini: 'LM', when: 'hace 4 días', whenFull: 'abierto hace 4 días', replies: 7, posts: [
        P('Lucía M.', 'LM', 'Hace dos meses que no me aparecen en el portal las percepciones bancarias de un cliente. ¿Les pasó? ¿A quién se le reclama?', 'hace 4 días', { author_flag: true }),
        P('Martín R.', 'MR', 'Primero reclamá al banco que actuó como agente de percepción. Si no responde, se puede cargar con la constancia que te den.', 'hace 4 días'),
      ] },
      { id: 'th8', cat: 'imp', title: 'Cómo computar el saldo a favor del período anterior', excerpt: 'Tengo un saldo técnico y no sé dónde lo arrastro.', author: 'Diego T.', ini: 'DT', when: 'hace 5 días', whenFull: 'abierto hace 5 días', replies: 5, posts: [
        P('Diego T.', 'DT', 'Tengo un cliente con saldo a favor del período anterior y no sé en qué renglón de la DDJJ conviene computarlo. ¿Alguien tiene un ejemplo?', 'hace 5 días', { author_flag: true }),
        P('Ana F.', 'AF', 'Va como saldo técnico a favor del contribuyente, en el renglón de arrastre del período anterior. Si es libre disponibilidad, es otro renglón.', 'hace 5 días'),
      ] },
    ];
  }
  V.FORUM_CATS = [
    { id: 'imp', name: 'Impuestos y vencimientos', n: 48, color: '#5b2fd1', tag: 'violet' },
    { id: 'mono', name: 'Monotributo', n: 31, color: '#0f7336', tag: 'green' },
    { id: 'sueldos', name: 'Sueldos y cargas sociales', n: 22, color: '#4a35c9', tag: 'violet' },
    { id: 'soft', name: 'Software y herramientas', n: 17, color: '#a86b05', tag: 'amber' },
    { id: 'hon', name: 'Honorarios y ejercicio', n: 12, color: '#8a3a7c', tag: 'pink' },
    { id: 'libre', name: 'Charla libre', n: 9, color: '#59616b', tag: 'violet' },
  ];
  V.FORUM_SHORT = { imp: 'Impuestos', mono: 'Monotributo', sueldos: 'Sueldos', soft: 'Software', hon: 'Honorarios', libre: 'Charla libre' };

  /* ---------- novedades (contenido editorial, no cambia) ---------- */
  V.NOVEDADES = [
    { id: 'n1', type: 'prorroga', label: 'Prórroga', date: '2026-08-06', title: 'Se prorroga el vencimiento de IVA — período 07/2026', body: 'ARCA extendió el vencimiento de la declaración jurada de IVA para CUIT terminados en 4, 5 y 6. Ya se actualizó en el calendario de los clientes afectados.', short: 'ARCA extendió el vencimiento para CUIT terminados en 4, 5 y 6.', src: 'AFIP/ARCA — RG 5.618/2026', affects: 6, cta: 'clientes', mLabel: 'PRÓRROGA' },
    { id: 'n2', type: 'norma', label: 'Cambio de norma', date: '2026-07-28', title: 'Nuevo portal para la presentación de DDJJ de IVA', body: 'Desde el período 07/2026 la presentación se realiza por el nuevo portal de ARCA. Cambia el circuito de carga y el formato del archivo.', short: 'Cambia el circuito de carga y el formato del archivo.', src: 'AFIP/ARCA — RG 5.612/2026', affects: 12, cta: 'curso', mins: 4, course: true, mLabel: 'CAMBIO DE NORMA' },
    { id: 'n3', type: 'recat', label: 'Recategorización', date: '2026-07-15', title: 'Nuevas escalas de monotributo vigentes desde agosto', body: 'Se actualizaron los topes de facturación de cada categoría. Revisá si alguno de tus monotributistas quedó fuera de escala antes de la recategorización.', short: 'Se actualizaron los topes de facturación por categoría.', src: 'AFIP/ARCA — Resolución 5.605/2026', affects: 9, cta: 'clientes', mLabel: 'RECATEGORIZACIÓN' },
    { id: 'n4', type: 'curso', label: 'Curso', date: '2026-07-02', title: 'Recategorización paso a paso en 8 minutos', body: 'Un recorrido corto por el nuevo formulario de recategorización: qué datos pedir al cliente y dónde se confirma.', short: 'Recorrido corto por el nuevo formulario.', src: 'Vigente Academia', affects: 0, cta: 'curso', mins: 8, course: true, mLabel: 'CURSO' },
  ];
  V.NOV_SECTIONS = {
    n2: [
      ['Qué cambió', 'Desde el período 07/2026 la declaración jurada de IVA se presenta a través del nuevo portal de ARCA. El servicio anterior deja de aceptar presentaciones.'],
      ['Qué tenés que hacer', 'Adherir el nuevo servicio desde el administrador de relaciones de cada cliente antes de la primera presentación. La adhesión se hace una sola vez por CUIT.'],
      ['Qué cambia en el archivo', 'El formato del archivo de importación pasa de .txt a .xml. Los sistemas contables habituales ya publicaron la actualización correspondiente.'],
      ['Qué pasa si presentás por el portal viejo', 'La presentación no se registra y el trámite queda como no presentado, con el riesgo de multa por infracción formal.'],
    ],
    n4: [
      ['Qué vas a ver', 'Cómo entrar al formulario de recategorización, qué datos de facturación tomar y cómo confirmar el resultado.'],
      ['Qué tenés que pedirle al cliente', 'Facturación de los últimos 12 meses y la constancia de inscripción vigente.'],
      ['Qué hacer si queda fuera de escala', 'Calcular la categoría que corresponde y avisar al cliente antes de confirmar el cambio.'],
    ],
  };
  V.AFFECTED = [
    { id: 'c_ep', name: 'Estudio Pérez y Asoc.', cuit: '30-71234567-4' }, { id: 'c_ca', name: 'Constructora Alfa S.A.', cuit: '30-70998877-1' },
    { id: 'c_tn', name: 'Textil Norte SRL', cuit: '30-71778899-0' }, { id: 'c_gl', name: 'Gráfica Lomas SRL', cuit: '30-71332211-6' },
    { id: 'c_mi', name: 'Metalúrgica Ituzaingó', cuit: '30-71889900-4' }, { id: 'c_sr', name: 'Servicios Rivadavia SA', cuit: '30-71223344-9' },
    { id: 'c_ph', name: 'Pérez Hermanos SRL', cuit: '30-71556677-3' }, { id: 'c_x1', name: 'Transportes del Plata SA', cuit: '30-71445566-2' },
    { id: 'c_x2', name: 'Ferretería Industrial SRL', cuit: '30-71667788-5' }, { id: 'c_x3', name: 'Agropecuaria Los Tilos SA', cuit: '30-71990011-8' },
    { id: 'c_x4', name: 'Distribuidora Andina SRL', cuit: '30-71223399-7' }, { id: 'c_x5', name: 'Laboratorios Cuyo SA', cuit: '30-71554433-1' },
  ];

  /* ---------- store ---------- */
  let state = null;
  const listeners = [];
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) return s; }
    } catch (e) { /* storage no disponible: sigue en memoria */ }
    return seed('full');
  }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  V.S = () => (state || (state = load()));
  V.save = persist; // guardar sin notificar (para cambios silenciosos)
  V.set = (fn) => { fn(V.S()); persist(); listeners.forEach((f) => f()); };
  V.onChange = (fn) => listeners.push(fn);
  V.reset = (mode) => { const keepLogin = V.S().loggedIn; state = seed(mode || 'full'); state.loggedIn = keepLogin; persist(); listeners.forEach((f) => f()); };
  window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); listeners.forEach((f) => f()); } });
  V.uid = (p) => (p || 'id') + '_' + Math.random().toString(36).slice(2, 9);

  /* ---------- consultas ---------- */
  const Q = (V.q = {});
  Q.client = (id) => V.S().clients.find((c) => c.id === id);
  Q.tramite = (id) => V.S().tramites.find((t) => t.id === id);
  Q.status = (t) => {
    if (t.presentedOn) return 'presentado';
    const n = diffDays(t.due, V.TODAY);
    if (n < 0) return 'vencido';
    if (n === 0) return 'urgente';
    if (t.isNew) return 'nuevo';
    return 'proximo';
  };
  Q.dueLabel = (t) => {
    const n = diffDays(t.due, V.TODAY);
    if (t.presentedOn) return 'Presentado';
    if (n < 0) return `Vencido hace ${-n} ${-n === 1 ? 'día' : 'días'}`;
    if (n === 0) return 'Vence hoy';
    return `Vence en ${n} ${n === 1 ? 'día' : 'días'}`;
  };
  const ord = (t) => V.S().tramites.indexOf(t); // orden de carga: desempata fechas iguales
  const PRIO = { vencido: 0, urgente: 1, nuevo: 2, proximo: 2, presentado: 3 };
  Q.sorted = (list) => list.slice().sort((a, b) => {
    const pa = PRIO[Q.status(a)], pb = PRIO[Q.status(b)];
    if (pa !== pb) return pa - pb;
    return a.due.localeCompare(b.due) || ord(a) - ord(b);
  });
  Q.byDate = (list) => list.slice().sort((a, b) => a.due.localeCompare(b.due) || ord(a) - ord(b));
  Q.clientTramites = (cid) => Q.byDate(V.S().tramites.filter((t) => t.clientId === cid));
  Q.pending = () => V.S().tramites.filter((t) => !t.presentedOn);
  Q.dueToday = () => Q.byDate(Q.pending().filter((t) => t.due === V.TODAY));
  Q.overdue = () => Q.byDate(Q.pending().filter((t) => t.due < V.TODAY));
  Q.presentedToday = () => V.S().tramites.filter((t) => t.presentedOn === V.TODAY);
  Q.upcoming = (n) => Q.byDate(Q.pending().filter((t) => t.due > V.TODAY)).slice(0, n || 5);
  Q.weekRange = (anchor) => { const m = V.date.mondayOf(anchor || V.TODAY); return [m, addDays(m, 6)]; };
  Q.stats = () => {
    const S = V.S();
    const [w0, w1] = Q.weekRange();
    const week = Q.pending().filter((t) => t.due >= w0 && t.due <= w1).length + S.ghost.week;
    const done = S.tramites.filter((t) => t.presentedOn).length;
    return {
      hoy: Q.dueToday().length,
      vencidos: Q.overdue().length,
      alDia: S.ghost.alDia + done,
      clientes: S.ghost.active + S.clients.length,
      semana: week,
    };
  };
  Q.unread = () => V.S().notifs.filter((n) => !n.read).length;
  Q.initials = (name) => {
    const parts = name.replace(/[.,]/g, '').split(/\s+/).filter(Boolean);
    const first = parts[0] || '?';
    const second = parts.length > 1 ? parts[1] : '';
    // "Apellido, Nombre" → AN ; "Estudio Pérez y Asoc." → EP
    if (/,/.test(name)) return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    const skip = ['y', 'de', 'del', 'la', 'el', 'los', 'las', 'sa', 'srl'];
    const sig = parts.filter((p) => !skip.includes(p.toLowerCase()));
    const a = (sig[0] || first)[0] || '?';
    const b = (sig[1] || second || '')[0] || '';
    return (a + b).toUpperCase();
  };
  // Historial del trámite: período actual (si ya se presentó / venció) + presentaciones previas.
  Q.history = (t) => {
    const out = [];
    const st = Q.status(t);
    const period = monthName(shiftMonth(t.due, -1));
    if (t.presentedOn) out.push({ label: period, text: `Presentado el ${V.date.dm(t.presentedOn)}`, cls: 'cur' });
    else if (st === 'vencido') out.push({ label: period, text: 'sin presentar', cls: 'bad' });
    const n = st === 'vencido' ? 2 : 3;
    for (let k = 1; k <= n; k++) {
      const dueK = shiftMonth(t.due, -k);
      out.push({ label: monthName(shiftMonth(dueK, -1)), text: `Presentado el ${V.date.dm(dueK)}`, cls: '' });
    }
    return out;
  };
  function shiftMonth(s, n) {
    const d = parse(s); const day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return iso(d);
  }
  function monthName(s) { const d = parse(s); return `${cap(MES[d.getMonth()])} ${d.getFullYear()}`; }

  /* ---------- acciones compartidas (web, app y reloj) ---------- */
  const A = (V.act = {});
  A.present = (id, onDate) => V.set((S) => {
    const t = S.tramites.find((x) => x.id === id);
    if (t) {
      t.presentedOn = onDate || V.TODAY; t.isNew = false;
      const n = new Date(); t.presentedAt = `${pad(n.getHours())}:${pad(n.getMinutes())}`;
    }
  });
  A.undo = (id) => V.set((S) => { const t = S.tramites.find((x) => x.id === id); if (t) { t.presentedOn = null; t.presentedAt = null; } });
  A.addNote = (id, text) => V.set((S) => {
    const t = S.tramites.find((x) => x.id === id);
    if (t && text.trim()) t.notes.unshift({ text: text.trim(), at: V.TODAY });
  });
  A.markAllRead = () => V.set((S) => S.notifs.forEach((n) => (n.read = true)));
  A.readNotif = (id) => V.set((S) => { const n = S.notifs.find((x) => x.id === id); if (n) n.read = true; });

  // genera trámites a partir del perfil (nuevo cliente / edición de perfil)
  A.generate = (type, juris) => {
    const list = [];
    const has = (j) => juris.includes(j);
    if (type === 'Monotributo') {
      list.push({ name: 'Pago mensual monotributo', short: 'Monotributo', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Mensual', due: '2026-08-14', period: 'Agosto 2026' });
      list.push({ name: 'Recategorización semestral', short: 'Recateg.', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Semestral', due: '2026-08-14', period: 'Segundo semestre 2026' });
    } else if (type === 'Responsable Inscripto') {
      list.push({ name: 'IVA — Declaración jurada mensual', short: 'IVA DDJJ', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Mensual', due: '2026-08-26', period: 'Julio 2026' });
      list.push({ name: 'Ganancias — Anticipo', short: 'Ganancias', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Bimestral', due: '2026-09-15', period: 'Bimestre 4' });
    } else if (type === 'Autónomo') {
      list.push({ name: 'Aportes previsionales', short: 'Aportes', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Mensual', due: '2026-08-24', period: 'Julio 2026' });
      list.push({ name: 'Ganancias — Anticipo', short: 'Ganancias', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Bimestral', due: '2026-09-15', period: 'Bimestre 4' });
    } else {
      list.push({ name: 'Presentaciones informativas', short: 'Informativas', org: 'AFIP/ARCA', ambit: 'Nacional', freq: 'Anual', due: '2026-08-31', period: 'Ejercicio 2026' });
    }
    if (has('arba') && type !== 'Exento') list.push({ name: 'IIBB — Declaración mensual (ARBA)', short: 'IIBB', org: 'ARBA', ambit: 'Provincial', freq: 'Mensual', due: '2026-08-22', period: 'Julio 2026' });
    if (has('caba') && type !== 'Exento') list.push({ name: 'IIBB — Declaración mensual (AGIP)', short: 'IIBB CABA', org: 'AGIP', ambit: 'CABA', freq: 'Mensual', due: '2026-08-20', period: 'Julio 2026' });
    return list;
  };
  A.addClient = (data) => {
    let id;
    V.set((S) => {
      const taken = S.clients.length;
      id = V.uid('c');
      const c = {
        id, name: data.name, short: data.name.split(/\s+/)[0], cuit: data.cuit, type: data.type, juris: data.juris.slice(),
        activity: data.activity || '', email: data.email || '', phone: '', since: 'agosto 2026', tint: taken % 6,
        profileLog: [['Alta del cliente', V.date.dmy(V.TODAY)]],
      };
      S.clients.push(c);
      const chosen = data.tramites || A.generate(c.type, c.juris);
      chosen.forEach((g) => S.tramites.push(Object.assign({ id: V.uid('t'), clientId: id, presentedOn: null, isNew: true, notes: [], extraHist: [] }, g)));
    });
    return id;
  };

  A.docList = (cid) => {
    const S = V.S();
    if (S.docLists[cid]) return S.docLists[cid];
    const c = Q.client(cid); const groups = {};
    const ts = Q.clientTramites(cid);
    const add = (g, items) => { if (!groups[g]) groups[g] = items.map((l) => ({ l, on: true })); };
    ts.forEach((t) => {
      if (/^IVA/.test(t.name)) add('IVA — DDJJ mensual', ['Libro IVA ventas', 'Libro IVA compras', 'Extractos bancarios']);
      else if (/^IIBB/.test(t.name)) add('IIBB — DDJJ mensual', ['Detalle de ventas por jurisdicción', 'Comprobantes de retenciones']);
      else if (/anual/i.test(t.name)) add('Ganancias — DDJJ anual', ['Balance firmado', 'Inventario de bienes de uso']);
      else if (/^Ganancias/.test(t.name)) add('Ganancias — Anticipo', ['Balance parcial', 'Extractos bancarios']);
      else if (/monotributo|Recateg/i.test(t.name)) add('Monotributo', ['Comprobantes de ingresos del período']);
      else if (/Aportes/.test(t.name)) add('Aportes previsionales', ['Recibos de cobro del período']);
      else add(t.name, ['Documentación respaldatoria']);
    });
    if (!Object.keys(groups).length) add('Documentación general', ['Constancia de inscripción']);
    S.docLists[cid] = groups;
    return groups;
  };
  A.requestItems = (t) => {
    const S = V.S();
    const base = /^IVA/.test(t.name)
      ? ['Libro IVA ventas del período', 'Libro IVA compras del período', 'Extractos bancarios del mes', 'Facturas de compra pendientes de carga', 'Comprobantes de retenciones sufridas']
      : /^IIBB/.test(t.name) ? ['Detalle de ventas por jurisdicción', 'Comprobantes de retenciones', 'Extractos bancarios del mes', 'Convenio multilateral']
      : /Aportes/.test(t.name) ? ['Recibos de cobro del período', 'Constancia de pago anterior', 'Comprobantes de gastos deducibles']
      : /monotributo|Recateg/i.test(t.name) ? ['Facturación del período', 'Constancia de inscripción', 'Comprobantes de compras']
      : ['Balance parcial', 'Extractos bancarios del mes', 'Libro IVA ventas del período', 'Libro IVA compras del período'];
    const pre = /^IVA/.test(t.name) ? 3 : 2;
    return base.map((l, i) => ({ l, on: i < pre }));
  };
})();
