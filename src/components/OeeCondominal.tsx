import React, { useState, useMemo } from "react";
import { Area, TareaPreventiva, EventoTrazabilidad } from "../types";
import { BRAND } from "../config/brand";
import {
  Gauge,
  Clock,
  Sparkles,
  ZapOff,
  CheckSquare,
  AlertCircle,
  TrendingDown,
  Wrench,
  TrendingUp,
  Activity,
  BarChart2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
  Legend,
  ComposedChart
} from "recharts";

interface OeeCondominalProps {
  areas: Area[];
  tareas: TareaPreventiva[];
  currentScenario?: 'A' | 'B';
  onAddTrazabilidad: (nuevo: EventoTrazabilidad) => void;
  onTriggerToast: (msg: string) => void;
}

export default function OeeCondominal({ 
  areas, 
  tareas, 
  currentScenario = 'A',
  onAddTrazabilidad, 
  onTriggerToast 
}: OeeCondominalProps) {
  
  // 1. Interactive States for Uptime and Cuts
  const [horasCorteElectricidad, setHorasCorteElectricidad] = useState<number>(4); // default 4 hrs of cut
  const [horasCorteAgua, setHorasCorteAgua] = useState<number>(0);
  const [numCorrectivosReactivos, setNumCorrectivosReactivos] = useState<number>(2); // default 2 reactive emergency OTs

  const HORAS_TOTAL_MES = 720; // 30 dias * 24 horas

  // 2. Computed OEE Factors
  // Availability = (720 - horas_corte) / 720 * 100
  const disponibilidad = useMemo(() => {
    const totalCortes = horasCorteElectricidad + horasCorteAgua;
    return Number((((HORAS_TOTAL_MES - totalCortes) / HORAS_TOTAL_MES) * 100).toFixed(1));
  }, [horasCorteElectricidad, horasCorteAgua]);

  // Performance = Tareas completadas / Tareas asamblea programadas (from actual tareas state)
  const rendimiento = useMemo(() => {
    const totalProgramadas = tareas.length;
    const totalCompletadas = tareas.filter(t => t.estado === "completada" || (t.estado === "programada" && t.costo_real !== null)).length;
    if (totalProgramadas === 0) return 100;
    return Number(((totalCompletadas / totalProgramadas) * 100).toFixed(1));
  }, [tareas]);

  // Quality = 1 - (incidencias_correctivas / total_tareas) * 100
  const calidad = useMemo(() => {
    const totalMantenimientos = tareas.length + numCorrectivosReactivos;
    if (totalMantenimientos === 0) return 100;
    return Number(((1 - (numCorrectivosReactivos / totalMantenimientos)) * 100).toFixed(1));
  }, [tareas, numCorrectivosReactivos]);

  // OEE = (Disp * Rend * Cal) / 10000
  const oee = useMemo(() => {
    const calculated = (disponibilidad * rendimiento * calidad) / 10000;
    return Number(calculated.toFixed(1));
  }, [disponibilidad, rendimiento, calidad]);

  // Benchmark target
  const OEE_META = 85.0;

  // 3. Historical OEE database (12 months)
  const oeeHistorico = [
    { mes: "Jul 25", oee: 79.4, disp: 98.2, rend: 85.0, cal: 95.1 },
    { mes: "Ago 25", oee: 82.1, disp: 99.0, rend: 87.0, cal: 95.4 },
    { mes: "Sep 25", oee: 84.5, disp: 99.1, rend: 90.1, cal: 94.8 },
    { mes: "Oct 25", oee: 86.2, disp: 100.0, rend: 91.0, cal: 94.7 },
    { mes: "Nov 25", oee: 81.3, disp: 96.4, rend: 89.2, cal: 94.6 }, // water leak incident
    { mes: "Dic 25", oee: 87.4, disp: 100.0, rend: 92.5, cal: 94.5 },
    { mes: "Ene 26", oee: 88.0, disp: 99.5, rend: 93.0, cal: 95.0 },
    { mes: "Feb 26", oee: 89.1, disp: 99.8, rend: 94.0, cal: 95.1 },
    { mes: "Mar 26", oee: 91.2, disp: 100.0, rend: 96.0, cal: 95.0 },
    { mes: "Abr 26", oee: 86.4, disp: 98.1, rend: 91.0, cal: 96.8 },
    { mes: "May 26", oee: 92.0, disp: 100.0, rend: 97.2, cal: 94.7 },
    { mes: "Jun 26", oee: oee, disp: disponibilidad, rend: rendimiento, cal: calidad },
  ];

  // 4. Proposed diagnostic items based on lowest factor
  const diagnostic = useMemo(() => {
    const factors = [
      { name: "Diponibilidad", val: disponibilidad, icon: ZapOff, desc: "Afectado por interrupciones físicas de energía o agua común.", suggestion: "Instalar capacitores de potencia y alarmas de flujo en bombas para avisar sobre cortes." },
      { name: "Rendimiento", val: rendimiento, icon: CheckSquare, desc: "Afectado por planes de mantenimiento vencidos o no reportados a tiempo.", suggestion: "Ajustar frecuencia de recordatorios y agilizar el checkout de subida de evidencias fotográficas." },
      { name: "Calidad", val: calidad, icon: AlertCircle, desc: "Afectado por incidentes correctivos de emergencia por fallas no anticipadas.", suggestion: "Aumentar instrumentación de sensores IoT de Predictivo RUL para sustituir mantenimientos reactivos por predictivos." }
    ];

    // sort ascending to find worst performer
    const worst = [...factors].sort((a, b) => a.val - b.val)[0];
    return {
      name: worst.name,
      val: worst.val,
      icon: worst.icon,
      desc: worst.desc,
      suggestion: worst.suggestion
    };
  }, [disponibilidad, rendimiento, calidad]);

  const handleRegisterIncident = () => {
    setNumCorrectivosReactivos(prev => prev + 1);
    onTriggerToast("⚠️ Incidente Correctivo registrado. Afecta el factor de 'Calidad' del OEE.");
    
    const log: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: "",
      accion: `⚠️ Registro de Incidente Correctivo de Emergencia Nº ${numCorrectivosReactivos + 1} en zonas comunes. Calidad OEE Condominal recalculada.`,
      actor: "Laura Méndez",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    onAddTrazabilidad(log);
  };

  const handleResetCuts = () => {
    setHorasCorteElectricidad(0);
    setHorasCorteAgua(0);
    setNumCorrectivosReactivos(0);
    onTriggerToast("🔄 Simulador de OEE restablecido en condiciones ideales (100% disponibilidad).");
  };

  return (
    <div id="tpm-oee" className="space-y-8 animate-fade-in text-xs">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-brand-green-dark uppercase bg-brand-green-soft px-2.5 py-1 rounded-full border border-brand-green/20">indicador clase mundial</span>
            <h1 className="text-2xl font-extrabold text-[#2B2B2B] mt-2">OEE Condominal (Eficiencia General)</h1>
            <p className="text-slate-500 text-xs mt-1">
              Factor único para auditar el desempeño general de administración ante asambleas. Pondera disponibilidad de servicios, ritmo de ejecución del plan y prevención de siniestros correctivos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Meta Condominal:</span>
            <span className="bg-[#2B2B2B] text-brand-green px-3 py-1 rounded-xl font-mono font-black border border-brand-green/10">
              {OEE_META}% OEE
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* VELOCÍMETRO GAUGE & DESGLOSE EN FACTORES */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div className="text-center space-y-3">
              <span className="text-[10px] font-black uppercase text-slate-400">Estatus OEE del Mes Corriente</span>
              
              {/* Custom SVG Gauging visual ring */}
              <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#F1F5F9"
                    strokeWidth="10"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={oee >= OEE_META ? "#84BD4B" : "#B45309"}
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 - (251.2 * oee) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-4xl font-black text-slate-800">{oee}%</p>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${oee >= OEE_META ? "text-brand-green-dark" : "text-amber-600"}`}>
                    {oee >= OEE_META ? "Clase Mundial" : "Requiere Acción"}
                  </span>
                </div>
              </div>

              <div className="text-slate-400 text-[10.5px] px-4 font-semibold text-center leading-relaxed">
                Este factor califica la estabilidad de activos. Para un condominio bien gestionado, la meta recomendada de control es de un OEE superior al <strong>{OEE_META}%</strong>.
              </div>
            </div>

            {/* Factores Desglosados */}
            <div className="space-y-4 border-t border-slate-100 pt-5 mt-4">
              {/* Disponibilidad */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    🟢 Disponibilidad (Servicio Uptime)
                  </span>
                  <span className="font-mono font-bold text-slate-800">{disponibilidad}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 rounded-full" style={{ width: `${disponibilidad}%` }} />
                </div>
              </div>

              {/* Rendimiento */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    🔵 Rendimiento (Efectividad Plan)
                  </span>
                  <span className="font-mono font-bold text-slate-800">{rendimiento}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${rendimiento}%` }} />
                </div>
              </div>

              {/* Calidad */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    🟡 Calidad (Prevención de Fallas)
                  </span>
                  <span className="font-mono font-bold text-slate-800">{calidad}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-green rounded-full" style={{ width: `${calidad}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICOS DE TENDENCIA HISTÓRICA & SIMULADOR DE COORDENADAS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TENDENCIA ULTIMOS 12 MESES */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                <Activity size={16} className="text-brand-green" /> Evolución del Índice OEE de los Últimos 12 Meses
              </h3>
              <p className="text-xs text-slate-400">Comparativa contra la línea base de asamblea. La línea sólida refleja la estabilización del inmueble.</p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={oeeHistorico} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94A3B8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} domain={[60, 100]} />
                  <Tooltip />
                  <ReferenceLine y={OEE_META} stroke="#DC2626" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Línea Meta 85%", fill: "#DC2626", fontSize: 9, position: "insideBottomRight" }} />
                  <Line 
                    type="monotone" 
                    dataKey="oee" 
                    stroke="#84BD4B" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1.5, fill: "#FFF" }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PARETO 80/20 CHART (Escenario B) */}
          {currentScenario === 'B' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 animate-fade-in">
              <div>
                <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                  <BarChart2 size={16} className="text-amber-500" /> Gráfico de Pareto de Fallas (Principio de Enfoque 80/20)
                </h3>
                <p className="text-xs text-slate-400">Las fallas mecánicas de elevadores y cisternas de agua representan el 60% de la indisponibilidad total.</p>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={[
                      { causa: "Elevadores", incidentes: 24, acumulado: 34 },
                      { causa: "Cisterna / Agua", incidentes: 18, acumulado: 60 },
                      { causa: "Subestación", incidentes: 11, acumulado: 76 },
                      { causa: "Puertas/Acceso", incidentes: 6, acumulado: 85 },
                      { causa: "Chiller / Clima", incidentes: 5, acumulado: 92 },
                      { causa: "Pasillos Luz", incidentes: 3, acumulado: 96 },
                      { causa: "Otros", incidentes: 3, acumulado: 100 }
                    ]}
                    margin={{ top: 10, right: -5, left: -25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="causa" stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={9} tickLine={false} domain={[0, 100]} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#2B2B2B] text-white p-2.5 rounded-xl text-xs font-mono">
                              <p className="font-bold">{data.causa}</p>
                              <p className="text-[#84BD4B] font-bold">Frecuencia: {data.incidentes} fallas</p>
                              <p className="text-amber-400 font-bold">Acumulado: {data.acumulado}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar yAxisId="left" dataKey="incidentes" fill="#0A1B3D" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* SIMULADOR DE INCIDENTES (PURA INTERACCIÓN UI) */}
          <div className="bg-[#2B2B2B] text-white p-5 rounded-2xl border border-transparent shadow-md space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center gap-1.5">
              💡 Auditoría y Simulación de Incidencias Operativas
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed font-semibold">
              Pruebe cómo impactan cortes accidentales de servicios (agua/electricidad) o el aumento de urgencias mecánicas en la salud final que ve la asamblea:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-3">
                {/* Cuota electrica cuts */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-300">
                    <span>Horas Corte Electricidad:</span>
                    <span className="font-mono font-bold text-brand-green">{horasCorteElectricidad} h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    step="1"
                    value={horasCorteElectricidad}
                    onChange={(e) => setHorasCorteElectricidad(Number(e.target.value))}
                    className="w-full accent-[#84BD4B] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                {/* Cuts agua */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-300">
                    <span>Horas Corte Agua Cisterna:</span>
                    <span className="font-mono font-bold text-brand-green">{horasCorteAgua} h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="48"
                    step="1"
                    value={horasCorteAgua}
                    onChange={(e) => setHorasCorteAgua(Number(e.target.value))}
                    className="w-full accent-[#84BD4B] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Botón de Correctivos y Reseteo */}
              <div className="flex flex-col justify-around gap-2">
                <button
                  type="button"
                  id="btn-register-incident"
                  onClick={handleRegisterIncident}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wrench size={12} /> Registrar Correctivo Urgencia
                </button>
                <button
                  type="button"
                  onClick={handleResetCuts}
                  className="w-full py-2 bg-white/10 hover:bg-white/15 text-white/80 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Restablecer Condiciones Ideales
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* DETECTIVE DE INEFICIENCIAS - RECOMENDACIONES DE MEJORA AUTOMÁTICAS */}
      <div className="bg-emerald-50/50 border border-brand-green/20 p-6 rounded-2xl relative overflow-hidden space-y-4">
        <h4 className="text-sm font-extrabold text-[#5E8E2E] flex items-center gap-1.5">
          <Sparkles size={16} /> Diagnóstico Inteligente de Mejora de OEE
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-2">
            <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1">
              Desempeño Restringido por: <span className="text-[#2B2B2B]">{diagnostic.name} ({diagnostic.val}%)</span>
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed font-semibold">
              {diagnostic.desc}
            </p>
            <p className="text-[11.5px] text-[#5E8E2E] leading-relaxed font-black">
              📊 Plan de Acción Recomendado: {diagnostic.suggestion}
            </p>
          </div>
          <div className="md:col-span-4 bg-white p-4 rounded-xl border border-brand-green/10 flex flex-col justify-between h-full">
            <span className="text-[9px] font-black text-slate-400 uppercase block tracking-wider">Planificación Estimada</span>
            <p className="text-xl font-black text-[#2B2B2B] mt-1">+4.2% OEE</p>
            <span className="text-[9px] text-slate-500 block leading-snug mt-1 font-medium">Incremento estimado si se implementa este mes.</span>
          </div>
        </div>
      </div>

    </div>
  );
}
