import React, { useState } from "react";
import { TareaPreventiva, Area, Responsable, EventoTrazabilidad } from "../types";
import { BRAND } from "../config/brand";
import { 
  X, 
  CheckSquare, 
  Square, 
  Calendar, 
  DollarSign, 
  User, 
  Wrench, 
  ShieldAlert, 
  BookOpen, 
  FileText, 
  Upload, 
  Activity,
  Award,
  BellRing,
  ExternalLink,
  Mail
} from "lucide-react";
import { syncToGoogleCalendar, sendReminderEmail } from "../services/integrations";

interface TareaModalProps {
  tarea: TareaPreventiva;
  areas: Area[];
  responsables: Responsable[];
  trazabilidad: EventoTrazabilidad[];
  onClose: () => void;
  onUpdateTarea: (updated: TareaPreventiva) => void;
  onAddTrazabilidad: (evento: EventoTrazabilidad) => void;
  onTriggerToast: (message: string) => void;
}

export default function TareaModal({ 
  tarea, 
  areas, 
  responsables, 
  trazabilidad, 
  onClose, 
  onUpdateTarea, 
  onAddTrazabilidad, 
  onTriggerToast 
}: TareaModalProps) {
  
  // Local state for interactive steps checklist
  const [pasosCompletados, setPasosCompletados] = useState<{ [key: number]: boolean }>(
    tarea.instrucciones_json.reduce((acc, _, index) => {
      // Simulate some steps checked if task was already marked or has evidence
      acc[index] = tarea.costo_real !== null;
      return acc;
    }, {} as { [key: number]: boolean })
  );

  // Evidence upload simulation state
  const [notaEvidencia, setNotaEvidencia] = useState("");
  const [cargandoEvidencia, setCargandoEvidencia] = useState(false);
  const [evidenciaCargada, setEvidenciaCargada] = useState<any>(
    tarea.costo_real !== null 
      ? { nota: "Evidencia de inspección física cargada y auditada por dirección." }
      : null
  );

  const [nuevoCostoReal, setNuevoCostoReal] = useState(tarea.costo_real?.toString() || "");
  const [nuevoEstado, setNuevoEstado] = useState(tarea.estado);

  const areaObj = areas.find(a => a.id === tarea.area_id);
  const adminObj = responsables.find(r => r.id === tarea.admin_id) || responsables[0];
  const proveedorObj = responsables.find(r => r.id === tarea.proveedor_id) || responsables[1];
  const liderObj = responsables.find(r => r.id === tarea.lider_id) || responsables[2];

  const tareaTrazabilidad = trazabilidad.filter(tg => tg.tarea_id === tarea.id);

  const handleStepToggle = (index: number) => {
    const next = { ...pasosCompletados, [index]: !pasosCompletados[index] };
    setPasosCompletados(next);
    
    // Add a trace log for the step completion
    const stepName = tarea.instrucciones_json[index];
    const accAct = next[index] ? "Completó paso" : "Desmarcó paso";
    const nuevoEvento: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: tarea.id,
      accion: `${accAct}: "${stepName}"`,
      actor: "Kevin Barbosa (Líder)",
      fecha: new Date().toLocaleDateString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit" })
    };
    
    onAddTrazabilidad(nuevoEvento);
  };

  const handleSubirEvidencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notaEvidencia) {
      onTriggerToast("⚠️ Favor de escribir una nota de prueba de realización.");
      return;
    }

    setCargandoEvidencia(true);
    
    setTimeout(() => {
      setEvidenciaCargada({
        nota: notaEvidencia,
        fecha: new Date().toLocaleDateString("es-MX")
      });

      // Update task real cost and status to represent actual completion
      const finalCostReal = nuevoCostoReal ? parseFloat(nuevoCostoReal) : tarea.costo_estimado;
      const updatedTask: TareaPreventiva = {
        ...tarea,
        costo_real: finalCostReal,
        estado: "programada" // Marked complete or normal
      };

      onUpdateTarea(updatedTask);

      // Add audit tracing
      const trace: EventoTrazabilidad = {
        id: `tra_${Math.random().toString(36).substring(2, 9)}`,
        tarea_id: tarea.id,
        accion: `Evidencia de Realización y Nota cargada a Supabase Storage: "${notaEvidencia}". Costo real fijado en: $${finalCostReal} MXN.`,
        actor: "Kevin Barbosa",
        fecha: new Date().toLocaleDateString("es-MX")
      };

      onAddTrazabilidad(trace);
      setCargandoEvidencia(false);
      onTriggerToast("✅ Evidencia guardada en Supabase Storage y base de datos.");
    }, 1200);
  };

  const handleManualStatusChange = (status: any) => {
    setNuevoEstado(status);
    const updated: TareaPreventiva = {
      ...tarea,
      estado: status
    };
    onUpdateTarea(updated);

    const trace: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: tarea.id,
      accion: `Se actualizó el estado operacional a "${status.toUpperCase()}"`,
      actor: "Laura Méndez (Admin)",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    onAddTrazabilidad(trace);
    onTriggerToast(`Estatus actualizado a: ${status.toUpperCase()}`);
  };

  // Google Calendar Integration Toggle
  const handleSyncGCal = async () => {
    onTriggerToast("Enviando evento a Google Calendar...");
    const res = await syncToGoogleCalendar(tarea);
    if (res.success) {
      onTriggerToast(`Sincronizado con Google Calendar. ID Evento: ${res.eventId}`);
      
      const trace: EventoTrazabilidad = {
        id: `tra_${Math.random().toString(36).substring(2, 9)}`,
        tarea_id: tarea.id,
        accion: `Sincronización manual de agenda a Google Calendar (ID: ${res.eventId})`,
        actor: "Laura Méndez",
        fecha: new Date().toLocaleDateString("es-MX")
      };
      onAddTrazabilidad(trace);
    }
  };

  // Mail reminder Trigger Toggle
  const handleMailTrigger = async () => {
    onTriggerToast("Disparando recordatorio por correo...");
    const res = await sendReminderEmail(tarea, [adminObj.email, proveedorObj.email, liderObj.email]);
    if (res.success) {
      onTriggerToast("Recordatorio enviado a los 3 responsables.");
      
      const trace: EventoTrazabilidad = {
        id: `tra_${Math.random().toString(36).substring(2, 9)}`,
        tarea_id: tarea.id,
        accion: `Recordatorio automático enviado a ${proveedorObj.nombre}, ${liderObj.nombre} y ${adminObj.nombre}`,
        actor: "Sistema Resend",
        fecha: new Date().toLocaleDateString("es-MX")
      };
      onAddTrazabilidad(trace);
    }
  };

  const formatCurrency = (val: number | null) => {
    if (val === null) return "Pendiente";
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/50 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-gray-100 max-h-[92vh] flex flex-col overflow-hidden animate-fade-in">
        
        {/* Cabecera pegajosa */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green-dark bg-brand-green-soft px-2.5 py-0.5 rounded-full font-mono border border-brand-green/20">
                {areaObj?.nombre || tarea.area_id}
              </span>
              <span className={`text-[9.5px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full`}>
                Frecuencia: {tarea.frecuencia}
              </span>
            </div>
            <h2 className="text-lg font-black text-neutral-800 mt-1.5 leading-tight">{tarea.titulo}</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-100 rounded-lg text-gray-400 hover:text-neutral-700 transition shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo Scrolleable */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-neutral-700">
          
          {/* Estatus Operacionales en Fila */}
          <div className="bg-neutral-50 p-4 rounded-xl border border-gray-150 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Semáforo</span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  tarea.estado === "vencida" ? "bg-[#DC2626]" : tarea.estado === "en_curso" ? "bg-[#D97706]" : "bg-brand-green"
                }`} />
                <span className="text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  {tarea.estado === "vencida" ? "Vencida (Retrasada)" : tarea.estado === "en_curso" ? "Por Vencer (En curso)" : "Al día (Programada)"}
                </span>
              </div>
            </div>

            <div className="flex gap-1 font-bold">
              <button 
                onClick={() => handleManualStatusChange('programada')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${tarea.estado === 'programada' ? 'bg-brand-green text-white' : 'bg-neutral-200/60'}`}
              >
                Activa
              </button>
              <button 
                onClick={() => handleManualStatusChange('en_curso')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${tarea.estado === 'en_curso' ? 'bg-[#D97706] text-white' : 'bg-neutral-200/60'}`}
              >
                En Curso
              </button>
              <button 
                onClick={() => handleManualStatusChange('vencida')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${tarea.estado === 'vencida' ? 'bg-[#DC2626] text-white' : 'bg-neutral-200/60'}`}
              >
                Vencida
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* INSTRUCCIONES CHECKLIST */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={13} className="text-brand-green" /> Checklist Operativo (Preventivo)
              </h3>
              <p className="text-[10px] text-gray-400 font-normal leading-relaxed">Cada tarea exige cumplimiento estricto. El Líder de Mantenimiento debe auditar los puntos de inspección.</p>
              
              <div className="space-y-2 pt-1">
                {tarea.instrucciones_json.map((paso, index) => {
                  const completed = pasosCompletados[index];
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleStepToggle(index)}
                      className="w-full text-left p-3.5 rounded-xl border border-gray-100 hover:bg-neutral-50/50 flex items-start gap-3 transition"
                    >
                      <span className="shrink-0 mt-0.5" style={{ color: BRAND.colors.greenText }}>
                        {completed ? <CheckSquare size={16} /> : <Square size={16} className="text-gray-300" />}
                      </span>
                      <span className={`text-[11px] font-medium leading-normal ${completed ? 'line-through text-gray-400' : 'text-neutral-700'}`}>
                        {paso}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RESPONSABLES CLAROS */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <User size={13} className="text-brand-green-dark" /> Trazabilidad de Responsables
              </h3>
              <p className="text-[10px] text-gray-400 font-normal leading-relaxed">Se definen tres roles estratégicos para asegurar la transparencia e impedir fallas desmedidas.</p>
              
              <div className="space-y-2 pt-1.5">
                {[
                  { role: "Administrador (Asamblea)", obj: adminObj, desc: "Aprobador de cotizaciones y auditor" },
                  { role: "Proveedor (Socio Técnico)", obj: proveedorObj, desc: "Garante de la realización especializada" },
                  { role: "Líder de Mantenimiento", obj: liderObj, desc: "Tallerista y verificador residente" }
                ].map((resp, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-neutral-50/50 rounded-xl border border-neutral-100/60">
                    <span className="p-1.5 bg-white border border-gray-100 rounded-lg text-neutral-600 self-start">
                      <User size={14} />
                    </span>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 tracking-wider uppercase block">{resp.role}</span>
                      <p className="text-xs font-bold text-neutral-800 mt-0.5">{resp.obj.nombre}</p>
                      <span className="text-[10px] text-gray-400 block font-normal">{resp.desc} · {resp.obj.email}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* PRESUPUESTO FINANZAS */}
          <div className="grid grid-cols-2 gap-4 pb-1">
            <div className="p-3 bg-neutral-50 rounded-xl border border-gray-100 text-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Gasto Estimado</span>
              <p className="text-base font-black text-neutral-800 mt-1">{formatCurrency(tarea.costo_estimado)}</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-gray-100 text-center">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">Gasto Realizado</span>
              <p className="text-base font-black text-brand-green-dark mt-1">{formatCurrency(tarea.costo_real)}</p>
            </div>
          </div>

          {/* SUBIDA DE EVIDENCIA EN SUPABASE STORAGE */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Upload size={13} className="text-brand-green-dark" /> Evidencia en Supabase Storage
            </h3>
            
            {evidenciaCargada ? (
              <div className="p-4 bg-brand-green-soft border border-brand-green/20 rounded-xl space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-brand-green-dark">
                  <Award size={14} /> Prueba cargada y validada en el repositorio del Condominio.
                </div>
                <p className="text-neutral-600 italic">" {evidenciaCargada.nota} "</p>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 border-t border-green-100/50 font-mono">
                  <span>URL: https://supabase.storage/ lasvertientes-evidencia...</span>
                  <span>Auditado: {evidenciaCargada.fecha || new Date().toLocaleDateString("es-MX")}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubirEvidencia} className="space-y-3 bg-neutral-50/20 p-4 border border-dashed border-gray-250 rounded-xl">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-1">Costo Real Final en MXN ($)</label>
                  <input 
                    type="number" 
                    value={nuevoCostoReal}
                    onChange={e => setNuevoCostoReal(e.target.value)}
                    placeholder={tarea.costo_estimado.toString()}
                    className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-700 mb-1">Nota de Prueba de Realización *</label>
                  <input 
                    type="text" 
                    required
                    value={notaEvidencia}
                    onChange={e => setNotaEvidencia(e.target.value)}
                    placeholder="Escribe la nota de entrega, ej. Filtros renovados e inspección visual aprobada por Carlos."
                    className="w-full bg-white border border-gray-200 p-2.5 rounded-lg text-xs focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={cargandoEvidencia}
                  className="w-full text-neutral-850 bg-neutral-100 border border-gray-200 hover:bg-neutral-200/50 transition font-bold p-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5"
                >
                  <Upload size={14} /> {cargandoEvidencia ? "Subiendo archivo..." : "Subir archivo de prueba de realización"}
                </button>
              </form>
            )}
          </div>

          {/* HISTORIAL (TIMELINE) DE TRAZABILIDAD */}
          <div className="pt-2">
            <h3 className="font-extrabold text-neutral-800 text-[11px] uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <Activity size={13} className="text-brand-green font-light" /> Historial de Trazabilidad (Timeline)
            </h3>
            
            <div className="border-l-2 border-gray-100 ml-2.5 pl-5 space-y-4">
              {tareaTrazabilidad.length === 0 ? (
                <p className="text-[10px] text-gray-400">Sin registros de auditoría aún en esta tarea.</p>
              ) : (
                tareaTrazabilidad.map((trObj, idx) => (
                  <div key={trObj.id} className="relative">
                    {/* Circle marker */}
                    <span className="absolute -left-[27px] top-1 w-3 h-3 rounded-full border border-white bg-brand-green flex items-center justify-center" />
                    <div>
                      <p className="text-[11px] font-bold text-neutral-700 leading-normal">{trObj.accion}</p>
                      <span className="text-[9.5px] text-gray-400 mt-1 block font-normal">
                        Actor: {trObj.actor} • Registrado el: {trObj.fecha}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Footer con integraciones inmediatas */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-neutral-50">
          <div className="flex gap-2">
            <button
              onClick={handleSyncGCal}
              title="Sincronizar Google Calendar"
              className="px-3 py-2.5 border border-gray-250 bg-white hover:bg-neutral-50 text-neutral-700/85 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <ExternalLink size={12} /> Sync Google Calendar
            </button>
            <button
              onClick={handleMailTrigger}
              title="Notificar Responsables por Mail"
              className="px-3 py-2.5 border border-gray-250 bg-white hover:bg-neutral-50 text-neutral-700/85 text-[11px] font-bold rounded-lg transition flex items-center gap-1.5"
            >
              <Mail size={12} /> Notificar Mail (Resend)
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-white font-bold rounded-lg text-[11px] shadow-sm hover:opacity-90 transition"
            style={{ background: BRAND.colors.ink }}
          >
            Cerrar Detalles
          </button>
        </div>

      </div>
    </div>
  );
}
