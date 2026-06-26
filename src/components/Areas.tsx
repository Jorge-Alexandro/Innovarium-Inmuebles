import React, { useState } from "react";
import { Area, Activo, TareaPreventiva, EstadoSalud, FrecuenciaTarea } from "../types";
import { BRAND } from "../config/brand";
import { 
  Plus, 
  Settings, 
  Wrench, 
  ArrowRight,
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";

interface AreasProps {
  areas: Area[];
  activos: Activo[];
  tareas: TareaPreventiva[];
  onSelectTarea: (tarea: TareaPreventiva) => void;
  onAddActivo: (nuevoActivo: Activo) => void;
  onAddTarea: (nuevaTarea: TareaPreventiva) => void;
}

export default function Areas({ areas, activos, tareas, onSelectTarea, onAddActivo, onAddTarea }: AreasProps) {
  const [selectedAreaId, setSelectedAreaId] = useState<string>("gas");
  const [showAddActivoModal, setShowAddActivoModal] = useState<boolean>(false);
  const [showAddTareaModal, setShowAddTareaModal] = useState<boolean>(false);

  // Form states for adding assets
  const [activoName, setActivoName] = useState("");
  const [activoMarca, setActivoMarca] = useState("");
  const [activoFecha, setActivoFecha] = useState("2026-06-22");

  // Form states for adding tasks
  const [tareaTitulo, setTareaTitulo] = useState("");
  const [tareaFrecuencia, setTareaFrecuencia] = useState<FrecuenciaTarea>("mensual");
  const [tareaFecha, setTareaFecha] = useState("2026-07-01");
  const [tareaEst, setTareaEst] = useState("1000");
  const [tareaInstrucciones, setTareaInstrucciones] = useState("Paso 1: Inspeccionar estado general\nPaso 2: Realizar limpieza con solvente\nPaso 3: Probar continuidad");
  const [tareaActivoId, setTareaActivoId] = useState("");

  const activeArea = areas.find(a => a.id === selectedAreaId) || areas[0];
  const areaActivos = activos.filter(ac => ac.area_id === selectedAreaId);
  const areaTareas = tareas.filter(t => t.area_id === selectedAreaId);

  // Calculate stats for the active area
  const totalCostEst = areaTareas.reduce((sum, t) => sum + t.costo_estimado, 0);
  const totalCostReal = areaTareas.reduce((sum, t) => sum + (t.costo_real || 0), 0);

  const handleCreateActivo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activoName) return;

    const nuevo: Activo = {
      id: `act_${Math.random().toString(36).substring(2, 9)}`,
      area_id: selectedAreaId,
      nombre: activoName,
      marca: activoMarca || "Genérico",
      fecha_instalacion: activoFecha
    };

    onAddActivo(nuevo);
    setActivoName("");
    setActivoMarca("");
    setShowAddActivoModal(false);
  };

  const handleCreateTarea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tareaTitulo) return;

    const pasos = tareaInstrucciones.split("\n").filter(p => p.trim() !== "");

    const nueva: TareaPreventiva = {
      id: `tar_${Math.random().toString(36).substring(2, 9)}`,
      area_id: selectedAreaId,
      activo_id: tareaActivoId || (areaActivos[0]?.id || ""),
      titulo: tareaTitulo,
      instrucciones_json: pasos.length > 0 ? pasos : ["Verificación inicial de componentes"],
      frecuencia: tareaFrecuencia,
      proxima_fecha: tareaFecha,
      estado: "programada",
      costo_estimado: parseFloat(tareaEst) || 0,
      costo_real: null,
      admin_id: "admin_1",
      proveedor_id: "proveedor_1",
      lider_id: "lider_1"
    };

    onAddTarea(nueva);
    setTareaTitulo("");
    setTareaInstrucciones("Paso 1: Inspeccionar\nPaso 2: Limpiar\nPaso 3: Validar");
    setTareaEst("1000");
    setShowAddTareaModal(false);
  };

  const mapSalud = (areaId: string): { bg: string; text: string; label: string } => {
    const tareasArea = tareas.filter(t => t.area_id === areaId);
    const tieneVencidas = tareasArea.some(t => t.estado === "vencida");
    const tienePorVencer = tareasArea.some(t => t.estado === "en_curso");

    if (tieneVencidas) {
      return { bg: "bg-red-50 text-[#DC2626] border-red-200", text: "text-[#DC2626]", label: "Crítico" };
    } else if (tienePorVencer) {
      return { bg: "bg-yellow-50 text-yellow-700 border-yellow-200", text: "text-yellow-700", label: "Atención" };
    } else {
      return { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", label: "Al día" };
    }
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-extrabold text-neutral-800">Catálogo de Áreas y Equipos</h1>
        <p className="text-gray-500 text-sm mt-1">Conecta cada departamento o instalación con sus respectivos activos y planes de mantenimiento preventivo.</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        
        {/* SIDE BAR SECTOR DE ÁREAS */}
        <div className="lg:col-span-1 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Áreas ({areas.length})</p>
          <div className="space-y-1 bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
            {areas.map(a => {
              const active = a.id === selectedAreaId;
              const salud = mapSalud(a.id);
              const totalActivos = activos.filter(ac => ac.area_id === a.id).length;
              return (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelectedAreaId(a.id);
                    setTareaActivoId(activos.filter(ac => ac.area_id === a.id)[0]?.id || "");
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-sm font-semibold transition ${
                    active 
                      ? "text-brand-green-dark bg-brand-green-soft" 
                      : "text-gray-600 hover:bg-neutral-50"
                  }`}
                >
                  <div className="text-left min-w-0 pr-1">
                    <p className="font-bold truncate">{a.nombre}</p>
                    <span className="text-[10px] text-gray-400 block font-normal">{totalActivos} activos vinculados</span>
                  </div>
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${salud.bg} shrink-0`}>
                    {salud.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* DETALLE DEL ÁREA ACTIVIDAD Y EQUIPOS */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Banner Resumen del Área */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-800">{activeArea.nombre}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${mapSalud(activeArea.id).bg}`}>
                  Semaforización: {mapSalud(activeArea.id).label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Estimación anual: {formatCurrency(totalCostEst)} | Costo Realizado: {formatCurrency(totalCostReal)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAddActivoModal(true)}
                className="text-xs font-bold border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-neutral-50 transition flex items-center gap-1.5"
              >
                <Plus size={14} /> Registrar Activo
              </button>
              <button 
                onClick={() => {
                  setTareaActivoId(areaActivos[0]?.id || "");
                  setShowAddTareaModal(true);
                }}
                className="text-xs font-bold text-white px-3.5 py-2 rounded-lg transition flex items-center gap-1.5"
                style={{ background: BRAND.colors.green }}
              >
                <Plus size={14} /> Programar Tarea
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* LISTA DE ACTIVOS / EQUIPOS */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-bold text-[#2B2B2B] text-sm flex items-center gap-2">
                  <Settings size={16} className="text-brand-green-dark" /> Equipos / Activos ({areaActivos.length})
                </h3>
              </div>
              {areaActivos.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-gray-400">No hay activos registrados en esta área.</p>
                  <button 
                    onClick={() => setShowAddActivoModal(true)} 
                    className="text-xs font-bold text-brand-green hover:underline mt-2 inline-block transition"
                  >
                    Agregar el primero
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {areaActivos.map(ac => (
                    <div key={ac.id} className="p-3 rounded-xl border border-gray-100 bg-neutral-50/50 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <p className="text-xs font-bold text-neutral-800">{ac.nombre}</p>
                        <span className="text-[10px] font-semibold text-gray-400 bg-white border border-gray-200 px-1.5 py-0.5 rounded uppercase font-mono">
                          {ac.marca}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-2 border-t border-gray-100">
                        <span>Instalado: {ac.fecha_instalacion}</span>
                        <span className="font-mono text-[10px]">ID: {ac.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LISTA DE TAREAS PREVENTIVAS */}
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h3 className="font-bold text-[#2B2B2B] text-sm flex items-center gap-2">
                  <Wrench size={16} className="text-brand-green-dark" /> Plan Preventivo ({areaTareas.length})
                </h3>
              </div>
              {areaTareas.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-xs text-gray-400">No hay tareas programadas para esta área.</p>
                  <button 
                    onClick={() => setShowAddTareaModal(true)} 
                    className="text-xs font-bold text-brand-green hover:underline mt-2 inline-block transition"
                  >
                    Programar una tarea
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {areaTareas.map(t => {
                    const esVencida = t.estado === "vencida";
                    const esEnCurso = t.estado === "en_curso";
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelectTarea(t)}
                        className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-neutral-50/80 hover:border-gray-200 transition flex flex-col justify-between group"
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-xs font-bold text-slate-800 group-hover:text-brand-green transition truncate pr-2">
                            {t.titulo}
                          </p>
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 border ${
                            esVencida ? 'bg-red-50 text-red-700 border-red-100' : esEnCurso ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {esVencida ? "Crítico" : esEnCurso ? "Atención" : "Al día"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2.5 pt-2 border-t border-gray-50 w-full">
                          <span>Próximo dev: {t.proxima_fecha}</span>
                          <span className="font-bold text-neutral-700">{formatCurrency(t.costo_estimado)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* POPUP REGISTRAR ACTIVO */}
      {showAddActivoModal && (
        <div className="fixed inset-0 bg-neutral-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <h3 className="font-bold text-neutral-800 text-lg mb-2">Registrar Activo</h3>
            <p className="text-xs text-gray-400 mb-4">Añade un equipo de infraestructura en el área <strong>{activeArea.nombre}</strong>.</p>
            
            <form onSubmit={handleCreateActivo} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Nombre del Activo *</label>
                <input 
                  type="text" 
                  required 
                  value={activoName} 
                  onChange={e => setActivoName(e.target.value)}
                  placeholder="Ej. Extractor de gases de sótano"
                  className="w-full border border-gray-200 p-2.5 rounded-lg text-xs focus:ring-1 focus:ring-green-400 focus:outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Marca</label>
                  <input 
                    type="text" 
                    value={activoMarca} 
                    onChange={e => setActivoMarca(e.target.value)}
                    placeholder="Ej. Soler & Palau"
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-xs focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Instalado el</label>
                  <input 
                    type="date" 
                    value={activoFecha} 
                    onChange={e => setActivoFecha(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-xs focus:outline-none" 
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowAddActivoModal(false)}
                  className="px-3.5 py-2 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-neutral-50 transition font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs text-white rounded-lg transition font-bold"
                  style={{ background: BRAND.colors.green }}
                >
                  Guardar Activo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP PROGRAMAR TAREA */}
      {showAddTareaModal && (
        <div className="fixed inset-0 bg-neutral-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-neutral-800 text-lg mb-2">Programar Mantenimiento Preventivo</h3>
            <p className="text-xs text-gray-400 mb-4">Crea una plantilla periódica para resguardar la salud operativa del área <strong>{activeArea.nombre}</strong>.</p>
            
            <form onSubmit={handleCreateTarea} className="space-y-3.5 text-sm">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Título de la Tarea *</label>
                <input 
                  type="text" 
                  required 
                  value={tareaTitulo} 
                  onChange={e => setTareaTitulo(e.target.value)}
                  placeholder="Ej. Limpieza anual de rejillas y balance de aspas"
                  className="w-full border border-gray-200 p-2.5 rounded-lg text-xs focus:outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Frecuencia *</label>
                  <select 
                    value={tareaFrecuencia}
                    onChange={e => setTareaFrecuencia(e.target.value as FrecuenciaTarea)}
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="diaria">Diaria</option>
                    <option value="semanal">Semanal</option>
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Próxima Fecha *</label>
                  <input 
                    type="date" 
                    required
                    value={tareaFecha} 
                    onChange={e => setTareaFecha(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-xs focus:outline-none" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Activo Vinculado</label>
                  <select
                    value={tareaActivoId}
                    onChange={e => setTareaActivoId(e.target.value)}
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-xs bg-white focus:outline-none"
                  >
                    <option value="">Seleccionar activo...</option>
                    {areaActivos.map(ac => (
                      <option key={ac.id} value={ac.id}>{ac.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Monto Estimado ($) *</label>
                  <input 
                    type="number" 
                    required
                    value={tareaEst} 
                    onChange={e => setTareaEst(e.target.value)}
                    placeholder="1200"
                    className="w-full border border-gray-200 p-2.5 rounded-lg text-xs focus:outline-none" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Paso a Paso de Ejecución (Uno por línea) *</label>
                <textarea
                  rows={4}
                  required
                  value={tareaInstrucciones}
                  onChange={e => setTareaInstrucciones(e.target.value)}
                  placeholder="Línea 1: Revisar estado eléctrico&#13;Línea 2: Limpieza&#13;Línea 3: Tomar fotos"
                  className="w-full border border-gray-200 p-2.5 rounded-lg text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowAddTareaModal(false)}
                  className="px-3.5 py-2 text-xs border border-gray-200 text-gray-500 rounded-lg hover:bg-neutral-50 font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-xs text-white rounded-lg transition font-bold"
                  style={{ background: BRAND.colors.green }}
                >
                  Generar Orden Preventiva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
