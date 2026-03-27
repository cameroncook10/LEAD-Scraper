"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export function ScrollDashboardDemo() {
  return (
    <div className="flex flex-col overflow-hidden bg-black py-20">
      <ContainerScroll
        titleComponent={
          <>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Unleash the power of <br />
              <span className="text-5xl md:text-[6rem] font-black mt-2 leading-none bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent bg-300% animate-shimmer">
                Automated Scraping
              </span>
            </h2>
            <p className="text-gray-400 text-xl font-light max-w-2xl mx-auto mb-8">
              Watch your pipeline fill up in real-time as our AI agents scrape, qualify, and engage leads on autopilot.
            </p>
          </>
        }
      >
        <div className="w-full h-full relative group rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black border border-white/[0.06]">
          {/* CSS mockup dashboard */}
          <div className="absolute inset-0 p-6 flex flex-col">
            {/* Top bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500" />
                <div className="h-3 w-24 bg-white/10 rounded-full" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-16 bg-white/10 rounded-full" />
                <div className="h-3 w-16 bg-white/10 rounded-full" />
                <div className="h-8 w-8 rounded-full bg-white/10" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Leads", value: "12,847", color: "from-cyan-500/20 to-cyan-500/5", accent: "text-cyan-400" },
                { label: "Qualified", value: "8,234", color: "from-emerald-500/20 to-emerald-500/5", accent: "text-emerald-400" },
                { label: "Messages Sent", value: "4,521", color: "from-blue-500/20 to-blue-500/5", accent: "text-blue-400" },
                { label: "Response Rate", value: "34.2%", color: "from-violet-500/20 to-violet-500/5", accent: "text-violet-400" },
              ].map((stat) => (
                <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.color} border border-white/[0.06] p-4`}>
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
                  <div className={`text-xl font-bold ${stat.accent}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="flex-1 flex gap-4">
              <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="text-xs text-gray-500 mb-3">Leads Over Time</div>
                <div className="flex items-end gap-1.5 h-[60%]">
                  {[35, 45, 38, 55, 48, 62, 58, 72, 65, 78, 82, 75, 88, 92, 85, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-cyan-500/10 transition-all duration-500 group-hover:from-cyan-500/60 group-hover:to-cyan-500/20"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* Side panel */}
              <div className="w-48 rounded-xl bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="text-xs text-gray-500 mb-3">Recent Leads</div>
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="h-2 bg-white/10 rounded-full w-full mb-1" />
                        <div className="h-1.5 bg-white/5 rounded-full w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none rounded-2xl" />

          {/* Floating stat card */}
          <div className="absolute top-8 left-8 backdrop-blur-md bg-black/60 border border-cyan-500/30 p-4 rounded-xl shadow-lg shadow-cyan-500/20">
            <div className="text-xs text-cyan-400 uppercase tracking-widest font-semibold mb-1">Live Scraping</div>
            <div className="text-3xl font-black text-white">+1,248</div>
            <div className="text-sm text-gray-400">Leads this hour</div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}
