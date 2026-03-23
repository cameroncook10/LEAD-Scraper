import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { motion } from "framer-motion";

export function HeroScrollSection() {
  return (
    <div className="flex flex-col overflow-hidden bg-gray-950">
      <ContainerScroll
        titleComponent={
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">Live Dashboard</span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              See Your Leads{" "}
              <span className="gradient-text-cyan">In Real Time</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-light">
              Track every scrape, every DM, every conversion — all from one powerful dashboard.
            </p>
          </motion.div>
        }
      >
        {/* Dashboard mockup inside the scroll card */}
        <div className="w-full h-full bg-gray-950 p-4 md:p-8 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="text-xs text-gray-500 font-mono">dashboard.agentlead.io</div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: "Leads Scraped", value: "12,847", change: "+23%" },
              { label: "DMs Sent", value: "3,291", change: "+18%" },
              { label: "Comments Posted", value: "5,102", change: "+31%" },
              { label: "Conversions", value: "847", change: "+42%" },
            ].map((stat, i) => (
              <div key={i} className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div>
                <div className="text-lg font-bold text-white mt-1">{stat.value}</div>
                <div className="text-xs text-cyan-400 mt-0.5">{stat.change}</div>
              </div>
            ))}
          </div>

          {/* Chart area */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4">
            <div className="text-sm text-gray-400 mb-3">Lead Generation — Last 30 Days</div>
            <div className="flex items-end gap-1 h-24">
              {[40, 55, 35, 60, 45, 70, 50, 80, 65, 90, 75, 95, 85, 100, 80, 110, 95, 105, 90, 115, 100, 120, 105, 130, 110, 125, 115, 140, 120, 135].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-cyan-500/60 to-cyan-400/20 rounded-t-sm transition-all duration-300"
                  style={{ height: `${(h / 140) * 100}%` }}
                />
              ))}
            </div>
          </div>

          {/* Recent leads table */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="text-sm text-gray-400 mb-3">Recent Leads</div>
            <div className="space-y-2">
              {[
                { name: "Johnson HVAC", loc: "Atlanta, GA", score: 94, status: "Hot" },
                { name: "Prime Landscaping", loc: "Charlotte, NC", score: 87, status: "Warm" },
                { name: "Elite Plumbing", loc: "Richmond, VA", score: 91, status: "Hot" },
              ].map((lead, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                  <div>
                    <div className="text-sm text-white font-medium">{lead.name}</div>
                    <div className="text-xs text-gray-500">{lead.loc}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-cyan-400 font-mono">{lead.score}%</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${lead.status === "Hot" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}
