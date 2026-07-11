import React, { useState, useMemo } from "react";
import { TareaPreventiva, Area } from "../types";
import { BRAND } from "../config/brand";
import {
  Sliders,
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  Download,
  AlertCircle,
  TrendingDown,
  Sparkles,
  Award
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { jsPDF } from "jspdf";

interface SimuladorAsambleaProps {
  areas: Area[];
  tareas: TareaPreventiva[];
  currentScenario?: 'A' | 'B';
  onTriggerToast: (msg: string) => void;
}

export default function SimuladorAsamblea({ areas, tareas, currentScenario = 'A', onTriggerToast }: SimuladorAsambleaProps) {
  
  // 1. Sliders Input Variables (States)
  const [cuotaMensual, setCuotaMensual] = useState<number>(3500); // MXN
  const [incrementoAnual, setIncrementoAnual] = useState<number>(8); // %
  const [pctPreventivo, setPctPreventivo] = useState<number>(60); // % del presupuesto
  const [numUnidades, setNumUnidades] = useState<number>(140); // deptos
  const [pctMorosidad, setPctMorosidad] = useState<number>(15); // %
  const [aniosProyeccion, setAniosProyeccion] = useState<number>(5); // años
  const [fondoReservaPct, setFondoReservaPct] = useState<number>(10); // % reserved specifically for major infrastructure (Módulo 11)

  const COSTO_PROMEDIO_TAREA = 1500; // Costo por mantenimiento promedio en MXN

  // 2. Computed Financial Calculations
  const calculations = useMemo(() => {
    // Presupuesto Anual Disponible (efectivo descontando morosidad)
    const presupuestoAnualTeorico = cuotaMensual * numUnidades * 12;
    const presupuestoAnual = presupuestoAnualTeorico * (1 - pctMorosidad / 100);
    
    // Presupuesto destinado a preventivo
    const preventivoAnual = presupuestoAnual * (pctPreventivo / 100);
    
    // Cuántas tareas preventivas cubre al mes
    const tareasCubiertasMes = Math.round(preventiveBudget(preventivoAnual) / 12 / COSTO_PROMEDIO_TAREA);
    
    // Colchón de imprevistos
    const colchonImprevistos = presupuestoAnual - preventivoAnual;
    const colchonPct = 100 - pctPreventivo;

    // Ahorro vs Mantenimiento 100% correctivo
    // (Correctivo cuesta ~3x el preventivo según estudios TPM, ahorro neto es 2x preventivo)
    const ahorroAnualEst = preventivoAnual * 2;
    
    // ROI en años
    const roiAnios = ahorroAnualEst > 0 ? Number((preventivoAnual / ahorroAnualEst).toFixed(2)) : 0;

    // OEE Proyectado (Correlación estimada)
    const oeeProyectado = Math.min(98, Math.round(60 + pctPreventivo * 0.38));

    return {
      presupuestoAnual: Math.round(presupuestoAnual),
      presupuestoefectivo: Math.round(presupuestoAnualTeorico),
      preventivoAnual: Math.round(preventivoAnual),
      tareasCubiertasMes,
      colchonImprevistos: Math.round(colchonImprevistos),
      colchonPct,
      ahorroAnualEst: Math.round(ahorroAnualEst),
      roiAnios,
      oeeProyectado
    };
  }, [cuotaMensual, pctPreventivo, numUnidades, pctMorosidad]);

  function preventiveBudget(anual: number) {
    return anual;
  }

  // 3. Stacked Bar Chart Projection Data
  const chartProjectionData = useMemo(() => {
    const data = [];
    let currentAnualBudget = calculations.presupuestoAnual;
    let currentPreventive = calculations.preventivoAnual;
    let currentColchon = calculations.colchonImprevistos;

    for (let i = 1; i <= aniosProyeccion; i++) {
      data.push({
        name: `Año ${i}`,
        preventivo: Math.round(currentPreventive),
        imprevistos: Math.round(currentColchon),
        total: Math.round(currentAnualBudget)
      });
      // apply annual compound fee increase
      currentAnualBudget = currentAnualBudget * (1 + incrementoAnual / 100);
      currentPreventive = currentAnualBudget * (pctPreventivo / 100);
      currentColchon = currentAnualBudget * ((100 - pctPreventivo) / 100);
    }
    return data;
  }, [calculations, incrementoAnual, pctPreventivo, aniosProyeccion]);

  // 4. Prioritized tasks that fit vs those left out
  // Prioritized from actual tasks or mock tasks matching common areas
  const prioridadesMapeadas = useMemo(() => {
    const totalDisponibles = [
      { id: "p1", titulo: "Pruebas herméticas de gas", area: "Gas / Cocina", criticidad: "Alta", costo: 1800, r: 1 },
      { id: "p2", titulo: "Termografía de subestación", area: "Subestación Luz", criticidad: "Crítica", costo: 4200, r: 2 },
      { id: "p3", titulo: "Purga y ajuste de bombas", area: "Agua Bombeo", criticidad: "Alta", costo: 2200, r: 3 },
      { id: "p4", titulo: "Calibración tableros eléctricos", area: "Luz General", criticidad: "Media", costo: 1900, r: 4 },
      { id: "p5", titulo: "Soplado filtros de alberca", area: "Alberca", criticidad: "Baja", costo: 1200, r: 5 },
      { id: "p6", titulo: "Mecánica de elevadores comunes", area: "Elevadores", criticidad: "Crítica", costo: 6400, r: 6 },
      { id: "p7", titulo: "Sanitización ductos aire", area: "Pasillos", criticidad: "Media", costo: 3100, r: 7 },
      { id: "p8", titulo: "Pruebas red rociadores", area: "Control Incendios", criticidad: "Alta", costo: 2800, r: 8 },
      { id: "p9", titulo: "Grabador CCTV calibración", area: "Seguridad", criticidad: "Baja", costo: 900, r: 9 },
    ].sort((a,b) => a.r - b.r);

    let bolsaRestante = calculations.preventivoAnual / 12; // monthly preventative wallet
    
    return totalDisponibles.map(t => {
      const cabe = bolsaRestante >= t.costo;
      if (cabe) {
        bolsaRestante -= t.costo;
      }
      return {
        ...t,
        cubre: cabe
      };
    });
  }, [calculations]);

  // 5. Action: Export Scenario to PDF
  const handleExportScenarioPDF = () => {
    const doc = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4"
    });

    // Elegant primary colors
    doc.setFillColor(43, 43, 43); // #2B2B2B
    doc.rect(0, 0, 210, 32, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("INOVARUM INMUEBLES - INFORME DE PROYECCIÓN FINANCIERA", 14, 14);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(180, 230, 200);
    doc.text("Herramienta de Simulación y Sustentabilidad TPM para Asambleas de Condóminos", 14, 21);
    
    const condominioNombre = currentScenario === 'B' ? "Torre Ejecutiva Zapopan - Edificio Completo" : "Condominio Piloto: Las Vertientes - Casa Club";
    doc.text(condominioNombre, 14, 26);

    // Context metadata
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text("VALORES SELECCIONADOS EN EL SIMULADOR:", 14, 45);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`· Cuota Mensual Planificada: $${cuotaMensual.toLocaleString()} MXN`, 18, 52);
    doc.text(`· Unidades del Condominio: ${numUnidades} residencias`, 18, 58);
    doc.text(`· % Morosidad histórica calculada: ${pctMorosidad}%`, 18, 64);
    doc.text(`· Asignación al Programa Preventivo: ${pctPreventivo}%`, 110, 52);
    doc.text(`· Proyección Estimada de Incremento: ${incrementoAnual}% anual`, 110, 58);
    
    if (currentScenario === 'B') {
      doc.text(`· Retención Fondo de Reserva: ${fondoReservaPct}%`, 110, 64);
    } else {
      doc.text(`· Horizonte de Proyección: ${aniosProyeccion} años`, 110, 64);
    }

    // Horizontal split line
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 71, 196, 71);

    // Results Column
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(43, 43, 43);
    doc.text("MÉTRICAS FINANCIERAS Y OPERATIVAS OBTENIDAS:", 14, 79);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`📈 Presupuesto Anual Neto Disponible: `, 18, 86);
    doc.setFont("Helvetica", "bold");
    doc.text(`$${calculations.presupuestoAnual.toLocaleString()} MXN`, 85, 86);

    doc.setFont("Helvetica", "normal");
    doc.text(`🛡️ Presupuesto Neto Programa Preventivo: `, 18, 92);
    doc.setFont("Helvetica", "bold");
    doc.text(`$${calculations.preventivoAnual.toLocaleString()} MXN (anual)`, 85, 92);

    doc.setFont("Helvetica", "normal");
    doc.text(`💼 Fideicomiso / Fondo de Imprevistos: `, 18, 98);
    doc.setFont("Helvetica", "bold");
    doc.text(`$${calculations.colchonImprevistos.toLocaleString()} MXN (${calculations.colchonPct}%)`, 85, 98);

    let offsetGreenY = 104;
    if (currentScenario === 'B') {
      doc.setFont("Helvetica", "normal");
      doc.text(`🧱 Fondo Especial de Reserva (Criticidad): `, 18, 104);
      doc.setFont("Helvetica", "bold");
      const resAnual = calculations.presupuestoAnual * (fondoReservaPct / 100);
      doc.text(`$${Math.round(resAnual).toLocaleString()} MXN (${fondoReservaPct}%)`, 85, 104);
      offsetGreenY = 110;
    }

    doc.setFont("Helvetica", "normal");
    doc.text(`🌱 Ahorro Estimado vs Mantenimiento Correctivo: `, 18, offsetGreenY);
    doc.setFont("Helvetica", "bold");
    doc.setTextColor(94, 142, 46); // green text
    doc.text(`$${calculations.ahorroAnualEst.toLocaleString()} MXN / año`, 85, offsetGreenY);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(43, 43, 43);
    doc.text(`OEE Operativo Condominal Estimado: ${calculations.oeeProyectado}% (Clase Mundial)`, 18, offsetGreenY + 8);

    // Prioritized Tasks Table Header
    const tableHeaderY = offsetGreenY + 18;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, tableHeaderY, 182, 7, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text("Plan de Tareas Cubierto con la Cuota", 16, tableHeaderY + 5);
    doc.text("Costo", 140, tableHeaderY + 5);
    doc.text("Estatus Escenario", 165, tableHeaderY + 5);

    // List of tasks
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    let tableY = tableHeaderY + 12;
    
    prioridadesMapeadas.slice(0, 8).forEach(t => {
      doc.setTextColor(60, 60, 60);
      doc.text(`· [${t.criticidad}] ${t.titulo} (${t.area})`, 16, tableY);
      doc.text(`$${t.costo} MXN`, 140, tableY);
      
      if (t.cubre) {
        doc.setTextColor(94, 142, 46);
        doc.text("CUBIERTO", 165, tableY);
      } else {
        doc.setTextColor(200, 50, 50);
        doc.text("RECHAZADO / CORRECTIVO", 165, tableY);
      }
      tableY += 6;
    });

    // Stamp footer
    doc.setDrawColor(240, 240, 240);
    doc.line(14, 260, 196, 260);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Firma de Acreditación de Proyección:", 14, 266);
    doc.text("__________________________________________", 110, 266);
    doc.text("Innovarum Technologies - Algoritmo TPM de Simulación Financiera 2026. Huella Verde.", 14, 273);

    doc.save(`Innovarum_Proyecto_Firma_Asamblea_${cuotaMensual}cuota.pdf`);
    onTriggerToast("📄 PDF del Escenario de Asamblea exportado con éxito.");
  };

  return (
    <div id="tpm-simulador" className="space-y-8 animate-fade-in text-xs">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-brand-green-dark uppercase bg-brand-green-soft px-2.5 py-1 rounded-full border border-brand-green/20">simulación financiera asamblea</span>
            <h1 className="text-2xl font-extrabold text-[#2B2B2B] mt-2">Simulador de Escenarios (Asamblea)</h1>
            <p className="text-slate-500 text-xs mt-1">
              Visualizador proyectivo de recursos condominales. Simule aumentos, cuotas y niveles de morosidad para comprobar en tiempo real qué mantenimientos entran en presupuesto y el ROI esperado.
            </p>
          </div>
          <button
            onClick={handleExportScenarioPDF}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2B2B2B] text-white hover:bg-brand-green hover:text-[#2B2B2B] text-xs font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer"
          >
            <Download size={14} /> Exportar Escenario de Asamblea (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SLIDERS PANEL */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders size={16} className="text-[#84BD4B]" /> Variables de Entrada del Condominio
          </h3>

          <div className="space-y-4">
            {/* Cuota slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-1">💵 Cuota Mensual de Mantenimiento:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">${cuotaMensual} MXN</span>
              </div>
              <input
                type="range"
                min="500"
                max="10000"
                step="100"
                value={cuotaMensual}
                onChange={(e) => setCuotaMensual(Number(e.target.value))}
                className="w-full accent-[#84BD4B] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* % Preventivo allocation */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-1">🛡️ % Destinado a Preventivo:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{pctPreventivo}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={pctPreventivo}
                onChange={(e) => setPctPreventivo(Number(e.target.value))}
                className="w-full accent-[#84BD4B] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9.5px] text-gray-400">
                <span>Correctivos / Emergencias: {100 - pctPreventivo}%</span>
              </div>
            </div>

            {/* Num unidades */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-1">🏢 Residencias / Unidades de Cobro:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{numUnidades} Deptos</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                step="5"
                value={numUnidades}
                onChange={(e) => setNumUnidades(Number(e.target.value))}
                className="w-full accent-[#84BD4B] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Morosidad slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-1">📉 % de Morosidad Esperada (Impago):</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{pctMorosidad}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={pctMorosidad}
                onChange={(e) => setPctMorosidad(Number(e.target.value))}
                className="w-full accent-[#84BD4B] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Incremento slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-1">📈 % Incremento Cuota Anual:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{incrementoAnual}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={incrementoAnual}
                onChange={(e) => setIncrementoAnual(Number(e.target.value))}
                className="w-full accent-[#84BD4B] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Fondo de Reserva slider (Módulo 11 - Escenario B) */}
            {currentScenario === 'B' && (
              <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-black text-amber-900 flex items-center gap-1">🛡️ % Retenido para Fondo de Reserva:</span>
                  <span className="font-mono font-bold text-amber-950 bg-amber-100 px-2 py-0.5 rounded">{fondoReservaPct}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={fondoReservaPct}
                  onChange={(e) => setFondoReservaPct(Number(e.target.value))}
                  className="w-full accent-amber-600 h-2 bg-amber-100 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[9.5px] text-amber-800 leading-normal font-medium">
                  Este porcentaje de la cuota se acumula directamente en una subcuenta inviolable para reparaciones de capital (Elevadores, Red contra Incendios, Subestación eléctrica).
                </p>
                <div className="text-[10px] font-mono font-bold text-amber-950 border-t border-amber-200/50 pt-1.5">
                  Fondo Mensual: ${(calculations.presupuestoAnual * (fondoReservaPct / 100) / 12).toLocaleString(undefined, {maximumFractionDigits:0})} MXN
                </div>
              </div>
            )}

            {/* Años proyeccion */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-600 flex items-center gap-1">⏱️ Años de Proyección del Escenario:</span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{aniosProyeccion} años</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={aniosProyeccion}
                onChange={(e) => setAniosProyeccion(Number(e.target.value))}
                className="w-full accent-[#84BD4B] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* CALCULATED RESULTS */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calculator size={16} className="text-[#84BD4B]" /> Proyecciones Operativas de la Asamblea
            </h3>

            {/* Financial metrics block */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase">Presupuesto Anual</span>
                <p className="text-base font-black text-slate-800 font-mono">${calculations.presupuestoAnual.toLocaleString()}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase">Fondo Preventivo</span>
                <p className="text-base font-black text-[#5E8E2E] font-mono">${calculations.preventivoAnual.toLocaleString()}</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase">Bolsa Emergencias</span>
                <p className="text-base font-black text-slate-800 font-mono">${calculations.colchonImprevistos.toLocaleString()}</p>
              </div>

              <div className="p-3.5 bg-brand-green-soft border border-brand-green/20 rounded-xl space-y-1 col-span-2">
                <span className="text-[9px] text-[#5E8E2E] font-black uppercase">Ahorro Estimado Correctivos (Estudio TPM)</span>
                <p className="text-base font-black text-[#5E8E2E] font-mono">${calculations.ahorroAnualEst.toLocaleString()} MXN / año</p>
              </div>

              <div className="p-3.5 bg-[#2B2B2B] text-white rounded-xl space-y-1">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block">OEE Esperado</span>
                <p className="text-base font-black text-brand-green font-mono">{calculations.oeeProyectado}%</p>
              </div>
            </div>

            {/* Stacked Chart */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400 block border-b border-slate-50 pb-1">Proyección Presupuestaria a Largo Plazo ({aniosProyeccion} Años)</span>
              <div className="h-44 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartProjectionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F8FAFC" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={9} tickLine={false} />
                    <Tooltip />
                    <Legend iconSize={10} fontSize={9} />
                    <Bar dataKey="preventivo" name="Plan Preventivo" fill="#84BD4B" stackId="a" />
                    <Bar dataKey="imprevistos" name="Bolsa Imprevistos" fill="#2B2B2B" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRIORITIES CUBIERTAS TABLE */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
            <Award size={16} className="text-brand-green" /> Análisis del Plan de Mantenimientos Cubiertos por este Escenario
          </h3>
          <p className="text-xs text-slate-400">
            Con base en el presupuesto preventivo mensual simulado (${Math.round(calculations.preventivoAnual / 12).toLocaleString()} MXN / mes), así se priorizan los activos (priorizando criticidades y riesgos de falla):
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tareas Cubiertas */}
          <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1 uppercase bg-emerald-50 px-2 py-1 rounded w-fit">
              ✅ Mantenimientos Programados
            </h4>
            <div className="space-y-1.5 pt-1.5">
              {prioridadesMapeadas.filter(pm => pm.cubre).map(t => (
                <div key={t.id} className="flex justify-between items-center text-[11px] p-2 bg-slate-50 rounded-lg">
                  <span className="font-semibold text-slate-700 truncate max-w-[210px]">{t.titulo}</span>
                  <span className="font-mono text-slate-600 font-bold shrink-0">${t.costo} MXN</span>
                </div>
              ))}
              {prioridadesMapeadas.filter(pm => pm.cubre).length === 0 && (
                <p className="text-gray-400 italic py-4 text-center">Presupuesto insuficiente para cubrir mantenimientos prioritarios.</p>
              )}
            </div>
          </div>

          {/* Tareas Rechazadas por falta de presupuesto */}
          <div className="space-y-2 border border-slate-100 p-4 rounded-xl">
            <h4 className="text-xs font-bold text-red-700 flex items-center gap-1 uppercase bg-red-50 px-2 py-1 rounded w-fit">
              ❌ Mantenimientos Desplazados a Correctivo
            </h4>
            <div className="space-y-1.5 pt-1.5">
              {prioridadesMapeadas.filter(pm => !pm.cubre).map(t => (
                <div key={t.id} className="flex justify-between items-center text-[11px] p-2 bg-red-50/40 rounded-lg">
                  <span className="font-semibold text-red-950 truncate max-w-[210px]">{t.titulo}</span>
                  <span className="font-mono text-red-650 shrink-0 font-bold">${t.costo} MXN</span>
                </div>
              ))}
              {prioridadesMapeadas.filter(pm => !pm.cubre).length === 0 && (
                <p className="text-[#5E8E2E] italic py-4 text-center font-bold">🎉 ¡Felicidades! Esta cuota cubre el 100% del programa preventivo mensual.</p>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
