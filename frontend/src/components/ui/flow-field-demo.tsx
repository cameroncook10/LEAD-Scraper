import React from "react";
import NeuralBackground from "@/components/ui/flow-field-background";
import { ArrowRight, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative w-full min-h-screen flex items-center justify-center">
      {/* Particle background */}
      <div className="absolute inset-0 z-0">
        <NeuralBackground
          color="#22d3ee"
          trailOpacity={0.08}
          speed={0.6}
          particleCount={500}
        />
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-gray-950/40 via-transparent to-gray-950" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-gray-950/30 via-transparent to-gray-950/30" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 max-w-5xl mx-auto pt-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 text-sm font-medium">AI-Powered Lead Automation</span>
        </div>

        {/* Main headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 leading-[0.95]">
          <span className="text-white">Automate Your</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent glow-text">
            Lead Generation
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed font-light">
          Scrape leads, auto-DM prospects, auto-comment on posts, and qualify with AI — 
          all on autopilot. Built for businesses that want to dominate their market.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <button className="group flex items-center justify-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 hover:scale-105">
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-gray-700 hover:border-cyan-500/50 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:bg-gray-900/50">
            Watch Demo
          </button>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap justify-center gap-8 sm:gap-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">2,500+</div>
            <div className="text-sm text-gray-500 mt-1">Leads Per Minute</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">94%</div>
            <div className="text-sm text-gray-500 mt-1">AI Accuracy</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400">10x</div>
            <div className="text-sm text-gray-500 mt-1">ROI Average</div>
          </div>
        </div>
      </div>
    </div>
  );
}
