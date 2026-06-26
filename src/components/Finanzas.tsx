import React, { useState } from "react";
import { Presupuesto, TareaPreventiva, Area } from "../types";
import { BRAND } from "../config/brand";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { 
  TrendingDown, 
  AlertTriangle, 
  TrendingUp, 
  Receipt, 
  FileText, 
  Download,
  CheckCircle,
  HelpCircle,
  PiggyBank
} from "lucide-react";

interface FinanzasProps {
  presupuestos: Presupuesto[];
  areas: Area[];
  tareas: TareaPreventiva[];
  onTriggerToast: (message: string) => void;
}

export default function Finanzas({ presupuestos, areas, tareas, onTriggerToast }: FinanzasProps) {
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [facturaGenerada, setFacturaGenerada] = useState<any>(null);

  const totalPresupuestado = presupuestos.reduce((acc, p) => acc + p.monto_presupuestado, 0);
  const totalEjercido = presupuestos.reduce((acc, p) => acc + p.monto_gastado, 0);
  const remanente = totalPresupuestado - totalEjercido;

  const preVsGastoData = presupuestos.map(p => {
    const areaName = areas.find(a => a.id === p.area_id)?.nombre || p.area_id;
    return {
      name: areaName.split(" / ")[0], // Truncar para que quepa en gráficas
      Presupuestado: p.monto_presupuestado,
      Gastado: p.monto_gastado,
      sobregiro: p.monto_gastado > p.monto_presupuestado
    };
  });

  const formatCurrency = (val: number) => {
    return val.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
  };

  const handleGenerarFactura = () => {
    if (!selectedTaskId) {
      onTriggerToast("⚠️ Por favor selecciona una tarea para rellenar los datos de facturación.");
      return;
    }

    const tareaInst = tareas.find(t => t.id === selectedTaskId);
    if (!tareaInst) return;

    const areaName = areas.find(a => a.id === tareaInst.area_id)?.nombre || "General";
    const subtotal = Math.round(tareaInst.costo_estimado / 1.16);
    const iva = tareaInst.costo_estimado - subtotal;

    setFacturaGenerada({
      folio: `FAC-${Math.floor(Math.random() * 90000) + 10000}`,
      fecha: new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
      condominio: "Condominio Las Vertientes RFC: CLA880905-LV1",
      tarea: tareaInst.titulo,
      area: areaName,
      subtotal: subtotal,
      iva: iva,
      total: tareaInst.costo_estimado,
      proveedor: "Proveedor Asignado S.A. de C.V."
    });

    onTriggerToast("📄 Borrador de factura generado. Listo para auditoría de asamblea.");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-extrabold text-neutral-800">Seguimiento Económico-Contable</h1>
        <p className="text-gray-500 text-sm mt-1">
          Control presupuestario del condominio. Compara las cotizaciones estimadas versus lo pagado a proveedores para prevenir fraudes o desvíos.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-brand-green-soft text-brand-green-dark border border-brand-green/10">
            <PiggyBank size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Presupuestado Anual</span>
            <span className="text-xl font-black text-slate-900">{formatCurrency(totalPresupuestado)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gasto Ejercido</span>
            <span className="text-xl font-black text-slate-900">{formatCurrency(totalEjercido)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className={`p-3 rounded-lg ${remanente >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            <TrendingDown size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Remanente de Caja</span>
            <span className={`text-xl font-black ${remanente >= 0 ? "text-emerald-700" : "text-red-700"}`}>
              {formatCurrency(remanente)}
            </span>
          </div>
        </div>
      </div>

      {/* COMPARATIVA GRAFICA */}
      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Gráfica de Barras */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-neutral-800 text-base mb-1">Presupuestado vs Real por Área</h3>
            <p className="text-xs text-gray-400 mb-6">Comparativa de los fondos autorizados en la asamblea contra los gastos reales pagados.</p>
            
            <div className="h-64 sm:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={preVsGastoData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="Presupuestado" fill="#e5e7eb" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Gastado" fill={BRAND.colors.green} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ALERTA DE SOBREGIRO */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-neutral-800 text-base mb-1 flex items-center gap-2">
              <AlertTriangle size={17} className="text-red-600" /> Monitoreo de Alertas
            </h3>
            <p className="text-xs text-gray-400 mb-5">Áreas que excedieron los montos asignados o tienen advertencias de desborde.</p>
            
            <div className="space-y-3.5">
              {presupuestos.map(p => {
                const limitOver = p.monto_gastado > p.monto_presupuestado;
                const def = p.monto_presupuestado - p.monto_gastado;
                const areaObj = areas.find(a => a.id === p.area_id);
                return (
                  <div key={p.id} className={`p-3 rounded-xl border flex flex-col justify-between ${
                    limitOver ? "bg-red-50/50 border-red-150 text-red-950" : "bg-neutral-50/20 border-neutral-100"
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{areaObj?.nombre || p.area_id}</span>
                      {limitOver ? (
                        <span className="text-[9px] font-extrabold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded-full animate-pulse">
                          Sobregiro
                        </span>
                      ) : (
                        <span className="text-[9px] font-normal text-gray-400">Sano</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-gray-500">
                      <span>Caja: {formatCurrency(p.monto_presupuestado)}</span>
                      <span className={`font-semibold ${limitOver ? 'text-red-700' : 'text-gray-700'}`}>
                        {limitOver ? `Exceso: ${formatCurrency(Math.abs(def))}` : `Disponible: ${formatCurrency(def)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* PROPUESTA DE FACTURACIÓN (DRAFT INVOICE DESIGN) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="border-b border-slate-200 pb-4 mb-4">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Receipt size={18} className="text-brand-green" strokeWidth={2} /> Borrador de Factura de Servicios
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Visualizador contable para asambleas. Genera órdenes preventivas con desglose de IVA antes de efectuar su adquisición.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Seleccionar Tarea Terminada o Programada</label>
              <select
                value={selectedTaskId}
                onChange={e => setSelectedTaskId(e.target.value)}
                className="w-full text-xs bg-white border border-gray-200 p-2.5 rounded-lg focus:outline-none"
              >
                <option value="">-- Elige una tarea --</option>
                {tareas.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} ({formatCurrency(t.costo_estimado)})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerarFactura}
              className="w-full text-white font-bold p-2.5 rounded-lg text-xs hover:opacity-90 transition flex items-center justify-center gap-2"
              style={{ background: BRAND.colors.green }}
            >
              <FileText size={14} /> Facturar en Borrador
            </button>
          </div>

          <div className="md:col-span-3">
            {!facturaGenerada ? (
              <div className="h-full min-h-[160px] border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-center text-gray-400 bg-neutral-50/50">
                <FileText size={28} className="text-gray-300 mb-2" />
                <span className="text-xs font-medium">Borrador no generado</span>
                <p className="text-[10px] mt-1">Elige una tarea preventiva cargada arriba y presiona Facturar para desplegar el documento.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl p-5 bg-stone-50/50 space-y-4 text-xs font-mono text-neutral-700 relative overflow-hidden">
                <div className="absolute top-2.5 right-2.5 text-[8px] bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded-full tracking-wider uppercase font-sans">
                  Sin Procesar Pago Reales
                </div>
                
                <div className="flex justify-between items-start pb-3 border-b border-gray-200">
                  <div>
                    <h4 className="font-extrabold text-neutral-800 text-sm">INOVARIUM TECH</h4>
                    <p className="text-[9px] text-gray-400 mt-0.5">{facturaGenerada.proveedor}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-800">FACTURA DE SERVICIO</p>
                    <p className="text-gray-400">Folio: {facturaGenerada.folio}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pb-3 border-b border-gray-200 text-[10px]">
                  <div>
                    <span className="text-gray-400 block font-sans">CLIENTE</span>
                    <p className="font-bold">{facturaGenerada.condominio}</p>
                    <p className="text-gray-400 font-normal">Huixquilucan, Estado de México</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 block font-sans">FECHA DE EMISIÓN</span>
                    <p className="font-bold">{facturaGenerada.fecha}</p>
                  </div>
                </div>

                <div className="space-y-1.5 pb-3 border-b border-gray-200">
                  <span className="text-gray-400 block font-sans text-[10px]">CONCEPTO / DETALLES</span>
                  <p className="font-bold text-neutral-800 leading-normal">{facturaGenerada.tarea}</p>
                  <p className="text-gray-400 uppercase text-[9px] font-semibold">Área Técnica: {facturaGenerada.area}</p>
                </div>

                <div className="space-y-1 text-right max-w-xs ml-auto">
                  <div className="flex justify-between text-gray-500">
                    <span>Subtotal</span>
                    <span>{formatCurrency(facturaGenerada.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>IVA (16%)</span>
                    <span>{formatCurrency(facturaGenerada.iva)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-neutral-800 text-sm pt-1.5 border-t border-gray-200">
                    <span>TOTAL</span>
                    <span>{formatCurrency(facturaGenerada.total)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTriggerToast("📥 Descargando respaldo en XML y PDF...")}
                  className="w-full mt-2 font-sans font-bold bg-neutral-800 hover:bg-neutral-950 text-white p-2 rounded-lg text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Download size={12} /> Descargar Borrador (PDF)
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
