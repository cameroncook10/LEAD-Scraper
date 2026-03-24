import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 12, suffix: "+", label: "Industry Templates" },
  { value: 3, suffix: "", label: "Outreach Channels" },
  { value: 100, suffix: "%", label: "Automated" },
  { value: 24, suffix: "/7", label: "Lead Monitoring" },
];

function AnimatedCounter({ value, suffix, decimals = 0 }: { value: number; suffix: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-black text-white tabular-nums">
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}{suffix}
    </span>
  );
}

export function SocialProofBar() {
  return (
    <section className="py-12 px-6 relative">
      <div className="max-w-5xl mx-auto">
        <div className="glass-liquid rounded-2xl px-8 py-8 relative overflow-hidden">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center relative"
              >
                <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.label.includes("DMs") ? 1 : 0} />
                <div className="text-gray-500 text-xs mt-1.5 uppercase tracking-wider font-medium">{stat.label}</div>
                
                {/* Divider line (not on last) */}
                {i < stats.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-10"
                    style={{ background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.15), transparent)' }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
