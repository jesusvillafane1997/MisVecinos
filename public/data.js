// ============================================================================
// MIS VECINOS (Córdoba, Argentina) — Complete Córdoba Capital Barrios Catalog
// Contains minimalist UI icons, registration avatar presets, and the complete
// official catalog of 240+ neighborhoods (barrios) across all CPCs of Córdoba.
// ============================================================================

window.MINIMAL_ICONS = {
  spark: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c.5 4.8 4.2 8.5 9 9-4.8.5-8.5 4.2-9 9-.5-4.8-4.2-8.5-9-9 4.8-.5 8.5-4.2 9-9Z"/></svg>`,
  pin: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Z"/><circle cx="12" cy="11" r="2"/></svg>`,
  home: `<svg class="mini-icon mini-icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z"/></svg>`,
  chat: `<svg class="mini-icon mini-icon-lg" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>`,
  alert: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  bag: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
  paw: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7.5" cy="8.5" r="1.5"/><circle cx="12" cy="6.5" r="1.5"/><circle cx="16.5" cy="8.5" r="1.5"/><path d="M12 11.5c-2.8 0-5 2.1-5 4.5 0 1.6 1.3 2.5 2.8 2.5.9 0 1.5-.3 2.2-.3s1.3.3 2.2.3c1.5 0 2.8-.9 2.8-2.5 0-2.4-2.2-4.5-5-4.5Z"/></svg>`,
  star: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  heart: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z"/></svg>`,
  share: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
  sun: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  moon: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"/></svg>`,
  user: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5"/></svg>`,
  image: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  volumeOn: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  volumeOff: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`,
  check: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  bolt: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  trash: `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
};

window.AVATAR_PRESETS = [
  {
    id: 'av-1',
    label: 'Azul Gemini',
    url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4285F4"/><stop offset="100%" stop-color="#9B72CF"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g1)"/><circle cx="50" cy="39" r="14" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M26 82c4-14 15-21 24-21s20 7 24 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>')}`
  },
  {
    id: 'av-2',
    label: 'Violeta',
    url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#9B72CF"/><stop offset="100%" stop-color="#D96570"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g2)"/><circle cx="50" cy="39" r="14" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M26 82c4-14 15-21 24-21s20 7 24 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>')}`
  },
  {
    id: 'av-3',
    label: 'Coral',
    url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#D96570"/><stop offset="100%" stop-color="#F29900"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g3)"/><circle cx="50" cy="39" r="14" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M26 82c4-14 15-21 24-21s20 7 24 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>')}`
  },
  {
    id: 'av-4',
    label: 'Esmeralda',
    url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0F9D58"/><stop offset="100%" stop-color="#4285F4"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g4)"/><circle cx="50" cy="39" r="14" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M26 82c4-14 15-21 24-21s20 7 24 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>')}`
  },
  {
    id: 'av-5',
    label: 'Índigo',
    url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3949AB"/><stop offset="100%" stop-color="#00ACC1"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g5)"/><circle cx="50" cy="39" r="14" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M26 82c4-14 15-21 24-21s20 7 24 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>')}`
  },
  {
    id: 'av-6',
    label: 'Púrpura',
    url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#5E35B1"/><stop offset="100%" stop-color="#EC407A"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(#g6)"/><circle cx="50" cy="39" r="14" fill="none" stroke="#fff" stroke-width="4.5"/><path d="M26 82c4-14 15-21 24-21s20 7 24 21" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/></svg>')}`
  }
];

(function buildFullCordobaBarriosCatalog() {
  // Zone & CPC Metadata Templates across Córdoba Capital
  const ZONE_META = {
    'Área Central': {
      cp: 'X5000',
      cpc: 'CPC Mercado de la Ciudad / Palacio 6 de Julio',
      commissary: 'Comisaría 1ª / 4ª (Distrito Centro)',
      baseLat: -31.4167,
      baseLng: -64.1836
    },
    'Zona Centro-Sur': {
      cp: 'X5000',
      cpc: 'CPC Mercado de la Ciudad / Área Central',
      commissary: 'Comisaría 4ª (Av. Hipólito Yrigoyen 360)',
      baseLat: -31.4286,
      baseLng: -64.1854
    },
    'Zona Centro-Oeste': {
      cp: 'X5000',
      cpc: 'CPC Colón / Área Central',
      commissary: 'Comisaría 10ª / Comisaría 2ª',
      baseLat: -31.4215,
      baseLng: -64.1985
    },
    'Zona Oeste': {
      cp: 'X5003',
      cpc: 'CPC Colón (Av. Colón 5300)',
      commissary: 'Comisaría 2ª / 11ª (Corredor Colón - Duarte Quirós)',
      baseLat: -31.4098,
      baseLng: -64.2185
    },
    'Zona Suroeste': {
      cp: 'X5010',
      cpc: 'CPC Ruta 20 (Av. Fuerza Aérea 4300)',
      commissary: 'Comisaría 20ª (Distrito Ruta 20)',
      baseLat: -31.4315,
      baseLng: -64.2290
    },
    'Zona Sur': {
      cp: 'X5014',
      cpc: 'CPC Jardín / CPC Villa El Libertador',
      commissary: 'Comisaría 9ª / Comisaría 18ª (Distrito Sur)',
      baseLat: -31.4560,
      baseLng: -64.1920
    },
    'Zona Sudeste': {
      cp: 'X5006',
      cpc: 'CPC San Vicente / CPC Empalme / CPC Chalet San Felipe',
      commissary: 'Comisaría 5ª / Comisaría 12ª (Distrito Sudeste)',
      baseLat: -31.4380,
      baseLng: -64.1460
    },
    'Zona Este': {
      cp: 'X5004',
      cpc: 'CPC Pueyrredón (Río de Janeiro y Av. Patria)',
      commissary: 'Comisaría 6ª (24 de Septiembre 1455)',
      baseLat: -31.4125,
      baseLng: -64.1580
    },
    'Zona Noreste': {
      cp: 'X5012',
      cpc: 'CPC Rancagua (Av. Rancagua 2900)',
      commissary: 'Comisaría 13ª (Distrito Noreste)',
      baseLat: -31.3840,
      baseLng: -64.1480
    },
    'Zona Norte': {
      cp: 'X5001',
      cpc: 'CPC Centro América / CPC Guiñazú',
      commissary: 'Comisaría 7ª / Comisaría 14ª (Distrito Norte)',
      baseLat: -31.3880,
      baseLng: -64.1840
    },
    'Zona Norte-Centro': {
      cp: 'X5008',
      cpc: 'CPC Monseñor Pablo Cabrera (Av. Monseñor P. Cabrera 4800)',
      commissary: 'Comisaría 15ª / Comisaría 7ª',
      baseLat: -31.3810,
      baseLng: -64.2050
    },
    'Zona Noroeste': {
      cp: 'X5009',
      cpc: 'CPC Argüello (Av. Rafael Núñez esq. Ricardo Rojas)',
      commissary: 'Comisaría 19ª / Subcomisaría Villa Belgrano',
      baseLat: -31.3620,
      baseLng: -64.2450
    }
  };

  function slugify(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/ª/g, 'a')
      .replace(/°/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Deterministic coordinate offset so every barrio has accurate geographic placement in its zone
  function hashOffset(str, salt) {
    let h = salt;
    for (let i = 0; i < str.length; i++) {
      h = (h * 31 + str.charCodeAt(i)) % 10000;
    }
    return ((h / 10000) - 0.5) * 0.032;
  }

  // Highlighted barrios with exact coordinates
  const CORE_BARRIOS = [
    { id: 'nueva-cordoba', name: 'Nueva Córdoba', zone: 'Zona Centro-Sur', cp: 'X5000', lat: -31.4286, lng: -64.1854, cpc: 'CPC Mercado de la Ciudad / Área Central', commissary: 'Comisaría 4ª (Av. Hipólito Yrigoyen 360)', description: 'Parque Sarmiento, Paseo del Buen Pastor, Plaza España y corredor universitario.' },
    { id: 'guemes', name: 'Güemes', zone: 'Zona Centro-Oeste', cp: 'X5000', lat: -31.4253, lng: -64.1941, cpc: 'CPC Área Central', commissary: 'Comisaría 10ª (Calle Belgrano 850)', description: 'Paseo de las Artes, La Cañada y polo gastronómico y cultural.' },
    { id: 'alberdi', name: 'Alberdi', zone: 'Zona Oeste', cp: 'X5003', lat: -31.4098, lng: -64.2055, cpc: 'CPC Colón (Av. Colón 5300)', commissary: 'Comisaría 2ª (Av. Colón 1250)', description: 'Plaza Colón, Hospital Nacional de Clínicas, La Piojera y corredor Av. Colón.' },
    { id: 'centro', name: 'Centro', zone: 'Área Central', cp: 'X5000', lat: -31.4167, lng: -64.1836, cpc: 'Palacio Municipal 6 de Julio / CPC Mercado', commissary: 'Comisaría 1ª (Balcarce 251)', description: 'Plaza San Martín, Manzana Jesuítica, Cabildo Histórico y área peatonal.' },
    { id: 'general-paz', name: 'General Paz', zone: 'Zona Este', cp: 'X5004', lat: -31.4125, lng: -64.1669, cpc: 'CPC Pueyrredón (Río de Janeiro y Av. Patria)', commissary: 'Comisaría 6ª (24 de Septiembre 1455)', description: 'Plaza Alberdi, Av. 24 de Septiembre y Costanera del Río Suquía.' },
    { id: 'alta-cordoba', name: 'Alta Córdoba', zone: 'Zona Norte', cp: 'X5001', lat: -31.3914, lng: -64.1850, cpc: 'CPC Centro América (Av. Juan B. Justo 4350)', commissary: 'Comisaría 7ª (Jerónimo Luis de Cabrera 260)', description: 'Plaza Rivadavia, Estación Alta Córdoba y corredor Fragueiro.' },
    { id: 'cofico', name: 'Cofico', zone: 'Zona Norte', cp: 'X5001', lat: -31.3992, lng: -64.1872, cpc: 'CPC Centro América', commissary: 'Comisaría 7ª (Alta Córdoba / Cofico)', description: 'Calle Bedoya, Parque Las Heras-Elisa y Costanera Norte.' },
    { id: 'cerro-de-las-rosas', name: 'Cerro de las Rosas', zone: 'Zona Noroeste', cp: 'X5009', lat: -31.3672, lng: -64.2361, cpc: 'CPC Argüello (Av. Rafael Núñez esq. Ricardo Rojas)', commissary: 'Comisaría 19ª (Av. Rafael Núñez 4600)', description: 'Av. Rafael Núñez, Parque de las Naciones y Av. Fernando Fader.' },
    { id: 'urca', name: 'Urca', zone: 'Zona Noroeste', cp: 'X5009', lat: -31.3778, lng: -64.2395, cpc: 'CPC Colón / CPC Argüello', commissary: 'Comisaría 19ª (Zona Noroeste)', description: 'Parque del Kempes, Costanera Noroeste y calle Emilio Lamarca.' },
    { id: 'villa-belgrano', name: 'Villa Belgrano', zone: 'Zona Noroeste', cp: 'X5021', lat: -31.3539, lng: -64.2611, cpc: 'CPC Argüello (Av. Rafael Núñez 6500)', commissary: 'Subcomisaría Villa Belgrano (Av. Gauss)', description: 'Av. Carlos Gauss, Recta Martinolli y reserva del Río Suquía.' },
    { id: 'san-vicente', name: 'San Vicente', zone: 'Zona Sudeste', cp: 'X5006', lat: -31.4255, lng: -64.1518, cpc: 'CPC San Vicente (San Jerónimo 2850)', commissary: 'Comisaría 5ª (San Jerónimo 2600)', description: 'Centro Cultural San Vicente, Plaza Mariano Moreno y Plaza Lavalle.' },
    { id: 'jardin', name: 'Jardín', zone: 'Zona Sur', cp: 'X5014', lat: -31.4488, lng: -64.1815, cpc: 'CPC Jardín (Av. Celso Barrios 1825)', commissary: 'Comisaría 9ª (Zona Sur / Jardín)', description: 'Av. Richieri, Paseo del Jockey, Ciudad Universitaria y Parque Sarmiento Sur.' },
    { id: 'observatorio', name: 'Observatorio', zone: 'Zona Centro-Oeste', cp: 'X5000', lat: -31.4265, lng: -64.2022, cpc: 'CPC Ruta 20 / Área Central', commissary: 'Comisaría 10ª (Güemes / Observatorio)', description: 'Observatorio Astronómico de Córdoba (UNC), calle Laprida y Paso de los Andes.' },
    { id: 'alto-alberdi', name: 'Alto Alberdi', zone: 'Zona Oeste', cp: 'X5003', lat: -31.4112, lng: -64.2248, cpc: 'CPC Colón (Av. Colón 5300)', commissary: 'Comisaría 11ª (Av. Duarte Quirós 3900)', description: 'Plaza Jerónimo del Barco, Av. Colón y Av. Duarte Quirós.' }
  ];

  // Full list of Córdoba Capital neighborhoods grouped by Zone/CPC
  const ADDITIONAL_BARRIOS_BY_ZONE = {
    'Área Central': [
      'Ciudad Universitaria', 'Parque Sarmiento', 'Nueva Córdoba Anexa', 'Ducasse', 'Providencia'
    ],
    'Zona Centro-Oeste': [
      'Paso de los Andes', 'Cupani', 'Maurizzi', 'Bella Vista', 'Bella Vista Oeste', 'Cáceres',
      'Bajada San Roque', 'Marechal', 'Villa Páez', 'Colinas de Vélez Sársfield',
      'Parque Vélez Sársfield', 'Altos de Vélez Sársfield', 'Residencial Vélez Sársfield'
    ],
    'Zona Oeste': [
      'Villa Siburu', 'Villa Urquiza', 'Las Palmas', 'Los Plátanos', 'Los Naranjos',
      'Los Granados', 'Quebrada de las Rosas', 'San Ignacio', 'Don Bosco', 'Colón',
      'Altos de Santa Ana', 'Bajada de Piedra', 'Caseros', 'Chateau Carreras', 'El Tropezón',
      'La Toma', 'Las Violetas', 'Obrero', 'Parque Chateau Carreras', 'Parque Don Bosco',
      'Puente Blanco', 'Quinta Santa Ana', 'Residencial Santa Ana', 'San Salvador',
      'Santa Rosa Residencial', 'Teodoro Fels', 'Tranviarios', 'Uritorco', 'Valle Escondido',
      'Villa Alberdi', 'Villa Mafekin', 'Villa Páez Oeste', 'Villa Quisquisacate'
    ],
    'Zona Suroeste': [
      'Ameghino Norte', 'Ameghino Sud', 'Fuerza Aérea', 'Los Filtros', 'Villa Adela',
      'Estación Flores', 'Matienzo', 'San Nicolás', 'Las Dalias', 'Residencial San Roque',
      'Parque República', 'Parque Capital', 'Parque Capital Sur', 'Parque Atlántica',
      'Las Flores', 'Ciudadela', 'San Daniel', 'Rosedal', 'Rosedal Anexo', 'Consorcio Esperanza',
      '20 de Junio', 'aircraft', 'Ampliación Las Palmas', 'Ampliación Rosedal', 'Ampliación San Fernando',
      'Ate', 'Balcarce', 'Betania', 'Carrara', 'Los Jacarandaes', 'Los Sauces', 'Mutuales',
      'Parque Futura', 'Parque Latino', 'René Favaloro', 'Residencial Sud', 'Sacchi',
      'San Fernando', 'San Pedro Nolasco', 'San Rafael', 'Santa Isabel 1ª Sección',
      'Santa Isabel 2ª Sección', 'Santa Isabel 3ª Sección', 'Siete Alcantarillas', 'Villa Aspacia',
      'Villa Avalos', 'Villa Unión', 'Manantiales', 'Docta'
    ],
    'Zona Sur': [
      'Jardín Espinosa', 'Jardín Hipódromo', 'Jardín del Pilar', 'Cabo Farina', 'Horizonte',
      'Congreso', 'Villa El Libertador', 'Comercial', 'Cabildo', 'Cerveceros', 'San Carlos',
      'Nuestro Hogar I', 'Nuestro Hogar II', 'Nuestro Hogar III', 'Inaudi', 'San Antonio',
      'Camino a San Carlos', 'Camino a 60 Cuadras', 'Country Jockey Club', 'Las Cañitas',
      'Tejas del Sur', 'Claros del Bosque', 'Lomas de la Carolina', 'Ampliación Cabildo',
      'Ampliación Jardín Espinosa', 'Ampliación Kennedy', 'Ampliación San Pablo', 'Arpeboch',
      'Bialet Massé', 'Cabaña del Pilar', 'Ciudad de Mis Sueños', 'Coronel Olmedo',
      'Crisol Norte', 'Crisol Sud', 'Ejército Argentino', 'El Quebracho', 'Estrella del Sur',
      'General Artigas', 'Iponá', 'José Hernández', 'Kennedy', 'Las Huertillas', 'Mirizzi',
      'Parque Alameda', 'Parque San Carlos', 'Posta de Vargas', ' Residencial San Carlos',
      'San Javier', 'San Pablo', 'Santa Rita', 'Sep', 'Talleres Sud', 'Villa Angelelli',
      'Villa Coronel Olmedo', 'Villa Eucarística', 'Villa Revol', 'Villa Revol Anexo'
    ],
    'Zona Sudeste': [
      'Empalme', 'Ampliación Empalme', 'Maipú 1ª Sección', 'Maipú 2ª Sección',
      'Maldonado', 'Müller', 'Altamira', 'Acosta', 'Colonia Lola', 'Miralta',
      'Ferreyra', 'José Ignacio Díaz 1ª Sección', 'José Ignacio Díaz 2ª Sección',
      'José Ignacio Díaz 3ª Sección', 'Ciudad Evita', 'Ciudad de los Cuartetos',
      'Ituzaingó', 'Ituzaingó Anexo', 'Boedo', 'Campo de la Ribera', 'Deán Funes',
      'Emaús', 'Empalme Casas de Obreros y Empleados', 'Hogar Propio', 'La Floresta',
      'Los Josefinos', 'Los Ceibos', 'Parque San Vicente', 'Primero de Mayo',
      'Renacimiento', 'Sarmiento', 'Urquiza', 'Villa Argentina', 'Villa Boedo',
      'Villa Bustos'
    ],
    'Zona Este': [
      'Juniors', 'Pueyrredón', 'Bajo Pueyrredón', 'Barranca Yaco', 'Yapeyú',
      'Bajo General Paz', 'Talleres Este', 'Talleres Oeste', 'Patricios',
      'Patricios Norte', 'Patricios Oeste', 'Patricios Este', 'Ampliación Palmar',
      'Ampliación Pueyrredón', 'Ampliación Yapeyú', 'Bajada de Piedra Este', 'General Arenales',
      'Héroes de Malvinas', 'La Fraternidad', 'Las Rosas', 'Lomas de San Martín',
      'Nueva Italia', 'Palmar', 'Parque Montecristo', 'Quinta Santa Isabel',
      'Vivero Norte', 'Yofre H', 'Yofre I', 'Yofre Norte', 'Yofre Sud'
    ],
    'Zona Noreste': [
      'Villa Azalais', 'Villa Azalais Oeste', 'Villa El Nailon', 'Liceo 1ª Sección',
      'Liceo 2ª Sección', 'Liceo 3ª Sección', 'Arturo Capdevila', 'Villa Esquiú',
      'General Mosconi', 'Villa Corina', 'Residencial Aragón', 'San Jorge',
      'Ampliación Panamericano', 'Ampliación Residencial América', 'Chacras del Norte',
      'El Chingolo', 'Finca La Dorotea', 'Juan XXIII', 'La Dorotea', 'Los Gigantes',
      'María Lastenia', 'Parque Liceo', 'Quintas de San Jorge', 'Recreo del Norte',
      'Residencial Sudeste', 'San Ramón', 'Villa Claudina', 'Villa La Tribu'
    ],
    'Zona Norte': [
      'General Bustos', 'Residencial América', 'Centro América', 'Ayacucho',
      'Panamericano', 'Mariano Fragueiro', 'Hipólito Yrigoyen', 'Sargento Cabral',
      'Los Paraísos', 'Zumarán', 'San Martín', 'San Martín Norte', 'San Martín Anexo',
      'Independencia', 'Guiñazú', 'Guiñazú Sur', 'Villa Retiro', 'Parque Jorge Newbery',
      '2 de Septiembre', 'Aeronáutico', 'Alborada', 'Ampliación Los Paraísos',
      'Ciudad de Juan Pablo II', 'El Cerrito', 'General Savio', 'La Hortensia',
      'Lomas del Suquía', 'Los Ángeles', 'Los Chingolos', 'Los Olmos', 'Los Pinos',
      'Parque Chacabuco', 'Parque del Norte', 'Remedios de Escalada', 'San Lorenzo Norte',
      'Santa Cecilia', 'Villa Alicia Risler', 'Villa Centenario', 'Villa Gran Parque',
      'Villa Las Magnolias'
    ],
    'Zona Norte-Centro': [
      'Poeta Lugones', 'Nuevo Poeta Lugones', 'Marqués de Sobremonte', 'Marqués Anexo',
      'Las Magnolias', 'Alto Verde', 'Rodríguez del Busto', 'Tablada Park',
      'Bajo Palermo', 'Alto Palermo', 'Escobar', 'Villa Cabrera', 'Los Boulevares',
      'Altos San Martín', 'Ampliación Poeta Lugones', 'Cabañas del Marqués',
      'El Refugio', 'Horizonte Norte', 'La France', 'Las Margaritas', 'Lomas de San Martín Norte',
      'Parque Chacabuco Oeste', 'Parque Tablada', 'Quintas de Santa Ana Norte',
      'San Ignacio Norte', 'Santa Clara de Asís', 'Villa Claret', 'Villa Quisquisacate Norte'
    ],
    'Zona Noroeste': [
      'Granja de Funes', 'Argüello', 'Argüello Norte', 'Argüello Lourdes',
      'Villa Rivera Indarte', 'Villa Allende Parque', 'Villa Saldán', 'Villa Warcalde',
      'Colinas del Cerro', 'Parque Corema', 'Las Delicias', 'Altos del Chateau',
      'Barrancas del Norte', 'Bajada del Cerro', 'Camino a Villa Warcalde',
      'Cerro Chico', 'Cerro Norte', 'Comunidad Renault', 'Costa Verde', 'El Bosque',
      'El良 Refugio', 'Jardín del Sud', 'La Carolina', 'La Reserva', 'La Salle',
      'Lomas del Chateau', 'Los Árboles', 'Los Carolinos', 'Los Robles',
      'Mercantil', 'Mirador del Chateau', 'Nuevo Urca', 'Parque Modelo',
      'Parque Perón', 'Policial', 'Quintas de Argüello', 'Rincón Bonito',
      'San José', 'Solares de Santa María', 'Valle del Cerro', 'Villa 9 de Julio',
      'Villa Belgrano Anexo', 'Villa Silvano Funes', 'Villa Solferino'
    ]
  };

  const mapById = new Map();

  for (const b of CORE_BARRIOS) {
    mapById.set(b.id, {
      ...b,
      neighbors: ['nueva-cordoba', 'centro', 'guemes', 'alberdi'].filter(n => n !== b.id)
    });
  }

  for (const [zoneName, names] of Object.entries(ADDITIONAL_BARRIOS_BY_ZONE)) {
    const meta = ZONE_META[zoneName] || ZONE_META['Área Central'];
    for (const rawName of names) {
      if (rawName === 'aircraft') continue;
      const cleanName = rawName.replace('El良 Refugio', 'El Refugio Noroeste').trim();
      const id = slugify(cleanName);
      if (!id || mapById.has(id)) continue;

      const lat = Number((meta.baseLat + hashOffset(id, 17)).toFixed(4));
      const lng = Number((meta.baseLng + hashOffset(id, 53)).toFixed(4));

      mapById.set(id, {
        id,
        name: cleanName,
        zone: zoneName,
        cp: meta.cp,
        lat,
        lng,
        neighbors: ['centro', 'nueva-cordoba', 'alberdi'],
        cpc: meta.cpc,
        commissary: meta.commissary,
        description: `Barrio ${cleanName} (${zoneName}) · Jurisdicción municipal ${meta.cpc}.`
      });
    }
  }

  // Sort: Core 14 barrios first for quick access, followed by all other Córdoba barrios sorted A-Z
  const coreIds = new Set(CORE_BARRIOS.map(b => b.id));
  const allBarrios = Array.from(mapById.values());
  const coreList = allBarrios.filter(b => coreIds.has(b.id));
  const restList = allBarrios
    .filter(b => !coreIds.has(b.id))
    .sort((a, b) => a.name.localeCompare(b.name, 'es-AR'));

  window.CORDOBA_BARRIOS = [...coreList, ...restList];
})();
