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

  if (name.includes("light") || name.includes("foco") || name.includes("led") || name.includes("lampara") || name.includes("glow") || name.includes("refl") || name.includes("emit") || name.includes("glowing") || name.includes("ilumin")) {
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

  // Buckets for 10 floors and structure only
  const buckets: { [key: string]: {
    positions: number[];
    normals: number[];
    uvs: number[];
  }} = {};

  const systems = ["estructura"];
  for (let f = 0; f < 10; f++) {
    for (const sys of systems) {
      buckets[`${f}_${sys}`] = { positions: [], normals: [], uvs: [] };
    }
  }

  // Helper to classify all elements as base structure
  const getSystemType = (avgX: number, avgY: number, avgZ: number) => {
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

      // Estructura: Elegant, clean, semi-transparent white architectural glass shell
      const mat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc, // Off-white
        roughness: 0.75, // high roughness
        metalness: 0.05, // low metalness
        transparent: true,
        opacity: 0.55,
        depthWrite: true
      });

      // Preserve underlying baked texture maps if present in the GLTF
      const baseMat = isMultiMaterial ? originalMat[0] : originalMat;
      if (baseMat && (baseMat as any).map) {
        mat.map = (baseMat as any).map;
      }

      const m = new THREE.Mesh(geom, mat);
      m.name = `floor_${f}_system_${sys}`;
      
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
  const [showIotOverlays, setShowIotOverlays] = useState<boolean>(true);
  
  interface HoveredIotElement {
    system: string;
    floor: number;
    name: string;
    status: "Óptimo" | "Atención" | "Crítico";
    reading: string;
    x: number;
    y: number;
  }
  const [hoveredIot, setHoveredIot] = useState<HoveredIotElement | null>(null);
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
  const iotOverlayGroupRef = useRef<THREE.Group | null>(null);
  const buildingRootRef = useRef<THREE.Group | null>(null);

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
    if (!cameraRef.current || !controlsRef.current || !buildingRootRef.current) return;
    const rootBox = new THREE.Box3().setFromObject(buildingRootRef.current);
    const center = rootBox.getCenter(new THREE.Vector3());
    const size = rootBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    controlsRef.current.target.copy(center);

    switch (type) {
      case "iso":
        cameraRef.current.position.set(center.x + maxDim * 1.1, center.y + maxDim * 0.8, center.z + maxDim * 1.1);
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
      floorHighlightRing.current.visible = (visualMode !== "realista");
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

            // Classify system using specialized userData or fallback naming
            let meshSystem = child.userData.system !== undefined
              ? child.userData.system
              : classifyMeshSystem(child.name, meshFloorIndex);

            if (!meshSystem) {
              meshSystem = "estructura";
            }

            if (meshSystem === "estructura") {
              if ('wireframe' in anyMat) anyMat.wireframe = visualMode === "wireframe";
              
              const isGhostActive = systemGhostMode && activeSystemFilter !== "ninguno";

              if (visualMode === "realista") {
                if (isGhostActive) {
                  // Ghost effect activated for building
                  anyMat.transparent = true;
                  anyMat.opacity = 0.28;
                  anyMat.depthWrite = false;
                  
                  // Restore original color/map but keep it transparent
                  if (origMat) {
                    if (origMat.color && 'color' in anyMat) anyMat.color.copy(origMat.color);
                    if (origMat.map && 'map' in anyMat) anyMat.map = origMat.map;
                  } else {
                    if ('color' in anyMat) anyMat.color.setHex(0xf8fafc);
                  }
                } else {
                  // Ghost effect deactivated: solid building
                  const nameLower = child.name.toLowerCase();
                  const isGlass = nameLower.includes("glass") || 
                                  nameLower.includes("vidrio") || 
                                  nameLower.includes("cristal") || 
                                  nameLower.includes("window") || 
                                  nameLower.includes("ventana") || 
                                  nameLower.includes("transpar") ||
                                  (origMat && origMat.transparent);

                  if (isGlass) {
                    // Authentic glass: opacity between 0.35 and 0.55, transparent true, depthWrite false
                    anyMat.transparent = true;
                    anyMat.opacity = 0.45;
                    anyMat.depthWrite = false;
                  } else {
                    // Structural materials: opacity 0.92, transparent false, depthWrite true
                    anyMat.transparent = false;
                    anyMat.opacity = 0.92;
                    anyMat.depthWrite = true;
                    if ('roughness' in anyMat) anyMat.roughness = 0.7;
                    if ('metalness' in anyMat) anyMat.metalness = 0.05;
                  }

                  // Restore original materials, maps, and textures
                  if (origMat) {
                    if (origMat.color && 'color' in anyMat) anyMat.color.copy(origMat.color);
                    if (origMat.map && 'map' in anyMat) anyMat.map = origMat.map;
                  } else {
                    if ('color' in anyMat) anyMat.color.setHex(0xf8fafc);
                  }
                }
              } else {
                // xray or wireframe styles (always transparent)
                anyMat.transparent = true;
                if (visualMode === "wireframe") {
                  anyMat.opacity = isSelectedMesh ? 0.8 : (isHoveredMesh ? 0.5 : 0.2);
                  if ('color' in anyMat) anyMat.color.setHex(isDarkMode ? 0x475569 : 0xcbd5e1);
                } else {
                  anyMat.opacity = isSelectedMesh ? 0.65 : (isHoveredMesh ? 0.55 : 0.45);
                  if ('color' in anyMat) anyMat.color.setHex(0xf8fafc);
                  if (origMat && origMat.map) {
                    anyMat.map = origMat.map;
                  }
                }
                if ('roughness' in anyMat) anyMat.roughness = 0.75;
                if ('metalness' in anyMat) anyMat.metalness = 0.05;
                if ('depthWrite' in anyMat) anyMat.depthWrite = true;
              }

              if ('emissive' in anyMat) {
                anyMat.emissive.setHex(0x000000);
                anyMat.emissiveIntensity = 0.0;
              }
              child.visible = true;

            } else {
              // IoT Overlay system components
              if (!showIotOverlays) {
                anyMat.transparent = true;
                anyMat.opacity = 0.0;
                child.visible = false;
              } else {
                const isActualSystem = ["iluminacion", "agua", "energia", "hvac", "elevadores"].includes(meshSystem);
                const matchesActiveSystem = activeSystemFilter !== "ninguno" && 
                  (activeSystemFilter === "todos" ? isActualSystem : meshSystem === activeSystemFilter);

                if (activeSystemFilter !== "ninguno" && matchesActiveSystem) {
                  // If ghost mode is active and we're isolating a single system (not "todos")
                  const isIsolatingSingleSystem = systemGhostMode && activeSystemFilter !== "todos";
                  const baseOpacity = isIsolatingSingleSystem ? 0.95 : (activeSystemFilter === "todos" ? 0.35 : 0.90);
                  
                  // Dim overlays on non-selected floors to guide focus to the selected floor
                  const floorDimmFactor = isSelectedMesh ? 1.0 : 0.35;
                  anyMat.transparent = true;
                  anyMat.opacity = baseOpacity * floorDimmFactor;
                  
                  // Make selected floor overlays glow even more
                  const emissiveMultiplier = isSelectedMesh ? 1.5 : 0.6;
                  
                  let sysColor = 0xffffff;
                  if (meshSystem === "iluminacion") sysColor = 0xfacc15; // Yellow
                  else if (meshSystem === "agua") sysColor = 0x06b6d4; // Cyan
                  else if (meshSystem === "energia") sysColor = 0xf97316; // Orange
                  else if (meshSystem === "hvac") sysColor = 0xef4444; // Red-Orange
                  else if (meshSystem === "elevadores") sysColor = 0x8b5cf6; // Purple

                  if ('color' in anyMat) anyMat.color.setHex(sysColor);
                  if ('emissive' in anyMat) {
                    anyMat.emissive.setHex(sysColor);
                    anyMat.emissiveIntensity = (meshSystem === "iluminacion" ? 1.2 : 0.8) * emissiveMultiplier;
                  }
                  
                  if ('wireframe' in anyMat) anyMat.wireframe = visualMode === "wireframe";
                  child.visible = true;
                } else {
                  // Inactive system or "ninguno". Hide or make faint in ghost mode (opacity 0.08)
                  if (systemGhostMode && activeSystemFilter !== "ninguno") {
                    anyMat.transparent = true;
                    anyMat.opacity = 0.08;
                    if ('color' in anyMat) anyMat.color.setHex(0x555555);
                    if ('emissive' in anyMat) {
                      anyMat.emissive.setHex(0x000000);
                      anyMat.emissiveIntensity = 0.0;
                    }
                    child.visible = true;
                  } else {
                    anyMat.transparent = true;
                    anyMat.opacity = 0.0;
                    child.visible = false;
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
  }, [selectedPisoId, hoveredPisoId, explodeValue, visualMode, isDarkMode, floorStatuses, activeSystemFilter, systemGhostMode, showIotOverlays]);

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
    let onCanvasMouseMove: (event: MouseEvent) => void;

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
    const pointLight1 = new THREE.PointLight(0xffffff, 0.4, 30);
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

        // 1. Crea un único grupo raíz campusRoot, architectureRoot e iotRoot:
        const campusRoot = new THREE.Group();
        campusRoot.name = "campusRoot";
        buildingRootRef.current = campusRoot;
        modelRef.current = campusRoot;

        const architectureRoot = new THREE.Group();
        architectureRoot.name = "architectureRoot";

        const iotRoot = new THREE.Group();
        iotRoot.name = "iotRoot";
        iotOverlayGroupRef.current = iotRoot;

        campusRoot.add(architectureRoot);
        campusRoot.add(iotRoot);
        architectureRoot.add(model);
        scene.add(campusRoot);

        // 3. Calcula primero el bounding box del modelo GLB:
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // 4. Centra el modelo en su propio grupo:
        model.position.sub(center);

        // 5. Normaliza todo campusRoot usando como altura objetivo 18 unidades:
        const targetHeight = 18;
        const uniformScale = targetHeight / size.y;
        campusRoot.scale.setScalar(uniformScale);

        // Update matrix world to ensure correct vertex calculations
        architectureRoot.updateMatrixWorld(true);

        // 4. Crea un segundo bounding box llamado towerBounds exclusivamente para la torre vertical (excluyendo la plaza inferior):
        const totalBounds = new THREE.Box3().setFromObject(architectureRoot);
        const totalSize = totalBounds.getSize(new THREE.Vector3());
        const towerCutY = totalBounds.min.y + totalSize.y * 0.15; // 15% filter threshold

        const towerBounds = new THREE.Box3();
        architectureRoot.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const geom = child.geometry;
            if (geom) {
              child.updateMatrixWorld(true);
              const matrix = child.matrixWorld;
              const positionAttr = geom.attributes.position;
              if (positionAttr) {
                const tempV = new THREE.Vector3();
                for (let i = 0; i < positionAttr.count; i++) {
                  tempV.fromBufferAttribute(positionAttr, i);
                  tempV.applyMatrix4(matrix); // Transform to architectureRoot local space (unscaled)
                  if (tempV.y >= towerCutY) {
                    towerBounds.expandByPoint(tempV);
                  }
                }
              }
            }
          }
        });

        // Fallback to totalBounds if towerBounds is empty
        if (towerBounds.isEmpty()) {
          towerBounds.copy(totalBounds);
        }

        const towerSize = towerBounds.getSize(new THREE.Vector3());
        const towerCenter = towerBounds.getCenter(new THREE.Vector3());

        // Define bounding box ref based on tower bounds
        boundingBoxRef.current = towerBounds;

        // 10. Aplica la calibración de sistemas IoT únicamente a iotRoot o sus dimensiones relativas:
        const IOT_CALIBRATION = {
          offsetX: 0,
          offsetY: 0,
          offsetZ: 0,
          widthFactor: 0.82,
          depthFactor: 0.78,
          bottomFactor: 0.08,
          topFactor: 0.97
        };

        const calWidth = towerSize.x * IOT_CALIBRATION.widthFactor;
        const calDepth = towerSize.z * IOT_CALIBRATION.depthFactor;
        const calMinY = towerBounds.min.y + towerSize.y * IOT_CALIBRATION.bottomFactor;
        const calMaxY = towerBounds.min.y + towerSize.y * IOT_CALIBRATION.topFactor;
        const calHeight = calMaxY - calMinY;
        const calFloorHeight = calHeight / 10;

        const calCenter = new THREE.Vector3(
          towerCenter.x + IOT_CALIBRATION.offsetX,
          (calMinY + calMaxY) / 2,
          towerCenter.z + IOT_CALIBRATION.offsetZ
        );

        // Genera los overlays DESPUÉS de obtener el bounding box de la torre y calibración:
        const totalNiveles = 10;
        for (let f = 0; f < totalNiveles; f++) {
          const floorGroup = new THREE.Group();
          floorGroup.name = `floor_overlay_${f}`;
          
          // Position relative to campusRoot (unscaled coordinates)
          const floorY = calMinY + ((f + 0.5) / totalNiveles) * calHeight;
          floorGroup.position.set(calCenter.x, floorY, calCenter.z);

          // 1. Iluminación (Yellow #facc15): 4 small ceiling spheres per floor (max 80% width/depth)
          const lightingGroup = new THREE.Group();
          lightingGroup.name = "lightingGroup";
          const lightMat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            emissive: 0xfacc15,
            emissiveIntensity: 1.5,
            transparent: true,
            opacity: 0.9,
            roughness: 0.2,
            metalness: 0.1
          });
          const sphereRadius = calFloorHeight * 0.08;
          const lightGeom = new THREE.SphereGeometry(sphereRadius, 12, 12);
          const lx = calWidth * 0.35;
          const lz = calDepth * 0.35;
          const ly = calFloorHeight * 0.4;
          const lightPositions = [
            [-lx, ly, -lz],
            [-lx, ly, lz],
            [lx, ly, -lz],
            [lx, ly, lz]
          ];
          lightPositions.forEach((pos, idx) => {
            const lightMesh = new THREE.Mesh(lightGeom, lightMat.clone());
            lightMesh.position.set(pos[0], pos[1], pos[2]);
            lightMesh.name = `lighting_fixture_${f}_${idx}`;
            lightMesh.userData = { system: "iluminacion", floorIndex: f };
            lightingGroup.add(lightMesh);
          });
          floorGroup.add(lightingGroup);

          // 2. Agua (Cyan #06b6d4): Vertical tube, horizontal loops, cistern/tanks inside tower bounds
          const waterGroup = new THREE.Group();
          waterGroup.name = "waterGroup";
          const waterPipeMat = new THREE.MeshStandardMaterial({
            color: 0x06b6d4,
            emissive: 0x06b6d4,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9,
            roughness: 0.1,
            metalness: 0.8
          });
          
          // Main vertical water riser (offset from core)
          const waterX = -calWidth * 0.22;
          const waterZ = -calDepth * 0.22;
          const waterRiserRadius = calWidth * 0.008;
          const waterRiserGeom = new THREE.CylinderGeometry(waterRiserRadius, waterRiserRadius, calFloorHeight, 8);
          const waterRiser = new THREE.Mesh(waterRiserGeom, waterPipeMat.clone());
          waterRiser.position.set(waterX, 0, waterZ);
          waterRiser.name = `water_riser_${f}`;
          waterRiser.userData = { system: "agua", floorIndex: f };
          waterGroup.add(waterRiser);

          // Horizontal water pipelines looping around the floor
          const waterH1Geom = new THREE.BoxGeometry(calWidth * 0.55, calFloorHeight * 0.03, calDepth * 0.015);
          const waterH1 = new THREE.Mesh(waterH1Geom, waterPipeMat.clone());
          waterH1.position.set(-calWidth * 0.05, -calFloorHeight * 0.35, waterZ);
          waterH1.name = `water_h1_${f}`;
          waterH1.userData = { system: "agua", floorIndex: f };
          waterGroup.add(waterH1);

          const waterH2Geom = new THREE.BoxGeometry(calWidth * 0.015, calFloorHeight * 0.03, calDepth * 0.55);
          const waterH2 = new THREE.Mesh(waterH2Geom, waterPipeMat.clone());
          waterH2.position.set(waterX, -calFloorHeight * 0.35, -calDepth * 0.05);
          waterH2.name = `water_h2_${f}`;
          waterH2.userData = { system: "agua", floorIndex: f };
          waterGroup.add(waterH2);

          // Cistern / Water Tanks (independent from base platform)
          if (f === 0) {
            // Large ground water cistern inside tower bounds
            const tankGeom = new THREE.BoxGeometry(calWidth * 0.35, calFloorHeight * 0.5, calDepth * 0.35);
            const tankMesh = new THREE.Mesh(tankGeom, waterPipeMat.clone());
            tankMesh.position.set(waterX, -calFloorHeight * 0.25, -waterZ);
            tankMesh.name = `water_cistern`;
            tankMesh.userData = { system: "agua", floorIndex: f };
            waterGroup.add(tankMesh);
          } else if (f === 9) {
            // Rooftop reserve water tank
            const tankGeom = new THREE.CylinderGeometry(calWidth * 0.15, calWidth * 0.15, calFloorHeight * 0.6, 16);
            const tankMesh = new THREE.Mesh(tankGeom, waterPipeMat.clone());
            tankMesh.position.set(waterX, calFloorHeight * 0.3, waterZ);
            tankMesh.name = `water_roof_tank`;
            tankMesh.userData = { system: "agua", floorIndex: f };
            waterGroup.add(tankMesh);
          }
          floorGroup.add(waterGroup);

          // 3. Energía (Orange #f97316): Vertical trunk inside structural core, panel box, horizontal conduits
          const energyGroup = new THREE.Group();
          energyGroup.name = "energyGroup";
          const energyMat = new THREE.MeshStandardMaterial({
            color: 0xf97316,
            emissive: 0xf97316,
            emissiveIntensity: 1.0,
            transparent: true,
            opacity: 0.9,
            roughness: 0.2,
            metalness: 0.7
          });
          
          // Main vertical energy riser (inside structural core)
          const energyX = calWidth * 0.15;
          const energyZ = calDepth * 0.15;
          const energyRiserRadius = calWidth * 0.006;
          const energyRiserGeom = new THREE.CylinderGeometry(energyRiserRadius, energyRiserRadius, calFloorHeight, 8);
          const energyRiser = new THREE.Mesh(energyRiserGeom, energyMat.clone());
          energyRiser.position.set(energyX, 0, energyZ);
          energyRiser.name = `energy_riser_${f}`;
          energyRiser.userData = { system: "energia", floorIndex: f };
          energyGroup.add(energyRiser);

          // Symmetrical horizontal power conduits
          const energyH1Geom = new THREE.BoxGeometry(calWidth * 0.5, calFloorHeight * 0.018, calDepth * 0.01);
          const energyH1 = new THREE.Mesh(energyH1Geom, energyMat.clone());
          energyH1.position.set(calWidth * 0.1, calFloorHeight * 0.35, energyZ);
          energyH1.name = `energy_h1_${f}`;
          energyH1.userData = { system: "energia", floorIndex: f };
          energyGroup.add(energyH1);

          const energyH2Geom = new THREE.BoxGeometry(calWidth * 0.01, calFloorHeight * 0.018, calDepth * 0.5);
          const energyH2 = new THREE.Mesh(energyH2Geom, energyMat.clone());
          energyH2.position.set(energyX, calFloorHeight * 0.35, calDepth * 0.1);
          energyH2.name = `energy_h2_${f}`;
          energyH2.userData = { system: "energia", floorIndex: f };
          energyGroup.add(energyH2);

          // Smart Electrical Panel Box on each floor
          const panelGeom = new THREE.BoxGeometry(calWidth * 0.04, calFloorHeight * 0.3, calDepth * 0.02);
          const panelMesh = new THREE.Mesh(panelGeom, energyMat.clone());
          panelMesh.position.set(energyX, 0, energyZ * 0.9);
          panelMesh.name = `energy_panel_${f}`;
          panelMesh.userData = { system: "energia", floorIndex: f };
          energyGroup.add(panelMesh);
          floorGroup.add(energyGroup);

          // 4. Climas/HVAC (Red/Orange #ef4444): Symmetrical vertical shafts, horizontal ceiling ducts, rooftop units
          const hvacGroup = new THREE.Group();
          hvacGroup.name = "hvacGroup";
          const hvacMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            emissive: 0xef4444,
            emissiveIntensity: 1.1,
            transparent: true,
            opacity: 0.9,
            roughness: 0.3,
            metalness: 0.5
          });
          
          // Symmetrical vertical ventilation ducts
          const hvacX = calWidth * 0.2;
          const hvacZ = calDepth * 0.2;
          const hvacRiserWidth = calWidth * 0.02;
          const hvacR1Geom = new THREE.BoxGeometry(hvacRiserWidth, calFloorHeight, hvacRiserWidth);
          const hvacR1 = new THREE.Mesh(hvacR1Geom, hvacMat.clone());
          hvacR1.position.set(hvacX, 0, -hvacZ);
          hvacR1.name = `hvac_riser_1_${f}`;
          hvacR1.userData = { system: "hvac", floorIndex: f };
          hvacGroup.add(hvacR1);

          const hvacR2Geom = new THREE.BoxGeometry(hvacRiserWidth, calFloorHeight, hvacRiserWidth);
          const hvacR2 = new THREE.Mesh(hvacR2Geom, hvacMat.clone());
          hvacR2.position.set(-hvacX, 0, hvacZ);
          hvacR2.name = `hvac_riser_2_${f}`;
          hvacR2.userData = { system: "hvac", floorIndex: f };
          hvacGroup.add(hvacR2);

          // Horizontal main ceiling air ducts (strictly inside the plants, never outside facade)
          const hvacH1Geom = new THREE.BoxGeometry(calWidth * 0.7, calFloorHeight * 0.05, calDepth * 0.03);
          const hvacH1 = new THREE.Mesh(hvacH1Geom, hvacMat.clone());
          hvacH1.position.set(0, calFloorHeight * 0.35, 0);
          hvacH1.name = `hvac_h1_${f}`;
          hvacH1.userData = { system: "hvac", floorIndex: f };
          hvacGroup.add(hvacH1);

          const hvacH2Geom = new THREE.BoxGeometry(calWidth * 0.03, calFloorHeight * 0.05, calDepth * 0.7);
          const hvacH2 = new THREE.Mesh(hvacH2Geom, hvacMat.clone());
          hvacH2.position.set(0, calFloorHeight * 0.35, 0);
          hvacH2.name = `hvac_h2_${f}`;
          hvacH2.userData = { system: "hvac", floorIndex: f };
          hvacGroup.add(hvacH2);

          // Mechanical Units / Chillers on the roof (Floor 9) - roofBounds independent zone
          if (f === 9) {
            const chillerGeom = new THREE.BoxGeometry(calWidth * 0.2, calFloorHeight * 0.5, calDepth * 0.15);
            const chiller1 = new THREE.Mesh(chillerGeom, hvacMat.clone());
            chiller1.position.set(calWidth * 0.2, calFloorHeight * 0.55, -calDepth * 0.2);
            chiller1.name = `hvac_chiller_1`;
            chiller1.userData = { system: "hvac", floorIndex: f };
            hvacGroup.add(chiller1);

            const chiller2 = new THREE.Mesh(chillerGeom, hvacMat.clone());
            chiller2.position.set(calWidth * 0.2, calFloorHeight * 0.55, calDepth * 0.2);
            chiller2.name = `hvac_chiller_2`;
            chiller2.userData = { system: "hvac", floorIndex: f };
            hvacGroup.add(chiller2);
          }
          floorGroup.add(hvacGroup);

          // 5. Elevadores (Violet #8b5cf6): Symmetrical vertical lift column guides inside lateral cores
          const elevatorsGroup = new THREE.Group();
          elevatorsGroup.name = "elevatorsGroup";
          const elevatorMat = new THREE.MeshStandardMaterial({
            color: 0x8b5cf6,
            emissive: 0x8b5cf6,
            emissiveIntensity: 1.2,
            transparent: true,
            opacity: 0.9,
            roughness: 0.15,
            metalness: 0.9
          });
          const liftX = calWidth * 0.44; // lateral core placement
          const liftRailWidth = calWidth * 0.02;
          const liftRailGeom = new THREE.BoxGeometry(liftRailWidth, calFloorHeight, liftRailWidth);
          
          const leftRail = new THREE.Mesh(liftRailGeom, elevatorMat.clone());
          leftRail.position.set(-liftX, 0, 0);
          leftRail.name = `lift_rail_left_${f}`;
          leftRail.userData = { system: "elevadores", floorIndex: f };
          elevatorsGroup.add(leftRail);

          const rightRail = new THREE.Mesh(liftRailGeom, elevatorMat.clone());
          rightRail.position.set(liftX, 0, 0);
          rightRail.name = `lift_rail_right_${f}`;
          rightRail.userData = { system: "elevadores", floorIndex: f };
          elevatorsGroup.add(rightRail);

          // Moving/glowing elevator cabins
          if (f === 2) {
            const cabinGeom = new THREE.BoxGeometry(calWidth * 0.095, calFloorHeight * 0.75, calDepth * 0.095);
            const cabinMesh = new THREE.Mesh(cabinGeom, elevatorMat.clone());
            cabinMesh.position.set(-liftX, 0, 0);
            cabinMesh.name = `lift_cabin_left_${f}`;
            cabinMesh.userData = { system: "elevadores", floorIndex: f };
            elevatorsGroup.add(cabinMesh);
          } else if (f === 7) {
            const cabinGeom = new THREE.BoxGeometry(calWidth * 0.095, calFloorHeight * 0.75, calDepth * 0.095);
            const cabinMesh = new THREE.Mesh(cabinGeom, elevatorMat.clone());
            cabinMesh.position.set(liftX, 0, 0);
            cabinMesh.name = `lift_cabin_right_${f}`;
            cabinMesh.userData = { system: "elevadores", floorIndex: f };
            elevatorsGroup.add(cabinMesh);
          }
          floorGroup.add(elevatorsGroup);

          iotRoot.add(floorGroup);
        }

        // Record original materials & positions, enabling customized floor highlighting
        originalMaterials.current.clear();
        originalPositions.current.clear();

        campusRoot.traverse((child) => {
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

        // 7. Genera un THREE.Box3Helper de color magenta alrededor de la torre vertical (oculto en producción):
        const DEBUG_IOT_BOUNDS = false;
        if (DEBUG_IOT_BOUNDS) {
          const helper = new THREE.Box3Helper(towerBounds, 0xff00ff);
          helper.name = "towerBoxHelper";
          helper.visible = true; // Keep visible for verification
          campusRoot.add(helper);
        }

        // 8. Dynamic Glowing Level Bracket Indicator (Grid Selector / Technical Grid)
        const diameter = Math.max(towerSize.x, towerSize.z) * 1.15;
        const ring = new THREE.GridHelper(diameter, 16, 0x10b981, 0x10b981);
        ring.name = "floorHighlightRing";
        
        // Center of the bottom floor in unscaled coords is at calMinY + (calFloorHeight / 2)
        const initialY = calMinY + (0.5 / 10) * calHeight;
        ring.position.set(calCenter.x, initialY, calCenter.z);
        
        // Hide in realistic mode by default
        ring.visible = (visualMode !== "realista");
        
        campusRoot.add(ring);
        floorHighlightRing.current = ring;

        // Position camera perfectly centered using final bounding box of campusRoot
        const rootBox = new THREE.Box3().setFromObject(campusRoot);
        const rootCenter = rootBox.getCenter(new THREE.Vector3());
        const rootSize = rootBox.getSize(new THREE.Vector3());
        
        controls.target.copy(rootCenter);
        const maxDim = Math.max(rootSize.x, rootSize.y, rootSize.z);
        camera.position.set(
          rootCenter.x + maxDim * 1.1,
          rootCenter.y + maxDim * 0.8,
          rootCenter.z + maxDim * 1.1
        );
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
          roughness: 0.4, 
          metalness: 0.1,
          transparent: true,
          opacity: 0.35,
          depthWrite: true
        });
        const slab = new THREE.Mesh(slabGeom, slabMat);
        slab.name = `concrete_slab_floor_${i}`;
        slab.position.set(0, floorBaseY, 0);
        slab.userData = { system: "estructura", floorIndex: i };
        model.add(slab);
        
        // 2. Ceiling slab
        const ceilGeom = new THREE.BoxGeometry(8, 0.1, 8);
        const ceilMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.4, 
          metalness: 0.1,
          transparent: true,
          opacity: 0.35,
          depthWrite: true
        });
        const ceil = new THREE.Mesh(ceilGeom, ceilMat);
        ceil.name = `concrete_ceil_floor_${i}`;
        ceil.position.set(0, floorBaseY + 1.9, 0);
        ceil.userData = { system: "estructura", floorIndex: i };
        model.add(ceil);
        
        // 3. Glass central walls (curtain wall) - Pure translucent architectural glass
        const glassGeom = new THREE.BoxGeometry(7.2, 1.8, 7.2);
        const glassMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          transparent: true, 
          opacity: 0.15, 
          roughness: 0.1, 
          metalness: 0.9,
          depthWrite: false
        });
        const glass = new THREE.Mesh(glassGeom, glassMat);
        glass.name = `glass_window_floor_${i}`;
        glass.position.set(0, floorBaseY + 0.95, 0);
        glass.userData = { system: "estructura", floorIndex: i };
        model.add(glass);
        
        // 4. Corner Structural Columns
        const colGeom = new THREE.BoxGeometry(0.35, 1.8, 0.35);
        const colMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff, 
          roughness: 0.5,
          transparent: true,
          opacity: 0.5
        });
        const columnsPos = [ [-3.7, -3.7], [3.7, -3.7], [-3.7, 3.7], [3.7, 3.7] ];
        columnsPos.forEach(([cx, cz], colIdx) => {
          const col = new THREE.Mesh(colGeom, colMat);
          col.name = `structure_column_floor_${i}_${colIdx}`;
          col.position.set(cx, floorBaseY + 0.95, cz);
          col.userData = { system: "estructura", floorIndex: i };
          model.add(col);
        });
        
        // 5. Elevador Cabin / Shaft (System: elevadores) - Distributed in purple vertical bays
        const liftGeom = new THREE.BoxGeometry(1.4, 1.8, 1.4);
        const liftMat = new THREE.MeshStandardMaterial({ 
          color: 0x8b5cf6, // Vibrant Purple
          roughness: 0.15, 
          metalness: 0.85,
          emissive: 0x8b5cf6,
          emissiveIntensity: 0.3
        });
        const liftPositions = [ [0, -4.2], [0, 4.2] ];
        liftPositions.forEach(([lx, lz], liftIdx) => {
          const lift = new THREE.Mesh(liftGeom, liftMat);
          lift.name = `elevador_shaft_floor_${i}_${liftIdx}`;
          lift.position.set(lx, floorBaseY + 0.9, lz);
          lift.userData = { system: "elevadores", floorIndex: i };
          model.add(lift);
        });
        
        // 6. Water System (System: agua) - Blue/cyan vertical line units and nodes
        const waterGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 12);
        const waterMat = new THREE.MeshStandardMaterial({ 
          color: 0x06b6d4, // Vibrant Blue/Cyan
          roughness: 0.1, 
          metalness: 0.3,
          emissive: 0x06b6d4,
          emissiveIntensity: 0.3
        });
        const waterPositions = [ [-2.5, 2.5], [-2.5, -2.5], [-3.5, 0] ];
        waterPositions.forEach(([wx, wz], waterIdx) => {
          const waterUnit = new THREE.Mesh(waterGeom, waterMat);
          waterUnit.name = `water_pump_floor_${i}_${waterIdx}`;
          waterUnit.position.set(wx, floorBaseY + 0.5, wz);
          waterUnit.userData = { system: "agua", floorIndex: i };
          model.add(waterUnit);
        });
        
        // 7. Electrical transformer/power box (System: energia) - Orange electrical panels
        const powerGeom = new THREE.BoxGeometry(0.5, 0.6, 0.5);
        const powerMat = new THREE.MeshStandardMaterial({ 
          color: 0xf97316, // Vibrant Orange
          roughness: 0.25, 
          metalness: 0.7,
          emissive: 0xf97316,
          emissiveIntensity: 0.3
        });
        const powerPositions = [ [2.5, 2.5], [2.5, -2.5], [3.5, 0] ];
        powerPositions.forEach(([px, pz], powerIdx) => {
          const powerUnit = new THREE.Mesh(powerGeom, powerMat);
          powerUnit.name = `power_subest_floor_${i}_${powerIdx}`;
          powerUnit.position.set(px, floorBaseY + 0.3, pz);
          powerUnit.userData = { system: "energia", floorIndex: i };
          model.add(powerUnit);
        });
        
        // 8. HVAC Unit / Ducts (System: hvac) - Symmetrical red-orange ventilation ducts
        const hvacGeom = new THREE.BoxGeometry(0.8, 0.4, 0.8);
        const hvacMat = new THREE.MeshStandardMaterial({ 
          color: 0xef4444, // Vibrant Red-Orange
          roughness: 0.2, 
          metalness: 0.6,
          emissive: 0xef4444,
          emissiveIntensity: 0.3
        });
        const hvacPositions = [ [2.5, -2.5], [-2.5, 2.5], [0, 3.5] ];
        hvacPositions.forEach(([hx, hz], hvacIdx) => {
          const hvacUnit = new THREE.Mesh(hvacGeom, hvacMat);
          hvacUnit.name = `hvac_duct_floor_${i}_${hvacIdx}`;
          hvacUnit.position.set(hx, floorBaseY + 0.25, hz);
          hvacUnit.userData = { system: "hvac", floorIndex: i };
          model.add(hvacUnit);
        });
        
        // 9. LED Spotlights (System: iluminacion) - Symmetrical warm yellow glowing ceiling points per level
        const lightGeom = new THREE.SphereGeometry(0.18, 8, 8);
        const lightMat = new THREE.MeshStandardMaterial({ 
          color: 0xfacc15, // Glowing yellow
          emissive: 0xfacc15, 
          emissiveIntensity: 0.8 
        });
        const lightPositions = [ [-2.0, -2.0], [-2.0, 2.0], [2.0, -2.0], [2.0, 2.0] ];
        lightPositions.forEach(([lx, lz], lightIdx) => {
          const lightUnit = new THREE.Mesh(lightGeom, lightMat);
          lightUnit.name = `light_led_floor_${i}_${lightIdx}`;
          lightUnit.position.set(lx, floorBaseY + 1.8, lz);
          lightUnit.userData = { system: "iluminacion", floorIndex: i };
          model.add(lightUnit);
        });
      }
      
      return model;
    };

    loader.load(
      "/Meshy_AI_Vertical_Campus_Cross_30MB_final_valid.glb?v=26111472",
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
          const hitPoint = intersects[0].point.clone();
          if (buildingRootRef.current) {
            buildingRootRef.current.worldToLocal(hitPoint);
          }
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

    const getIotReading = (system: string, floorIndex: number) => {
      switch(system) {
        case "iluminacion":
          const lux = 300 + (floorIndex * 25) + Math.round(Math.sin(floorIndex) * 30);
          return `Luminancia: ${lux} lux | Estado: Activo`;
        case "agua":
          const pressure = (3.2 - (floorIndex * 0.15) + Math.sin(floorIndex) * 0.1).toFixed(1);
          return `Presión: ${pressure} bar | Flujo: 4.5 L/s`;
        case "energia":
          const kwh = 12 + (floorIndex * 1.5) + Math.round(Math.sin(floorIndex) * 2);
          return `Consumo: ${kwh} kW/h | Fase: Balanceada`;
        case "hvac":
          const temp = (20 + (floorIndex * 0.3) + Math.sin(floorIndex) * 0.5).toFixed(1);
          return `Temperatura: ${temp}°C | Humedad: 48%`;
        case "elevadores":
          const height = (floorIndex * 3.5).toFixed(1);
          return `Altura: ${height}m | Cabina: Operando`;
        default:
          return "Monitoreando...";
      }
    };

    onCanvasMouseMove = (event: MouseEvent) => {
      if (!canvasRef.current || !cameraRef.current || !modelRef.current || !containerRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(mouseX, mouseY), cameraRef.current);
      const intersects = raycaster.intersectObjects(modelRef.current.children, true);

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        const meshFloorIndex = obj.userData.floorIndex;
        const meshSystem = obj.userData.system;

        const isIotSystem = ["iluminacion", "agua", "energia", "hvac", "elevadores"].includes(meshSystem);

        if (meshFloorIndex !== undefined && meshSystem !== undefined && isIotSystem) {
          const containerRect = containerRef.current.getBoundingClientRect();
          const x = event.clientX - containerRect.left;
          const y = event.clientY - containerRect.top;

          // Determine status from worst status
          const floorStatus = floorStatuses[meshFloorIndex]?.worstStatus || "al_dia";
          let elementStatus: "Óptimo" | "Atención" | "Crítico" = "Óptimo";
          if (floorStatus === "critico") {
            elementStatus = "Crítico";
          } else if (floorStatus === "atencion") {
            elementStatus = "Atención";
          }

          const systemNames: { [key: string]: string } = {
            iluminacion: "Luminaria / Sensor Inteligente",
            agua: "Red de Distribución / Tubería",
            energia: "Tablero de Fuerza / Conector",
            hvac: "Ducto de Climatización / HVAC",
            elevadores: "Cabina / Guía Vertical"
          };

          setHoveredIot({
            system: meshSystem,
            floor: meshFloorIndex,
            name: systemNames[meshSystem] || "Sensor IoT",
            status: elementStatus,
            reading: getIotReading(meshSystem, meshFloorIndex),
            x,
            y
          });
        } else {
          setHoveredIot(null);
        }
      } else {
        setHoveredIot(null);
      }
    };

    canvasRef.current.addEventListener("mousemove", onCanvasMouseMove);

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
      if (canvasRef.current && onCanvasMouseMove) {
        canvasRef.current.removeEventListener("mousemove", onCanvasMouseMove);
      }
      setHoveredIot(null);

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

            {/* Hover Status Tooltip for IoT Sensors */}
            {hoveredIot && showIotOverlays && (
              <div 
                className="absolute bg-slate-950/95 text-white border border-slate-800 p-3.5 rounded-xl shadow-2xl pointer-events-none text-left z-30 flex flex-col gap-1 w-64 backdrop-blur-md transition-all duration-75"
                style={{ 
                  left: hoveredIot.x + 16, 
                  top: hoveredIot.y - 12,
                  transform: "translate(0, -50%)"
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#B08D4C]">
                    Nivel {hoveredIot.floor + 1} · {hoveredIot.system.toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                    hoveredIot.status === "Crítico" 
                      ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-xs" 
                      : hoveredIot.status === "Atención"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-xs"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-xs"
                  }`}>
                    {hoveredIot.status}
                  </span>
                </div>
                <h5 className="text-xs font-extrabold text-slate-100">{hoveredIot.name}</h5>
                <div className="h-px bg-slate-800/65 my-1" />
                <p className="text-[10px] text-slate-300 font-mono leading-relaxed">{hoveredIot.reading}</p>
              </div>
            )}

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

              {/* Premium Control Toggles */}
              <div className="shrink-0 flex flex-wrap items-center gap-2">
                {/* Capas IoT Switch */}
                <label className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/60 rounded-xl cursor-pointer select-none transition-all">
                  <input 
                    type="checkbox"
                    checked={showIotOverlays}
                    onChange={(e) => setShowIotOverlays(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-[#B08D4C] focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-[#B08D4C]"
                  />
                  <span className="text-[10px] font-extrabold text-slate-300 tracking-wide">
                    Capas IoT Activas
                  </span>
                </label>

                {/* Ghost mode check redesigned as a premium glass pill toggle */}
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
                { id: "iluminacion", label: "Iluminación", icon: <Sun size={12} />, color: "border-yellow-950/40 text-yellow-500 hover:bg-yellow-950/20 hover:text-yellow-400", activeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/60 shadow-sm shadow-yellow-500/10" },
                { id: "agua", label: "Agua", icon: <Droplet size={12} />, color: "border-cyan-950/40 text-cyan-400 hover:bg-cyan-950/20 hover:text-cyan-300", activeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-sm shadow-cyan-500/10" },
                { id: "energia", label: "Energía", icon: <Zap size={12} />, color: "border-orange-950/40 text-orange-400 hover:bg-orange-950/20 hover:text-orange-300", activeBg: "bg-orange-500/20 text-orange-300 border-orange-500/60 shadow-sm shadow-orange-500/10" },
                { id: "hvac", label: "Climas / HVAC", icon: <RefreshCw size={12} />, color: "border-red-950/40 text-red-400 hover:bg-red-950/20 hover:text-red-300", activeBg: "bg-red-500/20 text-red-300 border-red-500/60 shadow-sm shadow-red-500/10" },
                { id: "elevadores", label: "Elevadores", icon: <Activity size={12} />, color: "border-purple-950/40 text-purple-400 hover:bg-purple-950/20 hover:text-purple-300", activeBg: "bg-purple-500/20 text-purple-300 border-purple-500/60 shadow-sm shadow-purple-500/10" },
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
