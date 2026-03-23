import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Menu, X } from 'lucide-react';
import CursorFollower from './components/ui/cursor-follower';
import { GlobalBackground } from './components/ui/GlobalBackground';
import { HeroSection } from './components/ui/flow-field-demo';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { HowItWorksSection } from './components/sections/HowItWorksSection';
import { DashboardSection } from './components/sections/DashboardSection';
import { PricingSection } from './components/sections/PricingSection';
import { TestimonialsSection } from './components/sections/TestimonialsSection';
import { CTASection } from './components/sections/CTASection';
import { Footer } from './components/sections/Footer';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* Fixed global background with pulsing glows + geometric shapes */}
      <GlobalBackground />

      {/* Global cursor follower */}
      <CursorFollower />

      {/* Foreground content */}
      <div className="relative z-10">
        {/* Glass Navigation */}
        <GlassNavigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        {/* Main content */}
        <main>
          <HeroSection />
          <DashboardSection />
          <FeaturesSection />
          <HowItWorksSection />
          <PricingSection />
          <TestimonialsSection />
          <CTASection />
        </main>

        <Footer />
      </div>
    </div>
  );
}

function GlassNavigation({ mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative backdrop-blur-xl bg-black/40 border border-cyan-500/20 rounded-2xl px-6 py-3 shadow-2xl shadow-cyan-500/10 overflow-hidden">
          {/* Animated flowing gradient inside nav */}
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{ background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.25), transparent)" }}
            animate={{ x: [-200, 1200] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />

          {/* Content */}
          <div className="flex items-center justify-between relative z-10">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <motion.div
                className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.3 }}
              >
                <img src="/logo.png" alt="Agent Lead" className="w-10 h-10 object-contain" />
              </motion.div>
              <span className="font-semibold text-lg bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                Agent Lead
              </span>
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How It Works", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-sm text-gray-300 hover:text-cyan-400 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-400 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:block relative bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-500/30 overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: [-100, 200] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
              />
              <span className="relative z-10">Get Started</span>
            </motion.button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 backdrop-blur-xl bg-black/80 border border-cyan-500/20 rounded-2xl px-6 py-6 space-y-4"
          >
            {["Features", "How It Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-cyan-400 transition-colors py-2"
              >
                {item}
              </a>
            ))}
            <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 px-5 py-3 rounded-lg font-semibold transition-all">
              Get Started
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

export default App;
