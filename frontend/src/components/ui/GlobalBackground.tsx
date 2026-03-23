import React from 'react';

/**
 * Performance-optimized global background.
 * Uses static CSS radial gradients layered on top of each other
 * instead of framer-motion animated orbs — zero GPU overhead.
 * A noise texture is applied via CSS class on the root element.
 */
export function GlobalBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">
      {/* Layer 1: Deep mesh gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.12) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 50%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
            radial-gradient(ellipse 50% 60% at 10% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            radial-gradient(ellipse 40% 30% at 70% 100%, rgba(6, 182, 212, 0.04) 0%, transparent 50%),
            linear-gradient(180deg, #050505 0%, #0a0a0a 50%, #050505 100%)
          `,
        }}
      />

      {/* Layer 2: Subtle grid lines */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Layer 3: Top + bottom vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(180deg, rgba(5,5,5,0.6) 0%, transparent 20%, transparent 80%, rgba(5,5,5,0.8) 100%)
          `,
        }}
      />
    </div>
  );
}
