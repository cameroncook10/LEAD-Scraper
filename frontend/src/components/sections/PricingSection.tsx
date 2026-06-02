import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { BOOK_CALL_HREF, bookCallLinkProps } from "../../lib/contact";

const INCLUDED = [
  "Unlimited lead scraping — Google Maps, Yelp, Instagram & Facebook",
  "AI lead qualification & scoring",
  "Automated DM, email & SMS outreach",
  "Done-for-you scraper & campaign setup",
  "Analytics & ROI dashboard",
  "CRM-ready export (CSV, GoHighLevel, HubSpot)",
  "Priority onboarding & support",
];

export function PricingSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const getStarted = () => navigate(isAuthenticated ? "/dashboard" : "/login");

  return (
    <section id="pricing" className="relative py-28 px-6">
      <div className="relative max-w-4xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="badge-cyan mb-4 inline-block">Get Started</span>
          <h2 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">
            <span className="gradient-text-subtle">Done-for-you </span>
            <span className="gradient-text-cyan">lead generation</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
            One simple setup fee. We configure your scrapers, AI qualification, and
            outreach for your market — you get qualified leads on autopilot. No
            per-seat pricing, no monthly tiers to manage.
          </p>
        </motion.div>

        {/* Single offer card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mesh-cyan liquid-border rounded-3xl p-8 md:p-12"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-xs font-bold shadow-lg shadow-cyan-500/30 mb-5">
              <Sparkles className="w-3 h-3" />
              One-time setup
            </div>
            <span className="text-4xl md:text-5xl font-black text-white">
              Custom setup fee
            </span>
            <p className="text-gray-500 mt-3 max-w-md">
              Priced to your market and lead volume. Book a quick call and we'll
              scope it with you.
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 gap-3 mb-10 max-w-2xl mx-auto">
            {INCLUDED.map((feature, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" />
                <span className="text-gray-400 text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={getStarted}
              className="btn-primary px-8 py-4 text-base rounded-xl flex items-center justify-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href={BOOK_CALL_HREF}
              {...bookCallLinkProps}
              className="btn-ghost px-8 py-4 text-base rounded-xl flex items-center justify-center"
            >
              Book a setup call
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
