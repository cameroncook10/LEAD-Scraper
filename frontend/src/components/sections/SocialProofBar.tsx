import React from "react";
import { motion } from "framer-motion";
import { Users, MessageSquare, TrendingUp, Globe } from "lucide-react";

const stats = [
  { icon: Users, value: "500+", label: "Active Businesses", color: "text-cyan-400" },
  { icon: MessageSquare, value: "2.1M+", label: "DMs Sent", color: "text-blue-400" },
  { icon: TrendingUp, value: "94%", label: "Lead Accuracy", color: "text-emerald-400" },
  { icon: Globe, value: "12M+", label: "Leads Scraped", color: "text-purple-400" },
];

export function SocialProofBar() {
  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-2xl overflow-hidden"
        >
          {/* Liquid glass container */}
          <div className="relative backdrop-blur-2xl bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/20">
            {/* Inner aurora glow */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <div className="absolute top-0 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    className="text-center"
                  >
                    <Icon className={`w-6 h-6 ${stat.color} mx-auto mb-2 opacity-70`} />
                    <div className={`text-3xl font-black ${stat.color} mb-1`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">
                      {stat.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
