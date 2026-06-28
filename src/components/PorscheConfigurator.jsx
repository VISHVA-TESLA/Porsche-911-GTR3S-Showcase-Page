import React, { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

const PAINT_COLORS = [
  { name: "Chalk White", hex: "#f2f2f2" },
  { name: "Carmine Red", hex: "#a81116" },
  { name: "GT Silver", hex: "#9da1a3" },
  { name: "Racing Yellow", hex: "#ecc01c" },
  { name: "Lizard Green", hex: "#3ea23a" },
  { name: "Jet Black", hex: "#0b0c0d" }
];

const WHEEL_FINISHES = [
  { name: "Titanium Silver", hex: "#b5b7b8" },
  { name: "Aurum Gold", hex: "#cfa965" },
  { name: "Satin Black", hex: "#161718" },
  { name: "Guards Red", hex: "#b8161c" }
];

/* ------------------------------------------------------------------
 *  3D VEHICLE COMPONENT (CONFIGURATOR EDITION)
 * ------------------------------------------------------------------ */
function ConfigurableCar({ paintColor, wheelColor, drsActive }) {
  const { scene } = useGLTF("/models/porsche-911.glb");
  const paintMaterials = useRef([]);
  const wheelMaterials = useRef([]);
  const wingNode = useRef(null);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    clone.position.sub(center);
    const scale = 3.6 / Math.max(size.x, size.y, size.z);
    clone.scale.setScalar(scale);

    paintMaterials.current = [];
    wheelMaterials.current = [];
    wingNode.current = null;

    clone.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        // Find rear wing mesh to rotate for DRS
        if (node.name.toLowerCase().includes("boot.001") || node.name.toLowerCase().includes("wing")) {
          wingNode.current = node;
        }

        if (node.material) {
          node.material.envMapIntensity = 2.0;

          // Paint Material
          if (node.material.name === "paint" && !paintMaterials.current.includes(node.material)) {
            paintMaterials.current.push(node.material);
          }
          // Wheel Material (cylinders)
          if (node.name.toLowerCase().includes("cylinder")) {
            // Clone wheels material so they configure separately from other silver components
            node.material = node.material.clone();
            if (!wheelMaterials.current.includes(node.material)) {
              wheelMaterials.current.push(node.material);
            }
          }
        }
      }
    });
    return clone;
  }, [scene]);

  // Apply colors dynamically
  useEffect(() => {
    paintMaterials.current.forEach((mat) => mat.color.set(paintColor));
  }, [paintColor, prepared]);

  useEffect(() => {
    wheelMaterials.current.forEach((mat) => mat.color.set(wheelColor));
  }, [wheelColor, prepared]);

  // Animate DRS wing tilt flap
  useFrame((_, delta) => {
    if (wingNode.current) {
      // Rotate wing element slightly when DRS is active
      const targetRotation = drsActive ? -0.15 : 0;
      wingNode.current.rotation.x = THREE.MathUtils.lerp(
        wingNode.current.rotation.x,
        targetRotation,
        0.1
      );
    }
  });

  return <primitive object={prepared} dispose={null} />;
}

/* ------------------------------------------------------------------
 *  MAIN CONFIGURATOR PAGE
 * ------------------------------------------------------------------ */
export default function PorscheConfigurator({ paintColor, setPaintColor }) {
  const [wheelColor, setWheelColor] = useState(WHEEL_FINISHES[0].hex);
  const [drsActive, setDrsActive] = useState(false);

  return (
    <div className="relative h-screen w-full bg-[#ebebeb] text-[#111111] overflow-hidden flex flex-col justify-between p-8 md:p-12 font-mono">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <h1 className="text-[28vw] font-wide font-extrabold text-neutral-300/30 leading-none tracking-tighter uppercase">
          CONFIG
        </h1>
      </div>

      {/* Header bar */}
      <div className="relative flex justify-between items-start z-30 pointer-events-none w-full">
        <div className="pointer-events-auto flex flex-col text-left">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#a81116] flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a81116]" />
            STUDIO LABS // CONFIGURATOR
          </span>
          <span className="text-[9px] text-neutral-400 mt-1 uppercase">
            ORBIT ROTATE ACTIVE // SCROLL PAN LOCKED
          </span>
        </div>
      </div>

      {/* Main split display layout */}
      <div className="relative w-full h-full flex flex-col lg:flex-row items-center justify-between pointer-events-none z-20 my-4 gap-8">
        
        {/* Left Side: Detail specifications card */}
        <div className="pointer-events-auto w-full lg:max-w-xs bg-white/70 backdrop-blur-md border border-neutral-300/60 p-6 rounded-sm shadow-sm self-center">
          <span className="text-[9px] font-bold text-neutral-400 tracking-wider block mb-1">
            HOMOLOGATION SPEC
          </span>
          <h2 className="font-wide text-lg font-bold text-[#111111] uppercase tracking-wide">
            911 GT3 RS
          </h2>
          <div className="h-[1px] w-full bg-neutral-200 my-3" />
          
          <div className="flex flex-col gap-2.5 text-[11px] text-left">
            <div className="flex justify-between">
              <span className="text-neutral-400">PAINT EX</span>
              <span className="text-neutral-800 font-bold">
                {PAINT_COLORS.find((c) => c.hex === paintColor)?.name || "Chalk"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">WHEEL FINISH</span>
              <span className="text-neutral-800 font-bold">
                {WHEEL_FINISHES.find((w) => w.hex === wheelColor)?.name || "Silver"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">AERO WING DRS</span>
              <span className={`font-bold ${drsActive ? "text-[#a81116]" : "text-neutral-600"}`}>
                {drsActive ? "DRS OPEN // 34°" : "DOWNFORCE // 0°"}
              </span>
            </div>
          </div>
        </div>

        {/* 3D Canvas in center */}
        <div className="absolute inset-0 z-10">
          <Canvas gl={{ antialias: true, alpha: true }} camera={{ position: [4, 1.2, 5], fov: 32 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 8, 5]} intensity={1.5} />
            <spotLight position={[-8, 6, -6]} intensity={1.8} color="#9fb8ff" angle={0.6} />
            <spotLight position={[8, 3, 8]} intensity={1.4} color="#ffb37a" angle={0.8} />

            <Suspense fallback={<LoadingFallback />}>
              <ConfigurableCar paintColor={paintColor} wheelColor={wheelColor} drsActive={drsActive} />
              <ContactShadows position={[0, -0.85, 0]} opacity={0.35} scale={9} blur={2.4} far={3} color="#000000" />
              <Environment preset="studio" />
            </Suspense>

            <OrbitControls enableZoom={true} minDistance={2.5} maxDistance={7} target={[0, 0.4, 0]} makeDefault />
          </Canvas>
        </div>

        {/* Right Side: Options customization stack */}
        <div className="pointer-events-auto w-full lg:max-w-xs flex flex-col gap-4 self-center bg-white/70 backdrop-blur-md border border-neutral-300/60 p-6 rounded-sm shadow-sm text-left">
          
          {/* Swatch Tab: Paint */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
              Paint Options
            </span>
            <div className="grid grid-cols-6 gap-2">
              {PAINT_COLORS.map((c) => {
                const active = paintColor === c.hex;
                return (
                  <button
                    key={c.name}
                    onClick={() => setPaintColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    className={`h-6 w-6 rounded-full border transition-all duration-200 relative ${
                      active
                        ? "border-[#a81116] scale-110 ring-2 ring-[#a81116]/20"
                        : "border-neutral-300 hover:scale-105"
                    }`}
                  >
                    {active && <span className="absolute inset-1 rounded-full border border-white opacity-40" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] w-full bg-neutral-200 my-1" />

          {/* Swatch Tab: Wheels */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
              Wheel Finishes
            </span>
            <div className="grid grid-cols-4 gap-3">
              {WHEEL_FINISHES.map((w) => {
                const active = wheelColor === w.hex;
                return (
                  <button
                    key={w.name}
                    onClick={() => setWheelColor(w.hex)}
                    style={{ backgroundColor: w.hex }}
                    title={w.name}
                    className={`h-7 w-7 rounded-full border transition-all duration-200 relative ${
                      active
                        ? "border-[#a81116] scale-110 ring-2 ring-[#a81116]/20"
                        : "border-neutral-300 hover:scale-105"
                    }`}
                  >
                    {active && <span className="absolute inset-1.5 rounded-full border border-white/60 opacity-60" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] w-full bg-neutral-200 my-1" />

          {/* DRS Wing Toggle */}
          <div className="flex flex-col gap-2">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
              Active Aerodynamics
            </span>
            <button
              onClick={() => setDrsActive(!drsActive)}
              className={`w-full py-2.5 border font-mono text-[9px] font-bold uppercase tracking-widest transition-all duration-200 rounded-sm ${
                drsActive
                  ? "bg-[#a81116] border-[#a81116] text-white hover:bg-[#850b10]"
                  : "bg-white border-neutral-300 text-neutral-700 hover:border-[#111111]"
              }`}
            >
              {drsActive ? "DRS ACTIVE: OPEN" : "DRS INACTIVE: STOWED"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="relative flex justify-between items-center z-30 pointer-events-none w-full border-t border-neutral-300/40 pt-4">
        <span className="text-[8px] text-neutral-400 uppercase tracking-widest">
          DRAG TO ROTATE // PINCH TO ZOOM
        </span>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 font-mono text-[9px] uppercase tracking-widest text-[#111111]">
        <div className="h-3.5 w-3.5 border border-[#a81116] border-t-transparent rounded-full animate-spin" />
        LOADING MODEL CONFIGS...
      </div>
    </Html>
  );
}
