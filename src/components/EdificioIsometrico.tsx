import React, { useState, useMemo, useEffect, useRef } from "react";
import { Area, TareaPreventiva, Piso } from "../types";
import { motion, AnimatePresence } from "motion/react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { 
  Building2, 
  Activity, 
  CalendarDays, 
  Layers, 
  Eye,
  Sparkles,
  Zap,
  Shield,
  Droplet,
  Trees,
  Car,
  Settings,
  Home,
  Compass,
  Info,
  RotateCw,
  EyeOff,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  Grid3X3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface EdificioIsometricoProps {
  areas: Area[];
  tareas: TareaPreventiva[];
  onSelectTarea: (tarea: TareaPreventiva) => void;
  onSetTab: (tab: string) => void;
}

interface FloorStatus {
  id: string;
  numero: number;
  nombre: string;
  worstStatus: "critico" | "atencion" | "al_dia";
  vencidas: number;
  porVencer: number;
  completadas: number;
  total: number;
}

const classifyMeshSystem = (meshName: string, meshFloorIndex: number): string | null => {
  const name = (meshName || "").toLowerCase();
  
  if (name.includes("elevator") || name.includes("ascensor") || name.includes("elevador") || name.includes("shaft") || name.includes("cabina") || name.includes("lift")) {
    return "elevadores";
  }
  
  if (name.includes("water") || name.includes("bomba") || name.includes("pump") || name.includes("tank") || name.includes("cisterna") || name.includes("agua") || name.includes("pipe") || name.includes("tubo") || name.includes("plumb") || name.includes("hidro")) {
    return "agua";
  }
  if (meshFloorIndex === 8) { // Floor 9 is Cisterna (Index 8 in 0-9)
    if (name.includes("machin") || name.includes("equip") || name.includes("metal") || name.includes("cylin")) {
      return "agua";
    }
  }

  if (name.includes("cable") || name.includes("wire") || name.includes("transformer") || name.includes("transformador") || name.includes("electr") || name.includes("power") || name.includes("subest") || name.includes("zap") || name.includes("generador") || name.includes("breaker")) {
    return "energia";
  }
  if (meshFloorIndex === 1) { // Floor 2 is Subestación eléctrica (Index 1 in 0-9)
    if (name.includes("panel") || name.includes("machin") || name.includes("switch") || name.includes("metal") || name.includes("box")) {
      return "energia";
    }
  }

  if (name.includes("hvac") || name.includes("ac") || name.includes("ventil") || name.includes("extrac") || name.includes("chiller") || name.includes("condens") || name.includes("clima") || name.includes("duct") || name.includes("aire")) {
    return "hvac";
  }
  if (meshFloorIndex === 9) { // Floor 10 is Azotea / Roof which has HVAC
    if (name.includes("fan") || name.includes("motor") || name.includes("chiller") || name.includes("condens") || name.includes("compressor")) {
      return "hvac";
    }
  }

  if (name.includes("glass") || name.includes("window") || name.includes("ventana") || name.includes("cristal") || name.includes("vidrio") || name.includes("pane") || name.includes("light") || name.includes("foco") || name.includes("led") || name.includes("lampara") || name.includes("glow") || name.includes("refl") || name.includes("emit") || name.includes("glowing")) {
    return "iluminacion";
  }

  return null;
};

const splitSingleMeshIntoFloorSystems = (mesh: THREE.Mesh, bbox: THREE.Box3, size: THREE.Vector3): THREE.Group => {
  const geometry = mesh.geometry;
  const positionAttr = geometry.attributes.position;
  const normalAttr = geometry.attributes.normal;
  const uvAttr = geometry.attributes.uv;
  const indexAttr = geometry.index;

  const minY = bbox.min.y;
  const height = bbox.max.y - minY || 1;

  // Buckets for 10 floors and 6 systems
  const buckets: { [key: string]: {
    positions: number[];
    normals: number[];
    uvs: number[];
  }} = {};

  const systems = ["estructura", "elevadores", "iluminacion", "agua", "energia", "hvac"];
  for (let f = 0; f < 10; f++) {
    for (const sys of systems) {
      buckets[`${f}_${sys}`] = { positions: [], normals: [], uvs: [] };
    }
  }

  // Helper to classify vertex positions into systems based on spatial coordinates
  const getSystemType = (avgX: number, avgY: number, avgZ: number) => {
    const distFromCenter = Math.sqrt(avgX * avgX + avgZ * avgZ);
    const maxRadius = Math.max(size.x, size.z) / 2;

    // Elevadores: core vertical lift column in the center
    if (distFromCenter < maxRadius * 0.25) {
      return "elevadores";
    }
    // Iluminacion: outer perimeter / facade glazing
    if (distFromCenter > maxRadius * 0.72) {
      return "iluminacion";
    }
    // Agua: narrow quadrant column for water systems
    if (avgX < -maxRadius * 0.25 && Math.abs(avgZ) < maxRadius * 0.3) {
      return "agua";
    }
    // Energia: quadrant column for electrical trays & risers
    if (avgX > maxRadius * 0.25 && Math.abs(avgZ) < maxRadius * 0.3) {
      return "energia";
    }
    // HVAC: quadrant column for mechanical supply & extraction ducts
    if (avgZ > maxRadius * 0.25 && Math.abs(avgX) < maxRadius * 0.3) {
      return "hvac";
    }
    
    return "estructura";
  };

  const addTriangleToBucket = (
    fIndex: number,
    sysType: string,
    idxA: number,
    idxB: number,
    idxC: number
  ) => {
    const bucket = buckets[`${fIndex}_${sysType}`];
    if (!bucket) return;

    // A
    bucket.positions.push(positionAttr.getX(idxA), positionAttr.getY(idxA), positionAttr.getZ(idxA));
    if (normalAttr) {
      bucket.normals.push(normalAttr.getX(idxA), normalAttr.getY(idxA), normalAttr.getZ(idxA));
    } else {
      bucket.normals.push(0, 1, 0);
    }
    if (uvAttr) {
      bucket.uvs.push(uvAttr.getX(idxA), uvAttr.getY(idxA));
    } else {
      bucket.uvs.push(0, 0);
    }

    // B
    bucket.positions.push(positionAttr.getX(idxB), positionAttr.getY(idxB), positionAttr.getZ(idxB));
    if (normalAttr) {
      bucket.normals.push(normalAttr.getX(idxB), normalAttr.getY(idxB), normalAttr.getZ(idxB));
    } else {
      bucket.normals.push(0, 1, 0);
    }
    if (uvAttr) {
      bucket.uvs.push(uvAttr.getX(idxB), uvAttr.getY(idxB));
    } else {
      bucket.uvs.push(0, 0);
    }

    // C
    bucket.positions.push(positionAttr.getX(idxC), positionAttr.getY(idxC), positionAttr.getZ(idxC));
    if (normalAttr) {
      bucket.normals.push(normalAttr.getX(idxC), normalAttr.getY(idxC), normalAttr.getZ(idxC));
    } else {
      bucket.normals.push(0, 1, 0);
    }
    if (uvAttr) {
      bucket.uvs.push(uvAttr.getX(idxC), uvAttr.getY(idxC));
    } else {
      bucket.uvs.push(0, 0);
    }
  };

  if (indexAttr) {
    const indexArray = indexAttr.array;
    const len = indexArray.length;
    for (let i = 0; i < len; i += 3) {
      const idxA = indexArray[i];
      const idxB = indexArray[i + 1];
      const idxC = indexArray[i + 2];

      const ax = positionAttr.getX(idxA);
      const ay = positionAttr.getY(idxA);
      const az = positionAttr.getZ(idxA);

      const bx = positionAttr.getX(idxB);
      const by = positionAttr.getY(idxB);
      const bz = positionAttr.getZ(idxB);

      const cx = positionAttr.getX(idxC);
      const cy = positionAttr.getY(idxC);
      const cz = positionAttr.getZ(idxC);

      const avgX = (ax + bx + cx) / 3;
      const avgY = (ay + by + cy) / 3;
      const avgZ = (az + bz + cz) / 3;

      const fIndex = Math.min(9, Math.max(0, Math.floor(((avgY - minY) / height) * 10)));
      const sysType = getSystemType(avgX, avgY, avgZ);

      addTriangleToBucket(fIndex, sysType, idxA, idxB, idxC);
    }
  } else {
    const len = positionAttr.count;
    for (let i = 0; i < len; i += 3) {
      const idxA = i;
      const idxB = i + 1;
      const idxC = i + 2;

      const ax = positionAttr.getX(idxA);
      const ay = positionAttr.getY(idxA);
      const az = positionAttr.getZ(idxA);

      const bx = positionAttr.getX(idxB);
      const by = positionAttr.getY(idxB);
      const bz = positionAttr.getZ(idxB);

      const cx = positionAttr.getX(idxC);
      const cy = positionAttr.getY(idxC);
      const cz = positionAttr.getZ(idxC);

      const avgX = (ax + bx + cx) / 3;
      const avgY = (ay + by + cy) / 3;
      const avgZ = (az + bz + cz) / 3;

      const fIndex = Math.min(9, Math.max(0, Math.floor(((avgY - minY) / height) * 10)));
      const sysType = getSystemType(avgX, avgY, avgZ);

      addTriangleToBucket(fIndex, sysType, idxA, idxB, idxC);
    }
  }

  const group = new THREE.Group();
  group.name = "split_building_elements";

  const originalMat = mesh.material;
  const isMultiMaterial = Array.isArray(originalMat);

  for (let f = 0; f < 10; f++) {
    for (const sys of systems) {
      const b = buckets[`${f}_${sys}`];
      if (!b || b.positions.length === 0) continue;

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(b.positions, 3));
      geom.setAttribute('normal', new THREE.Float32BufferAttribute(b.normals, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(b.uvs, 2));

      // Clone original material
      let mat: THREE.Material;
      if (isMultiMaterial) {
        mat = (originalMat as THREE.Material[])[0].clone();
      } else if (originalMat instanceof THREE.Material) {
        mat = originalMat.clone();
      } else {
        mat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
      }

      const anyMat = mat as any;
      if (sys === "elevadores") {
        anyMat.color.setHex(0xffffff); // White
        if ('emissive' in anyMat) anyMat.emissive.setHex(0x333333);
        anyMat.roughness = 0.2;
        anyMat.metalness = 0.8;
      } else if (sys === "agua") {
        anyMat.color.setHex(0xffffff); // White
        if ('emissive' in anyMat) anyMat.emissive.setHex(0x333333);
        anyMat.roughness = 0.25;
      } else if (sys === "energia") {
        anyMat.color.setHex(0xffffff); // White
        if ('emissive' in anyMat) anyMat.emissive.setHex(0x333333);
        anyMat.roughness = 0.3;
      } else if (sys === "hvac") {
        anyMat.color.setHex(0xffffff); // White
        if ('emissive' in anyMat) anyMat.emissive.setHex(0x333333);
        anyMat.roughness = 0.4;
      } else if (sys === "iluminacion") {
        anyMat.color.setHex(0xffffff); // White
        if ('emissive' in anyMat) anyMat.emissive.setHex(0x333333);
        anyMat.transparent = true;
        anyMat.opacity = 0.82;
      } else {
        // Estructura (Clean white shell)
        anyMat.color.setHex(0xffffff);
        anyMat.roughness = 0.8;
        anyMat.metalness = 0.1;
      }

      const m = new THREE.Mesh(geom, mat);
      m.name = `floor_${f}_system_${sys}`;
      
      // Assign custom userData so selection, highlights, and tooltips know what this is instantly
      m.userData = {
        floorIndex: f,
        system: sys
      };

      group.add(m);
    }
  }

  return group;
};

export default function EdificioIsometrico({ 
  areas, 
  tareas, 
  onSelectTarea, 
  onSetTab 
}: EdificioIsometricoProps) {
  const [selectedPisoId, setSelectedPisoId] = useState<string>("piso_10"); // Default to P10 Roof Garden
  const [hoveredPisoId, setHoveredPisoId] = useState<string | null>(null);

  // Active Systems & Occupancy glowing state
  const [activeSystemFilter, setActiveSystemFilter] = useState<string>("todos");
  const [systemGhostMode, setSystemGhostMode] = useState<boolean>(true);
  const activeSystemFilterRef = useRef<string>("todos");

  // 3D Engine State
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [explodeValue, setExplodeValue] = useState<number>(0);
  const [visualMode, setVisualMode] = useState<"realista" | "xray" | "wireframe">("realista");
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isProcedural, setIsProcedural] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Three.js References
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const floorHighlightRing = useRef<THREE.GridHelper | null>(null);
  const boundingBoxRef = useRef<THREE.Box3 | null>(null);

  // Original materials and positions for custom shaders, glowing highlights, and exploding
  const originalMaterials = useRef<Map<THREE.Mesh, {
    color: THREE.Color,
    emissive: THREE.Color,
    opacity: number,
    transparent: boolean,
    wireframe: boolean
  }>>(new Map());
  const originalPositions = useRef<Map<THREE.Object3D, THREE.Vector3>>(new Map());

  // Define the 10 levels matching the campus architecture
  const PISOS_EDIFICIO: Piso[] = useMemo(() => [
    { id: "piso_10", condominio_id: "condo_torre_999", numero: 10, nombre: "P10 · Terraza & Roof Garden" },
    { id: "piso_9", condominio_id: "condo_torre_999", numero: 9, nombre: "P9 · Jardín Escolar y Aula Abierta" },
    { id: "piso_8", condominio_id: "condo_torre_999", numero: 8, nombre: "P8 · Espacios de Aprendizaje / Aulas" },
    { id: "piso_7", condominio_id: "condo_torre_999", numero: 7, nombre: "P7 · Gimnasio y Canchas" },
    { id: "piso_6", condominio_id: "condo_torre_999", numero: 6, nombre: "P6 · Espacio Escénico / Teatro" },
    { id: "piso_5", condominio_id: "condo_torre_999", numero: 5, nombre: "P5 · Talleres Juveniles y Tobogán" },
    { id: "piso_4", condominio_id: "condo_torre_999", numero: 4, nombre: "P4 · Auditorio Interactivo" },
    { id: "piso_3", condominio_id: "condo_torre_999", numero: 3, nombre: "P3 · Aulas Técnicas / Talleres" },
    { id: "piso_2", condominio_id: "condo_torre_999", numero: 2, nombre: "P2 · Sede CAF & CTBUH HQ" },
    { id: "piso_1", condominio_id: "condo_torre_999", numero: 1, nombre: "P1 · Lobby / Biblioteca & Plaza" }
  ], []);

  // Compute live maintenance statuses for each floor
  const floorStatuses = useMemo<FloorStatus[]>(() => {
    return PISOS_EDIFICIO.map(piso => {
      const floorAreas = areas.filter(a => a.piso_id === piso.id);
      const floorTareas = tareas.filter(t => floorAreas.some(fa => fa.id === t.area_id));
      
      const vencidas = floorTareas.filter(t => t.estado === "vencida" || t.estado === "urgente").length;
      const porVencer = floorTareas.filter(t => t.estado === "en_curso").length;
      const completadas = floorTareas.filter(t => t.estado === "completada" || (t.estado === "programada" && t.costo_real !== null)).length;
      const total = floorTareas.length;

      let worstStatus: "critico" | "atencion" | "al_dia" = "al_dia";
      if (vencidas > 0) {
        worstStatus = "critico";
      } else if (porVencer > 0) {
        worstStatus = "atencion";
      }

      return {
        id: piso.id,
        numero: piso.numero,
        nombre: piso.nombre,
        worstStatus,
        vencidas,
        porVencer,
        completadas,
        total
      };
    });
  }, [PISOS_EDIFICIO, areas, tareas]);

  const selectedFloorStatus = useMemo(() => {
    return floorStatuses.find(f => f.id === selectedPisoId) || floorStatuses[0];
  }, [floorStatuses, selectedPisoId]);

  const selectedFloorAreas = useMemo(() => {
    return areas.filter(a => a.piso_id === selectedPisoId);
  }, [areas, selectedPisoId]);

  // Map floor ID to index
  const getFloorIndex = (pisoId: string): number => {
    const num = parseInt(pisoId.replace("piso_", ""), 10);
    return isNaN(num) ? 0 : num - 1; // 0 to 9
  };

  const getStatusConfig = (status: "critico" | "atencion" | "al_dia") => {
    switch (status) {
      case "critico":
        return {
          glowColor: "#EF4444",
          hex: 0xEF4444,
          solidBg: "bg-red-50 text-red-700 border-red-200",
          badgeColor: "bg-red-500",
          text: "Alerta Crítica",
        };
      case "atencion":
        return {
          glowColor: "#F59E0B",
          hex: 0xF59E0B,
          solidBg: "bg-amber-50 text-amber-700 border-amber-200",
          badgeColor: "bg-amber-500",
          text: "Atención Requerida",
        };
      default:
        return {
          glowColor: "#10B981",
          hex: 0x10B981,
          solidBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          badgeColor: "bg-emerald-500",
          text: "Operando Al Día",
        };
    }
  };

  const getFloorIcon = (id: string, size = 18) => {
    switch(id) {
      case "piso_10": return <Trees className="text-emerald-500 shrink-0" size={size} />;
      case "piso_9": return <Compass className="text-teal-400 shrink-0" size={size} />;
      case "piso_8": return <Layers className="text-blue-500 shrink-0" size={size} />;
      case "piso_7": return <Activity className="text-orange-500 shrink-0" size={size} />;
      case "piso_6": return <Sparkles className="text-purple-500 shrink-0" size={size} />;
      case "piso_5": return <Home className="text-pink-500 shrink-0" size={size} />;
      case "piso_4": return <Info className="text-amber-500 shrink-0" size={size} />;
      case "piso_3": return <Settings className="text-slate-400 shrink-0" size={size} />;
      case "piso_2": return <Building2 className="text-indigo-500 shrink-0" size={size} />;
      default: return <Home className="text-emerald-600 shrink-0" size={size} />;
    }
  };

  // camera presets
  const setCameraView = (type: "iso" | "top" | "front") => {
    if (!cameraRef.current || !controlsRef.current || !boundingBoxRef.current) return;
    const center = new THREE.Vector3();
    boundingBoxRef.current.getCenter(center);
    const size = new THREE.Vector3();
    boundingBoxRef.current.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    controlsRef.current.target.copy(center);

    switch (type) {
      case "iso":
        cameraRef.current.position.set(center.x + maxDim * 1.2, center.y + maxDim * 1.0, center.z + maxDim * 1.2);
        break;
      case "top":
        cameraRef.current.position.set(center.x, center.y + maxDim * 1.8, center.z);
        break;
      case "front":
        cameraRef.current.position.set(center.x, center.y + maxDim * 0.2, center.z + maxDim * 1.5);
        break;
    }
    controlsRef.current.update();
  };

  // Triggered when selected floor or rendering mode changes
  const applyHighlightsAndOffsets = () => {
    if (!modelRef.current || !boundingBoxRef.current) return;

    const bbox = boundingBoxRef.current;
    const minY = bbox.min.y;
    const maxY = bbox.max.y;
    const height = maxY - minY;

    const selIndex = getFloorIndex(selectedPisoId);
    const hovIndex = hoveredPisoId ? getFloorIndex(hoveredPisoId) : null;

    // Position of horizontal grid selector
    if (floorHighlightRing.current) {
      const targetY = minY + (selIndex + 0.5) * (height / 10);
      floorHighlightRing.current.position.y = targetY + (selIndex * explodeValue * 2.0);
      
      // Update grid helper color to match the selected level status
      const status = floorStatuses.find(f => f.id === selectedPisoId)?.worstStatus || "al_dia";
      const statusCfg = getStatusConfig(status);
      const gridColor = new THREE.Color(statusCfg.hex);
      
      // Access custom colors of grid helper
      const materials = floorHighlightRing.current.material as THREE.LineBasicMaterial;
      if (materials) {
        materials.color.copy(gridColor);
      }
    }

    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const origPos = originalPositions.current.get(child);
        const origMat = originalMaterials.current.get(child);

        if (origPos && origMat && child.material) {
          // Determine the floor index of this mesh based on its userData properties or positions
          const meshFloorIndex = child.userData.floorIndex !== undefined 
            ? child.userData.floorIndex 
            : Math.min(9, Math.max(0, Math.floor(((origPos.y - minY) / (height || 1)) * 10)));

          // Apply Exploded View Offset
          child.position.y = origPos.y + meshFloorIndex * explodeValue * 2.0;

          // Apply visual highlights based on selected mode and active systems
          const mat = Array.isArray(child.material) ? child.material[0] : child.material;
          if (mat instanceof THREE.Material) {
            const anyMat = mat as any;
            const isSelectedMesh = meshFloorIndex === selIndex;
            const isHoveredMesh = hovIndex !== null && meshFloorIndex === hovIndex;

            const floorStatusStr = floorStatuses[9 - meshFloorIndex]?.worstStatus || "al_dia";
            const statusColor = new THREE.Color(getStatusConfig(floorStatusStr).glowColor);

            // Classify system using specialized userData or fallback naming
            const meshSystem = child.userData.system !== undefined
              ? child.userData.system
              : classifyMeshSystem(child.name, meshFloorIndex);
            const matchesActiveSystem = activeSystemFilter !== "ninguno" && 
              (activeSystemFilter === "todos" || meshSystem === activeSystemFilter);

            if (activeSystemFilter !== "ninguno" && systemGhostMode) {
              // GHOST MODE: Make active system elements stand out, make everything else translucent
              if (matchesActiveSystem) {
                if ('wireframe' in anyMat) anyMat.wireframe = false;
                anyMat.transparent = false;
                anyMat.opacity = 1.0;

                let sysColor = 0xffffff;
                if (meshSystem === "iluminacion") sysColor = 0xffffff; // white
                else if (meshSystem === "agua") sysColor = 0xffffff; // white
                else if (meshSystem === "energia") sysColor = 0xffffff; // white
                else if (meshSystem === "hvac") sysColor = 0xffffff; // white
                else if (meshSystem === "elevadores") sysColor = 0xffffff; // white

                if ('color' in anyMat) anyMat.color.setHex(sysColor);
                if ('emissive' in anyMat) {
                  anyMat.emissive.setHex(sysColor);
                  anyMat.emissiveIntensity = 0.85;
                }
              } else {
                // Highly translucent ghost background
                if ('wireframe' in anyMat) anyMat.wireframe = visualMode === "wireframe";
                anyMat.transparent = true;
                anyMat.opacity = visualMode === "wireframe" ? 0.05 : 0.06;
                if ('color' in anyMat) anyMat.color.setHex(isDarkMode ? 0x334155 : 0x94a3b8);
                if ('emissive' in anyMat) {
                  anyMat.emissive.setHex(0x000000);
                  anyMat.emissiveIntensity = 0.0;
                }
              }
            } else {
              // STANDARD SHADER VIEWS (with optional highlighted system items)
              if (activeSystemFilter !== "ninguno" && matchesActiveSystem) {
                // Highlight system elements on top of the realistic / xray / wireframe rendering
                if ('wireframe' in anyMat) anyMat.wireframe = visualMode === "wireframe";
                anyMat.transparent = false;
                anyMat.opacity = 1.0;

                let sysColor = 0xffffff;
                if (meshSystem === "iluminacion") sysColor = 0xffffff;
                else if (meshSystem === "agua") sysColor = 0xffffff;
                else if (meshSystem === "energia") sysColor = 0xffffff;
                else if (meshSystem === "hvac") sysColor = 0xffffff;
                else if (meshSystem === "elevadores") sysColor = 0xffffff;

                if ('color' in anyMat) anyMat.color.setHex(sysColor);
                if ('emissive' in anyMat) {
                  anyMat.emissive.setHex(sysColor);
                  anyMat.emissiveIntensity = 0.75;
                }
              } else {
                // standard render mode
                if (visualMode === "realista") {
                  if ('wireframe' in anyMat) anyMat.wireframe = false;
                  anyMat.transparent = origMat.transparent;
                  anyMat.opacity = origMat.opacity;
                  if ('color' in anyMat) anyMat.color.copy(origMat.color);

                  if ('emissive' in anyMat) {
                    if (isSelectedMesh) {
                      anyMat.emissive.copy(statusColor);
                      anyMat.emissiveIntensity = 0.55;
                    } else if (isHoveredMesh) {
                      anyMat.emissive.copy(statusColor);
                      anyMat.emissiveIntensity = 0.35;
                    } else {
                      anyMat.emissive.copy(origMat.emissive);
                      anyMat.emissiveIntensity = 1.0;
                    }
                  }

                } else if (visualMode === "xray") {
                  if ('wireframe' in anyMat) anyMat.wireframe = false;
                  if (isSelectedMesh) {
                    if ('color' in anyMat) anyMat.color.copy(statusColor);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.copy(statusColor);
                      anyMat.emissiveIntensity = 0.8;
                    }
                    anyMat.transparent = false;
                    anyMat.opacity = 1.0;
                  } else if (isHoveredMesh) {
                    if ('color' in anyMat) anyMat.color.copy(statusColor);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.copy(statusColor).multiplyScalar(0.5);
                      anyMat.emissiveIntensity = 0.5;
                    }
                    anyMat.transparent = true;
                    anyMat.opacity = 0.5;
                  } else {
                    // Ghostly blueprints blue
                    if ('color' in anyMat) anyMat.color.setHex(0x0e7490);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.setHex(0x022c22);
                      anyMat.emissiveIntensity = 0.1;
                    }
                    anyMat.transparent = true;
                    anyMat.opacity = 0.12;
                  }

                } else if (visualMode === "wireframe") {
                  if ('wireframe' in anyMat) anyMat.wireframe = true;
                  anyMat.transparent = true;
                  
                  if (isSelectedMesh) {
                    if ('color' in anyMat) anyMat.color.copy(statusColor);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.copy(statusColor);
                      anyMat.emissiveIntensity = 0.9;
                    }
                    anyMat.opacity = 1.0;
                  } else if (isHoveredMesh) {
                    if ('color' in anyMat) anyMat.color.copy(statusColor);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.copy(statusColor).multiplyScalar(0.5);
                      anyMat.emissiveIntensity = 0.5;
                    }
                    anyMat.opacity = 0.7;
                  } else {
                    if ('color' in anyMat) anyMat.color.setHex(isDarkMode ? 0x334155 : 0xcbd5e1);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.setHex(0x000000);
                      anyMat.emissiveIntensity = 0.0;
                    }
                    anyMat.opacity = 0.25;
                  }
                }
              }
            }
          }
        }
      }
    });
  };

  // Run Highlights & Offset updates when properties change
  useEffect(() => {
    applyHighlightsAndOffsets();
  }, [selectedPisoId, hoveredPisoId, explodeValue, visualMode, isDarkMode, floorStatuses, activeSystemFilter, systemGhostMode]);

  // Sync ref to avoid rebuilding Three loop
  useEffect(() => {
    activeSystemFilterRef.current = activeSystemFilter;
  }, [activeSystemFilter]);

  // Main Three.js Initialization
  useEffect(() => {
    if (!canvasRef.current) return;

    let animationFrameId: number;
    let resizeObserver: ResizeObserver;
    let onCanvasClick: (event: MouseEvent) => void;

    try {
      // 1. Create Scene
      const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xf8fafc);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.set(12, 10, 12);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    rendererRef.current = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.35 : 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, isDarkMode ? 0.8 : 1.2);
    dirLight.position.set(15, 20, 15);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Subtle fill point lights
    const pointLight1 = new THREE.PointLight(0xb45309, 0.4, 30);
    pointLight1.position.set(-10, 5, -10);
    scene.add(pointLight1);

    // 5. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't orbit below ground
    controls.minDistance = 3;
    controls.maxDistance = 60;

    // 7. Loading the 3D GLB Model
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    setIsLoading(true);
    setLoadError(null);

    const setupModelInScene = (model: THREE.Group, isThisProcedural: boolean) => {
      try {
        // If a real model is loaded, we split it into separate floor and system components!
        if (!isThisProcedural) {
          try {
            let singleMesh: THREE.Mesh | null = null;
            model.traverse((child) => {
              if (child instanceof THREE.Mesh && !singleMesh) {
                if (child.geometry && child.geometry.attributes && child.geometry.attributes.position) {
                  singleMesh = child;
                }
              }
            });

            if (singleMesh) {
              const tempBBox = new THREE.Box3().setFromObject(model);
              const tempSize = new THREE.Vector3();
              tempBBox.getSize(tempSize);

              const splitGroup = splitSingleMeshIntoFloorSystems(singleMesh, tempBBox, tempSize);
              
              // Remove original combined mesh from its parent
              if (singleMesh.parent) {
                singleMesh.parent.remove(singleMesh);
              } else {
                model.remove(singleMesh);
              }

              model.add(splitGroup);
            }
          } catch (splitErr) {
            console.error("Failed to split mesh into floors/systems, proceeding with original model:", splitErr);
          }
        }

        modelRef.current = model;

        // Auto calculate bounding box to dynamically scale and center camera
        const bbox = new THREE.Box3().setFromObject(model);
        boundingBoxRef.current = bbox;
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        const size = new THREE.Vector3();
        bbox.getSize(size);

        // Shift model so its ground sits near Y=0
        model.position.y = -bbox.min.y;
        bbox.translate(new THREE.Vector3(0, -bbox.min.y, 0));

        // Center on X and Z axes
        model.position.x = -center.x;
        model.position.z = -center.z;
        bbox.translate(new THREE.Vector3(-center.x, 0, -center.z));

        scene.add(model);

        // Record original materials & positions, enabling customized floor highlighting
        originalMaterials.current.clear();
        originalPositions.current.clear();

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Save original local position
            originalPositions.current.set(child, child.position.clone());

            if (child.material) {
              // Clone materials to avoid shared instances, allowing individual floor glows
              const originalMat = child.material;
              child.material = Array.isArray(originalMat)
                ? originalMat.map(m => m.clone())
                : originalMat.clone();

              const mat = Array.isArray(child.material) ? child.material[0] : child.material;
              if (mat instanceof THREE.Material) {
                const anyMat = mat as any;
                originalMaterials.current.set(child, {
                  color: anyMat.color ? anyMat.color.clone() : new THREE.Color(0xffffff),
                  emissive: ('emissive' in anyMat) ? anyMat.emissive.clone() : new THREE.Color(0,0,0),
                  opacity: anyMat.opacity,
                  transparent: anyMat.transparent,
                  wireframe: !!anyMat.wireframe
                });
              }
            }
          }
        });

        // Recalculate bounding box with final positions
        const adjustedBBox = new THREE.Box3().setFromObject(model);
        boundingBoxRef.current = adjustedBBox;

        const adjCenter = new THREE.Vector3();
        adjustedBBox.getCenter(adjCenter);
        const adjSize = new THREE.Vector3();
        adjustedBBox.getSize(adjSize);

        // 8. Dynamic Glowing Level Bracket Indicator (Grid Selector)
        const diameter = Math.max(adjSize.x, adjSize.z) * 1.35;
        const ring = new THREE.GridHelper(diameter, 16, 0x10b981, 0x10b981);
        ring.position.set(0, adjCenter.y, 0);
        scene.add(ring);
        floorHighlightRing.current = ring;

        // Position camera perfectly centered
        controls.target.copy(adjCenter);
        const maxDim = Math.max(adjSize.x, adjSize.y, adjSize.z);
        camera.position.set(adjCenter.x + maxDim * 1.1, adjCenter.y + maxDim * 0.8, adjCenter.z + maxDim * 1.1);
        controls.update();

        setIsLoading(false);
        applyHighlightsAndOffsets();
      } catch (err) {
        console.error("Error setting up model in scene, falling back to procedural building:", err);
        if (!isThisProcedural) {
          setIsProcedural(true);
          const proceduralModel = buildProceduralBuilding();
          setupModelInScene(proceduralModel, true);
        } else {
          setIsLoading(false);
          setLoadError("No se pudo iniciar el visualizador 3D.");
        }
      }
    };

    const buildProceduralBuilding = () => {
      const model = new THREE.Group();
      
      for (let i = 0; i < 10; i++) {
        const floorBaseY = i * 2.2;
        
        // 1. Slab (Base structure)
        const slabGeom = new THREE.BoxGeometry(8, 0.15, 8);
        const slabMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.5, 
          metalness: 0.1 
        });
        const slab = new THREE.Mesh(slabGeom, slabMat);
        slab.name = `concrete_slab_floor_${i}`;
        slab.position.set(0, floorBaseY, 0);
        model.add(slab);
        
        // 2. Ceiling slab
        const ceilGeom = new THREE.BoxGeometry(8, 0.1, 8);
        const ceilMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.5, 
          metalness: 0.1 
        });
        const ceil = new THREE.Mesh(ceilGeom, ceilMat);
        ceil.name = `concrete_ceil_floor_${i}`;
        ceil.position.set(0, floorBaseY + 1.9, 0);
        model.add(ceil);
        
        // 3. Glass central walls (curtain wall)
        const glassGeom = new THREE.BoxGeometry(7.2, 1.8, 7.2);
        const glassMat = new THREE.MeshStandardMaterial({ 
          color: 0x38bdf8, 
          transparent: true, 
          opacity: 0.25, 
          roughness: 0.1, 
          metalness: 0.9 
        });
        const glass = new THREE.Mesh(glassGeom, glassMat);
        glass.name = `glass_window_floor_${i}`;
        glass.position.set(0, floorBaseY + 0.95, 0);
        model.add(glass);
        
        // 4. Corner Structural Columns
        const colGeom = new THREE.BoxGeometry(0.35, 1.8, 0.35);
        const colMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.7 
        });
        const columnsPos = [ [-3.7, -3.7], [3.7, -3.7], [-3.7, 3.7], [3.7, 3.7] ];
        columnsPos.forEach(([cx, cz], colIdx) => {
          const col = new THREE.Mesh(colGeom, colMat);
          col.name = `structure_column_floor_${i}_${colIdx}`;
          col.position.set(cx, floorBaseY + 0.95, cz);
          model.add(col);
        });
        
        // 5. Elevador Cabin / Shaft (System: elevadores)
        const liftGeom = new THREE.BoxGeometry(1.6, 1.8, 1.6);
        const liftMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.3, 
          metalness: 0.8 
        });
        const lift = new THREE.Mesh(liftGeom, liftMat);
        lift.name = `elevador_shaft_floor_${i}`;
        lift.position.set(0, floorBaseY + 0.9, -4.2);
        model.add(lift);
        
        // 6. Water System (System: agua)
        const waterGeom = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 12);
        const waterMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.2, 
          metalness: 0.7 
        });
        const waterUnit = new THREE.Mesh(waterGeom, waterMat);
        waterUnit.name = `water_pump_floor_${i}`;
        waterUnit.position.set(-2.0, floorBaseY + 0.5, 2.0);
        model.add(waterUnit);
        
        // 7. Electrical transformer/power box (System: energia)
        const powerGeom = new THREE.BoxGeometry(0.6, 0.6, 0.6);
        const powerMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.4, 
          metalness: 0.8 
        });
        const powerUnit = new THREE.Mesh(powerGeom, powerMat);
        powerUnit.name = `power_subest_floor_${i}`;
        powerUnit.position.set(2.0, floorBaseY + 0.3, 2.0);
        model.add(powerUnit);
        
        // 8. HVAC Unit / Ducts (System: hvac)
        const hvacGeom = new THREE.BoxGeometry(1.0, 0.5, 1.0);
        const hvacMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.5, 
          metalness: 0.6 
        });
        const hvacUnit = new THREE.Mesh(hvacGeom, hvacMat);
        hvacUnit.name = `hvac_duct_floor_${i}`;
        hvacUnit.position.set(2.0, floorBaseY + 0.25, -2.0);
        model.add(hvacUnit);
        
        // 9. LED Spotlights (System: iluminacion)
        const lightGeom = new THREE.SphereGeometry(0.2, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          emissive: 0x333333, 
          emissiveIntensity: 0.5 
        });
        const lightUnit = new THREE.Mesh(lightGeom, lightMat);
        lightUnit.name = `light_led_floor_${i}`;
        lightUnit.position.set(-2.0, floorBaseY + 1.4, -2.0);
        model.add(lightUnit);
      }
      
      return model;
    };

    loader.load(
      "/Meshy_AI_Vertical_Campus_Cross_30MB_final_valid.glb?v=12556508",
      (gltf) => {
        setIsProcedural(false);
        setupModelInScene(gltf.scene, false);
        dracoLoader.dispose();
      },
      (xhr) => {
        if (xhr.total > 0) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
        } else {
          // Fallback if content length is unknown
          setLoadingProgress(prev => Math.min(prev + 10, 95));
        }
      },
      (error) => {
        console.warn("No se pudo cargar el modelo GLTF original. Iniciando estructura procedimental 3D interactiva de respaldo:", error);
        setIsProcedural(true);
        const proceduralModel = buildProceduralBuilding();
        setupModelInScene(proceduralModel, true);
        setLoadError(null);
        setIsLoading(false);
        dracoLoader.dispose();
      }
    );

    // 9. Resize Observer for proper dimensions (Avoids fixed window size reliance)
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight || 450;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial resize call
    setTimeout(handleResize, 100);

    // 10. Mouse click listener to support Raycasting Floor Selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    onCanvasClick = (event: MouseEvent) => {
      if (!canvasRef.current || !cameraRef.current || !modelRef.current || !boundingBoxRef.current) return;

      // Calculate localized relative canvas coordinates
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(modelRef.current.children, true);

      if (intersects.length > 0) {
        // We clicked a mesh! Try to get its explicit floor index from userData first, or fallback to spatial calculations.
        const clickedObj = intersects[0].object;
        let clickedFloorIndex = clickedObj.userData.floorIndex;
        
        if (clickedFloorIndex === undefined) {
          const hitPoint = intersects[0].point;
          const bbox = boundingBoxRef.current;
          const normY = (hitPoint.y - bbox.min.y) / (bbox.max.y - bbox.min.y || 1);
          clickedFloorIndex = Math.min(9, Math.max(0, Math.floor(normY * 10)));
        }
        
        // Map to corresponding floor ID (piso_1 to piso_10)
        const targetFloorId = `piso_${clickedFloorIndex + 1}`;
        setSelectedPisoId(targetFloorId);
      }
    };

    canvasRef.current.addEventListener("click", onCanvasClick);

    // 11. Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (controlsRef.current) {
        // Gentle passive rotation if requested
        if (autoRotate && !isLoading) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 0.45;
        } else {
          controlsRef.current.autoRotate = false;
        }
        controlsRef.current.update();
      }

      // Handle dynamic pulsing of active systems
      if (modelRef.current && activeSystemFilterRef.current !== "ninguno") {
        const time = performance.now() * 0.0035;
        const pulse = Math.sin(time) * 0.35 + 0.65; // oscillates between 0.3 and 1.0
        
        modelRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh && child.material) {
            const mat = Array.isArray(child.material) ? child.material[0] : child.material;
            const anyMat = mat as any;
            
            if ('emissive' in anyMat) {
              const origPos = originalPositions.current.get(child);
              if (origPos && boundingBoxRef.current) {
                const minY = boundingBoxRef.current.min.y;
                const height = boundingBoxRef.current.max.y - minY || 1;
                const normY = (origPos.y - minY) / height;
                const meshFloorIndex = child.userData.floorIndex !== undefined 
                  ? child.userData.floorIndex 
                  : Math.min(9, Math.max(0, Math.floor(normY * 10)));
                
                const meshSystem = child.userData.system !== undefined
                  ? child.userData.system
                  : classifyMeshSystem(child.name, meshFloorIndex);

                if (meshSystem !== null && (activeSystemFilterRef.current === "todos" || meshSystem === activeSystemFilterRef.current)) {
                  if (meshSystem === "elevadores") {
                    // Elevator moves up and down
                    const elevatorWave = Math.sin(time * 0.5 + normY * 5.5);
                    anyMat.emissiveIntensity = (elevatorWave > 0.3 ? 0.95 : 0.1) * pulse;
                  } else {
                    anyMat.emissiveIntensity = pulse * 0.85;
                  }
                }
              }
            }
          }
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
      animate();
    } catch (err) {
      console.error("ThreeJS initialization failed, falling back gracefully:", err);
      setIsLoading(false);
      setLoadError("El motor de renderizado 3D no se pudo inicializar o WebGL está desactivado en este navegador.");
    }

    // Cleanup Resources on Unmount
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      if (canvasRef.current && onCanvasClick) {
        canvasRef.current.removeEventListener("click", onCanvasClick);
      }

      // Dispose materials & geometries
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        });
      }

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  // Update background when dark mode shifts
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isDarkMode ? 0x0f172a : 0xf8fafc);
    }
  }, [isDarkMode]);

  return (
    <div id="edificio-isometrico-container" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-widest text-[#B08D4C] uppercase bg-[#B08D4C]/10 px-2 py-0.5 rounded-full mb-1">
            <Sparkles size={10} /> Escenario B · Renderizado 3D Interactivo
          </span>
          <h3 className="text-lg font-extrabold text-[#1B2A4A] flex items-center gap-2">
            <Layers className="text-[#B08D4C]" size={20} />
            Monitor Tridimensional de Habitabilidad
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Haz clic sobre los niveles para examinarlos.
          </p>
        </div>
        
        {/* SEMAPHORE LEGENDS */}
        <div className="flex flex-wrap items-center gap-3.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100/80">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-600 shadow-sm" />
            <span>Sano / Al Día</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-600 shadow-sm" />
            <span>Atención Preventiva</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-600 shadow-sm animate-pulse" />
            <span>Alerta de Vencimiento</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: INTERACTIVE 3D BLUEPRINT CANVAS */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col bg-slate-900 rounded-2xl border border-slate-800 relative shadow-inner overflow-hidden">
          
          {/* Action Toolbar on Top of the 3D Scene */}
          <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* View presets */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 backdrop-blur-md pointer-events-auto shadow-md">
              <button 
                onClick={() => setCameraView("iso")}
                title="Vista Isométrica"
                className="p-1.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all duration-150"
              >
                Isométrica
              </button>
              <button 
                onClick={() => setCameraView("top")}
                title="Vista Cenital (Planta)"
                className="p-1.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all duration-150"
              >
                Cenital
              </button>
              <button 
                onClick={() => setCameraView("front")}
                title="Vista Frontal (Fachada)"
                className="p-1.5 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-all duration-150"
              >
                Frontal
              </button>
            </div>

            {/* Render Styles Toolbar */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800/80 backdrop-blur-md pointer-events-auto shadow-md">
              <button
                onClick={() => setVisualMode("realista")}
                className={`px-2 py-1 text-[10px] font-black rounded flex items-center gap-1 transition-all ${
                  visualMode === "realista" ? "bg-[#B08D4C] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Grid3X3 size={11} />
                Realista
              </button>
              <button
                onClick={() => setVisualMode("xray")}
                className={`px-2 py-1 text-[10px] font-black rounded flex items-center gap-1 transition-all ${
                  visualMode === "xray" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Maximize2 size={11} />
                Rayos X
              </button>
              <button
                onClick={() => setVisualMode("wireframe")}
                className={`px-2 py-1 text-[10px] font-black rounded flex items-center gap-1 transition-all ${
                  visualMode === "wireframe" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Minimize2 size={11} />
                Estructura
              </button>
            </div>
          </div>

          {/* Right Floating Quick Toggles */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 pointer-events-auto">
            {/* Auto-Rotation Toggle */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title={autoRotate ? "Detener Rotación" : "Giro Automático"}
              className={`p-2.5 rounded-xl border backdrop-blur-md shadow-lg transition-all duration-200 ${
                autoRotate 
                  ? "bg-[#B08D4C]/25 text-[#B08D4C] border-[#B08D4C]/45" 
                  : "bg-slate-950/75 text-slate-400 border-slate-800/60 hover:text-white hover:bg-slate-900"
              }`}
            >
              <RotateCw size={14} className={autoRotate ? "animate-spin-slow" : ""} />
            </button>

            {/* Dark/Light Scene theme toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Cambiar Color de Fondo"
              className="p-2.5 rounded-xl bg-slate-950/75 text-slate-400 border border-slate-800/60 hover:text-white hover:bg-slate-900 backdrop-blur-md shadow-lg transition-all duration-200"
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {/* Canvas Wrapper */}
          <div 
            ref={containerRef} 
            className="w-full h-[480px] relative flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            {/* Real WebGL Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

            {/* 3D Loading Progress Overlay */}
            <AnimatePresence>
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-6 z-20 text-center backdrop-blur-sm"
                >
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-12 h-12 border-4 border-t-[#B08D4C] border-r-transparent border-b-[#B08D4C]/30 border-l-transparent rounded-full mb-4"
                  />
                  <h4 className="text-sm font-extrabold text-white tracking-wide">Cargando Modelo Tridimensional</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Importando geometría texturizada, configurando iluminación y calculando cotas de habitabilidad...
                  </p>
                  
                  {/* Progress bar */}
                  <div className="w-48 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden relative border border-slate-700/50">
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-[#B08D4C]"
                      initial={{ width: "0%" }}
                      animate={{ width: `${loadingProgress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#B08D4C] font-mono mt-1.5">
                    {loadingProgress}% cargado
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Loading error message fallback */}
            {loadError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
                <AlertTriangle className="text-red-500 mb-3" size={36} />
                <h4 className="text-sm font-extrabold text-white">Error de Carga 3D</h4>
                <p className="text-xs text-red-300 mt-2 max-w-sm">
                  {loadError}
                </p>
                <p className="text-[10px] text-slate-400 mt-4 italic max-w-xs">
                  Mientras se valida el archivo, hemos montado el panel de control lateral interactivo para coordinar el mantenimiento.
                </p>
              </div>
            )}

            {/* User-friendly procedural banner */}
            {isProcedural && (
              <div className="absolute bottom-16 left-3 right-3 z-10 bg-slate-950/90 border border-slate-800 text-slate-300 p-3 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-3 pointer-events-auto">
                <Info size={16} className="text-[#B08D4C] shrink-0 animate-pulse" />
                <div className="text-left leading-tight">
                  <span className="text-[10px] font-black uppercase tracking-wider block text-white">Modelo de Respaldo Interactivo Activo</span>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Para activar el render de alta fidelidad, sube <strong className="font-mono text-slate-300">Meshy_AI_Vertical_Campus_Cross_30MB_final_valid.glb</strong> a la carpeta <strong className="font-mono text-slate-300">public</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Control de Sistemas Activos / IoT */}
          <div className="bg-slate-950/85 p-4 border-t border-slate-800/80 backdrop-blur-md space-y-4">
            
            {/* Header Row with high-contrast, professional tags */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-[#B08D4C] rounded-full animate-pulse" />
                <div>
                  <span className="text-[11px] font-black tracking-wider text-slate-200 uppercase block">
                    Monitoreo IoT de Sistemas
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Haz clic para iluminar y aislar componentes de ingeniería activos
                  </span>
                </div>
              </div>

              {/* Ghost mode check redesigned as a premium glass pill toggle */}
              <div className="shrink-0">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 rounded-xl cursor-pointer select-none transition-all">
                  <input 
                    type="checkbox"
                    checked={systemGhostMode}
                    onChange={(e) => setSystemGhostMode(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-[#B08D4C] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-[#B08D4C]"
                  />
                  <span className="text-[10px] font-extrabold text-slate-300 tracking-wide">
                    Aislar sistema (Efecto Fantasma)
                  </span>
                </label>
              </div>
            </div>

            {/* Filter Buttons in a clean, highly responsive grid layout to avoid vertical wrapping mess */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {[
                { id: "todos", label: "Todos", icon: <Layers size={12} />, color: "border-slate-800 text-slate-300 hover:bg-slate-900 hover:text-white" },
                { id: "iluminacion", label: "Iluminación", icon: <Sun size={12} />, color: "border-yellow-900/30 text-yellow-500 hover:bg-yellow-950/20 hover:text-yellow-400", activeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/60 shadow-sm shadow-yellow-500/10" },
                { id: "agua", label: "Agua", icon: <Droplet size={12} />, color: "border-cyan-900/30 text-cyan-500 hover:bg-cyan-950/20 hover:text-cyan-400", activeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-500/10" },
                { id: "energia", label: "Energía", icon: <Zap size={12} />, color: "border-amber-900/30 text-amber-500 hover:bg-amber-950/20 hover:text-amber-400", activeBg: "bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/10" },
                { id: "hvac", label: "Climas / HVAC", icon: <RefreshCw size={12} />, color: "border-orange-900/30 text-orange-500 hover:bg-orange-950/20 hover:text-orange-400", activeBg: "bg-orange-500/20 text-orange-300 border-orange-500/60 shadow-sm shadow-orange-500/10" },
                { id: "elevadores", label: "Elevadores", icon: <Activity size={12} />, color: "border-purple-900/30 text-purple-500 hover:bg-purple-950/20 hover:text-purple-400", activeBg: "bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm shadow-purple-500/10" },
                { id: "ninguno", label: "Apagar", icon: <EyeOff size={12} />, color: "border-slate-850 text-slate-400 hover:bg-slate-900 hover:text-slate-300", activeBg: "bg-[#0f172a] text-slate-300 border-slate-700" }
              ].map((sys) => {
                const isActive = activeSystemFilter === sys.id;
                return (
                  <button
                    key={sys.id}
                    onClick={() => setActiveSystemFilter(sys.id)}
                    className={`px-2 py-2 text-[10px] font-black rounded-xl border flex items-center justify-center gap-1.5 transition-all duration-150 ${
                      isActive 
                        ? (sys.activeBg || "bg-[#B08D4C]/25 text-[#B08D4C] border-[#B08D4C]/60 shadow-sm shadow-[#B08D4C]/10") 
                        : `${sys.color} bg-slate-900/30`
                    }`}
                  >
                    <span className={isActive ? "scale-110 transition-transform" : "opacity-80"}>
                      {sys.icon}
                    </span>
                    <span>{sys.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Interactive Explode Controller */}
          <div className="bg-slate-950/90 p-4 border-t border-slate-800/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-cyan-400 animate-spin-slow" />
              <div>
                <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase block">Perspectiva Dinámica</span>
                <span className="text-[11px] text-[#B08D4C] font-semibold">Usa el mouse para rotar (clic izquierdo) y panear (clic derecho)</span>
              </div>
            </div>

            {/* Exploded View Slider */}
            <div className="flex items-center gap-3 w-full sm:w-auto max-w-xs bg-slate-900/60 p-2 rounded-xl border border-slate-800/50">
              <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase shrink-0">Vista Explotada</span>
              <input 
                type="range" 
                min="0" 
                max="1.5" 
                step="0.05"
                value={explodeValue}
                onChange={(e) => setExplodeValue(parseFloat(e.target.value))}
                className="w-32 accent-[#B08D4C] h-1 bg-slate-700 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] font-bold text-slate-300 font-mono shrink-0 w-8 text-right">
                {Math.round(explodeValue * 100)}%
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ACTIVE LEVEL TELEMETRY, AREAS & ACTIONS */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between self-stretch">
          <div className="space-y-4">
            
            {/* FLOATING DETAILED PANEL FOR SELECTED LEVEL */}
            <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-150 shadow-xs">
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-[#1B2A4A] flex items-center justify-center text-[#B08D4C] border border-[#B08D4C]/15 shadow-sm shrink-0">
                    {getFloorIcon(selectedFloorStatus.id, 22)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-400 block uppercase">
                      Nivel {selectedFloorStatus.numero - 1} · ID: {selectedFloorStatus.id}
                    </span>
                    <h4 className="font-extrabold text-[#1B2A4A] text-sm leading-tight mt-0.5">
                      {selectedFloorStatus.nombre}
                    </h4>
                  </div>
                </div>

                {/* Live Status Badge */}
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1.5 shadow-2xs ${
                  getStatusConfig(selectedFloorStatus.worstStatus).solidBg
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    getStatusConfig(selectedFloorStatus.worstStatus).badgeColor
                  }`} />
                  {getStatusConfig(selectedFloorStatus.worstStatus).text}
                </span>
              </div>

              {/* Maintenance Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2 pb-3.5 mb-3.5 border-b border-slate-200/60">
                <div className="p-2.5 bg-white border border-slate-100 rounded-xl text-center shadow-3xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Vencidas</span>
                  <div className={`text-base font-black mt-0.5 ${selectedFloorStatus.vencidas > 0 ? "text-red-500" : "text-slate-700"}`}>
                    {selectedFloorStatus.vencidas}
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-100 rounded-xl text-center shadow-3xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Por Vencer</span>
                  <div className={`text-base font-black mt-0.5 ${selectedFloorStatus.porVencer > 0 ? "text-amber-500" : "text-slate-700"}`}>
                    {selectedFloorStatus.porVencer}
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-100 rounded-xl text-center shadow-3xs">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ejecución</span>
                  <div className="text-base font-black text-emerald-600 mt-0.5">
                    {selectedFloorStatus.total > 0 
                      ? `${Math.round((selectedFloorStatus.completadas / selectedFloorStatus.total) * 100)}%` 
                      : "100%"
                    }
                  </div>
                </div>
              </div>

              {/* Diagnosis instructions banner */}
              <div className="bg-slate-100/80 p-3 rounded-xl border border-slate-200/40 text-[10px] text-slate-500 flex items-start gap-2">
                <Info size={14} className="text-[#B08D4C] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Haz clic en cualquier nivel del modelo 3D o selecciona uno en la lista de abajo. Los niveles se colorean según su semáforo.
                </p>
              </div>
            </div>

            {/* INTERACTIVE LEVEL QUICK LIST (Bidirectional Selector) */}
            <div className="space-y-2">
              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
                <Building2 size={12} className="text-[#B08D4C]" />
                Selectores de Nivel
              </h5>
              
              <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-1">
                {floorStatuses.map(f => {
                  const isSelected = selectedPisoId === f.id;
                  const statusCfg = getStatusConfig(f.worstStatus);
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelectedPisoId(f.id)}
                      onMouseEnter={() => setHoveredPisoId(f.id)}
                      onMouseLeave={() => setHoveredPisoId(null)}
                      className={`flex items-center justify-between p-1.5 px-3 rounded-lg text-left text-xs font-semibold transition-all border ${
                        isSelected 
                          ? "bg-[#1B2A4A] text-white border-[#B08D4C]/30 shadow-xs" 
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {getFloorIcon(f.id, 14)}
                        <span>{f.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.vencidas > 0 && (
                          <span className="bg-red-500 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {f.vencidas}
                          </span>
                        )}
                        <span className={`w-2.5 h-2.5 rounded-full ${statusCfg.badgeColor}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEGMENTED AREA LIST OF THE CHOSEN FLOOR */}
            <div className="space-y-2.5">
              <h5 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
                <Activity size={12} className="text-[#B08D4C]" />
                Áreas Registradas en este Piso
              </h5>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {selectedFloorAreas.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 bg-slate-50/50 border border-dashed border-slate-200/60 rounded-xl">
                    <p className="text-xs">No hay áreas de mantenimiento registradas en este piso.</p>
                  </div>
                ) : (
                  selectedFloorAreas.map(area => {
                    const areaTareas = tareas.filter(t => t.area_id === area.id);
                    const isCritical = areaTareas.some(t => t.estado === "vencida" || t.estado === "urgente");
                    const isWarning = areaTareas.some(t => t.estado === "en_curso");

                    return (
                      <div key={area.id} className="border border-slate-150 rounded-xl p-3 bg-white shadow-3xs hover:border-slate-250 transition-all duration-150">
                        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${
                              isCritical ? "bg-red-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
                            }`} />
                            {area.nombre}
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                            {areaTareas.length} Tareas
                          </span>
                        </div>

                        {/* List of active tasks in this specific sub-area */}
                        <div className="space-y-1.5 pl-2">
                          {areaTareas.length === 0 ? (
                            <span className="text-[10px] text-gray-400 italic block py-0.5 pl-1.5">
                              Sin planes activos cargados
                            </span>
                          ) : (
                            areaTareas.map(t => (
                              <div 
                                key={t.id}
                                onClick={() => onSelectTarea(t)}
                                className="flex items-center justify-between group/task cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-150"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <span className="text-[10.5px] font-semibold text-slate-600 block truncate group-hover/task:text-[#1B2A4A] transition-colors">
                                    {t.titulo}
                                  </span>
                                  <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-medium">
                                    <span className="uppercase font-mono text-[8px] bg-slate-100 text-slate-500 px-1 rounded">
                                      {t.frecuencia}
                                    </span>
                                    <span>•</span>
                                    <span>Vence: {t.proxima_fecha}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                    t.estado === "vencida" || t.estado === "urgente"
                                      ? "bg-red-50 text-red-600"
                                      : t.estado === "en_curso"
                                      ? "bg-amber-50 text-amber-600"
                                      : t.costo_real !== null
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-slate-50 text-slate-500"
                                  }`}>
                                    {t.estado === "vencida" ? "Vencida" : t.estado === "en_curso" ? "En Curso" : t.costo_real !== null ? "Completa" : "Prog"}
                                  </span>
                                  <Eye size={11} className="text-slate-300 group-hover/task:text-[#1B2A4A] transition-colors" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

          {/* VIEW ALL CALENDAR BUTTON */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button
              onClick={() => onSetTab("calendario")}
              className="w-full py-2.5 px-4 bg-[#1B2A4A] hover:bg-[#1B2A4A]/90 text-[#B08D4C] hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-2xs cursor-pointer border border-[#B08D4C]/30 hover:border-transparent transition-all duration-200"
            >
              <CalendarDays size={13} />
              <span>Ver Plan Preventivo en Módulo Calendario</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
