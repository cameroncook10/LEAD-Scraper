import React from "react";
import { motion } from "framer-motion";
import {
  Wrench,
  Home,
  Zap,
  Droplets,
  TreePine,
  Shield,
  Stethoscope,
  Scale,
  PaintBucket,
  Car,
  Dog,
  Smartphone,
  Building2,
  Sparkles,
  ArrowRight,
} from "lucide-react";

const industries = [
  {
    icon: Wrench,
    name: "HVAC Contractors",
    leads: "High",
    desc: "Homeowners needing heating, cooling & air quality services",
    color: "from-orange-500 to-red-500",
    preset: "hvac",
  },
  {
    icon: Home,
    name: "Roofing Companies",
    leads: "High",
    desc: "Storm damage, re-roofs, inspections & gutter installs",
    color: "from-amber-500 to-orange-500",
    preset: "roofing",
  },
  {
    icon: Droplets,
    name: "Plumbing Services",
    leads: "High",
    desc: "Emergency plumbing, remodels & commercial plumbing leads",
    color: "from-blue-500 to-cyan-500",
    preset: "plumbing",
  },
  {
    icon: Zap,
    name: "Electricians",
    leads: "Medium",
    desc: "Residential & commercial electrical work, panel upgrades",
    color: "from-yellow-500 to-amber-500",
    preset: "electrical",
  },
  {
    icon: TreePine,
    name: "Landscaping & Lawn Care",
    leads: "High",
    desc: "Lawn maintenance, hardscaping & landscape design",
    color: "from-green-500 to-emerald-500",
    preset: "landscaping",
  },
  {
    icon: PaintBucket,
    name: "Painting Contractors",
    leads: "Medium",
    desc: "Interior, exterior & commercial painting services",
    color: "from-violet-500 to-purple-500",
    preset: "painting",
  },
  {
    icon: Shield,
    name: "Pest Control",
    leads: "Medium",
    desc: "Termite, rodent & general pest management",
    color: "from-red-500 to-pink-500",
    preset: "pest_control",
  },
  {
    icon: Stethoscope,
    name: "Home Healthcare",
    leads: "Medium",
    desc: "In-home nursing, elder care & physical therapy",
    color: "from-teal-500 to-cyan-500",
    preset: "healthcare",
  },
  {
    icon: Scale,
    name: "Law Firms",
    leads: "High",
    desc: "Personal injury, family law & estate planning leads",
    color: "from-slate-400 to-gray-500",
    preset: "legal",
  },
  {
    icon: Car,
    name: "Auto Detailing",
    leads: "Medium",
    desc: "Mobile detailing, ceramic coating & paint correction",
    color: "from-cyan-500 to-blue-500",
    preset: "auto_detailing",
  },
  {
    icon: Dog,
    name: "Pet Services",
    leads: "Medium",
    desc: "Grooming, dog walking, pet sitting & pet training",
    color: "from-pink-500 to-rose-500",
    preset: "pet_services",
  },
  {
    icon: Building2,
    name: "Real Estate Agents",
    leads: "High",
    desc: "Buyer leads, seller leads & commercial property",
    color: "from-emerald-500 to-teal-500",
    preset: "real_estate",
  },
];

export function IndustriesSection() {
  return (
    <section id="industries" className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">Industries</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Built for{" "}
              <span className="gradient-text-cyan">Service Businesses</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Pre-built scraping templates for 12+ industries. One click to start generating
              qualified leads for your exact business type.
            </p>
          </motion.div>
        </div>

        {/* Industry cards grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {industries.map((industry, i) => {
            const Icon = industry.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.5 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative cursor-pointer"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                {/* Liquid glass card */}
                <div className="relative h-full rounded-2xl overflow-hidden">
                  {/* Glass refraction effect on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background:
                        "radial-gradient(circle at 30% 30%, rgba(6, 182, 212, 0.15), transparent 60%)",
                    }}
                  />

                  <div className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 h-full hover:border-cyan-500/30 hover:bg-white/[0.07] transition-all duration-500 shadow-lg shadow-black/20">
                    {/* Icon + leads badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${industry.color} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-mono text-cyan-400/80 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                        {industry.leads} volume
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-white mb-1.5">
                      {industry.name}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {industry.desc}
                    </p>

                    {/* Hover arrow */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span>Use Template</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-500 text-sm mb-4">
            Don't see your industry? Agent Lead works for any service-based business.
          </p>
          <motion.button
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-white font-medium transition-all duration-300"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Build Custom Template
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
