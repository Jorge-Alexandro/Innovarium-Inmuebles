import React, { useState } from "react";
import { Area, Activo, TareaPreventiva, Presupuesto, EventoTrazabilidad, Responsable, Manifest } from "../types";
import PredictivoRul from "./PredictivoRul";
import EnergiaCO2 from "./EnergiaCO2";
import RankingProveedores from "./RankingProveedores";
import OeeCondominal from "./OeeCondominal";
import SimuladorAsamblea from "./SimuladorAsamblea";
import ReportesAsamblea from "./ReportesAsamblea";
import { 
  Compass, 
  Activity, 
  Leaf, 
  Trophy, 
  Gauge, 
  Sliders, 
  FileCheck2 
} from "lucide-react";

interface TpmMasterProps {
  areas: Area[];
  activos: Activo[];
  tareas: TareaPreventiva[];
  presupuestos: Presupuesto[];
  responsables: Responsable[];
  manifest: Manifest;
  currentScenario: 'A' | 'B';
  onAddTarea: (nueva: TareaPreventiva) => void;
  onAddTrazabilidad: (nuevo: EventoTrazabilidad) => void;
  onTriggerToast: (msg: string) => void;
}

export default function TpmMaster({
  areas,
  activos,
  tareas,
  presupuestos,
  responsables,
  manifest,
  currentScenario,
  onAddTarea,
  onAddTrazabilidad,
  onTriggerToast
}: TpmMasterProps) {
  const [subTab, setSubTab] = useState<string>("m5");

  const subTabsCatalog = [
    { id: "m5", label: "Predictivo RUL", icon: Activity, desc: "Análisis de sensorizado de falla" },
    { id: "m6", label: "Energía y CO₂", icon: Leaf, desc: "Gasto y mitigación ecológica" },
    { id: "m7", label: "Ranking Kaizen", icon: Trophy, desc: "Evaluaciones de contratistas" },
    { id: "m8", label: "OEE Condominal", icon: Gauge, desc: "Desempeño general de activos" },
    { id: "m9", label: "Simulador Cuotas", icon: Sliders, desc: "Asamblea y retorno de inversión" },
    { id: "m10", label: "Reportes", icon: FileCheck2, desc: "Descargas PDF, XLSX y CSV" },
  ];

  return (
    <div id="tpm-master-panel" className="space-y-6">
      
      {/* Horizontes Selector Rail Tabs */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {subTabsCatalog.map(sub => {
            const isSelected = subTab === sub.id;
            return (
              <button
                key={sub.id}
                id={`subtab-tpm-${sub.id}`}
                onClick={() => setSubTab(sub.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition duration-200 cursor-pointer ${
                  isSelected 
                    ? "bg-[#2B2B2B] border-[#2B2B2B] text-white shadow shadow-[#2B2B2B]/20" 
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <sub.icon size={18} className={isSelected ? "text-brand-green" : "text-slate-500"} />
                <span className="font-extrabold text-[11px] mt-1.5">{sub.label}</span>
                <span className={`text-[8.5px] mt-0.5 block ${isSelected ? "text-slate-400" : "text-slate-400"}`}>
                  {sub.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-MODULE PORTAL ROUTING */}
      <div className="transition-all duration-300">
        {subTab === "m5" && (
          <PredictivoRul 
            areas={areas}
            activos={activos}
            tareas={tareas}
            currentScenario={currentScenario}
            onAddTarea={onAddTarea}
            onAddTrazabilidad={onAddTrazabilidad}
            onTriggerToast={onTriggerToast}
          />
        )}

        {subTab === "m6" && (
          <EnergiaCO2 
            areas={areas}
            currentScenario={currentScenario}
            onTriggerToast={onTriggerToast}
          />
        )}

        {subTab === "m7" && (
          <RankingProveedores 
            areas={areas}
            responsables={responsables}
            tareas={tareas}
            onAddTrazabilidad={onAddTrazabilidad}
            onTriggerToast={onTriggerToast}
          />
        )}

        {subTab === "m8" && (
          <OeeCondominal 
            areas={areas}
            tareas={tareas}
            currentScenario={currentScenario}
            onAddTrazabilidad={onAddTrazabilidad}
            onTriggerToast={onTriggerToast}
          />
        )}

        {subTab === "m9" && (
          <SimuladorAsamblea 
            areas={areas}
            tareas={tareas}
            currentScenario={currentScenario}
            onTriggerToast={onTriggerToast}
          />
        )}

        {subTab === "m10" && (
          <ReportesAsamblea 
            areas={areas}
            tareas={tareas}
            presupuestos={presupuestos}
            responsables={responsables}
            onTriggerToast={onTriggerToast}
          />
        )}
      </div>

    </div>
  );
}
