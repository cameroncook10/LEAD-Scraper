import React from "react";

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Two static gradient orbs — NO blur, NO animation */}
      <div
        className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.12]"
        style={{ background: "radial-gradient(circle, #22d3ee, transparent 65%)" }}
      />
      <div
        className="absolute top-1/3 -right-16 w-[400px] h-[400px] rounded-full opacity-[0.08]"
        style={{ background: "radial-gradient(circle, #06b6d4, transparent 65%)" }}
      />

      {/* Two CSS-animated lines using keyframes — no JS overhead */}
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <linearGradient id="line-grad-hero" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1="200" x2="100%" y2="400" stroke="url(#line-grad-hero)" strokeWidth="1" className="animate-line-1" />
        <line x1="100%" y1="100" x2="0" y2="500" stroke="url(#line-grad-hero)" strokeWidth="1" className="animate-line-2" />
      </svg>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
}
