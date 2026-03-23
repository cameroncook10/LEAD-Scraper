import React from "react";
import { motion } from "framer-motion";
import { Search, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Define Your Target",
    description: "Set your ideal customer profile — industry, location, company size, keywords. Agent Lead finds them instantly.",
    accent: "from-cyan-500 to-blue-500",
  },
  {
    num: "02",
    icon: Cpu,
    title: "AI Qualifies & Engages",
    description: "Our AI scores every lead, then auto-DMs and auto-comments on their content to build rapport at scale.",
    accent: "from-blue-500 to-violet-500",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Close More Deals",
    description: "Qualified, warm leads flow into your CRM. Your sales team focuses on closing, not prospecting.",
    accent: "from-violet-500 to-cyan-500",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge-cyan mb-4 inline-block">How It Works</span>
          <h2 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">
            <span className="gradient-text-subtle">Three Steps to </span>
            <span className="gradient-text-cyan">Autopilot</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
            Set it up once, let Agent Lead do the work forever.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-[72px] left-[20%] right-[20%] h-px"
            style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.2), rgba(139,92,246,0.15), rgba(6,182,212,0.2))' }}
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                {/* Step circle */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 glass-liquid">
                  <Icon className="w-8 h-8 text-cyan-400 relative z-10" />
                  <span className={`absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-gradient-to-br ${step.accent} text-white text-xs font-bold flex items-center justify-center shadow-lg`}>
                    {step.num}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-500 max-w-sm mx-auto leading-relaxed text-sm">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
