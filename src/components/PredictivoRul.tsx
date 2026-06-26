import React, { useState, useMemo } from "react";
import { TareaPreventiva, Area, Activo, EventoTrazabilidad } from "../types";
import { BRAND } from "../config/brand";
import { 
  Activity, 
  Cpu, 
  Flame, 
  Zap, 
  Droplet, 
  ShieldAlert, 
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface PredictivoRulProps {
  areas: Area[];
  activos: Activo[];
  tareas: TareaPreventiva[];
  onAddTarea: (nueva: TareaPreventiva) => void;
  onAddTrazabilidad: (nuevo: EventoTrazabilidad) => void;
  onTriggerToast: (msg: string) => void;
}

interface SensorReading {
  id: string;
  activoId: string;
  activoNombre: string;
  tipo: "vib" | "temp" | "gas" | "kwh" | "presion" | "ph" | "co";
  valor: number;
  unidad: string;
  fecha: string;
  zScore: number;
}

export default function PredictivoRul({ 
  areas, 
  activos, 
  tareas, 
  onAddTarea, 
  onAddTrazabilidad, 
  onTriggerToast 
}: PredictivoRulProps) {
  
  // 1. Assets hardware presets
  const hwPresets = [
    { id: "gas", name: "Gas", sensor: "MQ-2 / MQ-6", desc: "Detector de concentración de gas licuado en cocina", cost: "$8–12 USD", baseMedia: 220, baseSD: 30, unit: "ppm" },
    { id: "luz", name: "Luz / Electricidad", sensor: "SCT-013", desc: "Pinza amperimétrica no invasiva en subestación", cost: "$12–18 USD", baseMedia: 4.8, baseSD: 0.6, unit: "kW" },
    { id: "agua", name: "Agua / Bomba", sensor: "YF-S201 + MPU-6050", desc: "Sensor de flujo y vibración para bomba hidroneumática", cost: "$17–24 USD", baseMedia: 1.2, baseSD: 0.15, unit: "mm/s" },
    { id: "incendios", name: "Sistemas contra incendios", sensor: "MQ-135 + Presión", desc: "Sensor de CO/humo y sensor de presión en red de rociadores", cost: "$10–20 USD", baseMedia: 13.5, baseSD: 1.2, unit: "psi" },
    { id: "amenidades", name: "Alberca", sensor: "SEN0161 + Cloro ORP", desc: "Medidor combo de pH, temperatura y cloro activo", cost: "$25–40 USD", baseMedia: 7.4, baseSD: 0.2, unit: "pH" },
  ];

  // 2. Active asset selection for simulator
  const [selectedPresetId, setSelectedPresetId] = useState<string>("agua");
  const preset = useMemo(() => hwPresets.find(h => h.id === selectedPresetId)!, [selectedPresetId]);

  // Sliders for dynamic simulations
  const [simValue, setSimValue] = useState<number>(1.25); // initial for agua vib
  const [simTemp, setSimTemp] = useState<number>(55); // sub-sensor temp ºC
  const [simHours, setSimHours] = useState<number>(180); // hours operated in the month

  // Sync simulator slider to active preset changes
  React.useEffect(() => {
    setSimValue(preset.baseMedia);
    if (preset.id === "gas") {
      setSimTemp(25);
    } else if (preset.id === "luz") {
      setSimTemp(48);
    } else if (preset.id === "agua") {
      setSimTemp(62); // motor temperature
    } else {
      setSimTemp(28);
    }
  }, [selectedPresetId]);

  // 3. RUL Engine logic (JS side, mirroring the Edge Function)
  // Z-score: z = |valor - base_media| / base_sd
  const zScore = useMemo(() => {
    const diff = Math.abs(simValue - preset.baseMedia);
    return Number((diff / preset.baseSD).toFixed(2));
  }, [simValue, preset]);

  // Risk combined:
  // risk_vib = clamp(z_vib / z_crit * 50)
  // risk_temp = clamp(z_temp / z_crit * 30)
  // etc
  const combinedRisk = useMemo(() => {
    const zCrit = 2.5;
    // main value contribution (max 60%)
    const contributionMain = Math.min(60, (zScore / zCrit) * 60);
    
    // secondary temp contribution (max 40%)
    // normal motor temp base = 50, sd = 10
    const tDiff = Math.abs(simTemp - 45);
    const zTemp = tDiff / 10;
    const contributionTemp = Math.min(40, (zTemp / zCrit) * 40);

    return Math.round(Math.max(0, Math.min(100, contributionMain + contributionTemp)));
  }, [zScore, simTemp]);

  // Remaining Useful Life (RUL) in days
  const rulDays = useMemo(() => {
    const mtbfHours = 12000; // MTBF standard
    const degradation = 1 - (combinedRisk / 100) * 0.85;
    const hoursRemaining = mtbfHours * degradation - simHours;
    const days = Math.max(0, Math.round(hoursRemaining / 24));
    return days;
  }, [combinedRisk, simHours]);

  // Status mapping
  const statusInfo = useMemo(() => {
    if (combinedRisk >= 65) return { label: "Crítico / Emergencia", color: "text-red-600", bg: "bg-red-50 border-red-300", badge: "bg-red-600 text-white animate-pulse" };
    if (combinedRisk >= 40) return { label: "Alerta / Atención", color: "text-amber-600", bg: "bg-amber-50 border-amber-300", badge: "bg-amber-500 text-white" };
    return { label: "Normal / Óptimo", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-300", badge: "bg-emerald-600 text-white" };
  }, [combinedRisk]);

  // 4. Evolution readings state (Mocking 30 historical readings)
  const [readingsHistory, setReadingsHistory] = useState<SensorReading[]>(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const day = 30 - i;
      const baseVal = 1.25;
      const noise = (Math.sin(i * 0.5) * 0.15) + (Math.random() * 0.1 - 0.05);
      const val = baseVal + noise;
      const z = Math.abs(val - 1.2) / 0.15;
      return {
        id: `rd_${i}`,
        activoId: "b3333333",
        activoNombre: "Bomba Hidroneumática de Presión 5HP",
        tipo: "vib",
        valor: Number(val.toFixed(2)),
        unidad: "mm/s",
        fecha: `2026-06-${day.toString().padStart(2, "0")}`,
        zScore: Number(z.toFixed(2))
      };
    });
  });

  // Action: Calibrate Baseline
  const handleCalibrate = () => {
    onTriggerToast("🔄 Recalibrando línea base con las últimas lecturas. Ajustando media y desviación estándar.");
    
    const log: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: "",
      accion: `Calibración del sensor ${preset.sensor} en activo. Se actualizó la media a ${preset.baseMedia} y desviación estándar.`,
      actor: "Kevin Barbosa (Líder)",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    onAddTrazabilidad(log);
  };

  // Action: Generate Triggered Auto Work Order
  const [otGenerada, setOtGenerada] = useState<boolean>(false);

  const handleGenerateOT = () => {
    const actId = selectedPresetId === "gas" ? "b1111111" : selectedPresetId === "luz" ? "b2222222" : selectedPresetId === "agua" ? "b3333333" : selectedPresetId === "incendios" ? "b9999999" : "b0000000";
    const actNombre = hwPresets.find(p => p.id === selectedPresetId)?.name || "Infraestructura";
    const areaId = selectedPresetId;

    const nuevaOt: TareaPreventiva = {
      id: `ot_auto_${Math.random().toString(36).substring(2, 9)}`,
      area_id: areaId,
      activo_id: actId,
      titulo: `⚠️ OT Auto - Predictivo RUL - Riesgo del ${combinedRisk}% - Inspeccionar ${actNombre}`,
      instrucciones_json: [
        `Verificar inmediatamente lectura crítica simulada de ${simValue} ${preset.unit} (Z-Score: ${zScore})`,
        `Inspeccionar integridad del sensor IoT ${preset.sensor} y cableado ESP32`,
        `Realizar pruebas mecánicas, térmicas o de presión directas en el activo`,
        `Subir evidencia fotográfica inmediata indicando el dictamen diagnóstico`
      ],
      frecuencia: "diaria",
      proxima_fecha: new Date().toISOString().slice(0, 10),
      estado: "en_curso",
      costo_estimado: 1200,
      costo_real: null,
      admin_id: "admin_1",
      proveedor_id: "proveedor_1",
      lider_id: "lider_1"
    };

    onAddTarea(nuevaOt);

    const log: EventoTrazabilidad = {
      id: `tra_${Math.random().toString(36).substring(2, 9)}`,
      tarea_id: nuevaOt.id,
      accion: `⚠️ GENERACIÓN AUTOMÁTICA DE ORDEN DE TRABAJO PREDICTIVA por alerta del sensor ${preset.sensor} (Riesgo: ${combinedRisk}%, RUL restante: ${rulDays} días)`,
      actor: "Innovarum Predictivo RUL Engine",
      fecha: new Date().toLocaleDateString("es-MX")
    };
    onAddTrazabilidad(log);
    
    // Trigger mock alerts
    onTriggerToast(`🚨 ¡OT Automática Creada! Notificaciones enviadas por correo y WhatsApp a Kevin Barbosa.`);
    setOtGenerada(true);
    setTimeout(() => setOtGenerada(false), 2000);
  };

  // Map sensor history for active preset to render chart
  const activePresetChartData = useMemo(() => {
    return readingsHistory.map((r, idx) => {
      // Scale dummy reading value depending on active preset for aesthetics
      const scaleFactor = preset.baseMedia / 1.25;
      const noise = (Math.sin(idx * 0.7) * (preset.baseSD * 0.45)) + (Math.random() * (preset.baseSD * 0.2));
      const simulatedVal = Number((preset.baseMedia + noise).toFixed(preset.id === "luz" || preset.id === "amenidades" ? 2 : 0));
      return {
        dia: idx + 1,
        fecha: r.fecha,
        valor: simulatedVal,
        media: preset.baseMedia,
        warnMas: Number((preset.baseMedia + preset.baseSD * 1.5).toFixed(1)),
        warnMenos: Number(Math.max(0, preset.baseMedia - preset.baseSD * 1.5).toFixed(1)),
        critMas: Number((preset.baseMedia + preset.baseSD * 2.5).toFixed(1)),
        critMenos: Number(Math.max(0, preset.baseMedia - preset.baseSD * 2.5).toFixed(1)),
      };
    });
  }, [preset, readingsHistory]);

  return (
    <div id="tpm-predictivo" className="space-y-8">
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-brand-green-dark uppercase bg-brand-green-soft px-2.5 py-1 rounded-full border border-brand-green/20">mantenimiento predictivo</span>
            <h1 className="text-2xl font-extrabold text-[#2B2B2B] mt-2">Horizontes RUL (Remaining Useful Life)</h1>
            <p className="text-slate-500 text-xs mt-1">
              Pilar TPM (Mantenimiento Productivo Total) para la anticipación científica de fallas de infraestructura común mediante micro-sensores IoT embebidos.
            </p>
          </div>
          <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-100 rounded-xl">
            <Cpu size={16} className="text-[#84BD4B]" />
            <span className="text-[11px] font-mono font-bold text-slate-500">Hardware Condominio: ESP32 + WiFi ~ $110 USD</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* PANEL DE MOCK PRESETS HARDWARE & SENSORES */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-[#2B2B2B] text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Activity size={16} className="text-[#84BD4B]" /> Sensores de Campo IoT
            </h3>
            <p className="text-[11px] text-slate-400">
              Seleccione un activo instrumentado para simular lecturas del ESP32 receptor y calcular variables de falla:
            </p>

            <div className="space-y-2.5">
              {hwPresets.map(presetItem => {
                const isSelected = presetItem.id === selectedPresetId;
                return (
                  <button
                    key={presetItem.id}
                    id={`preset-${presetItem.id}`}
                    onClick={() => setSelectedPresetId(presetItem.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                      isSelected 
                        ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10" 
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/60 text-slate-700"
                    }`}
                  >
                    <div className="mt-0.5">
                      {presetItem.id === "gas" && <Flame size={15} className={isSelected ? "text-brand-green" : "text-gray-400"} />}
                      {presetItem.id === "luz" && <Zap size={15} className={isSelected ? "text-brand-green" : "text-gray-400"} />}
                      {presetItem.id === "agua" && <Droplet size={15} className={isSelected ? "text-brand-green" : "text-gray-400"} />}
                      {presetItem.id === "incendios" && <ShieldAlert size={15} className={isSelected ? "text-brand-green" : "text-gray-400"} />}
                      {presetItem.id === "amenidades" && <CheckCircle size={15} className={isSelected ? "text-brand-green" : "text-gray-400"} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black truncate">{presetItem.name}</span>
                        <span className={`text-[9px] font-mono font-bold ${isSelected ? "text-brand-green" : "text-slate-400"}`}>{presetItem.cost}</span>
                      </div>
                      <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                        {presetItem.desc}
                      </p>
                      <span className="text-[9.5px] block font-mono text-[9px] mt-1 text-slate-400 uppercase tracking-widest font-black">
                        {presetItem.sensor}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* HARDWARE REFERENCE ARCHITECTURE */}
          <div className="bg-[#2B2B2B] text-white p-5 rounded-2xl border border-transparent shadow-md space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-green flex items-center gap-1.5">
              <Cpu size={14} /> Arquitectura IoT Validada
            </h4>
            <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
              Los sensores se conectan directo a puertas analógicas del procesador <strong>ESP32 NodeMCU</strong>. Una rutina firmware envía datagramas JSON mediante REST API (Supabase REST endpoint sobre TLS) cada 5 minutos por WiFi.
            </p>
            <div className="bg-white/5 p-3 rounded-lg border border-white/10 space-y-1 text-[10px] font-mono text-gray-300">
              <p>📡 ESP32 WiFi Core: $5 USD</p>
              <p>🔧 Sensores Promedio: $14 USD</p>
              <p>⚡ Consumo Eléctrico: &lt; 1W continuo</p>
              <p>📶 Gateway: Módem Condominal</p>
            </div>
          </div>
        </div>

        {/* SIMULADOR INTERACTIVO Y GRÁFICOS */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SIMULADOR DE ESCENARIO SENSORIAL (PURA UI INTERACTIVA) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-[#2B2B2B] text-sm">Simulador de Lectura IoT en Tiempo Real</h3>
                <p className="text-xs text-slate-400">Ajuste las variables físicas para auditar la respuesta del calculador matemático RUL.</p>
              </div>
              <span className="px-2.5 py-1 bg-[#2B2B2B] text-white text-[9px] font-mono font-bold rounded-lg uppercase">
                Modo Demostración
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sliders de Entrada */}
              <div className="space-y-4">
                {/* Slider de Variable Principal */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      🔋 Lectura de Variable ({preset.unit}):
                    </span>
                    <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {simValue} {preset.unit}
                    </span>
                  </div>
                  <input 
                    type="range"
                    min={Math.max(0, preset.baseMedia - preset.baseSD * 4)}
                    max={preset.baseMedia + preset.baseSD * 4}
                    step={preset.id === "luz" || preset.id === "amenidades" ? 0.05 : 2}
                    value={simValue}
                    onChange={(e) => setSimValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 hover:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#84BD4B]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>Mínimo</span>
                    <span className="font-bold text-slate-500">Media Base: {preset.baseMedia} {preset.unit}</span>
                    <span>Máximo</span>
                  </div>
                </div>

                {/* Slider de Temperatura de Resguardo */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">🌡️ Temperatura del Motor / Resguardo:</span>
                    <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {simTemp} °C
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="115"
                    step="1"
                    value={simTemp}
                    onChange={(e) => setSimTemp(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 hover:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#84BD4B]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>10 °C (Frío)</span>
                    <span className="font-semibold text-slate-500">Normal ~45 °C</span>
                    <span>115 °C (Crítico)</span>
                  </div>
                </div>

                {/* Slider Horas Operación */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">⏱️ Horas de Operación Acumuladas:</span>
                    <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {simHours} h (este mes)
                    </span>
                  </div>
                  <input 
                    type="range"
                    min="0"
                    max="720"
                    step="10"
                    value={simHours}
                    onChange={(e) => setSimHours(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 hover:bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#84BD4B]"
                  />
                </div>
              </div>

              {/* Pantalla de Resultados de Cálculo RUL */}
              <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${statusInfo.bg}`}>
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Soporte Algorítmico</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${statusInfo.badge}`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/65 p-3 rounded-xl border border-white">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">Riesgo Combinado</span>
                      <p className="text-2xl font-black text-[#2B2B2B] mt-1">{combinedRisk}%</p>
                    </div>
                    <div className="bg-white/65 p-3 rounded-xl border border-white">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase block leading-none">RUL Estimado</span>
                      <p className="text-2xl font-black text-slate-800 mt-1">{rulDays} <span className="text-xs font-semibold text-slate-500">días</span></p>
                    </div>
                  </div>

                  <div className="text-[11.5px] text-slate-600 bg-white/40 p-2.5 rounded-xl border border-white/50 space-y-1">
                    <p className="flex justify-between">
                      <span>Z-Score Variable:</span>
                      <span className={`font-bold ${zScore > 2.5 ? "text-red-600" : zScore > 1.5 ? "text-amber-600" : "text-emerald-700"}`}>
                        {zScore} σ
                      </span>
                    </p>
                    <p className="flex justify-between text-[11px] text-slate-500">
                      <span>Línea Base:</span>
                      <span>{preset.baseMedia} ± {preset.baseSD} {preset.unit}</span>
                    </p>
                  </div>
                </div>

                {combinedRisk >= 60 ? (
                  <button
                    onClick={handleGenerateOT}
                    className="w-full mt-4 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition flex items-center justify-center gap-2 cursor-pointer shadow shadow-red-600/20"
                  >
                    <PlusCircle size={14} />
                    <span>Habilitar OT Automática Urgente</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full mt-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                  >
                    <span>Seguro. Sin Alertas Críticas (Riesgo &lt; 60%)</span>
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* GRÁFICO DE EVOLUCIÓN HISTÓRICA CON BANDAS DE DESVIACIÓN ESTÁNDAR (SHEWHART / TPM) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5">
                  <Activity size={16} className="text-brand-green" /> Carta de Control y Monitoreo del Sensor ({preset.sensor})
                </h3>
                <p className="text-xs text-slate-400">Inspección de estabilidad con límites de confianza estadística de ±1.5σ (Atención) y ±2.5σ (Crítico).</p>
              </div>
              <button
                onClick={handleCalibrate}
                className="px-3.5 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-50 bg-white border border-slate-200 rounded-xl shrink-0 transition flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Calibrar Línea Base</span>
              </button>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activePresetChartData}
                  margin={{ top: 15, right: 15, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="dia" stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const val = payload[0]?.value;
                        const mediaVal = payload[0]?.payload?.media;
                        const z = ((Number(val) - Number(mediaVal)) / preset.baseSD).toFixed(2);
                        return (
                          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-md text-xs space-y-1">
                            <p className="font-bold text-slate-700">Día {payload[0]?.payload?.dia}</p>
                            <p className="flex justify-between gap-4">
                              <span>Lectura:</span>
                              <strong className="text-slate-800">{val} {preset.unit}</strong>
                            </p>
                            <p className="flex justify-between gap-4 text-gray-400">
                              <span>Z-score:</span>
                              <strong className="text-slate-600">{Math.abs(Number(z))} σ</strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  
                  {/* Línea de la Media */}
                  <ReferenceLine y={preset.baseMedia} stroke="#475569" strokeWidth={1} label={{ value: "Media Base", fill: "#475569", fontSize: 9, position: "insideTopLeft" }} />
                  
                  {/* Límites de Alerta +1.5 Z-score */}
                  <ReferenceLine y={preset.baseMedia + preset.baseSD * 1.5} stroke="#D97706" strokeWidth={1.2} strokeDasharray="4 4" label={{ value: "+1.5σ (Alerta)", fill: "#D97706", fontSize: 9, position: "insideBottomRight" }} />
                  
                  {/* Límites Crítico +2.5 Z-score */}
                  <ReferenceLine y={preset.baseMedia + preset.baseSD * 2.5} stroke="#DC2626" strokeWidth={1.5} strokeDasharray="3 3" label={{ value: "+2.5σ (Crítico)", fill: "#DC2626", fontSize: 9, position: "insideBottomRight" }} />

                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#84BD4B" 
                    strokeWidth={2.5} 
                    dot={{ r: 3, fill: "#FFF", strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* HISTORIAL RECIENTE DE LECTURAS REGISTRADAS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-extrabold text-[#2B2B2B] text-sm flex items-center gap-1.5 mb-4">
          <Activity size={16} className="text-brand-green" /> Bitácora Reciente de Teledetección IoT
        </h3>

        <div className="overflow-x-auto border border-slate-150 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <th className="py-3 px-4 font-black text-[10px] uppercase">Marca de Tiempo</th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Régimen / Activo</th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Variable Medida</th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Valor Recibido</th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Z-Score Calculado</th>
                <th className="py-3 px-4 font-black text-[10px] uppercase">Severidad Diagnóstico</th>
              </tr>
            </thead>
            <tbody>
              {readingsHistory.slice(0, 8).map((r, i) => {
                const zRating = r.zScore > 2.5 ? "Crítico" : r.zScore > 1.5 ? "Atención" : "Estable";
                const badgeColor = zRating === "Crítico" ? "bg-red-100 text-red-700" : zRating === "Atención" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700";
                return (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-mono text-gray-400">{r.fecha} 10:45 AM</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{r.activoNombre}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 uppercase">{r.tipo === "vib" ? "Vibración Estator" : "Factor General d Gas"}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{r.valor} {r.unidad}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">{r.zScore} σ</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9.5px] uppercase ${badgeColor}`}>
                        {zRating}
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
  );
}
