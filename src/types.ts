/**
 * Types & Enums for Inovarium Inmuebles
 * Coincide estrictamente con el modelo de datos de Supabase.
 */

export interface Condominio {
  id: string;
  nombre: string;
  m2: number;
  direccion: string;
  regimen: string;
}

export type EstadoSalud = 'al_dia' | 'por_vencer' | 'vencido';

export interface Area {
  id: string;
  condominio_id: string;
  nombre: string;
  estado_salud: EstadoSalud;
}

export interface Activo {
  id: string;
  area_id: string;
  nombre: string;
  marca: string;
  fecha_instalacion: string;
}

export type EstadoTarea = 'programada' | 'en_curso' | 'completada' | 'vencida';
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
}

export interface Evidencia {
  id: string;
  tarea_id: string;
  archivo_url: string;
  nota: string;
  creada_en: string;
  creada_por: string;
}

export type RolResponsable = 'admin' | 'proveedor' | 'lider';

export interface Responsable {
  id: string;
  condominio_id: string;
  nombre: string;
  rol: RolResponsable;
  email: string;
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
