import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
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
      {/* Static global background — no animation */}
      <GlobalBackground />

      {/* Content */}
      <div className="relative z-10">
        <GlassNavigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
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
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-950/90 border border-gray-800 rounded-2xl px-6 py-3 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg overflow-hidden">
                <img src="/logo.png" alt="Agent Lead" className="w-10 h-10 object-contain" />
              </div>
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
                  className="text-sm text-gray-300 hover:text-cyan-400 transition-colors duration-150"
                >
                  {item}
                </a>
              ))}
            </div>

            {/* CTA */}
            <button className="hidden md:block bg-cyan-500 hover:bg-cyan-400 text-gray-950 px-6 py-2 rounded-lg text-sm font-medium transition-colors duration-150">
              Get Started
            </button>

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
          <div className="md:hidden mt-2 bg-gray-950/95 border border-gray-800 rounded-2xl px-6 py-6 space-y-4">
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
            <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-gray-950 px-5 py-3 rounded-lg font-semibold transition-colors">
              Get Started
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default App;
