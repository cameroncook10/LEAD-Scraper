import React, { useState, useEffect } from 'react';
import { Zap, Menu, X } from 'lucide-react';
import CursorFollower from './components/ui/cursor-follower';
import { HeroSection } from './components/ui/flow-field-demo';
import { HeroScrollSection } from './components/sections/HeroScrollSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { HowItWorksSection } from './components/sections/HowItWorksSection';
import { PricingSection } from './components/sections/PricingSection';
import { TestimonialsSection } from './components/sections/TestimonialsSection';
import { LampCTA } from './components/ui/lamp-demo';
import { Footer } from './components/sections/Footer';

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden">
      {/* Global cursor follower */}
      <CursorFollower />

      {/* Navigation - transparent, becomes solid on scroll */}
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-gray-950/90 backdrop-blur-xl border-b border-gray-800/50 shadow-lg shadow-black/20'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Agent Lead
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">How It Works</a>
              <a href="#pricing" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">Pricing</a>
              <button className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-lg font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25">
                Get Started
              </button>
            </nav>

            {/* Mobile menu toggle */}
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
          <div className="md:hidden bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 px-4 py-6 space-y-4">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 transition-colors py-2">Features</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 transition-colors py-2">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-cyan-400 transition-colors py-2">Pricing</a>
            <button className="w-full px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-lg font-semibold transition-all">
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Main content — single-page marketing site */}
      <main>
        {/* Hero with particle background */}
        <HeroSection />

        {/* Dashboard showcase with scroll animation */}
        <HeroScrollSection />

        {/* Features grid */}
        <FeaturesSection />

        {/* How it works */}
        <HowItWorksSection />

        {/* Pricing */}
        <PricingSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Lamp CTA */}
        <LampCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
