import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";

const chartData = [30, 45, 35, 55, 40, 60, 50, 70, 65, 75, 70, 85, 80, 90, 85, 95, 90, 88, 92, 87, 94, 91, 96, 93, 98, 95, 92, 97, 94, 100];

function StatCard({ title, value, change, trend }: { title: string; value: string; change: string; trend: "up" | "down" }) {
  const isPositive = trend === "up";
  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300">
      <div className="text-xs text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className={`flex items-center gap-1 text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{change}</span>
      </div>
    </div>
  );
}

function LeadRow({ name, location, score, status }: { name: string; location: string; score: string; status: string }) {
  const statusColors: Record<string, string> = {
    Hot: "bg-red-500/20 text-red-400 border-red-500/30",
    Warm: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    Cold: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };
  return (
    <div className="flex items-center justify-between p-3 rounded-lg backdrop-blur-sm bg-white/5 hover:bg-white/10 transition-colors">
      <div>
        <div className="font-medium text-sm text-white">{name}</div>
        <div className="text-xs text-gray-400">{location}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-cyan-400 font-mono">{score}</div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[status] || ""}`}>
          {status}
        </div>
      </div>
    </div>
  );
}

export function DashboardSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <span className="text-sm text-cyan-300">Live Dashboard</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            See Your Leads{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              In Real Time
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Track every scrape, every DM, every conversion — all from one powerful dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative"
        >
          {/* Glass dashboard */}
          <div className="relative backdrop-blur-2xl bg-gradient-to-br from-black/60 to-black/40 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl overflow-hidden">
            {/* Glow effects */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-400/15 rounded-full blur-3xl" />

            {/* Animated border sweep */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{ background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.2), transparent)" }}
              animate={{ x: [-500, 500] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* Browser chrome */}
            <div className="flex items-center gap-2 mb-6 relative z-10">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/50" />
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
              <div className="ml-4 text-xs text-gray-500 font-mono">dashboard.agentlead.io</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
              <StatCard title="Total Leads" value="12,847" change="+22%" trend="up" />
              <StatCard title="DMs Sent" value="3,291" change="+18%" trend="up" />
              <StatCard title="Comments Posted" value="5,102" change="+31%" trend="up" />
              <StatCard title="Conversions" value="847" change="+42%" trend="up" />
            </div>

            {/* Chart */}
            <div className="backdrop-blur-xl bg-black/30 border border-cyan-500/20 rounded-2xl p-6 mb-6 relative z-10 shadow-xl">
              <div className="text-sm font-medium text-gray-300 mb-4">Lead Conversion — Last 30 Days</div>
              <div className="h-48 flex items-end justify-between gap-1">
                {chartData.map((value, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    whileInView={{ height: `${value}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03, duration: 0.5 }}
                    whileHover={{ scale: 1.1 }}
                    className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-400/80 rounded-t-lg backdrop-blur-sm shadow-lg shadow-cyan-500/20 cursor-pointer"
                    style={{ minWidth: "3px" }}
                  />
                ))}
              </div>
            </div>

            {/* Leads table */}
            <div className="backdrop-blur-xl bg-black/30 border border-cyan-500/20 rounded-2xl p-6 relative z-10 shadow-xl">
              <div className="text-sm font-medium text-gray-300 mb-4">Recent Leads</div>
              <div className="space-y-3">
                <LeadRow name="Johnson HVAC" location="Phoenix, AZ" score="94%" status="Hot" />
                <LeadRow name="Prime Landscaping" location="Charlotte, NC" score="87%" status="Warm" />
                <LeadRow name="Elite Plumbing" location="Richmond, VA" score="91%" status="Hot" />
                <LeadRow name="Shango Roofing" location="Richmond, VA" score="96%" status="Hot" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
