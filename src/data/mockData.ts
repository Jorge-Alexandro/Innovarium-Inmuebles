import { 
  Condominio, Piso, Departamento, Area, Activo, Responsable, 
  TareaPreventiva, Presupuesto, EventoTrazabilidad, Manifest, 
  LecturaEnergia, FondoReserva, OeeHistorico, LecturaSensor
} from "../types";

// ==========================================
// 1. MANIFESTS (Módulo 11: Motor de Manifest)
// ==========================================

export const MANIFEST_PILOTO: Manifest = {
  companyId: "innovarum_las_vertientes",
  scenario: "apartamento",
  theme: {
    primaryColor: "#1B2A4A", // Azul marino Innovarum
    accentColor: "#B08D4C",  // Dorado Innovarum
    fontFamily: "Inter, sans-serif"
  },
  navigation: ["dashboard", "areas", "calendario", "finanzas", "tpm"],
  features: {
    enableIoTIntegration: true,
    enableMultiPiso: false,
    enableFondoReserva: false,
    enablePareto: false,
    enableAutoCalendarSync: true,
    enableWhatsApp: false,
    enableIsometricView: false
  }
};

export const MANIFEST_TORRE: Manifest = {
  companyId: "innovarum_torre_ejecutiva",
  scenario: "edificio",
  theme: {
    primaryColor: "#1B2A4A", // Azul marino Innovarum
    accentColor: "#B08D4C",  // Dorado Innovarum
    fontFamily: "Inter, sans-serif"
  },
  navigation: ["dashboard", "areas", "calendario", "finanzas", "tpm"],
  features: {
    enableIoTIntegration: true,
    enableMultiPiso: true,
    enableFondoReserva: true,
    enablePareto: true,
    enableAutoCalendarSync: true,
    enableWhatsApp: true,
    enableIsometricView: true
  }
};

// ==========================================
// 2. CONDOMINIOS
// ==========================================

export const CONDOMINIO_PILOTO_DATA: Condominio = {
  id: "condo_piloto_123",
  nombre: "Condominio Las Vertientes",
  m2: 24500,
  direccion: "Av. de los Pirules 440, Lomas de Tecamachalco, Huixquilucan, EdoMéx",
  regimen: "Régimen de Propiedad en Condominio Residencial",
  tipo: "apartamento",
  num_pisos: 1,
  tarifa_kwh: 1.15,
  meta_oee: 85
};

export const CONDOMINIO_TORRE_DATA: Condominio = {
  id: "condo_torre_999",
  nombre: "Torre Ejecutiva Innovarum",
  m2: 58000,
  direccion: "Av. Patria 1250, Villa Universitaria, Zapopan, Jalisco",
  regimen: "Régimen de Propiedad en Condominio Comercial y de Oficinas",
  tipo: "edificio",
  num_pisos: 10,
  tarifa_kwh: 2.45, // Tarifa comercial CFE aplicable en Jalisco
  meta_oee: 92
};

// ==========================================
// 3. PISOS Y DEPARTAMENTOS (Escenario B)
// ==========================================

export const PISOS_TORRE: Piso[] = [
  { id: "piso_1", condominio_id: "condo_torre_999", numero: 1, nombre: "P1 · Lobby / Biblioteca & Plaza" },
  { id: "piso_2", condominio_id: "condo_torre_999", numero: 2, nombre: "P2 · Sede CAF & CTBUH HQ" },
  { id: "piso_3", condominio_id: "condo_torre_999", numero: 3, nombre: "P3 · Aulas Técnicas / Talleres" },
  { id: "piso_4", condominio_id: "condo_torre_999", numero: 4, nombre: "P4 · Auditorio Interactivo" },
  { id: "piso_5", condominio_id: "condo_torre_999", numero: 5, nombre: "P5 · Talleres Juveniles y Tobogán" },
  { id: "piso_6", condominio_id: "condo_torre_999", numero: 6, nombre: "P6 · Espacio Escénico / Teatro" },
  { id: "piso_7", condominio_id: "condo_torre_999", numero: 7, nombre: "P7 · Gimnasio y Canchas" },
  { id: "piso_8", condominio_id: "condo_torre_999", numero: 8, nombre: "P8 · Espacios de Aprendizaje / Aulas" },
  { id: "piso_9", condominio_id: "condo_torre_999", numero: 9, nombre: "P9 · Jardín Escolar y Aula Abierta" },
  { id: "piso_10", condominio_id: "condo_torre_999", numero: 10, nombre: "P10 · Terraza & Roof Garden" }
];

// Generamos 10 departamentos por piso (total 100 deptos)
export const DEPARTAMENTOS_TORRE: Departamento[] = PISOS_TORRE.flatMap((p) => 
  Array.from({ length: 10 }, (_, idx) => ({
    id: `depto_${p.numero}_${idx + 1}`,
    piso_id: p.id,
    numero: `${p.numero}${String(idx + 1).padStart(2, '0')}`,
    tipo: p.numero <= 2 ? "comercial" : p.numero >= 9 ? "oficina" : "residencial"
  }))
);

// ==========================================
// 4. ÁREAS (10 Básicas para A, 18 para B)
// ==========================================

export const AREAS_PILOTO: Area[] = [
  { id: "gas", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Gas", estado_salud: "al_dia", categoria: "critica" },
  { id: "luz", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Luz / Electricidad", estado_salud: "por_vencer", categoria: "critica" },
  { id: "agua", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Agua", estado_salud: "al_dia", categoria: "critica" },
  { id: "electro", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Electrodomésticos", estado_salud: "al_dia", categoria: "basica" },
  { id: "llaves", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Llaves / Cerrajería", estado_salud: "por_vencer", categoria: "basica" },
  { id: "banos", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Baños", estado_salud: "al_dia", categoria: "basica" },
  { id: "cocina", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Cocina", estado_salud: "vencido", categoria: "basica" },
  { id: "seguridad", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Sistemas de Seguridad", estado_salud: "al_dia", categoria: "normativa" },
  { id: "incendios", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Sistemas Contra Incendios", estado_salud: "vencido", categoria: "normativa" },
  { id: "amenidades", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Amenidades", estado_salud: "al_dia", categoria: "basica" }
];

export const AREAS_TORRE: Area[] = [
  { id: "gas", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_1", nombre: "Gas", estado_salud: "al_dia", categoria: "critica" },
  { id: "luz", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_2", nombre: "Luz / Electricidad", estado_salud: "por_vencer", categoria: "critica" },
  { id: "agua", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_1", nombre: "Agua", estado_salud: "al_dia", categoria: "critica" },
  { id: "electro", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_6", nombre: "Electrodomésticos", estado_salud: "al_dia", categoria: "basica" },
  { id: "llaves", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_7", nombre: "Llaves / Cerrajería", estado_salud: "por_vencer", categoria: "basica" },
  { id: "banos", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_7", nombre: "Baños", estado_salud: "al_dia", categoria: "basica" },
  { id: "cocina", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_1", nombre: "Cocina", estado_salud: "vencido", categoria: "basica" },
  { id: "seguridad", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_1", nombre: "Sistemas de Seguridad", estado_salud: "al_dia", categoria: "normativa" },
  { id: "incendios", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_1", nombre: "Sistemas Contra Incendios", estado_salud: "vencido", categoria: "normativa" },
  { id: "amenidades", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_10", nombre: "Amenidades", estado_salud: "al_dia", categoria: "basica" },
  { id: "elevadores", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_5", nombre: "Elevadores", estado_salud: "por_vencer", categoria: "critica" },
  { id: "subestacion", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_2", nombre: "Subestación eléctrica", estado_salud: "al_dia", categoria: "critica" },
  { id: "hidroneumatico", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_3", nombre: "Sistema hidroneumático", estado_salud: "al_dia", categoria: "critica" },
  { id: "planta_emergencia", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_3", nombre: "Planta de emergencia", estado_salud: "al_dia", categoria: "critica" },
  { id: "cisterna", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_9", nombre: "Cisterna potable", estado_salud: "al_dia", categoria: "normativa" },
  { id: "tanque_elevado", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_9", nombre: "Tanque elevado", estado_salud: "al_dia", categoria: "critica" },
  { id: "azotea", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_9", nombre: "Azotea / Impermeabilización", estado_salud: "vencido", categoria: "normativa" },
  { id: "acceso_vehicular", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_4", nombre: "Control de acceso vehicular", estado_salud: "al_dia", categoria: "basica" }
];

// ==========================================
// 5. ACTIVOS (Con MTBF para Escenario B)
// ==========================================

export const ACTIVOS_PILOTO: Activo[] = [
  { id: "act_p1", area_id: "gas", nombre: "Tanque Estacionario de Gas 1000L", marca: "Tratogas", fecha_instalacion: "2022-04-10", estado: "operativo" },
  { id: "act_p2", area_id: "luz", nombre: "Subestación Eléctrica Principal 150KVA", marca: "Siemens", fecha_instalacion: "2021-08-15", estado: "operativo" },
  { id: "act_p3", area_id: "agua", nombre: "Bomba Hidroneumática de Presión 5HP", marca: "Altamira", fecha_instalacion: "2023-01-20", estado: "operativo" },
  { id: "act_p4", area_id: "electro", nombre: "Refrigerador Industrial Casa Club", marca: "Samsung", fecha_instalacion: "2023-05-12", estado: "operativo" },
  { id: "act_p5", area_id: "llaves", nombre: "Chapas Electromagnéticas de Accesos", marca: "Yale", fecha_instalacion: "2023-11-02", estado: "operativo" },
  { id: "act_p6", area_id: "banos", nombre: "Extractor de Humedad de Vapor", marca: "S&P", fecha_instalacion: "2022-09-18", estado: "operativo" },
  { id: "act_p7", area_id: "cocina", nombre: "Campana de Extracción y Filtro de Carbón", marca: "Inoxmédica", fecha_instalacion: "2021-12-05", estado: "fuera_servicio" },
  { id: "act_p8", area_id: "seguridad", nombre: "Grabador NVR 16 Canales 4K", marca: "Hikvision", fecha_instalacion: "2022-05-20", estado: "operativo" },
  { id: "act_p9", area_id: "incendios", nombre: "Unidad Central de Extintores PQS 9Kg", marca: "Buckeye", fecha_instalacion: "2021-11-10", estado: "falla_parcial" },
  { id: "act_p10", area_id: "amenidades", nombre: "Sistema Solar de Calentamiento de Alberca", marca: "Heliocol", fecha_instalacion: "2023-02-14", estado: "operativo" }
];

export const ACTIVOS_TORRE: Activo[] = [
  ...ACTIVOS_PILOTO.map(a => ({ ...a, mtbf_horas: 1800 })),
  // Activos de áreas avanzadas Escenario B
  { id: "act_b11", area_id: "elevadores", piso_id: "piso_6", nombre: "Elevador Principal de Pasajeros #1", marca: "Otis", fecha_instalacion: "2020-03-15", estado: "operativo", mtbf_horas: 1200, notas: "Elevador central de alta velocidad que cubre de PB a Piso 12" },
  { id: "act_b12", area_id: "elevadores", piso_id: "piso_6", nombre: "Elevador de Carga #2", marca: "Otis", fecha_instalacion: "2020-03-15", estado: "falla_parcial", mtbf_horas: 950, notas: "Uso pesado para mudanzas e intendencia" },
  { id: "act_b13", area_id: "subestacion", piso_id: "piso_1", nombre: "Transformador Trifásico Seco 500KVA", marca: "Prolec", fecha_instalacion: "2020-01-10", estado: "operativo", mtbf_horas: 4500 },
  { id: "act_b14", area_id: "hidroneumatico", piso_id: "piso_1", nombre: "Bomba de Presión Constante Duplex 15HP", marca: "Grundfos", fecha_instalacion: "2021-02-28", estado: "operativo", mtbf_horas: 1500 },
  { id: "act_b15", area_id: "planta_emergencia", piso_id: "piso_3", nombre: "Planta de Emergencia Diésel 250kW", marca: "Cummins", fecha_instalacion: "2019-11-20", estado: "operativo", mtbf_horas: 2800 },
  { id: "act_b16", area_id: "cisterna", piso_id: "piso_1", nombre: "Cisterna de Agua Potable 80,000L", marca: "Cemix", fecha_instalacion: "2019-10-05", estado: "operativo", mtbf_horas: 8000 },
  { id: "act_b17", area_id: "tanque_elevado", piso_id: "piso_10", nombre: "Tanque Elevado Regulador de Presión 20,000L", marca: "Rotoplas", fecha_instalacion: "2019-12-01", estado: "operativo", mtbf_horas: 6500 },
  { id: "act_b18", area_id: "azotea", piso_id: "piso_10", nombre: "Impermeabilización General de Azotea Elastomérica", marca: "Fester", fecha_instalacion: "2021-05-18", estado: "critico", mtbf_horas: 3000 },
  { id: "act_b19", area_id: "acceso_vehicular", piso_id: "piso_1", nombre: "Barreras de Acceso Vehicular Automatizadas RFID", marca: "Came", fecha_instalacion: "2022-07-22", estado: "operativo", mtbf_horas: 2200 }
];

// ==========================================
// 6. RESPONSABLES
// ==========================================

export const RESPONSABLES_PILOTO: Responsable[] = [
  { id: "resp_p1", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Laura Méndez", rol: "admin", email: "laura.mendez@innovarum.mx", activo: true },
  { id: "resp_p2", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Kevin Barbosa", rol: "lider", email: "kevin.barbosa@lasvertientes.mx", activo: true },
  { id: "resp_p3", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Soporte GasSeguro", rol: "proveedor", email: "soporte@gasseguro.mx", activo: true },
  { id: "resp_p4", condominio_id: CONDOMINIO_PILOTO_DATA.id, nombre: "Soporte ElectroPro", rol: "proveedor", email: "servicios@electropro.mx", activo: true }
];

export const RESPONSABLES_TORRE: Responsable[] = [
  ...RESPONSABLES_PILOTO.map(r => ({ ...r, condominio_id: CONDOMINIO_TORRE_DATA.id })),
  // Nuevos roles de Escenario B (superintendente, tecnico_area)
  { id: "resp_b5", condominio_id: CONDOMINIO_TORRE_DATA.id, nombre: "Ing. Alejandro Ruiz", rol: "superintendente", email: "alejandro.ruiz@innovarum.mx", activo: true, telefono: "3312345678", phone_whatsapp: "5213312345678" },
  { id: "resp_b6", condominio_id: CONDOMINIO_TORRE_DATA.id, nombre: "Téc. Martín Solís", rol: "tecnico_area", email: "martin.solis@innovarum.mx", activo: true, telefono: "3312345679" },
  { id: "resp_b7", condominio_id: CONDOMINIO_TORRE_DATA.id, nombre: "Téc. Carlos Ramos (Elevadores Otis)", rol: "tecnico_area", email: "carlos.ramos@otis.mx", activo: true }
];

// ==========================================
// 7. TAREAS PREVENTIVAS
// ==========================================

export const TAREAS_PILOTO: TareaPreventiva[] = [
  {
    id: "t1",
    area_id: "gas",
    activo_id: "act_p1",
    titulo: "Prueba de hermeticidad y detección de fugas",
    instrucciones_json: [
      "Cerrar la válvula principal de alimentación",
      "Aplicar solución jabonosa no corrosiva en uniones y reguladores",
      "Verificar estabilidad de presión en manómetro de prueba durante 10 minutos",
      "Registrar y firmar bitácora oficial de protección civil"
    ],
    frecuencia: "trimestral",
    proxima_fecha: "2026-07-03",
    estado: "programada",
    costo_estimado: 1800,
    costo_real: 1750,
    admin_id: "resp_p1",
    proveedor_id: "resp_p3",
    lider_id: "resp_p2"
  },
  {
    id: "t2",
    area_id: "gas",
    activo_id: "act_p1",
    titulo: "Calibración de sensores de gas en área de cocina",
    instrucciones_json: [
      "Presentar gas de calibración patrón al detector",
      "Verificar alarma audible en el rack general",
      "Comprobar cierre inmediato de electroválvula de corte de emergencia"
    ],
    frecuencia: "semestral",
    proxima_fecha: "2026-06-30",
    estado: "en_curso",
    costo_estimado: 1300,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_p3",
    lider_id: "resp_p2"
  },
  {
    id: "t3",
    area_id: "luz",
    activo_id: "act_p2",
    titulo: "Revisión y termografía de cargas de tablero general de distribución",
    instrucciones_json: [
      "Retirar carátulas protectoras con equipo de protección dieléctrico",
      "Realizar paneo termográfico y registrar zonas de sobrecalentamiento",
      "Ajustar torque en terminales de cables alimentadores principales",
      "Limpiar polvo acumulado por aspirado y soplado libre de humedad"
    ],
    frecuencia: "semestral",
    proxima_fecha: "2026-06-28",
    estado: "en_curso",
    costo_estimado: 2600,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_p4",
    lider_id: "resp_p2"
  },
  {
    id: "t4",
    area_id: "luz",
    activo_id: "act_p2",
    titulo: "Pruebas de arranque y fluidos de planta de emergencia diésel",
    instrucciones_json: [
      "Verificar carga y estado de bornes en batería de arranque de 24V",
      "Comprobar precalentamiento y niveles de diésel y refrigerante",
      "Efectuar arranque de prueba de 15 minutos midiendo frecuencia y voltaje"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-06-18",
    estado: "vencida",
    costo_estimado: 800,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_p4",
    lider_id: "resp_p2"
  },
  {
    id: "t5",
    area_id: "agua",
    activo_id: "act_p3",
    titulo: "Lavado profundo y desinfección de cisterna de agua potable",
    instrucciones_json: [
      "Coordinar vaciado parcial de la cisterna para evitar desperdicios",
      "Cepillar paredes y losas interiores con solución concentrada de cloro",
      "Aspirar lodos finos del fondo utilizando equipo sumergible sanitario",
      "Medir y restablecer residual de cloro libre a 1.5 ppm al reiniciar llenado"
    ],
    frecuencia: "semestral",
    proxima_fecha: "2026-08-15",
    estado: "programada",
    costo_estimado: 3200,
    costo_real: 3100,
    admin_id: "resp_p1",
    proveedor_id: "resp_p4",
    lider_id: "resp_p2"
  },
  {
    id: "t6",
    area_id: "cocina",
    activo_id: "act_p7",
    titulo: "Desengrase integral de campana extractora y descarga de trampa de grasa",
    instrucciones_json: [
      "Retirar filtros de lamas de acero inoxidable de la cocina",
      "Lavar filtros con agente desengrasante alcalino diluido en agua caliente",
      "Succionar sedimentos grasos de la trampa interceptora de polietileno"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-06-12",
    estado: "vencida",
    costo_estimado: 1100,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_p2",
    lider_id: "resp_p2"
  },
  {
    id: "t7",
    area_id: "incendios",
    activo_id: "act_p9",
    titulo: "Servicio de recarga anual y pesaje de cilindros extintores de PQS",
    instrucciones_json: [
      "Pesar cada cilindro y confirmar retención del peso total",
      "Revisar el manómetro confirmando que la aguja repose en zona verde",
      "Actualizar etiqueta holográfica y colocar seguro nuevo"
    ],
    frecuencia: "anual",
    proxima_fecha: "2026-06-05",
    estado: "vencida",
    costo_estimado: 2400,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_p4",
    lider_id: "resp_p2"
  }
];

export const TAREAS_TORRE: TareaPreventiva[] = [
  ...TAREAS_PILOTO,
  // Tareas de áreas avanzadas Escenario B
  {
    id: "t_b1",
    area_id: "elevadores",
    activo_id: "act_b11",
    titulo: "Mantenimiento mensual preventivo de poleas y guías de cabina",
    instrucciones_json: [
      "Limpieza de guías de cabina y contra-peso de residuos grasos viejos",
      "Revisar tensión y desgaste de los cables de acero de tracción de 1/2 pulgada",
      "Verificar funcionamiento de los interruptores de límite de carrera superior e inferior",
      "Lubricación de zapata de guías y ajuste de frenos magnéticos"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-07-04",
    estado: "en_curso",
    costo_estimado: 3500,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_b7",
    lider_id: "resp_b5",
    tecnico_area_id: "resp_b7"
  },
  {
    id: "t_b2",
    area_id: "subestacion",
    activo_id: "act_b13",
    titulo: "Limpieza y apriete de terminales en celdas de media tensión",
    instrucciones_json: [
      "Desenergizar subestación con candado de seguridad (LOTO)",
      "Limpiar aisladores de porcelana con alcohol isopropílico de alta pureza",
      "Ajustar torque en conexiones de cobre con torquímetro calibrado"
    ],
    frecuencia: "semestral",
    proxima_fecha: "2026-07-15",
    estado: "programada",
    costo_estimado: 8000,
    costo_real: 8200,
    admin_id: "resp_p1",
    proveedor_id: "resp_p4",
    lider_id: "resp_b5",
    tecnico_area_id: "resp_b6"
  },
  {
    id: "t_b3",
    area_id: "azotea",
    activo_id: "act_b18",
    titulo: "Reparación de grietas e impermeabilización por temporada de lluvias",
    instrucciones_json: [
      "Limpiar toda la superficie de la azotea de tierra y material suelto",
      "Sellar grietas activas con sellador de poliuretano de alta elasticidad",
      "Aplicar primera mano de impermeabilizante con rodillo y malla de refuerzo"
    ],
    frecuencia: "anual",
    proxima_fecha: "2026-06-10",
    estado: "vencida",
    costo_estimado: 45000,
    costo_real: null,
    admin_id: "resp_p1",
    proveedor_id: "resp_p4",
    lider_id: "resp_b5"
  }
];

// ==========================================
// 8. PRESUPUESTOS (Anual 2026)
// ==========================================

export const PRESUPUESTOS_PILOTO: Presupuesto[] = [
  { id: "pre_p1", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "gas", anio: 2026, monto_presupuestado: 14000, monto_gastado: 11200 },
  { id: "pre_p2", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "luz", anio: 2026, monto_presupuestado: 22000, monto_gastado: 18400 },
  { id: "pre_p3", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "agua", anio: 2026, monto_presupuestado: 18000, monto_gastado: 16100 },
  { id: "pre_p4", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "electro", anio: 2026, monto_presupuestado: 8000, monto_gastado: 5200 },
  { id: "pre_p5", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "llaves", anio: 2026, monto_presupuestado: 6000, monto_gastado: 4800 },
  { id: "pre_p6", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "banos", anio: 2026, monto_presupuestado: 9000, monto_gastado: 8650 },
  { id: "pre_p7", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "cocina", anio: 2026, monto_presupuestado: 11000, monto_gastado: 12300 },
  { id: "pre_p8", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "seguridad", anio: 2026, monto_presupuestado: 16000, monto_gastado: 13900 },
  { id: "pre_p9", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "incendios", anio: 2026, monto_presupuestado: 13000, monto_gastado: 6400 },
  { id: "pre_p10", condominio_id: CONDOMINIO_PILOTO_DATA.id, area_id: "amenidades", anio: 2026, monto_presupuestado: 19000, monto_gastado: 17500 }
];

export const PRESUPUESTOS_TORRE: Presupuesto[] = [
  ...PRESUPUESTOS_PILOTO.map(p => ({ ...p, condominio_id: CONDOMINIO_TORRE_DATA.id })),
  // Presupuestos de áreas avanzadas Escenario B
  { id: "pre_b11", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "elevadores", anio: 2026, monto_presupuestado: 42000, monto_gastado: 21500 },
  { id: "pre_b12", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "subestacion", anio: 2026, monto_presupuestado: 35000, monto_gastado: 28200 },
  { id: "pre_b13", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "hidroneumatico", anio: 2026, monto_presupuestado: 25000, monto_gastado: 18400 },
  { id: "pre_b14", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "planta_emergencia", anio: 2026, monto_presupuestado: 18000, monto_gastado: 12000 },
  { id: "pre_b15", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "cisterna", anio: 2026, monto_presupuestado: 12000, monto_gastado: 6500 },
  { id: "pre_b16", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "tanque_elevado", anio: 2026, monto_presupuestado: 10000, monto_gastado: 5000 },
  { id: "pre_b17", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "azotea", anio: 2026, monto_presupuestado: 60000, monto_gastado: 55000 },
  { id: "pre_b18", condominio_id: CONDOMINIO_TORRE_DATA.id, area_id: "acceso_vehicular", anio: 2026, monto_presupuestado: 15000, monto_gastado: 9500 }
];

// ==========================================
// 9. EVENTOS DE TRAZABILIDAD
// ==========================================

export const TRAZABILIDAD_PILOTO: EventoTrazabilidad[] = [
  { id: "e1", tarea_id: "t1", accion: "Mantenimiento planificado y asignado al calendario preventivo anual", actor: "Laura Méndez", fecha: "2026-06-01" },
  { id: "e2", tarea_id: "t1", accion: "Notificación programada por correo enviada a los tres responsables", actor: "Sistema Automático", fecha: "2026-06-02" },
  { id: "e3", tarea_id: "t1", accion: "Orden de compra aprobada con costo estimado de $1,800 MXN", actor: "Laura Méndez", fecha: "2026-06-14" },
  { id: "e4", tarea_id: "t1", accion: "Carga de comprobantes de hermeticidad y finalización física", actor: "Soporte GasSeguro", fecha: "2026-06-15" },
  { id: "e5", tarea_id: "t1", accion: "Dictamen de gas cargado a Supabase Storage con nota e informe", actor: "Kevin Barbosa", fecha: "2026-06-16" },
  { id: "e6", tarea_id: "t6", accion: "Mantenimiento planificado automático mensual de cocina", actor: "Sistema Automático", fecha: "2026-06-01" },
  { id: "e7", tarea_id: "t6", accion: "El mantenimiento rebasó el límite de fecha asignada y el estado cambió a Vencido", actor: "Monitoreo del Sistema", fecha: "2026-06-12" }
];

export const TRAZABILIDAD_TORRE: EventoTrazabilidad[] = [
  ...TRAZABILIDAD_PILOTO,
  { id: "e8", tarea_id: "t_b3", accion: "Alerta crítica de azotea: filtraciones activas en cubo de elevador de Piso 12", actor: "Ing. Alejandro Ruiz", fecha: "2026-06-10" },
  { id: "e9", tarea_id: "t_b1", accion: "Ajuste de cables de elevador Otis principal por Carlos Ramos", actor: "Carlos Ramos", fecha: "2026-06-25" }
];

// ==========================================
// 10. LECTURAS DE ENERGÍA Y CO₂
// ==========================================

export const ENERGIA_PILOTO: LecturaEnergia[] = [
  { id: "en_p1", area_id: "luz", kwh: 4500, costo_mxn: 5175, co2_kg: 1944, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" },
  { id: "en_p2", area_id: "agua", kwh: 3200, costo_mxn: 3680, co2_kg: 1382.4, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" },
  { id: "en_p3", area_id: "amenidades", kwh: 1200, costo_mxn: 1380, co2_kg: 518.4, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" },
  { id: "en_p4", area_id: "cocina", kwh: 900, costo_mxn: 1035, co2_kg: 388.8, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" }
];

export const ENERGIA_TORRE: LecturaEnergia[] = [
  ...ENERGIA_PILOTO,
  // Desglose de consumo por áreas de Escenario B
  { id: "en_b5", area_id: "elevadores", kwh: 12500, costo_mxn: 30625, co2_kg: 5400, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" },
  { id: "en_b6", area_id: "subestacion", kwh: 18000, costo_mxn: 44100, co2_kg: 7776, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" },
  { id: "en_b7", area_id: "hidroneumatico", kwh: 8500, costo_mxn: 20825, co2_kg: 3672, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" },
  { id: "en_b8", area_id: "acceso_vehicular", kwh: 800, costo_mxn: 1960, co2_kg: 345.6, periodo_inicio: "2026-05-01", periodo_fin: "2026-05-31" }
];

// Perfil de carga de energía 24 horas por piso (Simulación)
export const ENERGIA_PISOS_TORRE = [
  { piso: "Sótano/PB", kwh: 340, costo: 833, color: "#1B2A4A" },
  { piso: "Pisos 1-3", kwh: 580, costo: 1421, color: "#3B82F6" },
  { piso: "Pisos 4-6", kwh: 620, costo: 1519, color: "#10B981" },
  { piso: "Pisos 7-9", kwh: 710, costo: 1739, color: "#F59E0B" },
  { piso: "Pisos 10-12", kwh: 890, costo: 2180, color: "#EC4899" }
];

// ==========================================
// 11. FONDO DE RESERVA (Escenario B)
// ==========================================

export const FONDO_RESERVA_TORRE_DATA: FondoReserva[] = [
  {
    id: "fr_1",
    condominio_id: CONDOMINIO_TORRE_DATA.id,
    area_id: "elevadores",
    saldo_actual: 185000,
    contribucion_mensual: 12000,
    meta_mxn: 350000,
    activo_objetivo: "Cambio de cables de tracción y tarjeta de control Otis",
    fecha_meta_estimada: "2027-08-01"
  },
  {
    id: "fr_2",
    condominio_id: CONDOMINIO_TORRE_DATA.id,
    area_id: "hidroneumatico",
    saldo_actual: 95000,
    contribucion_mensual: 6000,
    meta_mxn: 180000,
    activo_objetivo: "Reemplazo preventivo de motores y sellos Grundfos",
    fecha_meta_estimada: "2027-09-01"
  },
  {
    id: "fr_3",
    condominio_id: CONDOMINIO_TORRE_DATA.id,
    area_id: "subestacion",
    saldo_actual: 145000,
    contribucion_mensual: 8500,
    meta_mxn: 220000,
    activo_objetivo: "Pruebas dieléctricas y termografía de transformador Prolec",
    fecha_meta_estimada: "2027-03-01"
  }
];

// ==========================================
// 12. OEE HISTÓRICO (12 Meses)
// ==========================================

export const OEE_HISTORICO_PILOTO_DATA: OeeHistorico[] = [
  { id: "oee_p1", condominio_id: CONDOMINIO_PILOTO_DATA.id, periodo: "Ene 2026", disponibilidad: 98.2, rendimiento: 84.5, calidad: 95.0, oee: 78.8 },
  { id: "oee_p2", condominio_id: CONDOMINIO_PILOTO_DATA.id, periodo: "Feb 2026", disponibilidad: 99.1, rendimiento: 86.0, calidad: 96.2, oee: 82.0 },
  { id: "oee_p3", condominio_id: CONDOMINIO_PILOTO_DATA.id, periodo: "Mar 2026", disponibilidad: 97.4, rendimiento: 89.2, calidad: 95.8, oee: 83.2 },
  { id: "oee_p4", condominio_id: CONDOMINIO_PILOTO_DATA.id, periodo: "Abr 2026", disponibilidad: 98.8, rendimiento: 91.0, calidad: 97.0, oee: 87.2 },
  { id: "oee_p5", condominio_id: CONDOMINIO_PILOTO_DATA.id, periodo: "May 2026", disponibilidad: 99.3, rendimiento: 92.5, calidad: 98.4, oee: 90.4 },
  { id: "oee_p6", condominio_id: CONDOMINIO_PILOTO_DATA.id, periodo: "Jun 2026", disponibilidad: 99.5, rendimiento: 93.8, calidad: 98.8, oee: 92.2 }
];

export const OEE_HISTORICO_TORRE_DATA: OeeHistorico[] = [
  ...OEE_HISTORICO_PILOTO_DATA.map(o => ({ ...o, condominio_id: CONDOMINIO_TORRE_DATA.id })),
  // OEE por piso para Escenario B
  { id: "oee_f1", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_1", periodo: "Jun 2026", disponibilidad: 99.6, rendimiento: 95.0, calidad: 99.0, oee: 93.7 },
  { id: "oee_f2", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_2", periodo: "Jun 2026", disponibilidad: 98.2, rendimiento: 92.0, calidad: 97.5, oee: 88.1 },
  { id: "oee_f3", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_3", periodo: "Jun 2026", disponibilidad: 99.0, rendimiento: 94.2, calidad: 98.0, oee: 91.4 },
  { id: "oee_f10", condominio_id: CONDOMINIO_TORRE_DATA.id, piso_id: "piso_10", periodo: "Jun 2026", disponibilidad: 95.5, rendimiento: 86.4, calidad: 93.0, oee: 76.7 } // Elevado por la azotea
];

// Pareto 80/20 Incidencias Correctivas por Área (Escenario B)
export const PARETO_INCIDENCIAS_TORRE = [
  { area: "Azotea (Impermeabilización)", incidencias: 14, porcentajeAcum: 31 },
  { area: "Elevadores", incidencias: 11, porcentajeAcum: 56 },
  { area: "Agua (Hidroneumático)", incidencias: 7, porcentajeAcum: 71 },
  { area: "Cocina común", incidencias: 5, porcentajeAcum: 82 },
  { area: "Luz / Electricidad", incidencias: 4, porcentajeAcum: 91 },
  { area: "Sistemas Contra Incendios", incidencias: 2, porcentajeAcum: 96 },
  { area: "Otros", incidencias: 2, porcentajeAcum: 100 }
];

// ==========================================
// 13. LECTURAS RECIENTES DE SENSORES
// ==========================================

export const LECTURAS_SENSORES_BASE: LecturaSensor[] = [
  { id: "ls_1", activo_id: "act_p3", tipo: "vib", valor: 1.45, unidad: "mm/s", leida_en: "2026-06-25T14:30:00Z" },
  { id: "ls_2", activo_id: "act_p3", tipo: "temp", valor: 64.2, unidad: "°C", leida_en: "2026-06-25T14:30:00Z" },
  { id: "ls_3", activo_id: "act_p1", tipo: "gas", valor: 215, unidad: "ppm", leida_en: "2026-06-25T14:35:00Z" },
  { id: "ls_4", activo_id: "act_p2", tipo: "kwh", valor: 4.6, unidad: "kW", leida_en: "2026-06-25T14:40:00Z" }
];
