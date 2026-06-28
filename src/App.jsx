import React, { useState } from "react";
import PorscheScrollExperience from "./components/PorscheScrollExperience";
import PorscheConfigurator from "./components/PorscheConfigurator";
import PorscheTimeline from "./components/PorscheTimeline";
import PorscheCompare from "./components/PorscheCompare";

const TABS = [
  { id: "inspect", label: "01 // INSPECT" },
  { id: "configurator", label: "02 // CONFIGURATOR" },
  { id: "timeline", label: "03 // HERITAGE" },
  { id: "compare", label: "04 // COMPARE" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState("inspect");
  // Shared paint configuration color (persists across tab changes)
  const [paintColor, setPaintColor] = useState("#f2f2f2");

  return (
    <main className="bg-[#ebebeb] font-sans text-neutral-900 select-none antialiased min-h-screen flex flex-col justify-between">
      
      {/* Sticky Global Navigation Header Bar */}
      <header className="sticky top-0 z-50 bg-[#ebebeb]/70 backdrop-blur-md border-b border-neutral-300/40 px-6 py-4 flex justify-between items-center font-mono">
        <div className="flex items-center gap-2.5">
          <span className="font-wide text-[10px] font-bold tracking-[0.25em] text-[#111111] uppercase">
            911 GT3 RS
          </span>
        </div>

        {/* Tab selection links */}
        <nav className="flex gap-6 md:gap-8 text-[9px] font-bold uppercase tracking-widest">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  // Scroll to top of window when swapping pages
                  window.scrollTo({ top: 0, behavior: "instant" });
                }}
                className={`relative py-1 transition-all duration-300 ${
                  active ? "text-[#a81116]" : "text-neutral-500 hover:text-[#111111]"
                }`}
              >
                {tab.label}
                {active && (
                  <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#a81116] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main dynamic routing content */}
      <div className="flex-1 w-full">
        {activeTab === "inspect" && (
          <>
            {/* Editorial lead-in header specific to inspect mode */}
            <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:48px_48px]" />
              
              <div className="absolute top-8 left-8 right-8 flex justify-between font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-500">
                <span>PROJECT // 992_GT3_RS</span>
                <span>STUTTGART, DE</span>
              </div>

              <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.4em] text-[#a81116]">
                Automotive Icon
              </p>
              <h1 className="max-w-4xl font-wide text-4xl font-extrabold leading-none tracking-tighter text-[#111111] md:text-7xl uppercase">
                BUILT FOR THE TRACK.
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-neutral-600">
                A high-performance sports car that demands no compromises. Born in motorsport, refined for aerodynamic perfection.
              </p>
              
              <div className="mt-16 flex flex-col items-center gap-3">
                <div className="h-12 w-[1px] bg-neutral-400/80 animate-bounce" />
                <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-neutral-400">
                  SCROLL TO BEGIN INSPECTION
                </p>
              </div>
            </section>

            {/* Immersive scroll telemetry */}
            <PorscheScrollExperience paintColor={paintColor} setPaintColor={setPaintColor} />

            {/* Outro footer specific to inspect mode */}
            <section className="relative flex h-[80vh] flex-col items-center justify-center overflow-hidden border-t border-neutral-300/60 bg-[#eaeaea] px-6 text-center">
              <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:48px_48px]" />
              
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.4em] text-[#a81116] font-bold">
                Legacy of Speed
              </p>
              <h2 className="max-w-3xl font-wide text-3xl font-bold uppercase tracking-tight text-[#111111] md:text-5xl">
                DRIVEN BY PASSION.
              </h2>
              <p className="mt-6 max-w-md text-[11px] leading-relaxed text-neutral-500 uppercase tracking-widest">
                Porsche 911 GT3 RS — Sixty years of refusing to look like anything else.
              </p>
              
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="mt-12 border border-neutral-400 hover:border-black text-[#111111] hover:bg-black hover:text-white px-8 py-3 font-mono text-[10px] uppercase tracking-widest transition-all duration-300 rounded-sm"
              >
                BACK TO START ↑
              </button>
            </section>
          </>
        )}

        {activeTab === "configurator" && (
          <PorscheConfigurator paintColor={paintColor} setPaintColor={setPaintColor} />
        )}

        {activeTab === "timeline" && (
          <PorscheTimeline />
        )}

        {activeTab === "compare" && (
          <PorscheCompare />
        )}
      </div>

    </main>
  );
}
