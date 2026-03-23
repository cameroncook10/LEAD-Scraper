'use client';

import { LeadScrapingVisual } from "@/components/ui/lead-scraping-visual";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";

export function SplineHeroSection() {
  return (
    <div className="w-full min-h-[600px] h-[80vh] relative overflow-hidden backdrop-blur-3xl bg-black/40 border-y border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        size={600}
      />
      
      <div className="flex flex-col md:flex-row h-full max-w-7xl mx-auto items-center relative z-10">
        {/* Left content */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex-1 p-8 md:p-12 relative z-10 flex flex-col justify-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/20 mb-6 w-fit">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-sm text-cyan-300">Live Scraping Engine</span>
          </div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white via-cyan-100 to-cyan-500 leading-tight mb-6">
            Scale Sales <br/>On Autopilot
          </h2>
          <p className="text-xl text-cyan-100/70 max-w-lg mb-8 leading-relaxed font-light">
            Our AI engine maps global business networks in real-time. Identify qualified leads and deploy personalized Auto DMs instantly to flood your pipeline.
          </p>
          
          <div className="flex gap-4">
            <button className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
              Explore Dashboard
            </button>
          </div>
        </motion.div>

        {/* Right content - Spline 3D */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex-1 w-full h-[500px] md:h-full relative"
        >
          <LeadScrapingVisual className="w-full h-full" />
        </motion.div>
      </div>
    </div>
  )
}
