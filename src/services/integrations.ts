/**
 * Integraciones para Inovarium Inmuebles.
 * Contiene las firmas requeridas del MVP para sincronización de Google Calendar y envío de correos,
 * listas para producción bajo Supabase Edge Functions, Resend u OAuth.
 */

import { TareaPreventiva } from "../types";

/**
 * Sincroniza una tarea de mantenimiento preventivo con la API de Google Calendar.
 * @param task La tarea preventiva a agregar o actualizar.
 * @returns Promesa que emula el resultado de la sincronización.
 */
export async function syncToGoogleCalendar(task: TareaPreventiva): Promise<{ success: boolean; eventId?: string; error?: string }> {
  console.log(`[Google Calendar Sync] Iniciando sincronización para: "${task.titulo}"`);
  
  // TODO REAL COUPLING DE INTEGRACIÓN:
  // 1. Obtener el token OAuth de Google del responsable (mantenido en Supabase Auth o metadata).
  // 2. Hacer una petición POST a https://www.googleapis.com/calendar/v3/calendars/primary/events
  // 3. Pasar el payload con summary, description (instrucciones_json), start/end dates y asistentes.
  
  await new Promise((resolve) => setTimeout(resolve, 600)); // Emular latencia de red

  return {
    success: true,
    eventId: `gcal_${Math.random().toString(36).substring(2, 9)}`,
  };
}

/**
 * Dispara un correo de recordatorio a los 3 responsables (Administrador, Proveedor, Mantenimiento)
 * utilizando el servicio de correo (tipo Resend o similar).
 * @param task La tarea preventiva que requiere atención inmediata.
 * @param emails Lista opcional de correos destinatarios.
 * @returns Promesa con el estatus del envío.
 */
export async function sendReminderEmail(
  task: TareaPreventiva,
  emails: string[] = ["admin@lasvertientes.mx", "proveedor@gasseguro.mx", "carlos.lider@servicio.mx"]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`[Resend Email Trigger] Enviando recordatorio a ${emails.join(", ")} para la tarea: "${task.titulo}"`);

  // TODO REAL COUPLING DE INTEGRACIÓN:
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'Inovarium Inmuebles <alertas@inovarium.com.mx>',
  //   to: emails,
  //   subject: `⚠️ Alerta de Mantenimiento Preventivo: ${task.titulo}`,
  //   html: `<h1>Recordatorio de Mantenimiento</h1><p>Vence el: ${task.proxima_fecha}</p>`
  // });

  await new Promise((resolve) => setTimeout(resolve, 500)); // Emular latencia de red

  return {
    success: true,
    messageId: `msg_${Math.random().toString(36).substring(2, 9)}`,
  };
}
