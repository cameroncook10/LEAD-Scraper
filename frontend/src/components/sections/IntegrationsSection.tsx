import React from "react";
import { motion } from "framer-motion";

const integrations = [
  { name: "GoHighLevel", color: "#4F46E5" },
  { name: "HubSpot", color: "#FF7A59" },
  { name: "Salesforce", color: "#00A1E0" },
  { name: "Pipedrive", color: "#25292C" },
  { name: "Zapier", color: "#FF4A00" },
  { name: "Slack", color: "#4A154B" },
  { name: "Google Sheets", color: "#34A853" },
  { name: "Webhooks", color: "#06B6D4" },
];

export function IntegrationsSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-sm text-gray-500 uppercase tracking-widest mb-2">
            Integrations
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            Connect to Your{" "}
            <span className="gradient-text-cyan">Existing Stack</span>
          </h3>
        </motion.div>

        {/* Logo strip */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
          {integrations.map((integration, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.08 }}
              className="group"
            >
              <div className="relative backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] rounded-2xl px-6 py-4 hover:border-cyan-500/25 hover:bg-white/[0.07] transition-all duration-500 shadow-lg shadow-black/10 cursor-pointer">
                {/* Color dot */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full shadow-lg"
                    style={{
                      backgroundColor: integration.color,
                      boxShadow: `0 0 12px ${integration.color}40`,
                    }}
                  />
                  <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {integration.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
