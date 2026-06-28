import React, { useState } from "react";
import { motion } from "framer-motion";

const MODELS = [
  {
    name: "911 Carrera",
    tagline: "The Daily Benchmark",
    specs: {
      power: "379 HP",
      rpm: "7,500 RPM",
      acceleration: "4.0 sec",
      downforce: "Minimal",
      aero: "Passive spoiler",
      chassis: "Steel/Aluminum composite",
      weight: "3,354 lbs",
      price: "$114,400"
    },
    metrics: {
      hpVal: 379,
      rpmVal: 7500,
      accVal: 4.0, // shorter is better
      downforceVal: 50 // placeholder for bar chart
    }
  },
  {
    name: "911 GT3",
    tagline: "The Purist's Instrument",
    specs: {
      power: "502 HP",
      rpm: "9,000 RPM",
      acceleration: "3.2 sec",
      downforce: "330 lbs",
      aero: "Fixed swan-neck wing",
      chassis: "Aluminum/CFRP hybrid",
      weight: "3,126 lbs",
      price: "$182,900"
    },
    metrics: {
      hpVal: 502,
      rpmVal: 9000,
      accVal: 3.2,
      downforceVal: 330
    }
  },
  {
    name: "911 GT3 RS",
    tagline: "The Track Homologation",
    specs: {
      power: "518 HP",
      rpm: "9,000 RPM",
      acceleration: "3.0 sec",
      downforce: "1,895 lbs",
      aero: "Active hydraulic DRS wing",
      chassis: "Full CFRP motorsport panels",
      weight: "3,268 lbs",
      price: "$223,800"
    },
    metrics: {
      hpVal: 518,
      rpmVal: 9000,
      accVal: 3.0,
      downforceVal: 1895
    }
  }
];

export default function PorscheCompare() {
  const [activeMetric, setActiveMetric] = useState("downforce"); // downforce, power, acceleration

  // Helper to resolve bar values
  const getChartData = () => {
    switch (activeMetric) {
      case "downforce":
        return {
          title: "TOTAL DOWNFORCE // LBS @ 177 MPH (Higher is better)",
          max: 2000,
          data: MODELS.map((m) => ({ name: m.name, val: m.metrics.downforceVal, display: m.specs.downforce }))
        };
      case "power":
        return {
          title: "ENGINE OUTPUT // HORSEPOWER (Higher is better)",
          max: 6000, // scaled for layout
          data: MODELS.map((m) => ({ name: m.name, val: m.metrics.hpVal * 10, display: m.specs.power }))
        };
      case "acceleration":
        default:
          return {
            title: "0 - 60 MPH ACCELERATION // SECONDS (Lower is better)",
            max: 5,
            data: MODELS.map((m) => ({ name: m.name, val: m.metrics.accVal, display: m.specs.acceleration, reverse: true }))
          };
    }
  };

  const chart = getChartData();

  return (
    <div className="min-h-screen w-full bg-[#ebebeb] text-[#111111] p-8 md:p-12 font-mono relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Title */}
      <div className="relative max-w-4xl mx-auto flex flex-col text-left mb-12 border-b border-neutral-300 pb-6 z-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#a81116]">
          homologation metrics // specs comparison
        </span>
        <h1 className="font-wide text-3xl font-extrabold uppercase leading-none tracking-tight text-[#111111] md:text-5xl mt-2">
          RANGE ANALYSIS.
        </h1>
      </div>

      {/* Main comparative grid layout */}
      <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 items-start">
        
        {/* Specification Comparison Matrix (Table) */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md border border-neutral-300/60 p-6 rounded-sm shadow-sm flex flex-col text-left gap-4 overflow-x-auto">
          <span className="text-[9px] font-bold text-neutral-400 tracking-wider">
            MATRIX DATA // side-by-side
          </span>
          
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-neutral-300 text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-3">SPECIFICATION</th>
                {MODELS.map((m) => (
                  <th key={m.name} className="py-3 px-2">{m.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">output</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-semibold">{m.specs.power}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">max rpm</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-semibold">{m.specs.rpm}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">0-60 mph</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-semibold">{m.specs.acceleration}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">downforce</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-semibold text-[#a81116]">{m.specs.downforce}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">aerodynamics</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-sans text-[11px] text-neutral-600 leading-tight">{m.specs.aero}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">construction</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-sans text-[11px] text-neutral-600 leading-tight">{m.specs.chassis}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase">curb weight</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-semibold">{m.specs.weight}</td>)}
              </tr>
              <tr>
                <td className="py-3 font-bold text-neutral-400 uppercase text-[#a81116]">base msrp</td>
                {MODELS.map((m) => <td key={m.name} className="py-3 px-2 font-bold text-[#a81116]">{m.specs.price}</td>)}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Dynamic Comparison Charts Panel */}
        <div className="lg:col-span-5 bg-white/70 backdrop-blur-md border border-neutral-300/60 p-6 rounded-sm shadow-sm flex flex-col text-left gap-6">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-neutral-400 tracking-wider">
              ANALYTICS GRAPHS // comparative
            </span>
            <span className="text-[11px] font-sans font-medium text-neutral-500 leading-relaxed">
              Compare engine output, acceleration speed, and drag-downforce profiles below.
            </span>
          </div>

          {/* Metric tabs buttons */}
          <div className="flex border border-neutral-300 rounded-sm overflow-hidden text-[9px] font-bold uppercase tracking-wider w-full">
            <button
              onClick={() => setActiveMetric("downforce")}
              className={`flex-1 py-2 text-center transition-all ${
                activeMetric === "downforce" ? "bg-[#a81116] text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              downforce
            </button>
            <button
              onClick={() => setActiveMetric("power")}
              className={`flex-1 py-2 text-center transition-all ${
                activeMetric === "power" ? "bg-[#a81116] text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              power
            </button>
            <button
              onClick={() => setActiveMetric("acceleration")}
              className={`flex-1 py-2 text-center transition-all ${
                activeMetric === "acceleration" ? "bg-[#a81116] text-white" : "bg-white text-neutral-600 hover:bg-neutral-100"
              }`}
            >
              0-60 MPH
            </button>
          </div>

          {/* SVG Bar Chart Display */}
          <div className="flex flex-col gap-4">
            <span className="text-[9px] font-bold text-neutral-700 tracking-wider uppercase">
              {chart.title}
            </span>

            <div className="flex flex-col gap-5 pt-2">
              {chart.data.map((row) => {
                // Calculate percentage width of bar
                const pct = chart.reverse 
                  ? ((5.0 - row.val) / 3.0) * 80 + 20 // scale acceleration nicely
                  : (row.val / chart.max) * 100;

                return (
                  <div key={row.name} className="flex flex-col gap-1.5 text-left">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-[#111111]">{row.name}</span>
                      <span className={activeMetric === "downforce" && row.name.includes("GT3 RS") ? "text-[#a81116] font-bold" : "text-neutral-500"}>
                        {row.display}
                      </span>
                    </div>
                    {/* SVG/CSS Bar */}
                    <div className="h-6 w-full bg-neutral-200 border border-neutral-300/40 relative overflow-hidden rounded-[1px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(Math.min(pct, 100), 0)}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full ${
                          row.name.includes("GT3 RS") 
                            ? "bg-[#a81116] shadow-[inset_0_0_10px_rgba(255,255,255,0.15)]" 
                            : "bg-neutral-800"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
