import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 px-6 overflow-hidden">
      {/* Lightweight animated background — no canvas, no blur */}
      <AnimatedBackground />

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/30 via-transparent to-black" />

      {/* Content */}
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
        >
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-cyan-300 font-medium">AI-Powered Lead Automation</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-[0.95]"
        >
          <span className="text-white">Automate Your </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            Lead Generation
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg sm:text-xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
        >
          Scrape leads, auto-DM prospects, auto-comment on posts, and qualify with AI — all on autopilot.
          Built for businesses that want to dominate their market.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
        >
          <button className="group bg-cyan-500 hover:bg-cyan-400 text-gray-950 px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-200 flex items-center gap-2">
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors duration-200 flex items-center gap-2">
            <Play className="w-5 h-5" />
            Watch Demo
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: "2,500+", label: "Leads Per Minute" },
            { value: "94%", label: "AI Accuracy" },
            { value: "10x", label: "ROI Average" },
          ].map((stat, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
              )}
              <div>
                <div className="text-3xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
