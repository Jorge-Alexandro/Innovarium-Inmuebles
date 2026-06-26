import React from "react";
import { TareaPreventiva, Area, EstadoSalud, EventoTrazabilidad } from "../types";
import { BRAND } from "../config/brand";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wallet, 
  ChevronRight, 
  ShieldAlert,
  Boxes,
  Activity,
  AlertCircle,
  Download
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { jsPDF } from "jspdf";

interface DashboardProps {
  tareas: TareaPreventiva[];
  areas: Area[];
  presupuestos: { area_id: string; monto_presupuestado: number; monto_gastado: number }[];
  trazabilidad: EventoTrazabilidad[];
  onSelectTarea: (tarea: TareaPreventiva) => void;
  onSetTab: (tab: string) => void;
}

export default function Dashboard({ tareas, areas, presupuestos, trazabilidad, onSelectTarea, onSetTab }: DashboardProps) {
  // Calculando KPIs generales
  const totalTareas = tareas.length;
  const completadas = tareas.filter(t => t.estado === "programada" && t.costo_real !== null).length; // Completas con costo real o evidencia cargada
  const conEvidencia = tareas.filter(t => t.costo_real !== null || t.id === "t1" || t.id === "t5" || t.id === "t6" || t.id === "t9" || t.id === "t11" || t.id === "t14").length; // simulated con evidencia
  const vencidas = tareas.filter(t => t.estado === "vencida").length;
  const porVencer = tareas.filter(t => t.estado === "en_curso").length;
  const programadasNormales = tareas.filter(t => t.estado === "programada" && t.costo_real === null).length;

  const cumplimientoPct = totalTareas > 0 ? Math.round(((totalTareas - vencidas) / totalTareas) * 100) : 100;

  const totalPresupuesto = presupuestos.reduce((acc, p) => acc + p.monto_presupuestado, 0);
  const totalGastado = presupuestos.reduce((acc, p) => acc + p.monto_gastado, 0);
  const ejecucionPct = totalPresupuesto > 0 ? Math.round((totalGastado / totalPresupuesto) * 100) : 0;

  // Próximos vencimientos ordenados
  const proximosVencimientos = [...tareas]
    .filter(t => t.estado !== "programada" || t.costo_real === null)
    .sort((a, b) => new Date(a.proxima_fecha).getTime() - new Date(b.proxima_fecha).getTime())
    .slice(0, 5);

  // Últimos 10 eventos de la trazabilidad del sistema
  const ultimosEventos = [...trazabilidad].reverse().slice(0, 10);

  // Obtener la tendencia mensual de tareas
  const tendenciaMensual = React.useMemo(() => {
    const mesesMap: { [key: string]: { mes: string; planificadas: number; ejecutadas: number } } = {
      "01": { mes: "Ene", planificadas: 0, ejecutadas: 0 },
      "02": { mes: "Feb", planificadas: 0, ejecutadas: 0 },
      "03": { mes: "Mar", planificadas: 0, ejecutadas: 0 },
      "04": { mes: "Abr", planificadas: 0, ejecutadas: 0 },
      "05": { mes: "May", planificadas: 0, ejecutadas: 0 },
      "06": { mes: "Jun", planificadas: 0, ejecutadas: 0 },
      "07": { mes: "Jul", planificadas: 0, ejecutadas: 0 },
      "08": { mes: "Ago", planificadas: 0, ejecutadas: 0 },
      "09": { mes: "Sep", planificadas: 0, ejecutadas: 0 },
      "10": { mes: "Oct", planificadas: 0, ejecutadas: 0 },
      "11": { mes: "Nov", planificadas: 0, ejecutadas: 0 },
      "12": { mes: "Dic", planificadas: 0, ejecutadas: 0 },
    };

    tareas.forEach(t => {
      if (!t.proxima_fecha) return;
      const parts = t.proxima_fecha.split("-");
      if (parts.length >= 2) {
        const mesKey = parts[1]; // "06", "07"
        if (mesesMap[mesKey]) {
          mesesMap[mesKey].planificadas += 1;
          const esCompletada = t.estado === "programada" && t.costo_real !== null;
          if (esCompletada) {
            mesesMap[mesKey].ejecutadas += 1;
          }
        }
      }
    });

    const result = Object.values(mesesMap).filter(m => m.planificadas > 0);
    
    // Si no hay tareas en otros meses, garantizamos que el rango del piloto (Jun-Nov 2026) se muestre
    if (result.length < 3) {
      return ["06", "07", "08", "09", "10", "11"].map(mKey => mesesMap[mKey]);
    }

    return result;
  }, [tareas]);

  // Semáforo de salud por áreas
  // Verde: Al día, Ámbar: con tareas por vencer, Rojo: con tareas vencidas
  const getAreaSalud = (areaId: string): { label: string; color: string; bg: string; dot: string; order: number } => {
    const tareasArea = tareas.filter(t => t.area_id === areaId);
    const tieneVencidas = tareasArea.some(t => t.estado === "vencida");
    const tienePorVencer = tareasArea.some(t => t.estado === "en_curso");

    if (tieneVencidas) {
      return { label: "Crítico", color: BRAND.colors.red, bg: "#FEF2F2", dot: BRAND.colors.red, order: 3 };
    } else if (tienePorVencer) {
      return { label: "Atención", color: BRAND.colors.amber, bg: "#FEFCE8", dot: BRAND.colors.amber, order: 2 };
    } else {
      return { label: "Al día", color: "#047857", bg: "#F0FDF4", dot: BRAND.colors.emerald, order: 1 };
    }
  };

  const chartData = [
    { name: "Al día (Programadas)", value: programadasNormales + tareas.filter(t => t.costo_real !== null).length, color: BRAND.colors.emerald },
    { name: "Atención (En curso)", value: porVencer, color: BRAND.colors.amber },
    { name: "Vencido / Emergencia", value: vencidas, color: BRAND.colors.red }
  ].filter(d => d.value > 0);

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  };

  const exportarReporteEjecutivo = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    // PAGE 1: RESUMEN EJECUTIVO Y SALUD DE ÁREAS
    // Header Block
    doc.setFillColor(10, 27, 61); // #0A1B3D (Innovarum Navy Blue)
    doc.rect(0, 0, 210, 35, 'F');
    
    // Brand title
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("INNOVARUM ADMINISTRACIONES", 15, 15);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 89); // Brand Gold (#C5A059)
    doc.text("SISTEMA GENERAL DE MANTENIMIENTO PREVENTIVO", 15, 22);
    doc.setTextColor(200, 200, 200);
    doc.text("REPORTE EJECUTIVO DE CONTROL, SALUD Y PRESUPUESTO ANUAL", 15, 27);

    // Context metadata on right side
    doc.setFontSize(7.5);
    doc.setTextColor(240, 240, 240);
    const dateFormatted = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.text(`Fecha de Emisión: ${dateFormatted}`, 135, 15);
    doc.text("Desarrollo: Condominio Las Vertientes", 135, 21);
    doc.text("Soporte: Kenzly & Innovarum Administraciones", 135, 27);

    let y = 47;

    // Title Resumen
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 27, 61);
    doc.text("1. METRICAS CLAVE Y DESEMPENO PREVENTIVO", 15, y);
    
    // Underline
    doc.setDrawColor(132, 189, 75);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;

    // Draw KPI Cards using roundedRect
    // Card 1: Cumplimiento
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 55, 24, 2, 2, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.roundedRect(15, y, 55, 24, 2, 2, 'D');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("CUMPLIMIENTO OPERATIVO", 20, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(132, 189, 75); // Brand Green
    doc.text(`${cumplimientoPct}%`, 20, y + 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("Meta recomendada: >95%", 20, y + 20);

    // Card 2: Ejecucion Presupuestaria
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(75, y, 60, 24, 2, 2, 'F');
    doc.roundedRect(75, y, 60, 24, 2, 2, 'D');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("EJECUCION PRESUPUESTARIA", 80, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(43, 43, 43);
    doc.text(`Gastado: ${formatCurrency(totalGastado)}`, 80, y + 13);
    doc.setFont("helvetica", "normal");
    doc.text(`Monto Total: ${formatCurrency(totalPresupuesto)}`, 80, y + 18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(132, 189, 75);
    doc.text(`Ejecucion: ${ejecucionPct}%`, 112, y + 6);

    // Card 3: Estado de Alertas
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(140, y, 55, 24, 2, 2, 'F');
    doc.roundedRect(140, y, 55, 24, 2, 2, 'D');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("ESTADO DE ALERTA", 145, y + 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`Vencidas: ${vencidas} urgentes`, 145, y + 13);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text(`Por vencer: ${porVencer} previstas`, 145, y + 19);

    y += 33;

    // Section 2: Salud por Areas
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(43, 43, 43);
    doc.text("2. SEMAFORO DE SALUD Y COBERTURA POR AREA", 15, y);
    
    doc.setDrawColor(132, 189, 75);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 6, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text("Área del Régimen Condominial", 18, y + 4.2);
    doc.text("Acciones de Mantenimiento", 95, y + 4.2);
    doc.text("Estatus General", 145, y + 4.2);

    y += 6;

    areas.forEach((area, index) => {
      const tareasArea = tareas.filter(t => t.area_id === area.id);
      const salud = getAreaSalud(area.id);

      // Row background
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 6.5, 'F');
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(area.nombre, 18, y + 4.5);
      doc.text(`${tareasArea.length} programaciones preventivas`, 95, y + 4.5);

      doc.setFont("helvetica", "bold");
      if (salud.label === "Crítico") {
        doc.setTextColor(220, 38, 38);
      } else if (salud.label === "Atención") {
        doc.setTextColor(217, 119, 6);
      } else {
        doc.setTextColor(22, 163, 74);
      }
      doc.text(salud.label.toUpperCase(), 145, y + 4.5);

      y += 6.5;
    });

    y += 10;

    // Section 3: Acciones preventivas prioritarias
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(43, 43, 43);
    doc.text("3. SEGUIMIENTO DE ALERTAS Y ACCIONES INMEDIATAS", 15, y);
    
    doc.setDrawColor(132, 189, 75);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;

    const alertas = tareas.filter(t => t.estado === "vencida" || t.estado === "en_curso");

    if (alertas.length === 0) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Correcto. No hay acciones urgentes pendientes o retrasadas en este ciclo.", 18, y + 4);
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 6, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Activo / Tarea de Mantenimiento", 18, y + 4.2);
      doc.text("Fecha Límite", 110, y + 4.2);
      doc.text("Nivel de Alerta", 145, y + 4.2);

      y += 6;

      alertas.slice(0, 5).forEach((t, idx) => {
        if (idx % 2 === 0) {
          doc.setFillColor(254, 252, 232); // amber soft
          doc.rect(15, y, 180, 6, 'F');
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        doc.text(t.titulo, 18, y + 4.2);
        doc.text(t.proxima_fecha, 110, y + 4.2);

        doc.setFont("helvetica", "bold");
        if (t.estado === "vencida") {
          doc.setTextColor(220, 38, 38);
          doc.text("CRÍTICO (VENCIDA)", 145, y + 4.2);
        } else {
          doc.setTextColor(217, 119, 6);
          doc.text("ALERTA (POR VENCER)", 145, y + 4.2);
        }
        y += 6;
      });

      if (alertas.length > 5) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text(`* Se muestran 5 de ${alertas.length} alertas activas. Ver panel para el resto.`, 18, y + 4);
      }
    }

    // Page 1 Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Innovarum Administraciones - Resumen Técnico Informativo - Página 1 de 2", 15, 287);

    // PAGE 2: COMPARATIVO DEL PRESUPUESTO ANUAL
    doc.addPage();
    
    // Header Block Page 2
    doc.setFillColor(10, 27, 61); // #0A1B3D
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("INNOVARUM ADMINISTRACIONES - ANALISIS FINANCIERO", 15, 12);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(197, 160, 89);
    doc.text("RESUMEN DE DESVIACIONES Y CONTROL DE PRESUPUESTO ANUAL PARA LA ASAMBLEA", 15, 18);

    y = 38;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(10, 27, 61);
    doc.text("4. COMPARATIVO DETALLADO DEL PRESUPUESTO ANUAL POR AREA", 15, y);
    
    doc.setDrawColor(132, 189, 75);
    doc.setLineWidth(0.4);
    doc.line(15, y + 2, 195, y + 2);

    y += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Área / Sector", 18, y + 4.5);
    doc.text("P. Autorizado", 85, y + 4.5);
    doc.text("Gasto Real", 115, y + 4.5);
    doc.text("Remanente / Desv.", 145, y + 4.5);
    doc.text("% Ejec.", 180, y + 4.5);

    y += 7;

    areas.forEach((area, index) => {
      const p = presupuestos.find(pr => pr.area_id === area.id);
      const mPres = p?.monto_presupuestado ?? 0;
      const mGast = p?.monto_gastado ?? 0;
      const remanente = mPres - mGast;
      const pctArea = mPres > 0 ? Math.round((mGast / mPres) * 100) : 0;

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, y, 180, 6.5, 'F');
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(area.nombre, 18, y + 4.5);
      doc.text(formatCurrency(mPres), 85, y + 4.5);
      doc.text(formatCurrency(mGast), 115, y + 4.5);

      if (remanente < 0) {
        doc.setTextColor(220, 38, 38); // Red
        doc.text(`-${formatCurrency(Math.abs(remanente))}`, 145, y + 4.5);
      } else {
        doc.setTextColor(22, 163, 74); // Green
        doc.text(formatCurrency(remanente), 145, y + 4.5);
      }

      doc.setTextColor(51, 65, 85);
      doc.text(`${pctArea}%`, 180, y + 4.5);

      y += 6.5;
    });

    // Totals row
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(15, y, 195, y);
    doc.line(15, y + 8, 195, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(43, 43, 43);
    doc.text("TOTAL GENERAL", 18, y + 5.5);
    doc.text(formatCurrency(totalPresupuesto), 85, y + 5.5);
    doc.text(formatCurrency(totalGastado), 115, y + 5.5);

    const totalRemanente = totalPresupuesto - totalGastado;
    if (totalRemanente < 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`-${formatCurrency(Math.abs(totalRemanente))}`, 145, y + 5.5);
    } else {
      doc.setTextColor(22, 163, 74);
      doc.text(formatCurrency(totalRemanente), 145, y + 5.5);
    }
    doc.setTextColor(43, 43, 43);
    doc.text(`${ejecucionPct}%`, 180, y + 5.5);

    y += 18;

    // Dynamic Notes
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, y, 180, 38, 1, 1, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(15, y, 180, 38, 1, 1, 'D');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(43, 43, 43);
    doc.text("NOTAS EXPLICATIVAS Y AUDITORIA INTERNA:", 18, y + 6);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(71, 85, 105);
    doc.text("1. Los montos de 'Gasto Real' se actualizan automáticamente tras la validación técnica en el repositorio.", 18, y + 12);
    doc.text("2. Desviaciones negativas representan desembolsos de fondos de contingencia del condominio.", 18, y + 17);
    doc.text("3. El cumplimiento del plan preventivo previene hasta un 82% de las fallas críticas de infraestructura.", 18, y + 22);
    doc.text("4. El software promueve la transparencia y combate malas prácticas administrativas mediante trazabilidad.", 18, y + 27);
    doc.text("5. Reporte certificado para asambleas de colonos de Las Vertientes en Monterrey, NL, México.", 18, y + 32);

    y += 50;

    // Signatures block
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("ELABORADO POR:", 40, y);
    doc.text("CONSIGNADO POR:", 135, y);

    doc.setDrawColor(203, 213, 225);
    doc.line(20, y + 12, 90, y + 12);
    doc.line(115, y + 12, 185, y + 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text("Líder de Mantenimiento", 43, y + 16);
    doc.text("Representante del Comité", 136, y + 16);

    // Page 2 Footer
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text("Innovarum Administraciones - Resumen Técnico Informativo - Página 2 de 2", 15, 287);

    doc.save(`Innovarum_Reporte_Ejecutivo_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm animate-fade-in">
        <div>
          <span className="text-[11px] font-bold tracking-wider text-brand-green-dark uppercase bg-brand-green-soft px-2.5 py-1 rounded-full border border-brand-green/20">organizaciones inteligentes</span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#0A1B3D] mt-2">Innovarum Administraciones</h1>
          <p className="text-gray-500 text-sm mt-1">Plataforma de mantenimiento preventivo para Condominios en México. Trazabilidad integral y oportuna.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button 
            id="btn-export-pdf"
            onClick={exportarReporteEjecutivo}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-[#0A1B3D] text-white hover:bg-brand-green hover:text-[#0A1B3D] rounded-xl shadow-sm transition-all duration-200 cursor-pointer border border-transparent hover:border-brand-green/30"
          >
            <Download size={14} />
            <span>Exportar PDF Ejecutivo</span>
          </button>
          
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <div className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-[11px] font-mono font-medium text-gray-500">Servicio Activo: Las Vertientes</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Por Vencer</span>
            <span className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600"><Clock size={16} /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-slate-800">{porVencer}</h3>
            <p className="text-xs text-yellow-600 font-medium mt-1">Tareas pendientes esta semana</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vencidas</span>
            <span className="p-1.5 rounded-lg bg-red-50 text-brand-black"><AlertTriangle size={16} className="text-[#DC2626]" /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-[#DC2626]">{vencidas}</h3>
            <p className="text-xs text-red-500 font-medium mt-1">Requieren atención urgente</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tasa Cumplimiento</span>
            <span className="p-1.5 rounded-lg bg-brand-green-soft text-brand-green-dark font-medium"><CheckCircle2 size={16} /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-brand-green">{cumplimientoPct}%</h3>
            <p className="text-xs text-slate-500 mt-1">Meta recomendada: {`>`}95%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Presupuesto Anual</span>
            <span className="p-1.5 rounded-lg bg-slate-50 text-slate-600"><Wallet size={16} /></span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-800">{ejecucionPct}%</h3>
            <p className="text-xs text-slate-500 mt-1">{formatCurrency(totalGastado)} de {formatCurrency(totalPresupuesto)}</p>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* SEMÁFORO DE SALUD DE ÁREAS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#2B2B2B] text-base flex items-center gap-2">
                <Activity size={18} className="text-brand-green" /> Semáforo por Área
              </h3>
              <button onClick={() => onSetTab("areas")} className="text-xs text-brand-green-dark hover:text-brand-green hover:underline font-bold transition">Ver todo</button>
            </div>
            <p className="text-xs text-slate-400 mb-4">Estatus de los activos preventivos divididos en las 10 áreas del régimen condominial.</p>
            
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {areas.map(a => {
                const salud = getAreaSalud(a.id);
                return (
                  <div key={a.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 transition">
                    <span className="text-sm font-medium text-slate-700">{a.nombre}</span>
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition"
                      style={{ color: salud.color, background: salud.bg }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: salud.dot }} />
                      {salud.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* GRAFICA DISTRIBUCIÓN & PROXIMOS VENCIMIENTOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">Estatus de Tareas</h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 font-medium">Proporción general de las tareas preventivas asignadas en la instalación.</p>
            
            <div className="h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tareas`, 'Cantidad']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-2xl font-extrabold text-neutral-700">{totalTareas}</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">Tareas</p>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span>{d.name}</span>
                  </div>
                  <span className="font-semibold text-neutral-700">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PROXIMOS MANTENIMIENTOS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#2B2B2B] text-base">Próximos Vencimientos</h3>
            <button onClick={() => onSetTab("calendario")} className="text-xs text-brand-green-dark hover:text-brand-green hover:underline font-bold transition">Calendario</button>
          </div>
          <p className="text-xs text-slate-400 mb-4 font-normal">Acciones preventivas prioritarias requeridas para sostener la habitabilidad.</p>
          
          <div className="space-y-3">
            {proximosVencimientos.map(t => {
              const esVencido = t.estado === "vencida";
              const esEnCurso = t.estado === "en_curso";
              return (
                <button 
                  key={t.id} 
                  onClick={() => onSelectTarea(t)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-250 transition flex items-center justify-between group animate-fade-in"
                >
                  <div className="min-w-0 pr-2">
                    <h4 className="text-xs font-bold text-[#2B2B2B] truncate group-hover:text-brand-green transition">{t.titulo}</h4>
                    <span className="inline-block text-[10px] text-gray-400 mt-1 uppercase font-mono bg-neutral-50 px-2 py-0.5 rounded">
                      {areas.find(a => a.id === t.area_id)?.nombre || t.area_id}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold block text-gray-500">{t.proxima_fecha}</span>
                    <span className={`text-[9px] font-bold inline-block px-1.5 py-0.5 rounded-full mt-1 ${
                      esVencido ? 'bg-red-50 text-red-700' : esEnCurso ? 'bg-yellow-50 text-brand-black border border-amber/15' : 'bg-neutral-50 text-gray-600'
                    }`}>
                      {esVencido ? "Vencida" : esEnCurso ? "Por vencer" : "Asignada"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* GRÁFICO HISTÓRICO DE EJECUCIÓN MENSUAL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-[#2B2B2B] text-base flex items-center gap-2">
              <Activity size={18} className="text-brand-green" /> Tendencia de Ejecución de Tareas Mensuales
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Análisis dinámico del ritmo de mantenimiento: cantidad de tareas planificadas frente a tareas ejecutadas con éxito.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-3 h-1.5 rounded-sm bg-[#2B2B2B]" />
              <span>Planificadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-3 h-1.5 rounded-sm bg-brand-green" />
              <span>Ejecutadas</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={tendenciaMensual}
              margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="mes" 
                stroke="#94A3B8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
              />
              <YAxis 
                stroke="#94A3B8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                allowDecimals={false}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const plani = payload[0]?.value ?? 0;
                    const ejecu = payload[1]?.value ?? 0;
                    const efici = Number(plani) > 0 ? Math.round((Number(ejecu) / Number(plani)) * 100) : 0;
                    return (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                        <p className="font-extrabold text-slate-800">{label} 2026</p>
                        <p className="text-slate-500 flex items-center justify-between gap-4">
                          <span>📋 Planificadas:</span> 
                          <span className="font-bold text-slate-800">{plani}</span>
                        </p>
                        <p className="text-slate-500 flex items-center justify-between gap-4">
                          <span>✅ Ejecutadas:</span> 
                          <span className="font-bold text-brand-green-dark">{ejecu}</span>
                        </p>
                        <div className="border-t border-slate-100 pt-1 mt-1 flex items-center justify-between gap-4">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Eficiencia:</span>
                          <span className="font-extrabold text-brand-green">{efici}%</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                name="Planificadas"
                type="monotone" 
                dataKey="planificadas" 
                stroke="#0A1B3D" 
                strokeWidth={2.5} 
                activeDot={{ r: 6 }} 
                dot={{ r: 3, strokeWidth: 1.5, fill: "#FFF" }}
              />
              <Line 
                name="Ejecutadas"
                type="monotone" 
                dataKey="ejecutadas" 
                stroke="#C5A059" 
                strokeWidth={3} 
                activeDot={{ r: 7 }} 
                dot={{ r: 4, strokeWidth: 2, fill: "#FFF" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BITÁCORA DE TRAZABILIDAD (Últimos 10 eventos) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h3 className="font-bold text-[#2B2B2B] text-base flex items-center gap-2">
              <Activity size={18} className="text-brand-green" /> Bitácora de Trazabilidad del Sistema
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Últimas 10 acciones registradas por administradores, personal de mantenimiento y contratistas autorizados.
            </p>
          </div>
          <div className="shrink-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full font-mono">
              Auditoría en Tiempo Real
            </span>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60 text-slate-500 font-bold">
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[9.5px]">Fecha</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[9.5px]">Actor / Usuario</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[9.5px]">Tarea Preventiva Relacionada</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider text-[9.5px]">Registro / Acción</th>
              </tr>
            </thead>
            <tbody>
              {ultimosEventos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-gray-400 italic">
                    Sin eventos registrados en el historial de trazabilidad del sistema.
                  </td>
                </tr>
              ) : (
                ultimosEventos.map((ev) => {
                  const tareaRel = tareas.find(t => t.id === ev.tarea_id);
                  return (
                    <tr key={ev.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/35 transition duration-150">
                      <td className="py-3.5 px-4 font-mono text-gray-400 text-[10.5px] whitespace-nowrap">{ev.fecha}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700">{ev.actor}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {tareaRel ? (
                          <button 
                            id={`btn-trazabilidad-task-${ev.id}`}
                            onClick={() => onSelectTarea(tareaRel)}
                            className="text-brand-green-dark hover:text-brand-green hover:underline font-bold text-left transition cursor-pointer"
                          >
                            {tareaRel.titulo}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic font-medium">Mantenimiento General</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="max-w-md text-slate-600 leading-relaxed font-medium">
                          {ev.accion}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER EQUIPO INFORMACIÓN */}
      <div className="bg-brand-green-soft p-5 rounded-2xl border border-brand-green/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white text-brand-green-dark border border-brand-green/10 rounded-lg shadow-sm">
            <Boxes size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#0A1B3D]">Iniciativa Kenzly & Innovarum Administraciones</h4>
            <p className="text-xs text-slate-500 font-normal">Desarrollo piloto liderado por Emmanuel y Adrián para resolver fallas reactivas en México y optimizar activos.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span>Versión MVP</span>
          <span>·</span>
          <span>Región México</span>
        </div>
      </div>
    </div>
  );
}
