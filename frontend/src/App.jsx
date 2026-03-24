import React, { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CursorFollower from './components/ui/cursor-follower';
import { GlobalBackground } from './components/ui/GlobalBackground';
import { SplineHeroSection } from './components/sections/SplineHeroSection';
import { ScrollDashboardDemo } from './components/sections/ScrollDashboardDemo';
import { NavigationDock } from './components/sections/NavigationDock';
import { SocialProofBar } from './components/sections/SocialProofBar';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { DashboardSection } from './components/sections/DashboardSection';
import { IndustriesSection } from './components/sections/IndustriesSection';
import { HowItWorksSection } from './components/sections/HowItWorksSection';
import { IntegrationsSection } from './components/sections/IntegrationsSection';
import { PricingSection } from './components/sections/PricingSection';
import { TestimonialsSection } from './components/sections/TestimonialsSection';
import { FAQSection } from './components/sections/FAQSection';
import { CTASection } from './components/sections/CTASection';
import { Footer } from './components/sections/Footer';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden relative noise-overlay">
      <GlobalBackground />
      <CursorFollower />

      <div className="relative z-10">
        <GlassNavigation mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />

        <main>
          <SplineHeroSection />
          <SocialProofBar />
          <ScrollDashboardDemo />
          <DashboardSection />
          <FeaturesSection />
          <IndustriesSection />
          <HowItWorksSection />
          <IntegrationsSection />
          <PricingSection />
          <TestimonialsSection />
          <FAQSection />
          <CTASection />
        </main>

        <Footer />
        <NavigationDock />
      </div>
    </div>
  );
}

const NAV_ITEMS = ["Features", "Industries", "How It Works", "Pricing", "FAQ"];

function GlassNavigation({ mobileMenuOpen, setMobileMenuOpen }) {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  // Hide on scroll down, show on scroll up
  useMotionValueEvent(scrollY, "change", (latest) => {
    const direction = latest > lastScrollY.current ? "down" : "up";
    if (direction === "down" && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastScrollY.current = latest;
  });

  // Scroll progress bar
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: hidden ? -120 : 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 30 }}
      className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-3"
    >
      <div className="max-w-7xl mx-auto">
        <div className="relative glass-nav rounded-2xl px-6 py-3 overflow-hidden">
          
          {/* Scroll progress bar */}
          <motion.div
            className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"
            style={{ width: progressWidth }}
          />

          <div className="flex items-center justify-between relative z-10">
            {/* Logo */}
            <a href="#" className="flex items-center gap-2.5">
              <motion.div
                className="w-9 h-9 rounded-lg overflow-hidden flex items-center justify-center"
                whileHover={{ scale: 1.08 }}
              >
                <img src="/logo.png" alt="Agent Lead" className="w-9 h-9 object-contain" />
              </motion.div>
              <span className="font-bold text-base tracking-tight">
                <span className="text-white">Agent</span>
                <span className="text-cyan-400">Lead</span>
              </span>
            </a>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-7">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                  className="text-[13px] text-gray-400 hover:text-white transition-colors duration-200 relative group font-medium"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </div>

            {/* CTA */}
            <motion.button
              onClick={() => navigate('/dashboard')}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="hidden md:flex items-center gap-2 bg-white text-gray-950 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
              <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-2 glass-nav rounded-2xl px-6 py-5 space-y-3"
          >
            {NAV_ITEMS.map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block text-gray-300 hover:text-white transition-colors py-1.5 text-sm"
              >
                {item}
              </a>
            ))}
            <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-gray-950 px-5 py-2.5 rounded-lg font-semibold text-sm">
              Get Started
            </button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}

export default App;
