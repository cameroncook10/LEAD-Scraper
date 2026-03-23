import React from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const chartData = [30, 45, 35, 55, 40, 60, 50, 70, 65, 75, 70, 85, 80, 90, 85, 95, 90, 88, 92, 87, 94, 91, 96, 93, 98, 95, 92, 97, 94, 100];

export function DashboardSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6">
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
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          {/* Dashboard — solid background, no blur */}
          <div className="bg-gray-900/90 border border-cyan-500/20 rounded-3xl p-8 shadow-xl">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="ml-4 text-xs text-gray-500 font-mono">dashboard.agentlead.io</div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { title: "Total Leads", value: "12,847", change: "+22%" },
                { title: "DMs Sent", value: "3,291", change: "+18%" },
                { title: "Comments Posted", value: "5,102", change: "+31%" },
                { title: "Conversions", value: "847", change: "+42%" },
              ].map((stat, i) => (
                <div key={i} className="bg-gray-950/80 border border-gray-800 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">{stat.title}</div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <TrendingUp className="w-3 h-3" />
                    <span>{stat.change}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-6 mb-6">
              <div className="text-sm font-medium text-gray-300 mb-4">Lead Conversion — Last 30 Days</div>
              <div className="h-48 flex items-end justify-between gap-1">
                {chartData.map((value, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-cyan-500/50 to-cyan-400/80 rounded-t-sm transition-all duration-200 hover:from-cyan-400/60 hover:to-cyan-300/90"
                    style={{ height: `${value}%`, minWidth: "3px" }}
                  />
                ))}
              </div>
            </div>

            {/* Leads table */}
            <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-6">
              <div className="text-sm font-medium text-gray-300 mb-4">Recent Leads</div>
              <div className="space-y-3">
                {[
                  { name: "Johnson HVAC", loc: "Phoenix, AZ", score: "94%", status: "Hot", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                  { name: "Prime Landscaping", loc: "Charlotte, NC", score: "87%", status: "Warm", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
                  { name: "Elite Plumbing", loc: "Richmond, VA", score: "91%", status: "Hot", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                  { name: "Shango Roofing", loc: "Richmond, VA", score: "96%", status: "Hot", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                ].map((lead, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/50 hover:bg-gray-800/50 transition-colors duration-150">
                    <div>
                      <div className="font-medium text-sm text-white">{lead.name}</div>
                      <div className="text-xs text-gray-400">{lead.loc}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium text-cyan-400 font-mono">{lead.score}</div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium border ${lead.color}`}>{lead.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
