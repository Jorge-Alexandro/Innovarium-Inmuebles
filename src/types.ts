/**
 * Types & Enums for Inovarium Inmuebles
 * Coincide estrictamente con el modelo de datos de Supabase para los Escenarios A y B.
 */

export interface Condominio {
  id: string;
  nombre: string;
  m2: number;
  direccion: string;
  regimen: string;
  tipo: 'apartamento' | 'edificio' | 'plaza_comercial' | 'parque_industrial';
  num_pisos: number;
  tarifa_kwh: number;
  meta_oee: number;
}

export interface Piso {
  id: string;
  condominio_id: string;
  numero: number;
  nombre: string;
}

export interface Departamento {
  id: string;
  piso_id: string;
  numero: string;
  tipo: 'residencial' | 'oficina' | 'comercial' | 'industrial';
}

export type EstadoSalud = 'al_dia' | 'por_vencer' | 'vencido';
export type CategoriaArea = 'basica' | 'critica' | 'normativa';

export interface Area {
  id: string;
  condominio_id: string;
  piso_id?: string | null;
  nombre: string;
  icono?: string;
  estado_salud: EstadoSalud;
  categoria: CategoriaArea;
}

export interface Activo {
  id: string;
  area_id: string;
  piso_id?: string | null;
  departamento_id?: string | null;
  nombre: string;
  marca: string;
  modelo?: string;
  numero_serie?: string;
  fecha_instalacion: string;
  vida_util_dias?: number;
  estado?: 'operativo' | 'falla_parcial' | 'critico' | 'fuera_servicio';
  notas?: string;
  mtbf_horas?: number; // Para Escenario B
}

export type EstadoTarea = 'programada' | 'en_curso' | 'completada' | 'vencida' | 'urgente';
export type FrecuenciaTarea = 'diaria' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface TareaPreventiva {
  id: string;
  area_id: string;
  activo_id: string;
  titulo: string;
  instrucciones_json: string[]; // checklist de pasos
  frecuencia: FrecuenciaTarea;
  proxima_fecha: string;
  estado: EstadoTarea;
  costo_estimado: number;
  costo_real: number | null;
  admin_id: string;
  proveedor_id: string;
  lider_id: string;
  tecnico_area_id?: string | null; // Escenario B
  google_event_id?: string;
  generada_por_rul?: boolean;
}

export interface Evidencia {
  id: string;
  tarea_id: string;
  archivo_url: string;
  nota: string;
  creada_en: string;
  creada_por: string;
}

export type RolResponsable = 'admin' | 'proveedor' | 'lider' | 'superintendente' | 'tecnico_area';

export interface Responsable {
  id: string;
  condominio_id: string;
  nombre: string;
  rol: RolResponsable;
  email: string;
  telefono?: string;
  phone_whatsapp?: string;
  activo: boolean;
}

export interface Presupuesto {
  id: string;
  condominio_id: string;
  area_id: string;
  anio: number;
  monto_presupuestado: number;
  monto_gastado: number;
}

export interface EventoTrazabilidad {
  id: string;
  tarea_id: string;
  accion: string;
  actor: string;
  fecha: string;
}

// Predictivo / IoT RUL Types
export interface LecturaSensor {
  id: string;
  activo_id: string;
  piso_id?: string | null;
  tipo: 'vib' | 'temp' | 'flujo' | 'gas' | 'ph' | 'kwh' | 'co' | 'presion' | 'co2';
  valor: number;
  unidad: string;
  leida_en: string;
}

export interface ConfigRul {
  id: string;
  activo_id: string;
  tipo_sensor: string;
  base_media: number;
  base_sd: number;
  umbral_z_warn: number;
  umbral_z_crit: number;
  mtbf_horas: number;
}

export interface RulResultado {
  id: string;
  activo_id: string;
  riesgo: number; // 0-100
  rul_dias: number;
  z_score_max: number;
  calculado_en: string;
}

// Energía
export interface LecturaEnergia {
  id: string;
  area_id: string;
  piso_id?: string | null;
  kwh: number;
  costo_mxn: number;
  co2_kg: number;
  periodo_inicio: string;
  periodo_fin: string;
}

// Fondo de Reserva (Escenario B)
export interface FondoReserva {
  id: string;
  condominio_id: string;
  area_id: string;
  saldo_actual: number;
  contribucion_mensual: number;
  meta_mxn: number;
  activo_objetivo: string;
  fecha_meta_estimada: string;
}

// OEE Historico
export interface OeeHistorico {
  id: string;
  condominio_id: string;
  piso_id?: string | null; // NULL = global, NOT NULL = por piso
  periodo: string; // YYYY-MM-DD o nombre del mes
  disponibilidad: number;
  rendimiento: number;
  calidad: number;
  oee: number;
  pareto_top3_areas?: { area: string; pct_incidencias: number }[];
  mtbf_promedio_horas?: number;
}

// Incidencias correctivas para cálculo de Calidad en OEE
export interface IncidenciaCorrectiva {
  id: string;
  area_id: string;
  piso_id?: string | null;
  descripcion: string;
  reportada_en: string;
  resuelta_en: string;
  costo_real: number;
  tarea_id_generada?: string;
}

// Manifest de Metadata-Driven UI (Módulo 11)
export interface AppTheme {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  logoUrl?: string;
}

export interface Manifest {
  companyId: string;
  scenario: 'apartamento' | 'edificio';
  theme: AppTheme;
  navigation: string[];
  features: {
    enableIoTIntegration: boolean;
    enableMultiPiso: boolean;
    enableFondoReserva: boolean;
    enablePareto: boolean;
    enableAutoCalendarSync: boolean;
    enableWhatsApp: boolean;
    enableIsometricView?: boolean;
  };
}
