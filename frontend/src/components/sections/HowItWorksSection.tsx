import React from "react";
import { motion } from "framer-motion";
import { Search, Cpu, Rocket } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: Search,
    title: "Define Your Target",
    description: "Set your ideal customer profile — industry, location, company size, keywords. Agent Lead finds them instantly.",
  },
  {
    num: "02",
    icon: Cpu,
    title: "AI Qualifies & Engages",
    description: "Our AI scores every lead, then auto-DMs and auto-comments on their content to build rapport at scale.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Close More Deals",
    description: "Qualified, warm leads flow into your CRM. Your sales team focuses on closing, not prospecting.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Three Steps to{" "}
              <span className="gradient-text-cyan">Autopilot</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              Set it up once, let Agent Lead do the work forever.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px bg-gradient-to-r from-cyan-500/30 via-cyan-500/10 to-cyan-500/30" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative text-center"
              >
                {/* Step number circle */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-900 border-2 border-cyan-500/30 mb-6">
                  <div className="absolute inset-0 rounded-full bg-cyan-500/5 animate-pulse-cyan" />
                  <Icon className="w-8 h-8 text-cyan-400 relative z-10" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-cyan-500 text-gray-950 text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 max-w-sm mx-auto leading-relaxed">{step.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
