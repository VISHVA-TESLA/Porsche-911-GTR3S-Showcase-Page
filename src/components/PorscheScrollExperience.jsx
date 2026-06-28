import React, { useRef, useEffect, useState, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows, Html, OrbitControls, MeshReflectorMaterial } from "@react-three/drei";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "framer-motion";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

/**
 * ------------------------------------------------------------------
 *  Boxer-6 Engine Web Audio Synthesizer Class
 * ------------------------------------------------------------------
 */
class EngineSynthesizer {
  constructor() {
    this.ctx = null;
    this.osc1 = null;
    this.osc2 = null;
    this.gainNode = null;
    this.lowpass = null;
    this.isPlaying = false;
  }

  start() {
    if (this.isPlaying) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // saw oscillator for boxer-six cylinder roughness
      this.osc1 = this.ctx.createOscillator();
      this.osc1.type = "sawtooth";
      this.osc1.frequency.setValueAtTime(42, this.ctx.currentTime);

      // triangle oscillator for lower bass exhaust growl
      this.osc2 = this.ctx.createOscillator();
      this.osc2.type = "triangle";
      this.osc2.frequency.setValueAtTime(84, this.ctx.currentTime);

      // lowpass filter to muffle raw digital sound and simulate engine block/exhaust housing
      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = "lowpass";
      this.lowpass.frequency.setValueAtTime(140, this.ctx.currentTime);

      // master volume
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

      // Connect paths
      this.osc1.connect(this.lowpass);
      this.osc2.connect(this.lowpass);
      this.lowpass.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc1.start(0);
      this.osc2.start(0);
      this.isPlaying = true;
    } catch (e) {
      console.error("Failed to start Web Audio Engine Synthesizer:", e);
    }
  }

  setRPM(factor) {
    if (!this.isPlaying || !this.ctx) return;
    // factor: 0 -> 1
    // Modulate base frequencies based on speed
    const f1 = 42 + factor * 85;  // 42Hz to 127Hz
    const f2 = 84 + factor * 170; // 84Hz to 254Hz

    // Smooth transition using setTargetAtTime to prevent clicks
    this.osc1.frequency.setTargetAtTime(f1, this.ctx.currentTime, 0.12);
    this.osc2.frequency.setTargetAtTime(f2, this.ctx.currentTime, 0.12);

    // Open filter cutoff as RPM increases to simulate exhaust sound pressure
    this.lowpass.frequency.setTargetAtTime(140 + factor * 350, this.ctx.currentTime, 0.15);
  }

  stop() {
    if (!this.isPlaying) return;
    try {
      this.osc1.stop();
      this.osc2.stop();
      this.osc1.disconnect();
      this.osc2.disconnect();
      this.lowpass.disconnect();
      this.gainNode.disconnect();
      this.ctx.close();
    } catch (e) {
      console.error(e);
    }
    this.isPlaying = false;
    this.ctx = null;
  }
}

/**
 * ------------------------------------------------------------------
 *  CHAPTER DATA
 *  Corresponds with telemetry and page highlights.
 * ------------------------------------------------------------------
 */
const CHAPTERS = [
  {
    id: "silhouette",
    range: [0, 0.33],
    eyebrow: "01 // SILHOUETTE & AERO",
    title: "Chassis Louvers",
    body: "Constructed with motorsport-derived CFRP panels. Front fender ventilation louvers extract high-pressure air from the wheel arches to stabilize the front axle at high speeds.",
    camera: { pos: [3.8, 1.1, 4.8], target: [0, 0.45, 0] },
    details: { speed: "65 mph", rpm: "3100 rpm", gforce: "0.85 G", drs: "CLOSED" }
  },
  {
    id: "cockpit",
    range: [0.33, 0.66],
    eyebrow: "02 // CONTROL COCKPIT",
    title: "GT Sports Steering",
    body: "The driver acts as pilot. Four individual rotary dials on the alcantara wheel allow dynamic real-time adjustment of suspension damping, ESC/TC values, and the DRS wing angle.",
    camera: { pos: [0.22, 0.75, 1.6], target: [-0.35, 0.5, -0.2] },
    details: { speed: "115 mph", rpm: "5800 rpm", gforce: "1.25 G", drs: "ARMED" }
  },
  {
    id: "rear_spoiler",
    range: [0.66, 1.0],
    eyebrow: "03 // PERFORMANCE DRS",
    title: "Active DRS Wing",
    body: "A swan-neck active rear wing featuring formula-1 inspired Drag Reduction System (DRS). Combined with active front wing elements, it delivers up to 860 kg of total downforce.",
    camera: { pos: [-3.2, 1.4, -3.8], target: [0, 0.7, -1.2] },
    details: { speed: "172 mph", rpm: "8200 rpm", gforce: "1.65 G", drs: "ACTIVE" }
  },
];

const TOTAL_VH = 300;

const COLORS = [
  { name: "Chalk White", hex: "#f2f2f2" },
  { name: "Carmine Red", hex: "#a81116" },
  { name: "GT Silver", hex: "#9da1a3" },
  { name: "Racing Yellow", hex: "#ecc01c" },
  { name: "Lizard Green", hex: "#3ea23a" },
  { name: "Jet Black", hex: "#0b0c0d" }
];

/* ------------------------------------------------------------------
 *  3D MODEL CAR COMPONENT
 * ------------------------------------------------------------------ */
function Car({ url = "/models/porsche-911.glb", paintColor }) {
  const { scene } = useGLTF(url);
  const paintMaterials = useRef([]);

  // Recenter + normalize scale once
  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);
    
    // Offset center
    clone.position.sub(center);
    const scale = 3.6 / Math.max(size.x, size.y, size.z);
    clone.scale.setScalar(scale);

    paintMaterials.current = [];
    clone.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        
        if (node.material) {
          // Boost environment reflections for metal look
          node.material.envMapIntensity = 1.8;
          // Locate paint mesh/material name to apply configurations
          if (node.material.name === "paint" && !paintMaterials.current.includes(node.material)) {
            paintMaterials.current.push(node.material);
          }
        }
      }
    });
    return clone;
  }, [scene]);

  // Handle real-time color paint swap
  useEffect(() => {
    paintMaterials.current.forEach((material) => {
      material.color.set(paintColor);
    });
  }, [paintColor]);

  return <primitive object={prepared} dispose={null} />;
}

/* ------------------------------------------------------------------
 *  CAMERA RIG (WITH INTRO REVEAL SWEEP)
 * ------------------------------------------------------------------ */
function CameraRig({ progressRef, idleRef, isOrbitMode, revealTimer, isPreloading }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.45, 0));
  const idleAngle = useRef(0);

  useFrame((state, delta) => {
    if (isPreloading) return;

    // Handle introductory camera reveal sweep
    if (revealTimer.current < 2.0) {
      revealTimer.current += delta;
      const t = Math.min(revealTimer.current / 2.0, 1.0);
      const easeT = THREE.MathUtils.smoothstep(t, 0, 1);

      // Start position (high cinematic sweep) to chapter 0 camera position
      const startPos = new THREE.Vector3(0, 4.5, 7.5);
      const targetPos = new THREE.Vector3(...CHAPTERS[0].camera.pos);
      const pos = new THREE.Vector3().lerpVectors(startPos, targetPos, easeT);

      const startTgt = new THREE.Vector3(0, 0.45, 0);
      const targetTgt = new THREE.Vector3(...CHAPTERS[0].camera.target);
      const tgt = new THREE.Vector3().lerpVectors(startTgt, targetTgt, easeT);

      camera.position.copy(pos);
      camera.lookAt(tgt);
      target.current.copy(tgt);
      return;
    }

    if (isOrbitMode) return; // disable camera control in Orbit mode

    const p = progressRef.current; // 0 -> 1

    const keyframes = CHAPTERS.map((c) => c.camera);
    const segment = 1 / (keyframes.length - 1);
    const idx = Math.min(Math.floor(p / segment), keyframes.length - 2);
    const localT = (p - idx * segment) / segment;

    const a = keyframes[idx];
    const b = keyframes[idx + 1];

    const pos = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...a.pos),
      new THREE.Vector3(...b.pos),
      THREE.MathUtils.smoothstep(localT, 0, 1)
    );
    const tgt = new THREE.Vector3().lerpVectors(
      new THREE.Vector3(...a.target),
      new THREE.Vector3(...b.target),
      THREE.MathUtils.smoothstep(localT, 0, 1)
    );

    // Idle drifting fallback
    if (idleRef.current) {
      idleAngle.current += delta * 0.15;
      const driftRadius = 0.14;
      pos.x += Math.sin(idleAngle.current) * driftRadius;
      pos.y += Math.sin(idleAngle.current * 0.5) * 0.03;
    }

    camera.position.lerp(pos, 0.08);
    target.current.lerp(tgt, 0.08);
    camera.lookAt(target.current);
  });

  return null;
}

/* ------------------------------------------------------------------
 *  MAIN EXPERIENCE CONTAINER
 * ------------------------------------------------------------------ */
export default function PorscheScrollExperience({ paintColor, setPaintColor }) {
  const sectionRef = useRef(null);
  const progressRef = useRef(0);
  const idleRef = useRef(false);
  
  // App States
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadPct, setPreloadPct] = useState(0);
  const [activeChapter, setActiveChapter] = useState(CHAPTERS[0]);
  const [isOrbitMode, setIsOrbitMode] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [showSpecs, setShowSpecs] = useState(false);

  const idleTimeout = useRef(null);
  const synthRef = useRef(new EngineSynthesizer());
  const revealTimer = useRef(0);

  // Dynamic telemetry states
  const [hudStats, setHudStats] = useState({
    speed: 0,
    rpm: 850,
    gforce: "0.0 G",
    drs: "CLOSED",
    gear: "N"
  });

  // Preloader calibration simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setPreloadPct((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsPreloading(false), 300);
          return 100;
        }
        return prev + Math.floor(Math.random() * 12) + 2;
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Handle Audio Start/Stop
  const toggleSound = () => {
    if (!soundEnabled) {
      synthRef.current.start();
      setSoundEnabled(true);
      synthRef.current.setRPM(progressRef.current * 0.2);
    } else {
      synthRef.current.stop();
      setSoundEnabled(false);
    }
  };

  // Safe audio cleanup
  useEffect(() => {
    return () => {
      synthRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (isPreloading) return;

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;

        // Resolve chapter
        const next =
          CHAPTERS.find(
            (c) => self.progress >= c.range[0] && self.progress < c.range[1]
          ) || CHAPTERS[CHAPTERS.length - 1];

        setActiveChapter((prev) => (prev.id === next.id ? prev : next));

        // Update telemetry data dynamically
        const calculatedSpeed = Math.round(self.progress * 184);
        const calculatedRpm = Math.round(850 + self.progress * 8150 + Math.random() * 30);
        
        let gearVal = "N";
        if (calculatedSpeed === 0) gearVal = "P";
        else if (calculatedSpeed < 35) gearVal = "1";
        else if (calculatedSpeed < 65) gearVal = "2";
        else if (calculatedSpeed < 95) gearVal = "3";
        else if (calculatedSpeed < 125) gearVal = "4";
        else if (calculatedSpeed < 155) gearVal = "5";
        else gearVal = "6";

        let gValue = "0.0 G";
        let drsState = "CLOSED";

        if (self.progress < 0.33) {
          gValue = `${(0.4 + self.progress * 1.5).toFixed(2)} G`;
          drsState = "CLOSED";
        } else if (self.progress < 0.66) {
          gValue = `${(1.0 + (self.progress - 0.33) * 0.8).toFixed(2)} G`;
          drsState = "ARMED";
        } else {
          gValue = `${(1.2 + (self.progress - 0.66) * 1.4).toFixed(2)} G`;
          drsState = "ACTIVE";
        }

        setHudStats({
          speed: calculatedSpeed,
          rpm: calculatedRpm,
          gforce: gValue,
          drs: drsState,
          gear: gearVal
        });

        // Rev up dynamic engine sound
        if (synthRef.current.isPlaying) {
          const scrollSpeed = Math.abs(self.getVelocity());
          const revFactor = Math.min(scrollSpeed / 1000, 0.7) + (self.progress * 0.3);
          synthRef.current.setRPM(revFactor);
        }

        // Idle timer trigger
        idleRef.current = false;
        clearTimeout(idleTimeout.current);
        idleTimeout.current = setTimeout(() => {
          idleRef.current = true;
          if (synthRef.current.isPlaying) {
            synthRef.current.setRPM(progressRef.current * 0.3);
          }
        }, 1000);
      },
    });

    return () => {
      trigger.kill();
      clearTimeout(idleTimeout.current);
    };
  }, [soundEnabled, isPreloading]);

  // Click handler to scroll to a specific section percentage
  const scrollToChapter = (range) => {
    if (!sectionRef.current) return;
    setIsOrbitMode(false); // revert back to Cinematic
    const start = sectionRef.current.offsetTop;
    const height = sectionRef.current.offsetHeight - window.innerHeight;
    const targetProgress = (range[0] + range[1]) / 2;
    window.scrollTo({
      top: start + height * targetProgress,
      behavior: "smooth"
    });
  };

  return (
    <section
      ref={sectionRef}
      style={{ height: `${TOTAL_VH}vh` }}
      className="relative bg-[#ebebeb] text-[#111111]"
    >
      {/* Immersive Preloading Calibration Overlay */}
      <AnimatePresence>
        {isPreloading && (
          <motion.div
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#ebebeb] font-mono p-8"
          >
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="w-80 flex flex-col gap-3 text-left">
              <span className="text-[9px] font-bold text-[#a81116] tracking-[0.3em] uppercase">
                CALIBRATING TELEMETRY LABS
              </span>
              <div className="h-[2px] bg-neutral-300 w-full overflow-hidden relative">
                <motion.div
                  style={{ width: `${Math.min(preloadPct, 100)}%` }}
                  className="h-full bg-[#a81116]"
                />
              </div>
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>STAGE_992 // LOAD_ASSETS</span>
                <span className="font-bold text-neutral-800">{Math.min(preloadPct, 100)}%</span>
              </div>
              <div className="mt-4 flex flex-col gap-1 text-[8px] text-neutral-400">
                <span>CONNECTING EXHAUST WEB AUDIO API...</span>
                {preloadPct > 30 && <span>LOCATING WHEELS CYLINDER NODES...</span>}
                {preloadPct > 60 && <span>MAPPING DYNAMIC REFLECTIVE PLANES...</span>}
                {preloadPct > 85 && <span>BOOTING DRS CONTROL MODULES...</span>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky viewport-locked stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between p-8 md:p-12 z-10">
        
        {/* Background Watermark Typography */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <h1 className="text-[28vw] font-wide font-extrabold text-neutral-300/30 leading-none tracking-tighter uppercase">
            GT3 RS
          </h1>
        </div>

        {/* 1. Header Area overlay */}
        <div className="relative flex justify-between items-start z-30 pointer-events-none w-full">
          {/* Top-Left: Specs and LED RPM bar */}
          <div className="pointer-events-auto flex flex-col gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#111111] flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#a81116] animate-pulse" />
              4.0L FLAT-SIX // 9000 RPM
            </span>
            {/* LED RPM bar */}
            <div className="flex gap-[3px]">
              {Array.from({ length: 12 }).map((_, i) => {
                const step = i / 11;
                const active = progressRef.current >= step;
                return (
                  <div
                    key={i}
                    className={`h-[4px] w-[8px] transition-colors duration-150 ${
                      active
                        ? i < 8
                          ? "bg-neutral-800"
                          : i < 10
                          ? "bg-[#ecc01c]"
                          : "bg-[#a81116]"
                        : "bg-neutral-300/40"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Top-Right: Porsche crest and logotype */}
          <div className="pointer-events-auto flex items-center gap-3 bg-white/40 backdrop-blur-sm border border-neutral-300/50 p-2.5 rounded-sm shadow-sm select-none">
            <svg
              className="h-7 w-7 text-[#111111] fill-current"
              viewBox="0 0 100 120"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="50,10 90,30 90,80 50,110 10,80 10,30" stroke="#111111" strokeWidth="6" fill="transparent" />
              <polygon points="50,22 80,37 80,73 50,96 20,73 20,37" fill="#a81116" opacity="0.8" />
              <line x1="50" y1="10" x2="50" y2="110" stroke="#111111" strokeWidth="4" />
              <line x1="10" y1="55" x2="90" y2="55" stroke="#111111" strokeWidth="4" />
            </svg>
            <span className="font-wide text-xs font-bold tracking-[0.25em] text-[#111111]">
              PORSCHE
            </span>
          </div>
        </div>

        {/* 2. Middle Content Grid */}
        <div className="relative w-full h-full flex items-center justify-between pointer-events-none z-20 my-4">
          
          {/* Left Block: Chapter Overlays & Specs Drawer Trigger */}
          <div className="pointer-events-auto w-full max-w-sm md:max-w-md flex flex-col justify-end text-left pl-2 md:pl-6 pt-12 self-end mb-4 gap-6">
            
            {/* View Specification Drawer button */}
            <button
              onClick={() => setShowSpecs(true)}
              className="self-start font-mono text-[9px] font-bold uppercase tracking-[0.25em] bg-white/60 border border-neutral-300 px-4 py-2 hover:border-[#111111] rounded-sm transition-all duration-300"
            >
              [ VIEW SPECS ]
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeChapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-[#a81116] mb-2 block">
                  {activeChapter.eyebrow}
                </span>
                <h2 className="font-wide text-3xl font-extrabold uppercase leading-[1.05] tracking-tighter text-[#111111] md:text-5xl">
                  {activeChapter.title}
                </h2>
                <div className="h-[2px] w-24 bg-[#a81116] my-4" />
                <p className="text-xs font-sans text-neutral-600 leading-relaxed max-w-sm">
                  {activeChapter.body}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Block: Technical Thumbnail Cards Stack */}
          <div className="pointer-events-auto flex flex-col gap-4 self-center pr-2 md:pr-6">
            {CHAPTERS.map((ch, idx) => {
              const active = activeChapter.id === ch.id;
              const thumbnails = [
                "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80",
                "https://images.unsplash.com/photo-1611245801312-51345984c1ee?auto=format&fit=crop&w=300&q=80",
                "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=300&q=80"
              ];

              return (
                <div
                  key={ch.id}
                  onClick={() => scrollToChapter(ch.range)}
                  className={`group relative flex items-center justify-between gap-4 p-2 rounded-sm border cursor-pointer transition-all duration-300 w-64 md:w-72 bg-white/70 backdrop-blur-md ${
                    active
                      ? "border-[#a81116] ring-1 ring-[#a81116] shadow-md transform scale-[1.03]"
                      : "border-neutral-300/60 opacity-60 hover:opacity-90 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-16 overflow-hidden rounded-[1px] bg-neutral-200 border border-neutral-300">
                      <img
                        src={thumbnails[idx]}
                        alt={ch.title}
                        className="h-full w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-mono text-[8px] font-bold text-neutral-400 tracking-wider">
                        STAGE 0{idx + 1}
                      </span>
                      <span className="font-wide text-[9px] font-extrabold uppercase text-[#111111] tracking-wide">
                        {ch.title}
                      </span>
                    </div>
                  </div>
                  {active && (
                    <div className="flex items-center gap-1.5 font-mono text-[7px] font-bold text-[#a81116] uppercase bg-[#a81116]/10 px-1.5 py-0.5 rounded-sm">
                      <span className="h-1 w-1 bg-[#a81116] rounded-full animate-ping" />
                      LIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 3D Canvas Stage */}
        <div className="absolute inset-0 z-10">
          <Canvas
            shadows
            dpr={[1, 1.8]}
            camera={{ fov: 30, position: CHAPTERS[0].camera.pos }}
            gl={{ antialias: true, alpha: true }}
            onCreated={({ gl }) => {
              gl.shadowMap.type = THREE.PCFSoftShadowMap;
            }}
          >
            <fog attach="fog" args={["#ebebeb", 8, 18]} />
            
            {/* Matte Studio Lights */}
            <ambientLight intensity={0.5} />
            <directionalLight
              castShadow
              position={[5, 8, 5]}
              intensity={1.5}
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-bias={-0.0001}
            />
            <spotLight position={[-8, 6, -6]} intensity={1.8} color="#9fb8ff" angle={0.6} penumbra={1} />
            <spotLight position={[8, 3, 8]} intensity={1.4} color="#ffb37a" angle={0.8} penumbra={1} />

            <Suspense fallback={null}>
              <Car paintColor={paintColor} />
              
              {/* Ground Shadow mesh for tire contact */}
              <ContactShadows
                position={[0, -0.85, 0]}
                opacity={0.35}
                scale={9}
                blur={2.4}
                far={3}
                color="#000000"
              />

              {/* Advanced Reflective Showroom floor */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.85, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <MeshReflectorMaterial
                  blur={[400, 100]}
                  resolution={1024}
                  mixBlur={1}
                  mixStrength={35}
                  roughness={1}
                  depthScale={1.2}
                  minDepthThreshold={0.4}
                  maxDepthThreshold={1.4}
                  color="#dcdcdc"
                  metalness={0.05}
                />
              </mesh>

              <Environment preset="studio" />
            </Suspense>

            {/* Configurable Hotspots */}
            <Suspense fallback={null}>
              {!isOrbitMode && activeChapter.id === "silhouette" && (
                <Html position={[1.1, 0.4, 1.2]} distanceFactor={6} center>
                  <Hotspot
                    title="Fender Ventilation"
                    desc="CFRP louvers extract hot air to maximize front downforce."
                  />
                </Html>
              )}
              {!isOrbitMode && activeChapter.id === "cockpit" && (
                <Html position={[0.2, 0.55, 0.1]} distanceFactor={6} center>
                  <Hotspot
                    title="Rotary Steering Dials"
                    desc="Control TC, ESC, suspension damper settings, and active wing directly."
                  />
                </Html>
              )}
              {!isOrbitMode && activeChapter.id === "rear_spoiler" && (
                <Html position={[-0.1, 0.85, -1.6]} distanceFactor={6} center>
                  <Hotspot
                    title="Swan-Neck Wing"
                    desc="Hydraulic DRS wing opens up to reduce drag for ultimate top speed."
                  />
                </Html>
              )}
            </Suspense>

            <CameraRig
              progressRef={progressRef}
              idleRef={idleRef}
              isOrbitMode={isOrbitMode}
              revealTimer={revealTimer}
              isPreloading={isPreloading}
            />

            {isOrbitMode && (
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={2.5}
                maxDistance={8}
                target={[0, 0.45, 0]}
                makeDefault
              />
            )}
          </Canvas>
        </div>

        {/* 3. Bottom HUD and Controls Bar */}
        <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 z-30 pointer-events-none w-full border-t border-neutral-300/40 pt-4 bg-[#ebebeb]/50 backdrop-blur-sm p-4 rounded-sm">
          
          {/* Telemetry Dashboard Data Display */}
          <div className="pointer-events-auto flex items-center gap-6 font-mono">
            {/* RPM Dial widget */}
            <div className="relative h-12 w-12 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle cx="24" cy="24" r="20" stroke="#d1d5db" strokeWidth="3" fill="transparent" />
                {/* Active RPM indicator */}
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  stroke={hudStats.rpm > 8000 ? "#a81116" : "#111111"}
                  strokeWidth="3.5"
                  fill="transparent"
                  strokeDasharray="125"
                  strokeDashoffset={125 - (125 * (hudStats.rpm / 9000))}
                  className="transition-all duration-75"
                />
              </svg>
              {/* Dial text */}
              <div className="flex flex-col items-center">
                <span className="text-[12px] font-extrabold leading-none text-[#111111]">{hudStats.gear}</span>
                <span className="text-[6px] text-neutral-400 font-bold">GEAR</span>
              </div>
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                SPEED
              </span>
              <span className="text-xl font-bold tracking-tight text-[#111111]">
                {hudStats.speed} <span className="text-xs text-neutral-500 font-normal">MPH</span>
              </span>
            </div>
            
            <div className="h-8 w-[1px] bg-neutral-300" />
            
            <div className="flex flex-col text-left">
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                ENGINE RPM
              </span>
              <span className="text-xl font-bold tracking-tight text-[#111111]">
                {hudStats.rpm} <span className="text-xs text-neutral-500 font-normal">RPM</span>
              </span>
            </div>

            <div className="h-8 w-[1px] bg-neutral-300" />

            <div className="flex flex-col text-left">
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                LATERAL G
              </span>
              <span className="text-xl font-bold tracking-tight text-[#111111]">
                {hudStats.gforce}
              </span>
            </div>

            <div className="h-8 w-[1px] bg-neutral-300" />

            <div className="flex flex-col text-left">
              <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                DRS STATE
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-sm border ${
                hudStats.drs === "ACTIVE"
                  ? "bg-[#a81116]/10 border-[#a81116] text-[#a81116]"
                  : hudStats.drs === "ARMED"
                  ? "bg-[#ecc01c]/10 border-[#ecc01c] text-[#a8821c]"
                  : "bg-neutral-200 border-neutral-300 text-neutral-600"
              }`}>
                {hudStats.drs}
              </span>
            </div>
          </div>

          {/* Paint Configurator Swatches */}
          <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 bg-white/60 border border-neutral-300/40 rounded-full shadow-sm">
            <span className="font-mono text-[9px] font-bold text-neutral-400 tracking-wider mr-1 uppercase">
              PAINT:
            </span>
            <div className="flex gap-2">
              {COLORS.map((color) => {
                const active = paintColor === color.hex;
                return (
                  <button
                    key={color.name}
                    onClick={() => setPaintColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    className={`h-5 w-5 rounded-full border shadow-inner transition-all duration-300 relative ${
                      active
                        ? "border-[#a81116] scale-125 ring-2 ring-[#a81116]/20"
                        : "border-neutral-300 hover:scale-110"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-1 rounded-full border border-white/80 opacity-50" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Audio Synthesizer, Mode Toggles */}
          <div className="pointer-events-auto flex items-center gap-3">
            <button
              onClick={toggleSound}
              className={`flex items-center gap-2 border px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300 shadow-sm ${
                soundEnabled
                  ? "bg-[#a81116] border-[#a81116] text-white hover:bg-[#850b10] hover:border-[#850b10]"
                  : "bg-white border-neutral-300 text-neutral-700 hover:border-[#111111]"
              }`}
            >
              <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                {soundEnabled ? (
                  <path d="M6 9H4.25A2.25 2.25 0 002 11.25v1.5A2.25 2.25 0 004.25 15H6l6 4.5V4.5L6 9zm10.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                ) : (
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H4.25A2.25 2.25 0 002 11.25v1.5A2.25 2.25 0 004.25 15H7l6 4.5v-5.46l5.05 5.05c-.65.49-1.39.88-2.21 1.09v2.06c1.37-.3 2.61-.94 3.65-1.81L20.73 22 22 20.73 4.27 3zM13 4.5L9.67 7.83 13 11.17V4.5z" />
                )}
              </svg>
              {soundEnabled ? "ENGINE: ON" : "ENGINE: OFF"}
            </button>

            <button
              onClick={() => setIsOrbitMode(!isOrbitMode)}
              className={`flex items-center gap-2 border px-4 py-2.5 font-mono text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all duration-300 shadow-sm ${
                isOrbitMode
                  ? "bg-[#111111] border-[#111111] text-white hover:bg-neutral-800"
                  : "bg-white border-neutral-300 text-neutral-700 hover:border-[#111111]"
              }`}
            >
              {isOrbitMode ? "MODE: FREE" : "MODE: CINEMATIC"}
            </button>
          </div>
        </div>

        {/* Free mode alert popup overlay */}
        <AnimatePresence>
          {isOrbitMode && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-[#111111]/90 backdrop-blur-md text-white font-mono text-[9px] uppercase tracking-widest px-4 py-2 border border-neutral-700 shadow-xl rounded-sm text-center"
            >
              DRAG TO ROTATE CAR // SCROLL TO NAVIGATE
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Technical Spec Drawer Sidebar Component */}
      <AnimatePresence>
        {showSpecs && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 w-80 md:w-96 bg-white/95 backdrop-blur-md border-r border-neutral-300/60 z-50 p-8 shadow-2xl flex flex-col justify-between font-mono"
          >
            <div className="flex flex-col gap-8 text-left">
              {/* Drawer Header */}
              <div className="flex justify-between items-center">
                <span className="font-wide text-xs font-bold tracking-widest">
                  911 GT3 RS SPEC SHEET
                </span>
                <button
                  onClick={() => setShowSpecs(false)}
                  className="font-mono text-xs font-bold hover:text-[#a81116] transition-colors p-2"
                >
                  [ CLOSE ]
                </button>
              </div>

              {/* Data Table */}
              <div className="flex flex-col gap-4 text-xs">
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">ENGINE TYPE</span>
                  <span className="text-neutral-800 text-right font-bold">4.0L Boxer-6</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">ASPIRATION</span>
                  <span className="text-neutral-800 text-right font-bold">Naturally Aspirated</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">HORSEPOWER</span>
                  <span className="text-neutral-800 text-right font-bold">518 HP @ 9,000 RPM</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">TORQUE</span>
                  <span className="text-neutral-800 text-right font-bold">342 lb-ft @ 6,300 RPM</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">0-60 MPH</span>
                  <span className="text-neutral-800 text-right font-bold">3.0 SECONDS</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">TOP TRACK SPEED</span>
                  <span className="text-neutral-800 text-right font-bold">184 MPH</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">MAX DOWNFORCE</span>
                  <span className="text-neutral-800 text-right font-bold">1,895 lbs @ 177 mph</span>
                </div>
                <div className="flex justify-between border-b border-neutral-200 pb-2">
                  <span className="text-neutral-400">CURB WEIGHT</span>
                  <span className="text-neutral-800 text-right font-bold">3,268 lbs</span>
                </div>
              </div>
            </div>

            {/* Technical logo at bottom of drawer */}
            <div className="border-t border-neutral-200 pt-6 text-left flex flex-col gap-1.5">
              <span className="text-[10px] text-neutral-400">HOMOLOGATION MODULE</span>
              <span className="text-[8px] text-neutral-300">STAGE_2 // GT_DYNAMICS_992</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/**
 * ------------------------------------------------------------------
 *  PULSATING HOTSPOT ICON + DESCRIPTION OVERLAY
 * ------------------------------------------------------------------
 */
function Hotspot({ title, desc }) {
  return (
    <div className="group relative">
      <div className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#a81116] text-white shadow-[0_0_12px_#a81116] transition-all duration-300 hover:scale-125">
        <span className="h-3.5 w-3.5 rounded-full bg-white animate-ping absolute" />
        <span className="h-2 w-2 rounded-full bg-white relative" />
      </div>

      <div className="pointer-events-none absolute left-8 top-1/2 w-48 -translate-y-1/2 rounded-[2px] border border-neutral-200 bg-white/95 p-3 text-[10px] text-neutral-800 opacity-0 shadow-lg backdrop-blur-md transition-all duration-300 group-hover:pointer-events-auto group-hover:opacity-100 z-50">
        <p className="font-wide font-extrabold uppercase tracking-wider text-[#a81116] mb-1">
          {title}
        </p>
        <p className="leading-relaxed text-neutral-500 font-sans font-medium">
          {desc}
        </p>
      </div>
    </div>
  );
}
