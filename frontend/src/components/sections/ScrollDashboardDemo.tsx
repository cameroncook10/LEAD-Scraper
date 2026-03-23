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
        <div className="w-full h-full relative group">
          {/* We'll use a placeholder that looks like a beautiful dashboard since we don't have the actual dashboard image yet, but it's loaded from a reliable unsplash coding/dashboard image that matches the dark theme */}
          <img
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2000"
            alt="Dashboard Preview"
            className="w-full h-full object-cover rounded-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-500"
            draggable={false}
          />
          {/* Overlay gradient to match theme */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-cyan-900/20 to-transparent pointer-events-none rounded-2xl mix-blend-overlay"></div>
          
          {/* Floating UI elements to make it look like our app */}
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
