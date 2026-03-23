import React from "react";
import { motion } from "framer-motion";

export function GlobalBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-black" />

      {/* Three slow-pulsing orbs — GPU composited */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[100px] will-change-transform"
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.12, 0.2, 0.12] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-cyan-400/12 rounded-full blur-[80px] will-change-transform"
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 6 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-300/10 rounded-full blur-[120px] will-change-transform"
      />

      {/* Two diagonal flowing lines — lightweight SVG */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lg-global" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.line
          x1="0%" y1="0%" x2="100%" y2="100%"
          stroke="url(#lg-global)" strokeWidth="1"
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.line
          x1="100%" y1="0%" x2="0%" y2="100%"
          stroke="url(#lg-global)" strokeWidth="1"
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
      </svg>
    </div>
  );
}
