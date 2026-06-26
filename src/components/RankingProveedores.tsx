import React, { useState, useMemo } from "react";
import { Area, Responsable, TareaPreventiva, EventoTrazabilidad } from "../types";
import { BRAND } from "../config/brand";
import {
  Trophy,
  Star,
  Clock,
  DollarSign,
  AlertOctagon,
  ShieldAlert,
  ThumbsUp,
  Award,
  ChevronRight,
  PlusCircle,
  FileCheck2,
  Lock,
  GraduationCap,
  Users,
  Flame,
  Sparkles,
  TrendingDown,
  BookOpen,
  Plus
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface ProveedorSST {
  id: string;
  nombre: string;
  rfc: string;
  telefono: string;
  email: string;
  areaEspecialidad: string;
  historicoScores: number[]; // last 6 months
  // Aggregated metrics
  cumplimientoPct: number; // 0-100
  calificacionPromedio: number; // 1-5
  tiempoRespuestaHoras: number; // hrs average
  variacionCosto: number; // -1 to 1 (0 is perfect, e.g. 0.05 is 5% over budget)
  otsRulGeneradas: number; // count of predictive urgencies triggered
}

interface RankingProveedoresProps {
  areas: Area[];
  responsables: Responsable[];
  tareas: TareaPreventiva[];
  onAddTrazabilidad: (nuevo: EventoTrazabilidad) => void;
  onTriggerToast: (msg: string) => void;
}

export default function RankingProveedores({ 
  areas, 
  responsables, 
  tareas, 
  onAddTrazabilidad, 
  onTriggerToast 
}: RankingProveedoresProps) {
  
  // 1. Initial State for Suppliers
  const [proveedores, setProveedores] = useState<ProveedorSST[]>([
    {
      id: "prov_gas",
      nombre: "GasSeguro del Valle S.A.",
      rfc: "GSV901012AB4",
      telefono: "55-4321-8765",
      email: "ordenes@gasseguro.mx",
      areaEspecialidad: "Gas / Termo-hidráulica",
      historicoScores: [88, 90, 89, 91, 93, 92],
      cumplimientoPct: 94,
      calificacionPromedio: 4.6,
      tiempoRespuestaHoras: 18,
      variacionCosto: 0.03, // 3% sobre Presupuesto
      otsRulGeneradas: 1
    },
    {
      id: "prov_luz",
      nombre: "ElectroPro Eléctricos del Centro",
      rfc: "EPE150422K90",
      telefono: "55-8901-2345",
      email: "asistencia@electropro.mx",
      areaEspecialidad: "Electricidad / Subestaciones",
      historicoScores: [82, 85, 87, 85, 88, 89],
      cumplimientoPct: 88,
      calificacionPromedio: 4.4,
      tiempoRespuestaHoras: 22,
      variacionCosto: 0.05, // 5% over
      otsRulGeneradas: 2
    },
    {
      id: "prov_hmas",
      nombre: "Kevin Barbosa (Hotelería+ Mantenimiento)",
      rfc: "RUKK8501127A9",
      telefono: "55-1122-3344",
      email: "soporte@hoteleriamas.mx",
      areaEspecialidad: "Mantenimiento General / Albercas",
      historicoScores: [92, 94, 95, 93, 96, 95],
      cumplimientoPct: 97,
      calificacionPromedio: 4.8,
      tiempoRespuestaHoras: 12,
      variacionCosto: -0.01, // 1% under estimate
      otsRulGeneradas: 0
    },
    {
      id: "prov_baja",
      nombre: "Sistemas Contra Incendios Express SRL",
      rfc: "SCI030811CC8",
      telefono: "55-9988-7766",
      email: "servicio@incendiosexpress.com",
      areaEspecialidad: "Sistemas Contra Incendios",
      historicoScores: [55, 52, 49, 48, 47, 46], // Problematic provider (<50 score)
      cumplimientoPct: 58,
      calificacionPromedio: 2.8,
      tiempoRespuestaHoras: 54,
      variacionCosto: 0.28, // 28% over budget
      otsRulGeneradas: 5
    }
  ]);

  // Selected provider ID for detail inspect card
  const [selectedProvId, setSelectedProvId] = useState<string>("prov_hmas");

  // --- NUEVA SECCIÓN DE GAMIFICACIÓN, CERTIFICACIÓN Y RETENCIÓN ---
  // Para combatir el "rodeo de personal" (rotación constante que sale muy caro)
  const [empleados, setEmpleados] = useState([
    {
      id: "emp_1",
      nombre: "Juan Pérez Solís",
      especialidad: "Termohidráulica & Gas",
      nivel: 2,
      xp: 40,
      certificaciones: ["Dictámenes de Hermeticidad", "SST Gas L.P."],
      rotacionRiesgo: "Medio",
      misionesCompletadas: 8,
      sueldoMensual: 14000
    },
    {
      id: "emp_2",
      nombre: "Diana Gómez Reyes",
      especialidad: "Electricidad & Climas",
      nivel: 3,
      xp: 85,
      certificaciones: ["Tableros de Distribución CFE", "Mantenimiento HVAC Preventivo"],
      rotacionRiesgo: "Bajo",
      misionesCompletadas: 15,
      sueldoMensual: 16500
    },
    {
      id: "emp_3",
      nombre: "Pedro Sánchez Torres",
      especialidad: "Albercas & Hidráulica",
      nivel: 1,
      xp: 15,
      certificaciones: ["Tratamiento Químico de Agua"],
      rotacionRiesgo: "Alto",
      misionesCompletadas: 2,
      sueldoMensual: 11000
    }
  ]);

  const [nuevoEmpNombre, setNuevoEmpNombre] = useState("");
  const [nuevoEmpEspecialidad, setNuevoEmpEspecialidad] = useState("Electricidad");
  const [nuevoEmpSueldo, setNuevoEmpSueldo] = useState("12000");

  // Simulador de costos de rotación de personal
  const [numBajasAnuales, setNumBajasAnuales] = useState(3);
  const costoReclutamientoFirma = 12000; // Liquidación, búsqueda, onboarding, etc.
  const perdidaConocimientoActivo = 16000; // Daños por errores de personal novato

  const handleCapacitarEmpleado = (id: string) => {
    const certificadosDisponibles = [
      "Certificado Rigging de Motores",
      "SST Alturas Avanzado",
      "Auditoría de Activos Inmobiliarios",
      "Diagnóstico Predictivo de Vibraciones",
      "Operación Segura de Calderas ASME",
      "Primeros Auxilios e Incendios"
    ];

    setEmpleados(prev => prev.map(emp => {
      if (emp.id === id) {
        // Seleccionar una que no tenga
        const noObtenidas = certificadosDisponibles.filter(c => !emp.certificaciones.includes(c));
        const nuevaCert = noObtenidas.length > 0 
          ? noObtenidas[Math.floor(Math.random() * noObtenidas.length)]
          : "Certificación Kaizen Master";

        let nuevoXp = emp.xp + 45;
        let nuevoNivel = emp.nivel;
        if (nuevoXp >= 100) {
          nuevoNivel += 1;
          nuevoXp = nuevoXp % 100;
        }

        return {
          ...emp,
          nivel: nuevoNivel,
          xp: nuevoXp,
          certificaciones: [...emp.certificaciones, nuevaCert],
          rotacionRiesgo: "Bajo" // Baja el riesgo de fuga/rotación por motivación y pertenencia
        };
      }
      return emp;
    }));

    const empObj = empleados.find(e => e.id === id);
    onTriggerToast(`🎓 ¡${empObj?.nombre} ha completado su entrenamiento! Su riesgo de rotación bajó a "Bajo".`);

    onAddTrazabilidad({
      id: `tra_training_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: "",
      accion: `Capacitación y Micro-certificación entregada a ${empObj?.nombre}. Especialidad consolidada.`,
      actor: "Administración Innovarum",
      fecha: new Date().toLocaleDateString("es-MX")
    });
  };

  const handleGamificarMision = (id: string) => {
    setEmpleados(prev => prev.map(emp => {
      if (emp.id === id) {
        let nuevoXp = emp.xp + 30;
        let nuevoNivel = emp.nivel;
        if (nuevoXp >= 100) {
          nuevoNivel += 1;
          nuevoXp = nuevoXp % 100;
        }
        return {
          ...emp,
          xp: nuevoXp,
          nivel: nuevoNivel,
          misionesCompletadas: emp.misionesCompletadas + 1
        };
      }
      return emp;
    }));

    const empObj = empleados.find(e => e.id === id);
    onTriggerToast(`⚡ Misión Kaizen completada por ${empObj?.nombre}. +30 XP acumulados.`);
  };

  const handleAgregarEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoEmpNombre.trim()) return;

    const nuevo: typeof empleados[0] = {
      id: `emp_${Date.now()}`,
      nombre: nuevoEmpNombre,
      especialidad: nuevoEmpEspecialidad,
      nivel: 1,
      xp: 0,
      certificaciones: ["Inducción General Innovarum"],
      rotacionRiesgo: "Medio",
      misionesCompletadas: 0,
      sueldoMensual: Number(nuevoEmpSueldo) || 12000
    };

    setEmpleados(prev => [...prev, nuevo]);
    setNuevoEmpNombre("");
    onTriggerToast(`👤 Nuevo empleado ${nuevo.nombre} registrado en el sistema.`);
  };

  // Evaluation Modal states
  const [showEvalModal, setShowEvalModal] = useState<boolean>(false);
  const [evalProvId, setEvalProvId] = useState<string>("prov_hmas");
  const [evalCalificacion, setEvalCalificacion] = useState<number>(5);
  const [evalTiempoResp, setEvalTiempoResp] = useState<string>("");
  const [evalCostoEstimado, setEvalCostoEstimado] = useState<string>("1500");
  const [evalCostoReal, setEvalCostoReal] = useState<string>("1500");
  const [evalATiempo, setEvalATiempo] = useState<boolean>(true);
  const [evalNota, setEvalNota] = useState<string>("");

  // Period filter
  const [filtroArea, setFiltroArea] = useState<string>("todos");

  // 2. Composite Score Calculator
  // Score compuesto = (cumplimiento × 0.35) + (calificacion/5 × 0.30) + (1 - |variacion_costo| × 0.20) + (resp_norm × 0.15)
  // where resp_norm = 1 - clamp(tiempo_respuesta_horas / 72, 0, 1)
  const calculateCompositeScore = (item: ProveedorSST): number => {
    const cumplimiento = item.cumplimientoPct / 100; // max 1.0 (weight 35)
    const calif = item.calificacionPromedio / 5; // max 1.0 (weight 30)
    
    // cost variance (weight 20)
    // Absolute difference, bounded so it doesn't break
    const vCostoNorm = Math.max(0, 1 - Math.abs(item.variacionCosto));
    
    // speed normalizer (weight 15)
    const respNorm = 1 - Math.max(0, Math.min(1, item.tiempoRespuestaHoras / 72));

    const score = (cumplimiento * 35) + (calif * 30) + (vCostoNorm * 20) + (respNorm * 15);
    return Math.round(score);
  };

  // Process list with scores
  const proveedoresConScore = useMemo(() => {
    return proveedores.map(p => {
      const score = calculateCompositeScore(p);
      return {
        ...p,
        score
      };
    }).filter(p => {
      if (filtroArea === "todos") return true;
      if (p.areaEspecialidad.toLowerCase().includes(filtroArea.toLowerCase())) return true;
      return false;
    }).sort((a, b) => b.score - a.score);
  }, [proveedores, filtroArea]);

  const activeProvider = useMemo(() => {
    return proveedoresConScore.find(p => p.id === selectedProvId) || proveedoresConScore[0];
  }, [proveedoresConScore, selectedProvId]);

  // Handle assessment submit
  const handleEvalGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTiempoResp || isNaN(Number(evalTiempoResp))) {
      onTriggerToast("❌ Ingrese un tiempo de respuesta válido en horas.");
      return;
    }
    const cEst = Number(evalCostoEstimado) || 1200;
    const cReal = Number(evalCostoReal) || 1200;
    const varCostoCalculada = (cReal - cEst) / cEst;

    // Mutate supplier record to represent evaluated stats
    setProveedores(prev => prev.map(p => {
      if (p.id === evalProvId) {
        // compute sliding average
        const nuevaCalif = Number(((p.calificacionPromedio * 4 + evalCalificacion) / 5).toFixed(1));
        const nuevoTiempo = Math.round((p.tiempoRespuestaHoras * 4 + Number(evalTiempoResp)) / 5);
        const nuevaCumplimiento = evalATiempo 
          ? Math.min(100, Math.round((p.cumplimientoPct * 4 + 100) / 5))
          : Math.max(0, Math.round((p.cumplimientoPct * 4 + 0) / 5));
        const nuevaVariacion = Number(((p.variacionCosto * 4 + varCostoCalculada) / 5).toFixed(3));
        
        // append new score to historical record
        const simulatedScore = Math.max(20, Math.min(100, p.historicoScores[p.historicoScores.length - 1] + (evalCalificacion >= 4 ? 2 : -4)));
        const nuevosScores = [...p.historicoScores.slice(1), simulatedScore];

        return {
          ...p,
          calificacionPromedio: nuevaCalif,
          tiempoRespuestaHoras: nuevoTiempo,
          cumplimientoPct: nuevaCumplimiento,
          variacionCosto: nuevaVariacion,
          historicoScores: nuevosScores
        };
      }
      return p;
    }));

    // Audit trace event
    const pNombre = proveedores.find(p => p.id === evalProvId)?.nombre || "Proveedor";
    const log: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: "",
      accion: `Se completó evaluación de desempeño para "${pNombre}". Calificación: ${evalCalificacion} estrellas, tiempo: ${evalTiempoResp}h, costo real vs est: $${cReal}/$${cEst}.`,
      actor: "Laura Méndez (Administradora)",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    onAddTrazabilidad(log);

    onTriggerToast(`🏆 Evaluación registrada con éxito. Kaizen Leaderboard recalibrado.`);
    setShowEvalModal(false);
    
    // Reset inputs
    setEvalNota("");
    setEvalTiempoResp("");
  };

  // Convert last 6 months scores to chart format
  const activeCharData = useMemo(() => {
    if (!activeProvider) return [];
    const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun"];
    return activeProvider.historicoScores.map((score, i) => ({
      mes: meses[i],
      score
    }));
  }, [activeProvider]);

  return (
    <div id="tpm-proveedores" className="space-y-8 animate-fade-in text-xs">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-brand-green-dark uppercase bg-brand-green-soft px-2.5 py-1 rounded-full border border-brand-green/20">kaizen leader board</span>
            <h1 className="text-2xl font-extrabold text-[#2B2B2B] mt-2">Ranking de Contratistas S.S.T y Kaizen</h1>
            <p className="text-slate-500 text-xs mt-1">
              Indicador de solvencia y calidad técnica de proveedores. Evalúa el cumplimiento exacto del programa preventivo y el control del impacto presupuestario de imprevistos.
            </p>
          </div>
          <button
            onClick={() => {
              setEvalProvId(selectedProvId);
              setShowEvalModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white hover:bg-brand-green-dark text-xs font-bold rounded-xl shadow-sm transition cursor-pointer"
          >
            <PlusCircle size={14} /> Evaluar Tarea Realizada
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS & SYSTEM LIMITS ALERT */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">Filtrar Especialidad:</span>
          <select 
            value={filtroArea} 
            onChange={(e) => setFiltroArea(e.target.value)}
            className="p-1 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-bold"
          >
            <option value="todos">Todos</option>
            <option value="gas">Gas</option>
            <option value="electricidad">Electricidad</option>
            <option value="mantenimiento">General / Albercas</option>
            <option value="incendios">Sistemas Incendio</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
          <span className="font-semibold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full uppercase text-[9.5px]">
            Límite de Calidad Crítico: Menor a 50 pts
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEADERBOARD TABLE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-2">
              <Trophy size={16} className="text-[#84BD4B]" /> Ranking General de Proveedores del Condominio
            </h3>

            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <th className="py-3 px-3 font-black text-[9.5px] uppercase">Rango</th>
                    <th className="py-3 px-4 font-black text-[9.5px] uppercase">Proveedor / Razón Social</th>
                    <th className="py-3 px-3 font-black text-[9.5px] uppercase">Cumplimiento</th>
                    <th className="py-3 px-3 font-black text-[9.5px] uppercase">Calificación</th>
                    <th className="py-3 px-4 font-black text-[9.5px] uppercase text-right">TPM Score</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedoresConScore.map((prov, index) => {
                    const isSelected = selectedProvId === prov.id;
                    const isAlert = prov.score < 50;
                    
                    return (
                      <tr 
                        key={prov.id}
                        id={`supplier-row-${prov.id}`}
                        onClick={() => setSelectedProvId(prov.id)}
                        className={`border-b last:border-0 border-slate-100 hover:bg-slate-50 cursor-pointer transition ${
                          isSelected ? "bg-brand-green-soft/45 font-bold" : ""
                        }`}
                      >
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            {index === 0 && <Award size={14} className="text-amber-500" />}
                            <span className="font-mono text-slate-500 font-bold">#{index + 1}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {prov.nombre}
                          <span className="block text-[9.5px] text-slate-400 font-normal">{prov.areaEspecialidad}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-600">{prov.cumplimientoPct}%</td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-0.5 text-amber-500">
                            <Star size={11} fill="currentColor" />
                            <span className="font-mono font-bold">{prov.calificacionPromedio}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs ${
                            isAlert ? "bg-red-200 text-red-800 animate-pulse" : isSelected ? "bg-[#2B2B2B] text-white" : "bg-slate-100 text-slate-800"
                          }`}>
                            {prov.score} pts
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* DETAILS Inspect Card */}
        <div className="lg:col-span-5 space-y-6">
          {activeProvider ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              
              {/* Header Details */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Inspección de Contratista</span>
                  {activeProvider.score < 50 && (
                    <span className="px-2 py-0.5 bg-red-600 text-white font-bold text-[9px] rounded-full uppercase flex items-center gap-1">
                      <ShieldAlert size={10} /> Alerta de Calidad
                    </span>
                  )}
                </div>
                <h4 className="font-extrabold text-[#2B2B2B] text-sm mt-1">{activeProvider.nombre}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[9.5px] font-bold">
                    {activeProvider.areaEspecialidad}
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-400">{activeProvider.rfc}</span>
                </div>
              </div>

              {/* Aggregated KPIs of Provider */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase flex items-center gap-1">
                    <Clock size={11} /> Resp. Promedio
                  </span>
                  <p className="text-sm font-black text-slate-800 font-mono">{activeProvider.tiempoRespuestaHoras} hrs</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <span className="text-[9px] text-gray-400 font-extrabold uppercase flex items-center gap-1">
                    <DollarSign size={11} /> Desv. Presupuestal
                  </span>
                  <p className="text-sm font-black text-slate-800 font-mono">
                    {activeProvider.variacionCosto >= 0 ? "+" : ""}{(activeProvider.variacionCosto * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Linear chart for Score History */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 block pb-1 border-b border-slate-50">Evolución de Calidad (Último Semestre)</span>
                <div className="h-40 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeCharData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                      <XAxis dataKey="mes" stroke="#94A3B8" fontSize={9} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} domain={[30, 100]} />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#84BD4B" 
                        strokeWidth={2} 
                        dot={{ r: 3, strokeWidth: 1.5, fill: "#FFF" }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Warning Alert */}
              {activeProvider.score < 50 ? (
                <div className="p-4 bg-red-50 border border-red-200 text-red-950 rounded-xl space-y-2">
                  <h5 className="font-extrabold flex items-center gap-1 text-red-800">
                    <AlertOctagon size={13} /> Proveedor Crítico / Alerta General
                  </h5>
                  <p className="text-[10.5px] leading-relaxed">
                    Este proveedor ha sumado baja efectividad y sobregiros recurrentes de presupuesto. Se requiere citar a panel de auditoría o rescisión de contrato de mantenimiento común.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-950 rounded-xl flex items-start gap-2">
                  <ThumbsUp size={15} className="text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-[10.5px] leading-relaxed text-emerald-800">
                    Socio técnico con rango óptimo de calidad Kaizen. Mantiene desviaciones presupuestarias menores a su rango estimado oficial.
                  </p>
                </div>
              )}

            </div>
          ) : (
            <div className="bg-slate-100 p-6 rounded-2xl text-center text-slate-400">
              Seleccione un contratista del ranking para ver su desglose.
            </div>
          )}
        </div>

      </div>

      {/* --- NUEVA SECCIÓN DE CERTIFICACIÓN, ENTRENAMIENTO Y GAMIFICACIÓN --- */}
      <div id="gamificacion-mantenimiento" className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6 animate-fade-in">
        
        {/* Encabezado de la Sección */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-wider text-[#947235] uppercase bg-[#FAF6ED] px-2.5 py-1 rounded-full border border-brand-green/20">
              Retención de Talento & Kaizen Operativo
            </span>
            <h2 className="text-lg font-extrabold text-[#0A1B3D] flex items-center gap-2">
              <GraduationCap className="text-[#C5A059] shrink-0" size={20} />
              Certificación, Entrenamiento y Gamificación de Empleados
            </h2>
            <p className="text-slate-500 text-xs">
              La constante rotación o "rodeo" de contratistas novatos sale hasta un 40% más caro debido a pérdidas en el conocimiento de activos críticos. Incentiva la lealtad con micro-certificados, XP y misiones preventivas.
            </p>
          </div>
          
          <div className="bg-[#FAF6ED] border border-[#C5A059]/25 p-3 rounded-xl flex items-center gap-3 shrink-0 max-w-sm">
            <Flame className="text-[#C5A059] animate-pulse" size={20} />
            <div>
              <span className="text-[10px] font-bold text-[#947235] uppercase block">Eficiencia del Equipo</span>
              <p className="text-xs font-bold text-[#0A1B3D]">
                Nivel Promedio: {(empleados.reduce((acc, curr) => acc + curr.nivel, 0) / empleados.length).toFixed(1)} ⭐️
              </p>
            </div>
          </div>
        </div>

        {/* Panel Principal de Dos Columnas: Tarjetas de Colaboradores e Indicadores Financieros */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* COLUMNA IZQUIERDA (8 de 12): Listado de Empleados Gamificados */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#0A1B3D] text-xs flex items-center gap-2">
                <Users size={16} className="text-[#C5A059]" />
                Plantilla Operativa y Certificaciones Activas
              </h3>
              <span className="text-[10px] text-slate-400 font-mono font-bold">
                {empleados.length} Colaboradores Activos
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {empleados.map(emp => {
                const riesgoColor = 
                  emp.rotacionRiesgo === "Alto" ? "bg-red-50 text-red-700 border-red-200" :
                  emp.rotacionRiesgo === "Medio" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : // Changed gold/amber to green/emerald as requested!
                  "bg-emerald-50 text-emerald-700 border-emerald-150";

                return (
                  <div 
                    key={emp.id} 
                    id={`emp-card-${emp.id}`}
                    className="bg-slate-50/50 hover:bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex flex-col justify-between transition hover:shadow-sm"
                  >
                    {/* Header: Nombre, Especialidad, Riesgo */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-[#0A1B3D] text-xs">{emp.nombre}</h4>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{emp.especialidad}</p>
                        </div>
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded-full border ${riesgoColor}`}>
                          Riesgo Fuga: {emp.rotacionRiesgo}
                        </span>
                      </div>

                      {/* Nivel y Barra de XP */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-bold">
                          <span className="text-[#0A1B3D] flex items-center gap-1">
                            <Sparkles size={11} className="text-[#C5A059]" /> Nivel {emp.nivel}
                          </span>
                          <span className="text-slate-400 font-mono font-bold">{emp.xp}/100 XP</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#C5A059] transition-all duration-500 rounded-full" 
                            style={{ width: `${emp.xp}%` }}
                          />
                        </div>
                      </div>

                      {/* Lista de Certificaciones */}
                      <div className="pt-2">
                        <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block mb-1">Certificados S.S.T:</span>
                        <div className="flex flex-wrap gap-1">
                          {emp.certificaciones.map((cert, idx) => (
                            <span 
                              key={idx} 
                              className="text-[9px] font-bold bg-white border border-slate-150 text-slate-600 px-2 py-0.5 rounded-md"
                            >
                              🛡️ {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Acciones de Gamificación y Capacitación */}
                    <div className="flex items-center gap-2 pt-4 mt-4 border-t border-slate-100">
                      <button
                        id={`btn-train-${emp.id}`}
                        onClick={() => handleCapacitarEmpleado(emp.id)}
                        className="flex-1 py-1.5 px-2 bg-[#C5A059] hover:bg-[#A38042] text-white rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <GraduationCap size={11} /> Entrenar
                      </button>
                      <button
                        id={`btn-quest-${emp.id}`}
                        onClick={() => handleGamificarMision(emp.id)}
                        className="flex-1 py-1.5 px-2 bg-[#0A1B3D] hover:bg-slate-800 text-white rounded-lg text-[10px] font-black transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Flame size={11} className="text-[#C5A059]" /> Misión (+30 XP)
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Formulario rápido para registrar nuevo personal técnico */}
            <form 
              id="frm-add-empleado"
              onSubmit={handleAgregarEmpleado} 
              className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col md:flex-row items-end gap-3.5"
            >
              <div className="flex-1 space-y-1 w-full">
                <label htmlFor="input-emp-nombre" className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                  Nombre del Técnico
                </label>
                <input 
                  type="text"
                  id="input-emp-nombre"
                  placeholder="Ej. Andrés Barbosa"
                  required
                  value={nuevoEmpNombre}
                  onChange={(e) => setNuevoEmpNombre(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 outline-none text-xs rounded-lg text-slate-800 font-bold"
                />
              </div>

              <div className="w-full md:w-44 space-y-1">
                <label htmlFor="select-emp-esp" className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                  Especialidad Principal
                </label>
                <select 
                  id="select-emp-esp"
                  value={nuevoEmpEspecialidad}
                  onChange={(e) => setNuevoEmpEspecialidad(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 outline-none text-xs rounded-lg text-slate-700 font-bold"
                >
                  <option value="Electricidad & CFE">Electricidad & CFE</option>
                  <option value="SST Gas y Fluidos">SST Gas y Fluidos</option>
                  <option value="Climas & HVAC">Climas & HVAC</option>
                  <option value="Obra Civil / Albañilería">Obra Civil / Albañilería</option>
                </select>
              </div>

              <div className="w-full md:w-32 space-y-1">
                <label htmlFor="input-emp-sueldo" className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block">
                  Sueldo Mensual ($)
                </label>
                <input 
                  type="number"
                  id="input-emp-sueldo"
                  placeholder="12000"
                  value={nuevoEmpSueldo}
                  onChange={(e) => setNuevoEmpSueldo(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 outline-none text-xs rounded-lg text-slate-800 font-mono font-bold"
                />
              </div>

              <button 
                type="submit" 
                id="btn-submit-add-emp"
                className="py-2 px-4 bg-[#C5A059] hover:bg-[#A38042] text-white text-xs font-black rounded-lg transition shrink-0 cursor-pointer h-9 flex items-center gap-1"
              >
                <Plus size={14} /> Registrar
              </button>
            </form>

          </div>

          {/* COLUMNA DERECHA (4 de 12): Calculador Financiero del "Rodeo de Personal" */}
          <div className="lg:col-span-4 space-y-5">
            <h3 className="font-extrabold text-[#0A1B3D] text-xs flex items-center gap-2">
              <TrendingDown size={16} className="text-[#C5A059]" />
              Simulador Financiero de la Rotación
            </h3>

            <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cada baja imprevista en el condominio (despido, renuncia o rotación de contratista que no conoce las instalaciones) implica costos ocultos severos de onboarding y daños fortuitos a activos complejos.
              </p>

              {/* Slider de Bajas Anuales */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-500">Bajas de Personal / Año:</span>
                  <span className="text-brand-green font-mono text-sm">{numBajasAnuales} eventos</span>
                </div>
                <input 
                  type="range"
                  id="slider-bajas-anuales"
                  min="1"
                  max="10"
                  value={numBajasAnuales}
                  onChange={(e) => setNumBajasAnuales(Number(e.target.value))}
                  className="w-full h-2 bg-white rounded-lg appearance-none cursor-pointer"
                  style={{ accentColor: '#C5A059' }}
                />
              </div>

              {/* desglose de costos */}
              <div className="space-y-2.5 pt-2 text-[11px] border-t border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Costo Liquidación & Reclutamiento:</span>
                  <span className="font-mono text-slate-800 font-bold">
                    ${(numBajasAnuales * costoReclutamientoFirma).toLocaleString()} MXN
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pérdida Conocimiento de Activo:</span>
                  <span className="font-mono text-slate-800 font-bold">
                    ${(numBajasAnuales * perdidaConocimientoActivo).toLocaleString()} MXN
                  </span>
                </div>
                <div className="flex justify-between text-xs font-black text-red-700 pt-1.5 border-t border-dashed border-slate-200">
                  <span>Pérdida por Alta Rotación:</span>
                  <span>
                    ${(numBajasAnuales * (costoReclutamientoFirma + perdidaConocimientoActivo)).toLocaleString()} MXN
                  </span>
                </div>
              </div>

              {/* costo con Plan de Capacitación Innovarum */}
              <div className="p-3 bg-[#FAF6ED] border border-[#C5A059]/20 rounded-lg text-[10.5px] text-[#947235] leading-relaxed space-y-1.5">
                <div className="font-bold flex items-center gap-1 text-[#947235]">
                  <BookOpen size={12} /> Plan de Retención Innovarum
                </div>
                <p>
                  Certificar y gamificar a su personal técnico actual cuesta solo <strong>$3,500 MXN anuales</strong> por empleado, aumentando la lealtad un 90%.
                </p>
                <div className="flex justify-between font-bold pt-1.5 border-t border-[#C5A059]/15 text-xs text-[#0A1B3D]">
                  <span>Costo de Capacitación:</span>
                  <span>${(empleados.length * 3500).toLocaleString()} MXN</span>
                </div>
              </div>

              {/* Retorno de Inversión y Ahorros */}
              <div className="p-3.5 bg-[#0A1B3D] text-white rounded-lg space-y-1">
                <span className="text-[9px] font-black text-[#C5A059] uppercase tracking-widest block">Ahorro Neto Estimado</span>
                <p className="text-base font-black font-mono text-[#C5A059]">
                  ${Math.max(0, (numBajasAnuales * (costoReclutamientoFirma + perdidaConocimientoActivo)) - (empleados.length * 3500)).toLocaleString()} MXN
                </p>
                <p className="text-[9px] text-slate-300">
                  Invertir en capacitación evita el "rodeo de personal" y reduce imprevistos. Trazabilidad con Innovarum.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* EVALUATION MODAL FORM VIEW */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md animate-scale-up space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                <FileCheck2 size={16} className="text-[#84BD4B]" /> Auditoría y Evaluación de Tarea
              </h3>
              <button 
                onClick={() => setShowEvalModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleEvalGuardar} className="space-y-3.5">
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Contratista Evaluado</label>
                <select
                  value={evalProvId}
                  onChange={(e) => setEvalProvId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 text-xs rounded-xl outline-none"
                >
                  {proveedores.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Star selector */}
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Calificación de Servicio (1 a 5)</label>
                <div className="flex items-center gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((starIdx) => {
                    const isLit = starIdx <= evalCalificacion;
                    return (
                      <button
                        key={starIdx}
                        type="button"
                        onClick={() => setEvalCalificacion(starIdx)}
                        className="text-amber-400 hover:scale-110 transition cursor-pointer"
                      >
                        <Star size={20} fill={isLit ? "currentColor" : "none"} stroke="currentColor" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Tiempo Respuesta (hrs)</label>
                  <input
                    type="text"
                    placeholder="Ej. 12"
                    required
                    value={evalTiempoResp}
                    onChange={(e) => setEvalTiempoResp(e.target.value)}
                    className="w-full p-2 border border-slate-200 outline-none text-xs rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-2 pt-5 select-none">
                  <input 
                    type="checkbox" 
                    id="chk-atiempo" 
                    checked={evalATiempo}
                    onChange={(e) => setEvalATiempo(e.target.checked)}
                    className="w-4 h-4 text-brand-green accent-brand-green rounded border-slate-300" 
                  />
                  <label htmlFor="chk-atiempo" className="text-xs font-bold text-slate-600 block">Completada a Tiempo</label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Presupuesto Estimado ($)</label>
                  <input
                    type="text"
                    value={evalCostoEstimado}
                    onChange={(e) => setEvalCostoEstimado(e.target.value)}
                    className="w-full p-2 border border-slate-200 outline-none text-xs rounded-xl font-mono text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Costo Real Cobrado ($)</label>
                  <input
                    type="text"
                    value={evalCostoReal}
                    onChange={(e) => setEvalCostoReal(e.target.value)}
                    className="w-full p-2 border border-[#84BD4B] outline-none text-xs rounded-xl font-mono text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Comentario General / S.S.T Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Detalle reporte de protección civil, bitácora de firmas o calidad del sopleteado..."
                  value={evalNota}
                  onChange={(e) => setEvalNota(e.target.value)}
                  className="w-full p-2 border border-slate-200 outline-none text-xs rounded-xl"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-green hover:bg-brand-green-dark text-white text-xs font-black rounded-xl transition cursor-pointer"
                >
                  Guardar Evaluación de Contratista
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
