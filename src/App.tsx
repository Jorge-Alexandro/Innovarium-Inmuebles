import React, { useState, useMemo } from "react";
import { 
  AREAS_INICIALES, 
  ACTIVOS_INICIALES, 
  RESPONSABLES_INICIALES, 
  TAREAS_INICIALES, 
  PRESUPUESTOS_INICIALES, 
  EVOLUCION_TRAZABILIDAD_BASE,
  CONDOMINIO_PILOTO
} from "./data/mockData";
import { Area, Activo, TareaPreventiva, Presupuesto, EventoTrazabilidad, Responsable } from "./types";
import { BRAND } from "./config/brand";

import Dashboard from "./components/Dashboard";
import Areas from "./components/Areas";
import Calendario from "./components/Calendario";
import Finanzas from "./components/Finanzas";
import TpmMaster from "./components/TpmMaster";
import TareaModal from "./components/TareaModal";

import { 
  LayoutDashboard, 
  Boxes, 
  CalendarDays, 
  Wallet, 
  Bell, 
  ChevronRight, 
  Menu, 
  X,
  Sparkles,
  ShieldCheck,
  MapPin,
  Building2,
  Lock,
  Compass,
  FileCheck,
  Trees
} from "lucide-react";

export default function App() {
  const [tab, setTab] = useState<string>("panel");
  const [areas, setAreas] = useState<Area[]>(AREAS_INICIALES);
  const [activos, setActivos] = useState<Activo[]>(ACTIVOS_INICIALES);
  const [responsables, setResponsables] = useState<Responsable[]>(RESPONSABLES_INICIALES);
  const [tareas, setTareas] = useState<TareaPreventiva[]>(TAREAS_INICIALES);
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>(PRESUPUESTOS_INICIALES);
  const [trazabilidad, setTrazabilidad] = useState<EventoTrazabilidad[]>(EVOLUCION_TRAZABILIDAD_BASE);

  // Focus and toaster notifications
  const [selectedTarea, setSelectedTarea] = useState<TareaPreventiva | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showNotificationTray, setShowNotificationTray] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Triggering visual toasts
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // State mutation actions
  const handleAddActivo = (nuevo: Activo) => {
    setActivos(prev => [nuevo, ...prev]);
    
    // Log trace
    const log: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: "",
      accion: `Se registró un nuevo activo de infraestructura: "${nuevo.nombre}" (Marca: ${nuevo.marca})`,
      actor: "Laura Méndez",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    setTrazabilidad(prev => [log, ...prev]);
    triggerToast(`🛠️ Nuevo Activo guardado: "${nuevo.nombre}"`);
  };

  const handleAddTarea = (nueva: TareaPreventiva) => {
    setTareas(prev => [nueva, ...prev]);

    // Log trace
    const log: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: nueva.id,
      accion: `Se programó un nuevo plan preventivo periódico en el calendario: "${nueva.titulo}"`,
      actor: "Laura Méndez",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    setTrazabilidad(prev => [log, ...prev]);
    triggerToast(`📅 Plan preventivo programado con éxito.`);
  };

  const handleUpdateTarea = (updated: TareaPreventiva) => {
    setTareas(prev => prev.map(t => t.id === updated.id ? updated : t));
    
    // Update active modal reference if it's currently open
    if (selectedTarea && selectedTarea.id === updated.id) {
      setSelectedTarea(updated);
    }

    // If cost_real is updated, update the budgets table to keep sync!
    if (updated.costo_real !== null) {
      setPresupuestos(prev => prev.map(p => {
        if (p.area_id === updated.area_id) {
          // Add cost difference
          const previousValue = tareas.find(t => t.id === updated.id)?.costo_real || 0;
          const costDifference = updated.costo_real! - previousValue;
          return {
            ...p,
            monto_gastado: p.monto_gastado + costDifference
          };
        }
        return p;
      }));
    }
  };

  const handleAddTrazabilidad = (nuevo: EventoTrazabilidad) => {
    setTrazabilidad(prev => [nuevo, ...prev]);
  };

  // Counting notification badgelines
  const tareasVencidasCount = useMemo(() => tareas.filter(t => t.estado === "vencida").length, [tareas]);
  const tareasPorVencerCount = useMemo(() => tareas.filter(t => t.estado === "en_curso").length, [tareas]);
  const alertCount = tareasVencidasCount + tareasPorVencerCount;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row antialiased select-none font-sans" style={{ background: BRAND.colors.bg }}>
      
      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white text-slate-800 shrink-0 relative border-r border-slate-150">
        <div className="p-6 flex items-center gap-3 border-b border-neutral-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F8F9FA] border border-slate-200">
            <Trees size={20} className="text-[#0A1B3D]" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-[#0A1B3D] leading-none uppercase">Innovarum</h1>
            <p className="text-[8px] text-[#C5A059] uppercase tracking-wider font-extrabold mt-1">ADMINISTRACIONES</p>
          </div>
        </div>

        {/* Navigation Selector */}
        <nav className="flex-1 p-4 space-y-1 mt-4">
          {[
            { id: "panel", label: "Panel General", icon: LayoutDashboard },
            { id: "areas", label: "Catálogo de Áreas", icon: Boxes },
            { id: "calendario", label: "Calendario", icon: CalendarDays },
            { id: "finanzas", label: "Finanzas", icon: Wallet },
            { id: "tpm", label: "Horizontes TPM", icon: Compass },
          ].map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  active 
                    ? "bg-brand-green text-white shadow-sm shadow-brand-green/35" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <item.icon size={16} className={active ? "text-white" : "text-slate-500"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Condominium Label Card */}
        <div className="p-4 border-t border-slate-100 bg-[#F8F9FA] mt-auto">
          <div className="flex items-start gap-2.5">
            <Building2 size={16} className="text-[#C5A059] mt-0.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">CONDOMINIO PILOTO</span>
              <p className="text-xs font-bold text-[#0A1B3D] truncate">{CONDOMINIO_PILOTO.nombre}</p>
              <span className="text-[9px] text-slate-500 block font-normal leading-normal truncate">{CONDOMINIO_PILOTO.direccion}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MOBILE BAR */}
      <header className="md:hidden bg-white border-b border-slate-150 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#F8F9FA] text-[#0A1B3D] border border-slate-150">
            <Trees size={16} />
          </div>
          <div>
            <h1 className="text-sm font-black text-[#0A1B3D] leading-none uppercase">Innovarum</h1>
            <span className="text-[8px] font-black uppercase tracking-wider block" style={{ color: BRAND.colors.green }}>Administraciones</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notification bell on mobile */}
          <button 
            onClick={() => setShowNotificationTray(prev => !prev)}
            className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg relative"
          >
            <Bell size={16} />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-[8px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                {alertCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="p-2 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg"
          >
            {mobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER OPTIONS */}
      {mobileMenuOpen && (
        <div className="bg-white border-b border-slate-200 p-4 md:hidden space-y-1.5 animate-slide-down sticky top-[53px] z-30 shadow-md">
          {[
            { id: "panel", label: "Panel General", icon: LayoutDashboard },
            { id: "areas", label: "Catálogo de Áreas", icon: Boxes },
            { id: "calendario", label: "Calendario", icon: CalendarDays },
            { id: "finanzas", label: "Finanzas", icon: Wallet },
            { id: "tpm", label: "Horizontes TPM", icon: Compass },
          ].map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold transition text-left ${
                  active 
                    ? "bg-brand-green-soft text-brand-green-dark" 
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <item.icon size={15} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* CENTRAL CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* TOP BAR / UTILITIES FOR DESKTOP */}
        <header className="hidden md:flex justify-between items-center p-6 border-b border-slate-200 bg-white sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400">Régimen Legal:</span>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full uppercase">
              {CONDOMINIO_PILOTO.regimen}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <button 
              onClick={() => setShowNotificationTray(prev => !prev)}
              className="p-2.5 bg-slate-50 hover:bg-slate-100/60 border border-slate-200 text-slate-600 rounded-xl relative transition"
            >
              <Bell size={16} />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-600 text-white text-[8px] font-black rounded-full flex items-center justify-center animate-pulse">
                  {alertCount}
                </span>
              )}
            </button>

            {/* Profile badge and tech status */}
            <div className="flex items-center gap-2 bg-[#F8F9FA] border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs">
              <div className="w-5 h-5 rounded-full bg-[#0A1B3D] border border-white flex items-center justify-center text-brand-green font-bold text-[9px]">
                LM
              </div>
              <span className="font-bold text-[#0A1B3D]">Laura M. (Admin)</span>
            </div>
          </div>
        </header>

        {/* NOTIFICATION PANELS / DRAWER */}
        {showNotificationTray && (
          <div className="absolute right-4 top-16 w-80 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 p-4 space-y-3.5 max-h-[460px] overflow-y-auto animate-fade-in text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="font-extrabold text-neutral-800 uppercase tracking-widest text-[10px]">Notificaciones de Alerta</span>
              <button 
                onClick={() => setShowNotificationTray(false)}
                className="text-gray-400 hover:text-neutral-700"
              >
                <X size={15} />
              </button>
            </div>

            <div className="space-y-2">
              {tareas.filter(t => t.estado === "vencida").map(t => (
                <div key={t.id} className="p-3 bg-red-50/50 border border-red-150 hover:bg-red-50 rounded-xl flex gap-2.5 relative group">
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full shrink-0 mt-1.5" />
                  <div>
                    <h4 className="font-bold text-red-950 leading-normal">{t.titulo}</h4>
                    <p className="text-[10px] text-red-700/80 mt-1 font-semibold uppercase">Venció el {t.proxima_fecha}</p>
                    <button 
                      onClick={() => {
                        setSelectedTarea(t);
                        setShowNotificationTray(false);
                      }}
                      className="text-[9px] text-red-800 hover:underline font-bold mt-2 block"
                    >
                      Atender ahora
                    </button>
                  </div>
                </div>
              ))}

              {tareas.filter(t => t.estado === "en_curso").map(t => (
                <div key={t.id} className="p-3 bg-emerald-50/50 border border-emerald-100 hover:bg-emerald-50 rounded-xl flex gap-2.5 relative">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0 mt-1.5" />
                  <div>
                    <h4 className="font-bold text-emerald-950 leading-normal">{t.titulo}</h4>
                    <p className="text-[10px] text-emerald-700 mt-1 font-semibold uppercase">Próximo vencimiento: {t.proxima_fecha}</p>
                    <button 
                      onClick={() => {
                        setSelectedTarea(t);
                        setShowNotificationTray(false);
                      }}
                      className="text-[9px] text-emerald-800 hover:underline font-bold mt-2 block"
                    >
                      Verificar instructivos
                    </button>
                  </div>
                </div>
              ))}

              {alertCount === 0 && (
                <div className="py-8 text-center text-gray-400">
                  <FileCheck size={28} className="text-gray-300 mx-auto mb-2" />
                  <span className="font-medium text-xs">¡Todo en orden!</span>
                  <p className="text-[10px] text-gray-400 mt-1">Sin alertas de mantenimiento retrasadas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PRIMARY VIEW PANEL ROUTER PORTAL */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-5xl mx-auto w-full">
          {tab === "panel" && (
            <Dashboard 
              tareas={tareas} 
              areas={areas}
              presupuestos={presupuestos}
              trazabilidad={trazabilidad}
              onSelectTarea={setSelectedTarea}
              onSetTab={setTab}
            />
          )}

          {tab === "areas" && (
            <Areas 
              areas={areas}
              activos={activos}
              tareas={tareas}
              onSelectTarea={setSelectedTarea}
              onAddActivo={handleAddActivo}
              onAddTarea={handleAddTarea}
            />
          )}

          {tab === "calendario" && (
            <Calendario 
              tareas={tareas}
              areas={areas}
              onSelectTarea={setSelectedTarea}
              onTriggerToast={triggerToast}
            />
          )}

          {tab === "finanzas" && (
            <Finanzas 
              presupuestos={presupuestos}
              areas={areas}
              tareas={tareas}
              onTriggerToast={triggerToast}
            />
          )}

          {tab === "tpm" && (
            <TpmMaster 
              areas={areas}
              activos={activos}
              tareas={tareas}
              presupuestos={presupuestos}
              responsables={responsables}
              onAddTarea={handleAddTarea}
              onAddTrazabilidad={handleAddTrazabilidad}
              onTriggerToast={triggerToast}
            />
          )}
        </main>
      </div>

      {/* TAREA DETAILS MODAL DIALOG */}
      {selectedTarea && (
        <TareaModal 
          tarea={selectedTarea}
          areas={areas}
          responsables={responsables}
          trazabilidad={trazabilidad}
          onClose={() => setSelectedTarea(null)}
          onUpdateTarea={handleUpdateTarea}
          onAddTrazabilidad={handleAddTrazabilidad}
          onTriggerToast={triggerToast}
        />
      )}

      {/* GLOBAL TOAST POPUP NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-neutral-900 border border-neutral-800 text-white px-4 py-3.5 rounded-2xl shadow-xl flex items-center gap-3.5 z-50 text-xs font-semibold animate-slide-up max-w-sm">
          <Sparkles size={16} className="text-green-400 shrink-0" />
          <p className="leading-normal">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}
