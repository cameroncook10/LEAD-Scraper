import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Play, Zap } from "lucide-react";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import NeuralBackground from "@/components/ui/flow-field-background";
import { useNavigate } from "react-router-dom";

export function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 px-6 overflow-hidden">
      {/* Layer 1: particle flow-field (existing) */}
      <div className="absolute inset-0 z-0 opacity-60">
        <NeuralBackground color="#22d3ee" trailOpacity={0.06} speed={0.4} particleCount={150} />
      </div>

      {/* Layer 2: Figma animated background (new) */}
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
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/20 mb-8 shadow-lg shadow-cyan-500/20"
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
          <span className="relative inline-block text-white">
            Automate Your{" "}
          </span>
          <br />
          <span className="relative inline-block bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 bg-clip-text text-transparent">
            Lead Generation
            {/* Sparkle effects */}
            <motion.div
              className="absolute -right-6 top-1/4"
              animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            >
              <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/80" />
            </motion.div>
            <motion.div
              className="absolute -left-4 bottom-1/4"
              animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 0.5 }}
            >
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full shadow-lg shadow-blue-400/80" />
            </motion.div>
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
          <motion.button
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative bg-cyan-500 hover:bg-cyan-400 text-gray-950 px-8 py-4 rounded-xl font-bold text-lg transition-all overflow-hidden shadow-2xl shadow-cyan-500/30"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: [-200, 200] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            <span className="relative z-10 flex items-center gap-2">
              Start 3-Day Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="backdrop-blur-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/10"
          >
            <Play className="w-5 h-5" />
            Watch Demo
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 text-center"
        >
          {[
            { value: "Fast", label: "Extraction Speed" },
            { value: "AI", label: "Lead Scoring" },
            { value: "Auto", label: "Outreach" },
          ].map((stat, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div className="w-px h-12 bg-gradient-to-b from-transparent via-cyan-400/30 to-transparent" />
              )}
              <div className="relative">
                <div className="text-3xl font-bold text-cyan-400">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
                <div className="absolute inset-0 bg-cyan-400/10 blur-xl rounded-full -z-10" />
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
