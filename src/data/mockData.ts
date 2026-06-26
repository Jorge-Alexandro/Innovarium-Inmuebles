import { Area, Activo, Responsable, TareaPreventiva, Presupuesto, EventoTrazabilidad } from "../types";

export const CONDOMINIO_PILOTO = {
  id: "a3b8cd9e-1234-5678-abcd-ef1234567890",
  nombre: "Condominio Las Vertientes",
  m2: 24500, // 24,500 m² de áreas comunes e instalaciones
  direccion: "Av. de los Pirules 440, Lomas de Tecamachalco, Huixquilucan, EdoMéx",
  regimen: "Régimen de Propiedad en Condominio Residencial"
};

export const AREAS_INICIALES: Area[] = [
  { id: "gas", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Gas", estado_salud: "al_dia" },
  { id: "luz", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Luz / Electricidad", estado_salud: "por_vencer" },
  { id: "agua", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Agua", estado_salud: "al_dia" },
  { id: "electro", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Electrodomésticos", estado_salud: "al_dia" },
  { id: "llaves", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Llaves / Cerrajería", estado_salud: "por_vencer" },
  { id: "banos", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Baños", estado_salud: "al_dia" },
  { id: "cocina", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Cocina", estado_salud: "vencido" },
  { id: "seguridad", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Sistemas de Seguridad", estado_salud: "al_dia" },
  { id: "incendios", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Sistemas Contra Incendios", estado_salud: "vencido" },
  { id: "amenidades", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Amenidades", estado_salud: "al_dia" },
];

export const ACTIVOS_INICIALES: Activo[] = [
  { id: "b1111111", area_id: "gas", nombre: "Tanque Estacionario de Gas 1000L", marca: "Tratogas", fecha_instalacion: "2022-04-10" },
  { id: "b2222222", area_id: "luz", nombre: "Subestación Eléctrica Principal 150KVA", marca: "Siemens", fecha_instalacion: "2021-08-15" },
  { id: "b3333333", area_id: "agua", nombre: "Bomba Hidroneumática de Presión 5HP", marca: "Altamira", fecha_instalacion: "2023-01-20" },
  { id: "b4444444", area_id: "electro", nombre: "Refrigerador Industrial Casa Club", marca: "Samsung", fecha_instalacion: "2023-05-12" },
  { id: "b5555555", area_id: "llaves", nombre: "Chapas Electromagnéticas de Accesos", marca: "Yale", fecha_instalacion: "2023-11-02" },
  { id: "b6666666", area_id: "banos", nombre: "Extractor de Humedad de Vapor", marca: "S&P", fecha_instalacion: "2022-09-18" },
  { id: "b7777777", area_id: "cocina", nombre: "Campana de Extracción y Filtro de Carbón", marca: "Inoxmédica", fecha_instalacion: "2021-12-05" },
  { id: "b8888888", area_id: "seguridad", nombre: "Grabador NVR 16 Canales 4K", marca: "Hikvision", fecha_instalacion: "2022-05-20" },
  { id: "b9999999", area_id: "incendios", nombre: "Unidad Central de Extintores PQS 9Kg", marca: "Buckeye", fecha_instalacion: "2021-11-10" },
  { id: "b0000000", area_id: "amenidades", nombre: "Sistema Solar de Calentamiento de Alberca", marca: "Heliocol", fecha_instalacion: "2023-02-14" },
];

export const RESPONSABLES_INICIALES: Responsable[] = [
  { id: "admin_1", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Laura Méndez", rol: "admin", email: "admin@lasvertientes.mx" },
  { id: "proveedor_1", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Kevin Barbosa (Hotelería+)", rol: "proveedor", email: "soporte@hoteleriamas.mx" },
  { id: "lider_1", condominio_id: CONDOMINIO_PILOTO.id, nombre: "Kevin Barbosa", rol: "lider", email: "kevin.lider@servicio.mx" },
  { id: "proveedor_gas", condominio_id: CONDOMINIO_PILOTO.id, nombre: "GasSeguro del Valle S.A.", rol: "proveedor", email: "ordenes@gasseguro.mx" },
  { id: "proveedor_luz", condominio_id: CONDOMINIO_PILOTO.id, nombre: "ElectroPro Eléctricos", rol: "proveedor", email: "asistencia@electropro.mx" },
  { id: "proveedor_seg", condominio_id: CONDOMINIO_PILOTO.id, nombre: "AlarmaTotal de México", rol: "proveedor", email: "ops@alarmatotal.mx" },
];

export const TAREAS_INICIALES: TareaPreventiva[] = [
  // Gas (Al día)
  {
    id: "t1",
    area_id: "gas",
    activo_id: "b1111111",
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
    admin_id: "admin_1",
    proveedor_id: "proveedor_gas",
    lider_id: "lider_1",
  },
  {
    id: "t2",
    area_id: "gas",
    activo_id: "b1111111",
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
    admin_id: "admin_1",
    proveedor_id: "proveedor_gas",
    lider_id: "lider_1",
  },
  // Luz / Electricidad
  {
    id: "t3",
    area_id: "luz",
    activo_id: "b2222222",
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
    admin_id: "admin_1",
    proveedor_id: "proveedor_luz",
    lider_id: "lider_1"
  },
  {
    id: "t4",
    area_id: "luz",
    activo_id: "b2222222",
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
    admin_id: "admin_1",
    proveedor_id: "proveedor_luz",
    lider_id: "lider_1"
  },
  // Agua
  {
    id: "t5",
    area_id: "agua",
    activo_id: "b3333333",
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
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  {
    id: "t6",
    area_id: "agua",
    activo_id: "b3333333",
    titulo: "Mantenimiento preventivo en bombas hidroneumáticas de presión",
    instrucciones_json: [
      "Medir amperaje y balance de fases de los tres motores de bombeo",
      "Verificar y ajustar presostatos de arranque y paro cíclico",
      "Comprobar nivel de precarga de nitrógeno en tanque precargado",
      "Engrasar chumaceras y alineación física de flecha del acoplamiento"
    ],
    frecuencia: "trimestral",
    proxima_fecha: "2026-07-10",
    estado: "programada",
    costo_estimado: 1500,
    costo_real: 1500,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  // Electrodomésticos
  {
    id: "t7",
    area_id: "electro",
    activo_id: "b4444444",
    titulo: "Inspección de refrigerador industrial y empáques magnéticos",
    instrucciones_json: [
      "Limpiar serpentín condensador trasero de pelusa y polvo",
      "Verificar que la temperatura de conservación se mantenga estable a 4°C",
      "Aplicar silicón protector en gomas magnéticas para sellado perfecto"
    ],
    frecuencia: "anual",
    proxima_fecha: "2026-09-01",
    estado: "programada",
    costo_estimado: 900,
    costo_real: null,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  // Llaves/Cerrajería
  {
    id: "t8",
    area_id: "llaves",
    activo_id: "b5555555",
    titulo: "Lubricación y alineación de chapas electromagnéticas de acceso peatonal",
    instrucciones_json: [
      "Limpiar superficies de contacto de electroimanes con alcohol isopropílico",
      "Verificar y ajustar tornillo pivote de placas flotantes de atracción",
      "Comprobar temporizador de apertura y correcto accionamiento del botón físico"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-06-26",
    estado: "en_curso",
    costo_estimado: 400,
    costo_real: null,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  // Baños
  {
    id: "t9",
    area_id: "banos",
    activo_id: "b6666666",
    titulo: "Limpieza profunda de extractor de humedad y fluxómetros de baños comunes",
    instrucciones_json: [
      "Desmontar extractor de aire de aseos comunes del área de spa",
      "Retirar acumulación grasosa de aspas de ventilación",
      "Inspeccionar diafragmas de fluxómetros WC y reponer si gotean"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-07-05",
    estado: "programada",
    costo_estimado: 700,
    costo_real: 680,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  // Cocina
  {
    id: "t10",
    area_id: "cocina",
    activo_id: "b7777777",
    titulo: "Desengrase integral de campana extractora y descarga de trampa de grasa",
    instrucciones_json: [
      "Retirar filtros de lamas de acero inoxidable",
      "Lavar filtros con agente desengrasante alcalino diluido en agua caliente",
      "Succionar sedimentos grasos de la trampa interceptora de polietileno",
      "Agregar bacterias digestoras de materia orgánica para control de olores"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-06-12",
    estado: "vencida",
    costo_estimado: 1100,
    costo_real: null,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  // Seguridad
  {
    id: "t11",
    area_id: "seguridad",
    activo_id: "b8888888",
    titulo: "Pruebas de canal de video CCTV de cámaras perimetrales y respaldo NVR",
    instrucciones_json: [
      "Limpiar calotas de cristal de cámaras exteriores expuestas a polvo",
      "Verificar canalización mecánica de cableado UTP del circuito",
      "Validar bitácora de almacenamiento local asegurando 30 días de grabación continua",
      "Probar respaldo de energía UPS en caso de pérdida súbita de luz"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-07-08",
    estado: "programada",
    costo_estimado: 1200,
    costo_real: 1200,
    admin_id: "admin_1",
    proveedor_id: "proveedor_seg",
    lider_id: "lider_1"
  },
  // Sistemas de Incendio
  {
    id: "t12",
    area_id: "incendios",
    activo_id: "b9999999",
    titulo: "Servicio de recarga anual y pesaje de cilindros extintores de PQS",
    instrucciones_json: [
      "Pesar cada cilindro y confirmar retención del peso total requerido",
      "Revisar el manómetro confirmando que la aguja repose en zona de operación verde",
      "Inspeccionar manguera y boquilla de disparo buscando rupturas o nidos de insectos",
      "Reemplazar collarín plástico de identificación anual y actualizar etiqueta holográfica"
    ],
    frecuencia: "anual",
    proxima_fecha: "2026-06-05",
    estado: "vencida",
    costo_estimado: 2400,
    costo_real: null,
    admin_id: "admin_1",
    proveedor_id: "proveedor_seg",
    lider_id: "lider_1"
  },
  {
    id: "t13",
    area_id: "incendios",
    activo_id: "b9999999",
    titulo: "Prueba integral de sensores fotoeléctricos de humo en pasillos",
    instrucciones_json: [
      "Estimular cada sensor con humo sintético certificado en lata",
      "Registrar respuesta de sonido e iluminación del panel central contra incendios",
      "Validar transmisión telefónica de eventos de alarma a cuerpo de bomberos local"
    ],
    frecuencia: "semestral",
    proxima_fecha: "2026-07-20",
    estado: "programada",
    costo_estimado: 1600,
    costo_real: null,
    admin_id: "admin_1",
    proveedor_id: "proveedor_seg",
    lider_id: "lider_1"
  },
  // Amenidades
  {
    id: "t14",
    area_id: "amenidades",
    activo_id: "b0000000",
    titulo: "Evaluación y retrolavado en filtros de arena sílica de alberca común",
    instrucciones_json: [
      "Medir niveles químicos de pH (rango 7.2-7.6) y cloro libre (1-3 ppm)",
      "Realizar ciclo de retrolavado (backwash) del sistema de filtrado de arena sílica",
      "Limpiar canastilla atrapa-hojas de la bomba pre-filtro de recirculación"
    ],
    frecuencia: "mensual",
    proxima_fecha: "2026-07-02",
    estado: "programada",
    costo_estimado: 1900,
    costo_real: 1900,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
  {
    id: "t15",
    area_id: "amenidades",
    activo_id: "b0000000",
    titulo: "Ajuste de asadores comunes y sellante protector de intemperie",
    instrucciones_json: [
      "Limpieza abrasiva con cepillo de alambre y desatascado de coladera pluvial",
      "Revisión y torque en tornillería inoxidable de pérgola de madera exterior",
      "Aplicación de sellador protector de poro abierto repelente al agua de lluvia"
    ],
    frecuencia: "trimestral",
    proxima_fecha: "2026-08-09",
    estado: "programada",
    costo_estimado: 600,
    costo_real: null,
    admin_id: "admin_1",
    proveedor_id: "proveedor_1",
    lider_id: "lider_1"
  },
];

export const PRESUPUESTOS_INICIALES: Presupuesto[] = [
  { id: "p1", condominio_id: CONDOMINIO_PILOTO.id, area_id: "gas", anio: 2026, monto_presupuestado: 14000, monto_gastado: 11200 },
  { id: "p2", condominio_id: CONDOMINIO_PILOTO.id, area_id: "luz", anio: 2026, monto_presupuestado: 22000, monto_gastado: 18400 },
  { id: "p3", condominio_id: CONDOMINIO_PILOTO.id, area_id: "agua", anio: 2026, monto_presupuestado: 18000, monto_gastado: 16100 },
  { id: "p4", condominio_id: CONDOMINIO_PILOTO.id, area_id: "electro", anio: 2026, monto_presupuestado: 8000, monto_gastado: 5200 },
  { id: "p5", condominio_id: CONDOMINIO_PILOTO.id, area_id: "llaves", anio: 2026, monto_presupuestado: 6000, monto_gastado: 4800 },
  { id: "p6", condominio_id: CONDOMINIO_PILOTO.id, area_id: "banos", anio: 2026, monto_presupuestado: 9000, monto_gastado: 8650 },
  { id: "p7", condominio_id: CONDOMINIO_PILOTO.id, area_id: "cocina", anio: 2026, monto_presupuestado: 11000, monto_gastado: 12300 }, // con sobregiro
  { id: "p8", condominio_id: CONDOMINIO_PILOTO.id, area_id: "seguridad", anio: 2026, monto_presupuestado: 16000, monto_gastado: 13900 },
  { id: "p9", condominio_id: CONDOMINIO_PILOTO.id, area_id: "incendios", anio: 2026, monto_presupuestado: 13000, monto_gastado: 6400 },
  { id: "p10", condominio_id: CONDOMINIO_PILOTO.id, area_id: "amenidades", anio: 2026, monto_presupuestado: 19000, monto_gastado: 17500 },
];

export const EVOLUCION_TRAZABILIDAD_BASE: EventoTrazabilidad[] = [
  { id: "e1", tarea_id: "t1", accion: "Mantenimiento planificado y asignado al calendario preventivo anual", actor: "Laura Méndez", fecha: "2026-06-01" },
  { id: "e2", tarea_id: "t1", accion: "Notificación programada por correo enviada a los tres responsables", actor: "Sistema Automático", fecha: "2026-06-02" },
  { id: "e3", tarea_id: "t1", accion: "Orden de compra aprobada con costo estimado de $1,800 MXN", actor: "Laura Méndez", fecha: "2026-06-14" },
  { id: "e4", tarea_id: "t1", accion: "Carga de comprobantes de hermeticidad y finalización física", actor: "GasSeguro del Valle S.A.", fecha: "2026-06-15" },
  { id: "e5", tarea_id: "t1", accion: "Dictamen de gas cargado a Supabase Storage con nota e informe", actor: "Kevin Barbosa", fecha: "2026-06-16" },

  { id: "e6", tarea_id: "t10", accion: "Mantenimiento planificado automático mensual", actor: "Sistema Automático", fecha: "2026-06-01" },
  { id: "e7", tarea_id: "t10", accion: "El mantenimiento rebasó el límite de fecha asignada y el estado cambió a Vencido", actor: "Monitoreo del Sistema", fecha: "2026-06-12" },

  { id: "e8", tarea_id: "t12", accion: "Extintores pendientes de recarga. Alerta reportada a Administración", actor: "Kevin Barbosa", fecha: "2026-06-05" },
  { id: "e9", tarea_id: "t12", accion: "Fecha de vigencia superada. Estado cambiado a Vencido. Alerta en panel principal", actor: "Monitoreo del Sistema", fecha: "2026-06-06" },
];
