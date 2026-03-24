'use client';

import { LeadScrapingVisual } from "@/components/ui/lead-scraping-visual";
import { Spotlight } from "@/components/ui/spotlight";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SplineHeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      {/* Top gradient wash */}
      <div className="absolute top-0 left-0 right-0 h-[600px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse 100% 70% at 30% 0%, rgba(6, 182, 212, 0.12) 0%, transparent 60%)',
      }} />

      <Spotlight className="-top-40 left-0 md:left-40 md:-top-20" size={800} />
      
      <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0">
          
          {/* Left — 55% text column */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 lg:max-w-[55%] relative z-20"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full mb-8 liquid-border"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(15,23,42,0.8))',
                border: '1px solid rgba(6,182,212,0.15)',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
              </span>
              <span className="text-sm text-cyan-300 font-medium">Live Scraping Engine</span>
              <span className="text-xs text-cyan-500/60">v3.2</span>
            </motion.div>

            {/* Headline — Cinematic */}
            <h1 className="text-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-6">
              <span className="gradient-text-subtle block">Scale Sales</span>
              <span className="gradient-text-cyan block">On Autopilot</span>
            </h1>

            {/* Subhead */}
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mb-10 leading-relaxed font-light">
              Our AI maps business networks in real-time, identifies qualified leads, and deploys personalized outreach at scale. 
              <span className="text-cyan-400/80"> Zero manual work.</span>
            </p>

            {/* CTAs — Dual */}
            <div className="flex flex-wrap gap-4 mb-12">
              <motion.button
                onClick={() => navigate('/dashboard?tab=Campaigns')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-8 py-4 text-base rounded-xl"
              >
                Start Scraping Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
              <motion.button
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost px-8 py-4 text-base rounded-xl"
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </motion.button>
            </div>

            {/* Micro-stats row */}
            <div className="flex gap-8 text-sm">
              {[
                { value: '—', label: 'Leads Scraped' },
                { value: '—', label: 'Accuracy Rate' },
                { value: '—', label: 'DMs Delivered' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="flex flex-col"
                >
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-gray-500 text-xs mt-0.5">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — Visual (bleeds right) */}
          <motion.div 
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex-1 w-full min-h-[500px] lg:min-h-[600px] relative lg:-mr-20"
          >
            <LeadScrapingVisual className="w-full h-full" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
