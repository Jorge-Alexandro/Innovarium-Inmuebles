import React, { useState } from "react";
import { TareaPreventiva, Area } from "../types";
import { BRAND } from "../config/brand";
import { syncToGoogleCalendar, sendReminderEmail } from "../services/integrations";
import { 
  Calendar, 
  Search, 
  Mail, 
  Info,
  CalendarDays,
  BellRing,
  Filter,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Clock
} from "lucide-react";

interface CalendarioProps {
  tareas: TareaPreventiva[];
  areas: Area[];
  onSelectTarea: (tarea: TareaPreventiva) => void;
  onTriggerToast: (message: string) => void;
}

export default function Calendario({ tareas, areas, onSelectTarea, onTriggerToast }: CalendarioProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAreaFilter, setSelectedAreaFilter] = useState("todos");
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [selectedView, setSelectedView] = useState<'lista' | 'mensual'>('lista');

  // Filter tasks based on search and selected area
  const filteredTareas = tareas.filter(t => {
    const matchesSearch = t.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesArea = selectedAreaFilter === "todos" || t.area_id === selectedAreaFilter;
    return matchesSearch && matchesArea;
  });

  // Group tasks by Month for neat chronological view
  const groupTasksByMonth = (tasks: TareaPreventiva[]) => {
    const sorted = [...tasks].sort((a, b) => new Date(a.proxima_fecha).getTime() - new Date(b.proxima_fecha).getTime());
    const groups: { [key: string]: TareaPreventiva[] } = {};
    
    sorted.forEach(t => {
      // Format as "Enero 2026"
      const dateVal = new Date(t.proxima_fecha + "T00:00:00");
      const monthYear = dateVal.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
      const capitalized = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
      
      if (!groups[capitalized]) {
        groups[capitalized] = [];
      }
      groups[capitalized].push(t);
    });
    
    return groups;
  };

  const tasksByMonth = groupTasksByMonth(filteredTareas);

  // Sync action handler
  const handleSyncToGoogle = async (task: TareaPreventiva, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening the modal
    onTriggerToast(`Sincronizando "${task.titulo}" con Google Calendar...`);
    const result = await syncToGoogleCalendar(task);
    if (result.success) {
      onTriggerToast(`✅ Éxito: Sincronizado en Google Calendar con ID: ${result.eventId}`);
      const log = `[${new Date().toLocaleTimeString("es-MX")}] Sincronizado: "${task.titulo}" (${result.eventId})`;
      setSyncLogs(prev => [log, ...prev]);
    } else {
      onTriggerToast(`❌ Error: Sincronización fallida`);
    }
  };

  // Notification action handler
  const handleSendReminder = async (task: TareaPreventiva, e: React.MouseEvent) => {
    e.stopPropagation();
    onTriggerToast(`Disparando correos de recordatorio para "${task.titulo}"...`);
    const result = await sendReminderEmail(task);
    if (result.success) {
      onTriggerToast(`📨 Recordatorio enviado a Administrador, Proveedor y Líder de Mantenimiento`);
      const log = `[${new Date().toLocaleTimeString("es-MX")}] Correo enviado: "${task.titulo}" (${result.messageId})`;
      setSyncLogs(prev => [log, ...prev]);
    } else {
      onTriggerToast(`❌ Error: Fallo en envío de correos`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-extrabold text-neutral-800">Calendario Preventivo</h1>
        <p className="text-gray-500 text-sm mt-1">
          Planifica de forma proactiva. Sincroniza tareas del mes en la cuenta de Google Calendar de administración y despacha correos automáticos.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* AGENDA - MAIN VIEW */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* BARRA DE FILTROS */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-60">
              <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                placeholder="Buscar tareas..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-8 border border-gray-200 p-2.5 rounded-lg bg-neutral-50/50 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto items-center">
              <Filter size={14} className="text-gray-400" />
              <select
                value={selectedAreaFilter}
                onChange={e => setSelectedAreaFilter(e.target.value)}
                className="text-xs bg-white border border-gray-200 p-2.5 rounded-lg w-full sm:w-40 focus:outline-none"
              >
                <option value="todos">Todas las Áreas</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* LISTA DE MANTENIMIENTOS CRONOLÓGICOS */}
          {Object.keys(tasksByMonth).length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
              <Calendar size={36} className="text-gray-300 mx-auto" />
              <p className="text-sm font-semibold text-gray-500 mt-3">No hay tareas programadas con los filtros actuales</p>
              <p className="text-xs text-gray-400 mt-1">Intenta ajustando el buscador o la categoría.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(tasksByMonth).map(([month, monthTasks]) => (
                <div key={month} className="space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">{month}</h3>
                  
                  <div className="space-y-2">
                    {monthTasks.map(t => {
                      const areaObj = areas.find(a => a.id === t.area_id);
                      const isVencida = t.estado === "vencida";
                      const isEnCurso = t.estado === "en_curso";
                      // Extract day and month short
                      const dateParts = t.proxima_fecha.split("-");
                      const dayStr = dateParts[2] || "01";
                      return (
                        <div 
                          key={t.id}
                          onClick={() => onSelectTarea(t)}
                          className="bg-white p-3.5 rounded-xl border border-gray-100 hover:border-gray-200/80 hover:shadow-sm transition cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          {/* FECHA INSIGNIA */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 bg-neutral-50 border border-gray-100 rounded-lg flex flex-col items-center justify-center font-bold">
                              <span className="text-sm text-neutral-800 leading-none">{dayStr}</span>
                              <span className="text-[9px] uppercase text-gray-400 mt-0.5 leading-none">DÍA</span>
                            </div>

                            {/* DETALLES */}
                            <div className="min-w-0 text-left">
                              <h4 className="text-xs font-bold text-neutral-800 group-hover:text-brand-green transition truncate pr-1">
                                {t.titulo}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-medium">
                                  {areaObj?.nombre || t.area_id}
                                </span>
                                <span className="text-[9px] text-gray-300">•</span>
                                <span className="text-[10px] text-gray-400 font-semibold uppercase">{t.frecuencia}</span>
                              </div>
                            </div>
                          </div>

                           {/* ACCIONES DE INTEGRACIÓN */}
                          <div className="flex items-center gap-2 shrink-0">
                            
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mr-1 hidden sm:inline-block ${
                              isVencida ? 'bg-red-50 text-[#DC2626]' : isEnCurso ? 'bg-emerald-50 text-[#10B981]' : 'bg-brand-green-soft text-brand-green-dark border border-brand-green/10'
                            }`}>
                              {isVencida ? 'Vencida' : isEnCurso ? 'En Curso' : 'Programada'}
                            </span>

                            <button 
                              onClick={(e) => handleSyncToGoogle(t, e)}
                              title="Sincronizar con Google Calendar"
                              className="p-2 border border-gray-150 rounded-lg bg-neutral-50/50 hover:bg-neutral-100 hover:border-gray-350 transition text-gray-600 hover:text-brand-green"
                            >
                              <ExternalLink size={13} />
                            </button>
                            <button 
                              onClick={(e) => handleSendReminder(t, e)}
                              title="Disparar recordatorio por correo"
                              className="p-2 border border-gray-150 rounded-lg bg-neutral-50/50 hover:bg-neutral-100 hover:border-gray-350 transition text-gray-600 hover:text-brand-green"
                            >
                              <Mail size={13} />
                            </button>
                            <ChevronRight size={15} className="text-gray-300" />
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* LOGS DE INTEGRACIÓN & TRABAJO EN EQUIPO */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-[#2B2B2B] text-sm flex items-center gap-2">
              <BellRing size={16} className="text-brand-green font-normal" /> Trazabilidad de Comunicaciones
            </h3>
            <p className="text-xs text-gray-400 font-normal">Registro de eventos automatizados expedidos hacia Google Calendar o envíos de correo en esta sesión.</p>
            
            {syncLogs.length === 0 ? (
              <div className="p-4 border border-dashed border-gray-150 rounded-xl text-center">
                <Info size={16} className="text-gray-300 mx-auto mb-1.5" />
                <span className="text-[10px] text-gray-400">Sin eventos en la cola de salida de la sesión actual. Sincroniza tareas para ver los registros.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {syncLogs.map((log, index) => (
                  <div key={index} className="p-2.5 rounded bg-gray-50 border border-gray-100 font-mono text-[9px] text-gray-600 break-words leading-normal">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-brand-green-soft p-5 rounded-2xl border border-brand-green/20 space-y-2">
            <h4 className="text-xs font-bold text-brand-green-dark uppercase">¿Por qué es preventivo?</h4>
            <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
              Hoy los condominios operan de forma reactiva, destituyendo cargos de administración o personal técnico cuando suceden fallas críticas. 
              <strong> Innovarum Technologies</strong> empodera a la asamblea al proveer trazabilidad de cada paso de mantenimiento antes de que los activos colapsen.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
