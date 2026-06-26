import React, { useState, useMemo } from "react";
import { Area } from "../types";
import { BRAND } from "../config/brand";
import {
  Zap,
  Leaf,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  Flame,
  FileCheck,
  FileText,
  Upload,
  BarChart4
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line 
} from "recharts";

interface EnergiaCO2Props {
  areas: Area[];
  onTriggerToast: (msg: string) => void;
}

export default function EnergiaCO2({ areas, onTriggerToast }: EnergiaCO2Props) {
  // Configurable rates and limits
  const TARIFA_KWH = 3.45; // MXN por kWh tarifa DAC/GDMTO
  const CO2_FACTOR = 0.432; // kg CO₂ por kWh (CFE México)

  // 1. Initial State Data
  const [consumoMensualAreas, setConsumoMensualAreas] = useState([
    { id: "gas", areaNombre: "Gas/Cocina (Áreas gas)", kwh30d: 420, kwh7d: 110, anterior: 390 },
    { id: "luz", areaNombre: "Luz / Pasillos Eléctricos", kwh30d: 3850, kwh7d: 920, anterior: 3100 }, // +24% alarm
    { id: "agua", areaNombre: "Agua / Bombeo Hidroneumático", kwh30d: 2150, kwh7d: 530, anterior: 2200 },
    { id: "electro", areaNombre: "Electrodomésticos / Casa Club", kwh30d: 1100, kwh7d: 240, anterior: 1150 },
    { id: "seguridad", areaNombre: "Sistemas de Seguridad / CCTV", kwh30d: 650, kwh7d: 155, anterior: 630 },
    { id: "amenidades", areaNombre: "Alberca (Calefacción solar)", kwh30d: 1800, kwh7d: 410, anterior: 1750 },
  ]);

  // Form states for manual invoice data
  const [formArea, setFormArea] = useState<string>("luz");
  const [formKwh, setFormKwh] = useState<string>("");
  const [formCosto, setFormCosto] = useState<string>("");

  // Table sorting structure
  const [sortField, setSortField] = useState<"kwh30d" | "costo" | "area">("kwh30d");
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // 2. Computed KPIs
  const kpis = useMemo(() => {
    let totalKwh = 0;
    let totalKwhAnterior = 0;
    let maxAreaNombre = "-";
    let maxAreaKwh = 0;

    consumoMensualAreas.forEach(c => {
      totalKwh += c.kwh30d;
      totalKwhAnterior += c.anterior;
      if (c.kwh30d > maxAreaKwh) {
        maxAreaKwh = c.kwh30d;
        maxAreaNombre = c.areaNombre;
      }
    });

    const costoTotal = totalKwh * TARIFA_KWH;
    const co2Total = totalKwh * CO2_FACTOR;
    const variacionPct = totalKwhAnterior > 0 ? ((totalKwh - totalKwhAnterior) / totalKwhAnterior) * 100 : 0;
    
    // Equivalent of trees saved
    // 1 mature tree absorbs ~22kg of CO2 per year
    const arbolesEquivalentes = Math.round(co2Total / 22);

    return {
      totalKwh: Math.round(totalKwh),
      costoTotal: Math.round(costoTotal),
      co2Total: Math.round(co2Total),
      maxAreaNombre,
      variacionPct: Number(variacionPct.toFixed(1)),
      arbolesEquivalentes
    };
  }, [consumoMensualAreas]);

  // Table representation (sort logic applied)
  const sortedTableData = useMemo(() => {
    return [...consumoMensualAreas].sort((a, b) => {
      let multiplier = sortAsc ? 1 : -1;
      if (sortField === "area") {
        return a.areaNombre.localeCompare(b.areaNombre) * multiplier;
      } else if (sortField === "kwh30d") {
        return (a.kwh30d - b.kwh30d) * multiplier;
      } else {
        // costo sorting
        return ((a.kwh30d * TARIFA_KWH) - (b.kwh30d * TARIFA_KWH)) * multiplier;
      }
    });
  }, [consumoMensualAreas, sortField, sortAsc]);

  const toggleSort = (field: "kwh30d" | "costo" | "area") => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  // 3. 24h Load profile (average 7 days)
  const carga24h = [
    { hora: "00", kwh: 12 }, { hora: "01", kwh: 9 }, { hora: "02", kwh: 8 }, { hora: "03", kwh: 8 },
    { hora: "04", kwh: 10 }, { hora: "05", kwh: 14 }, { hora: "06", kwh: 22 }, { hora: "07", kwh: 35 },
    { hora: "08", kwh: 48 }, { hora: "09", kwh: 52 }, { hora: "10", kwh: 55 }, { hora: "11", kwh: 51 },
    { hora: "12", kwh: 49 }, { hora: "13", kwh: 44 }, { hora: "14", kwh: 42 }, { hora: "15", kwh: 40 },
    { hora: "16", kwh: 45 }, { hora: "17", kwh: 58 }, { hora: "18", kwh: 68 }, { hora: "19", kwh: 74 }, // Peak 7pm
    { hora: "20", kwh: 71 }, { hora: "21", kwh: 58 }, { hora: "22", kwh: 32 }, { hora: "23", kwh: 18 }
  ];

  // 4. Monthly Evolution 12 months (kWh)
  const evolucionHistorica = [
    { mes: "Jul 25", kwh: 8900, costo: 30705, co2: 3844 },
    { mes: "Ago 25", kwh: 9200, costo: 31740, co2: 3974 },
    { mes: "Sep 25", kwh: 8700, costo: 30015, co2: 3758 },
    { mes: "Oct 25", kwh: 8100, costo: 27945, co2: 3499 },
    { mes: "Nov 25", kwh: 7900, costo: 27255, co2: 3412 },
    { mes: "Dic 25", kwh: 9400, costo: 32430, co2: 4060 },
    { mes: "Ene 26", kwh: 9100, costo: 31395, co2: 3931 },
    { mes: "Feb 26", kwh: 8400, costo: 29014, co2: 3628 },
    { mes: "Mar 26", kwh: 8800, costo: 30360, co2: 3801 },
    { mes: "Abr 26", kwh: 9050, costo: 31222, co2: 3909 },
    { mes: "May 26", kwh: 9600, costo: 33120, co2: 4147 },
    { mes: "Jun 26", kwh: 9970, costo: 34396, co2: 4307 },
  ];

  // 5. Area distribution pie data
  const COLORS_DONUT = ["#2B2B2B", "#84BD4B", "#6FA73C", "#5E8E2E", "#A3E635", "#CBD5E1"];
  const pieData = useMemo(() => {
    return consumoMensualAreas.map((c, i) => ({
      name: c.areaNombre.split(" / ")[0],
      value: c.kwh30d,
      color: COLORS_DONUT[i % COLORS_DONUT.length]
    }));
  }, [consumoMensualAreas]);

  // Form manual submit handles
  const handleCargaManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKwh || isNaN(Number(formKwh))) {
      onTriggerToast("❌ Por favor, ingrese un número real de kWh consumidos.");
      return;
    }
    const valKwh = Number(formKwh);
    
    setConsumoMensualAreas(prev => prev.map(c => {
      if (c.id === formArea) {
        return {
          ...c,
          kwh30d: valKwh,
          kwh7d: Math.round(valKwh * 0.23) // approximate 7d weight
        };
      }
      return c;
    }));

    onTriggerToast(`⚡ Lectura CFE guardada para el área. Consumo de ${valKwh} kWh registrado.`);
    setFormKwh("");
    setFormCosto("");
  };

  // CSV Mock File Importer
  const handleCSVImport = () => {
    onTriggerToast("📂 Importando archivo de telemetría de CFE 'CFE_VERT_FACTURA_062026.csv'.");
    
    // Simulate updating luz & agua consumptions representing CSV entries
    setConsumoMensualAreas(prev => prev.map(c => {
      if (c.id === "luz") {
        return { ...c, kwh30d: 4100, kwh7d: 950 };
      }
      if (c.id === "agua") {
        return { ...c, kwh30d: 2320, kwh7d: 550 };
      }
      return c;
    }));
  };

  return (
    <div id="tpm-energia-co2" className="space-y-8 animate-fade-in">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-brand-green-dark uppercase bg-brand-green-soft px-2.5 py-1 rounded-full border border-brand-green/20">monitoreo ecológico sst</span>
            <h1 className="text-2xl font-extrabold text-[#2B2B2B] mt-2">Monitor de Energía y Huella de CO₂</h1>
            <p className="text-slate-500 text-xs mt-1">
              Registro volumétrico del consumo de energía del condominio, costes asociados y cálculo homologado de la huella de carbono según tarifas de la Comisión Federal de Electricidad (CFE).
            </p>
          </div>
          <button
            onClick={handleCSVImport}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2B2B2B] text-white hover:bg-[#84BD4B] text-xs font-bold rounded-xl shadow-sm transition-all duration-200 cursor-pointer border border-transparent"
          >
            <Upload size={14} /> Importar XML/CSV de CFE
          </button>
        </div>
      </div>

      {/* CORE KPIs DE CONSUMO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Consumo Mensual</span>
          <p className="text-3xl font-black text-slate-800 mt-2">{kpis.totalKwh.toLocaleString()} <span className="text-xs font-bold text-slate-500">kWh</span></p>
          <div className="flex items-center gap-1 mt-2">
            <span className={`text-[10.5px] font-extrabold ${kpis.variacionPct > 0 ? "text-amber-600" : "text-emerald-700"}`}>
              {kpis.variacionPct > 0 ? "↗" : "↘"} {Math.abs(kpis.variacionPct)}%
            </span>
            <span className="text-[10px] text-gray-400">vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Facturación Estimada CFE</span>
          <p className="text-3xl font-black text-slate-800 mt-2">${kpis.costoTotal.toLocaleString()} <span className="text-xs font-bold text-slate-500">MXN</span></p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-semibold font-mono">
            <span>Tarifa DAC: ${TARIFA_KWH} / kWh</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest block">Huella de CO₂ General</span>
          <p className="text-3xl font-black text-slate-800 mt-2">{kpis.co2Total.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span></p>
          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-[#5E8E2E] font-semibold">
            <Leaf size={12} />
            <span>CFE factor: {CO2_FACTOR} kg/kWh</span>
          </div>
        </div>

        <div className="bg-brand-green-soft border border-brand-green/20 p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-black text-brand-green-dark uppercase tracking-widest block">Compensación Ambiental</span>
            <p className="text-3xl font-black text-[#5E8E2E] mt-2">{kpis.arbolesEquivalentes} <span className="text-xs font-bold text-brand-green-dark">Árboles</span></p>
          </div>
          <span className="text-[9.5px] text-slate-500 leading-snug mt-2">
            Equivalente al secuestro anual de CO₂ necesario para mitigar la operación eléctrica común.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* GRÁFICAS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PROFILE DE CARGA 24 HORA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                <BarChart4 size={16} className="text-brand-green" /> Perfil de Demanda Eléctrica 24h (Promedio Histórico)
              </h3>
              <p className="text-xs text-slate-400">Demanda horaria de los últimos 7 días. Útil para reordenar consumos y mitigar el pico de demanda de las 19:00 hrs.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={carga24h}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="hora" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#2B2B2B] text-white p-2.5 rounded-xl text-xs font-mono">
                            <p className="font-bold">Hora: {payload[0]?.payload?.hora}:00</p>
                            <p className="text-brand-green font-bold">Consumo: {payload[0]?.value} kWh</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="kwh" 
                    fill="#84BD4B" 
                    radius={[4, 4, 0, 0]}
                  >
                    {carga24h.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hora === "19" ? "#2B2B2B" : "#84BD4B"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-2 text-[10.5px] text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <span>La demanda máxima ocurre entre las 18:00 y las 20:59 hrs. Se sugiere coordinar el apagado del encendido redundante de la alberca durante este lapso.</span>
            </div>
          </div>

          {/* EVOLUCIÓN HISTÓRICA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                <TrendingUp size={16} className="text-[#84BD4B]" /> Evolución de Consumo Eléctrico de los Últimos 12 Meses
              </h3>
              <p className="text-xs text-slate-400">Análisis interanual para auditar estacionalidades por cambios de temperatura en equipos.</p>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={evolucionHistorica}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="mes" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0]?.value;
                        const costo = payload[0]?.payload?.costo;
                        return (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                            <p className="font-extrabold text-slate-800">{payload[0]?.payload?.mes}</p>
                            <p className="text-slate-500 flex justify-between gap-6"><span>Consumo:</span> <span className="font-bold text-slate-800">{val} kWh</span></p>
                            <p className="text-slate-500 flex justify-between gap-6"><span>Importe CFE:</span> <span className="font-bold text-brand-green-dark">${costo} MXN</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="kwh" 
                    stroke="#2b2b2b" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: "#84BD4B", strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: DISTRIBUCIÓN Y CARGA MANUAL CFE */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* DONUT DISTRIBUCIÓN POR ÁREA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-[#2B2B2B] text-sm">Distribución Energética Común</h3>
            
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase">Total kWh</span>
                <p className="text-lg font-black text-slate-800">{kpis.totalKwh.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              {pieData.map((item, id) => {
                const percentage = Math.round((item.value / kpis.totalKwh) * 100);
                return (
                  <div key={id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 truncate">{item.name}</span>
                    </div>
                    <span className="font-bold text-slate-700">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FORMULARIO DE CARGA MANUAL (CFE BILL) */}
          <div className="bg-[#EDF5E1]/40 border border-brand-green/20 p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-[#5E8E2E] text-sm flex items-center gap-1.5">
              <FileText size={16} /> Carga Manual de Recibo CFE
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              ¿No cuentas con sensores inteligentes? Ingresa la lectura de consumo del último recibo para actualizar los indicadores analógicos:
            </p>

            <form onSubmit={handleCargaManual} className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Área o Instalación</label>
                <select
                  value={formArea}
                  onChange={(e) => setFormArea(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 outline-none text-xs rounded-xl focus:border-brand-green flex"
                >
                  <option value="luz">Pasillos & Electricidad</option>
                  <option value="agua">Cisterna & Bombeo</option>
                  <option value="electro">Club House</option>
                  <option value="seguridad">Sistemas CCTV & Rack</option>
                  <option value="amenidades">Alberca / Solar</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Consumo Eléctrico (kWh)</label>
                <input
                  type="text"
                  placeholder="Ej. 3400"
                  value={formKwh}
                  onChange={(e) => setFormKwh(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 outline-none text-xs rounded-xl focus:border-brand-green font-mono font-bold text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[#2B2B2B] hover:bg-brand-green hover:text-[#2B2B2B] text-white rounded-xl text-xs font-black transition cursor-pointer"
              >
                Registrar Lectura
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* TABLA DE ÁREAS CON ALERTA DE CONSUMOS EXCESIVOS (>20%) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5 mb-2">
          📋 Desglose de Consumo Energético por Áreas Comunes
        </h3>
        <p className="text-xs text-slate-400 mb-4">Haga clic en las cabeceras para ordenar por volumen o importes.</p>

        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold select-none">
                <th onClick={() => toggleSort("area")} className="py-3 px-4 font-black text-[10px] uppercase cursor-pointer hover:bg-slate-100">
                  Área / Instalación {sortField === "area" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => toggleSort("kwh30d")} className="py-3 px-4 font-black text-[10px] uppercase cursor-pointer hover:bg-slate-100">
                  Consumo 30 d (kWh) {sortField === "kwh30d" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Régimen 7 d (kWh)</th>
                <th onClick={() => toggleSort("costo")} className="py-3 px-4 font-black text-[10px] uppercase cursor-pointer hover:bg-slate-100">
                  Costo Estimado (MXN) {sortField === "costo" && (sortAsc ? "▲" : "▼")}
                </th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Huella CO₂ (kg)</th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Estado / Desviación</th>
              </tr>
            </thead>
            <tbody>
              {sortedTableData.map(c => {
                const costo = Math.round(c.kwh30d * TARIFA_KWH);
                const co2 = Math.round(c.kwh30d * CO2_FACTOR);
                const devPct = c.anterior > 0 ? Math.round(((c.kwh30d - c.anterior) / c.anterior) * 100) : 0;
                
                const isOver20 = devPct >= 20;

                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{c.areaNombre}</td>
                    <td className="py-3.5 px-4 font-mono font-bold">{c.kwh30d.toLocaleString()} kWh</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{c.kwh7d} kWh</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">${costo.toLocaleString()}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{co2.toLocaleString()} kg</td>
                    <td className="py-3.5 px-4">
                      {isOver20 ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 font-extrabold text-[9px] px-2 py-0.5 rounded-full w-fit uppercase">
                          <AlertTriangle size={11} />
                          <span>¡Desv: +{devPct}%!</span>
                        </div>
                      ) : (
                        <span className={`text-[9.5px] font-bold uppercase ${devPct >= 0 ? "text-slate-500" : "text-[#5E8E2E]"}`}>
                          {devPct >= 0 ? `+${devPct}% estable` : `${devPct}% ahorro`}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
