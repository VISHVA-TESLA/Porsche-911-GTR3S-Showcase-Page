import React from "react";
import { motion } from "framer-motion";

const TIMELINE_EVENTS = [
  {
    year: "1963",
    gen: "ORIGINAL 911 // 901",
    title: "Birth of a Silhouette",
    desc: "Unveiled at the Frankfurt Motor Show as the Type 901, the design defined the sports car archetype. Featuring a rear-mounted air-cooled boxer engine and an iconic fastback profile, it set a blueprint that has never been broken.",
    image: "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?auto=format&fit=crop&w=600&q=80"
  },
  {
    year: "1973",
    gen: "CARRERA RS 2.7",
    title: "The Lightweight Racer",
    desc: "Built to homologate the 911 for GT racing, the RS 2.7 was the first production model to feature a rear spoiler—the legendary 'ducktail'. At just 975 kg, it set the benchmark for high-performance track focus.",
    image: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?auto=format&fit=crop&w=600&q=80"
  },
  {
    year: "1995",
    gen: "TYPE 993",
    title: "Last of the Air-Cooled",
    desc: "Revered by collectors, the 993 represents the final generation of air-cooled boxer engines. Combining refined modern chassis dynamics with pure analog feedback, it remains a masterpiece of design integration.",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=600&q=80"
  },
  {
    year: "2013",
    gen: "TYPE 991 GT3",
    title: "Digital Precision",
    desc: "The generation that brought high-revving 9,000 RPM engines together with rear-axle steering and rapid-fire PDK dual-clutch transmissions, translating motorsport capability directly to tarmac touring.",
    image: "https://images.unsplash.com/photo-1605558202138-097f50c7e5a4?auto=format&fit=crop&w=600&q=80"
  },
  {
    year: "2023",
    gen: "TYPE 992 GT3 RS",
    title: "Aerodynamic Supremacy",
    desc: "The ultimate track homologation. Eliminating the front trunk to accommodate a massive center radiator and incorporating a hydraulic active DRS swan-neck wing, it delivers motorsport cup-car capabilities on road-legal tires.",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=600&q=80"
  }
];

export default function PorscheTimeline() {
  return (
    <div className="min-h-screen w-full bg-[#ebebeb] text-[#111111] p-8 md:p-12 font-mono relative overflow-x-hidden">
      
      {/* Grid backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(to_right,#000_1px,transparent_1px),linear-gradient(to_bottom,#000_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Page Title Header */}
      <div className="relative max-w-4xl mx-auto flex flex-col text-left mb-16 border-b border-neutral-300 pb-8 z-10">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#a81116]">
          Heritage Timeline // 1963 - 2026
        </span>
        <h1 className="font-wide text-3xl font-extrabold uppercase leading-none tracking-tight text-[#111111] md:text-5xl mt-2">
          SIXTY YEARS OF EVOLUTION.
        </h1>
        <p className="font-sans text-xs text-neutral-500 leading-relaxed mt-4 max-w-lg">
          Explore the lineage of speed. We don't discard our history—we refine it. The Porsche 911 represents a continuous thread of engineering obsession.
        </p>
      </div>

      {/* Timeline Layout */}
      <div className="relative max-w-3xl mx-auto flex flex-col items-center gap-12 z-10 pb-20">
        {/* Center line */}
        <div className="absolute left-1/2 top-4 bottom-16 w-[1px] bg-neutral-300 -translate-x-1/2 hidden md:block" />

        {TIMELINE_EVENTS.map((event, idx) => {
          const isEven = idx % 2 === 0;
          return (
            <motion.div
              key={event.year}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={`flex flex-col md:flex-row items-center justify-between w-full relative ${
                isEven ? "md:flex-row" : "md:flex-row-reverse"
              }`}
            >
              {/* Year marker */}
              <div className="absolute left-1/2 top-0 h-10 w-10 rounded-full border border-neutral-300 bg-[#ebebeb] flex items-center justify-center -translate-x-1/2 z-20 text-[10px] font-bold text-[#a81116] hidden md:flex shadow-sm">
                {event.year}
              </div>

              {/* Editorial card */}
              <div className="w-full md:w-[45%] bg-white/70 backdrop-blur-md border border-neutral-300/60 p-6 rounded-sm shadow-sm flex flex-col text-left gap-4 hover:shadow-md transition-all duration-300">
                {/* Year tag for mobile */}
                <div className="flex justify-between items-center md:hidden">
                  <span className="text-sm font-bold text-[#a81116]">{event.year}</span>
                  <span className="text-[8px] text-neutral-400 font-bold">{event.gen}</span>
                </div>

                <div className="hidden md:flex justify-between items-center">
                  <span className="text-[8px] text-neutral-400 font-bold tracking-widest">{event.gen}</span>
                </div>

                <h3 className="font-wide text-md font-bold uppercase tracking-wide text-[#111111]">
                  {event.title}
                </h3>
                
                {/* Visual Thumbnail */}
                <div className="h-40 w-full overflow-hidden rounded-[1px] bg-neutral-200 border border-neutral-300 shadow-inner">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="h-full w-full object-cover grayscale hover:grayscale-0 hover:scale-[1.03] transition-all duration-500"
                  />
                </div>

                <p className="font-sans text-[11px] text-neutral-600 leading-relaxed">
                  {event.desc}
                </p>
              </div>

              {/* Offset space helper */}
              <div className="w-0 md:w-[45%]" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
