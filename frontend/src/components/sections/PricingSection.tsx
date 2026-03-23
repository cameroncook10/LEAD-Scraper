import React from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$497",
    period: "/month",
    description: "For solo contractors & small businesses getting started with automation.",
    featured: false,
    cta: "Start Free Trial",
    features: [
      "5,000 leads per month",
      "Auto DM — 500 messages/mo",
      "Auto Comment — 1,000/mo",
      "AI lead qualification",
      "Basic analytics dashboard",
      "Email support",
      "CSV export",
    ],
  },
  {
    name: "Growth",
    price: "$2,000",
    period: "/month",
    description: "For growing businesses ready to scale outreach and dominate their market.",
    featured: true,
    cta: "Get Started",
    badge: "Most Popular",
    features: [
      "Unlimited lead scraping",
      "Auto DM — Unlimited messages",
      "Auto Comment — Unlimited",
      "AI lead qualification + scoring",
      "Advanced analytics & A/B testing",
      "CRM integration (GoHighLevel, HubSpot)",
      "Priority support — 15 min SLA",
      "Custom outreach templates",
      "Dedicated account manager",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For agencies & large organizations managing multiple client accounts.",
    featured: false,
    cta: "Contact Sales",
    features: [
      "Everything in Growth",
      "Multi-client management",
      "White-label dashboards",
      "Custom API integrations",
      "SSO & advanced security",
      "SLA guarantee — 99.9% uptime",
      "Dedicated success team",
      "Custom AI model training",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      {/* Subtle radial glow — no blur */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none opacity-[0.03]" style={{ background: "radial-gradient(circle, #22d3ee, transparent 70%)" }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Simple, Transparent{" "}
              <span className="gradient-text-cyan">Pricing</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              No hidden fees. No contracts. Cancel anytime.
            </p>
          </motion.div>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-8 transition-all duration-500 ${
                plan.featured
                  ? "bg-gradient-to-b from-cyan-950/50 to-gray-900 border-2 border-cyan-500/40 shadow-xl shadow-cyan-500/10 md:scale-105 md:-my-4"
                  : "bg-gray-900/50 border border-gray-800 hover:border-gray-700"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-cyan-500 text-gray-950 rounded-full text-sm font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-5xl font-black text-white">{plan.price}</span>
                <span className="text-gray-400 text-lg">{plan.period}</span>
              </div>

              <button
                className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all duration-300 mb-8 ${
                  plan.featured
                    ? "bg-cyan-500 hover:bg-cyan-400 text-gray-950 hover:shadow-lg hover:shadow-cyan-500/25"
                    : "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700 hover:border-cyan-500/30"
                }`}
              >
                {plan.cta}
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.featured ? "text-cyan-400" : "text-gray-500"}`} />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
