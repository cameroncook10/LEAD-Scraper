import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { createStripeCheckout } from "../../services/api";

const plans = [
  {
    name: "Starter",
    key: "starter",
    monthlyPrice: "$497",
    annualPrice: "$397",
    period: "/month",
    description: "For solo contractors & small businesses getting started with automation.",
    featured: false,
    cta: "Buy Now",
    mesh: "mesh-blue",
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
    key: "growth",
    monthlyPrice: "$2,000",
    annualPrice: "$1,600",
    period: "/month",
    description: "For growing businesses ready to scale outreach and dominate their market.",
    featured: true,
    cta: "Buy Now",
    badge: "Most Popular",
    mesh: "mesh-cyan",
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
    key: "enterprise",
    monthlyPrice: "Custom",
    annualPrice: "Custom",
    period: "",
    description: "For agencies & large organizations managing multiple client accounts.",
    featured: false,
    cta: "Contact Sales",
    mesh: "mesh-violet",
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
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleCheckout = async (plan: typeof plans[0]) => {
    if (plan.key === "enterprise") {
      window.location.href = "mailto:sales@agentlead.io?subject=Enterprise%20Plan%20Inquiry";
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      alert("Payment system is not configured yet. Please contact support@agentlead.io.");
      return;
    }

    setLoadingPlan(plan.key);
    try {
      const planKey = isAnnual ? `${plan.key}_annual` : plan.key;

      const res = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ plan: planKey }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Checkout failed (${res.status}): ${text}`);
      }

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No checkout URL returned');
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      alert(err.message || "Unable to start checkout. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section id="pricing" className="relative py-28 px-6">
      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="badge-cyan mb-4 inline-block">Pricing</span>
          <h2 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">
            <span className="gradient-text-subtle">Simple, Transparent </span>
            <span className="gradient-text-cyan">Pricing</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
            Choose the plan that fits your business. Cancel anytime.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-4 mb-14">
          <span className={`text-sm font-medium transition-colors ${!isAnnual ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 rounded-full transition-colors duration-300"
            style={{
              background: isAnnual
                ? 'linear-gradient(135deg, rgba(6,182,212,0.6), rgba(59,130,246,0.6))'
                : 'rgba(255,255,255,0.1)',
            }}
          >
            <motion.div
              animate={{ x: isAnnual ? 26 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${isAnnual ? 'text-white' : 'text-gray-500'}`}>
            Annual
            <span className="ml-1.5 text-xs text-emerald-400 font-bold">Save 20%</span>
          </span>
        </div>

        {/* Pricing grid */}
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
              className={`relative rounded-2xl p-7 transition-all duration-500 ${
                plan.featured
                  ? `${plan.mesh} liquid-border md:scale-[1.03] md:-my-3`
                  : `${plan.mesh} border border-white/[0.04]`
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-xs font-bold shadow-lg shadow-cyan-500/30 animate-glow">
                    <Sparkles className="w-3 h-3" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <h3 className="text-xl font-bold text-white mb-1.5">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-5">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-black text-white">
                  {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-gray-500 text-base">{plan.period}</span>
              </div>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan === plan.key}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-300 mb-7 flex items-center justify-center gap-2 ${
                  plan.featured
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/[0.06] hover:border-white/[0.12]"
                } ${loadingPlan === plan.key ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {loadingPlan === plan.key ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to checkout...
                  </>
                ) : (
                  plan.cta
                )}
              </button>

              {plan.key !== "enterprise" && (
                <p className="text-center text-xs text-gray-600 -mt-4 mb-5">
                  Cancel anytime • Instant access after purchase
                </p>
              )}

              <ul className="space-y-2.5">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.featured ? "text-cyan-400" : "text-gray-600"}`} />
                    <span className="text-gray-400 text-sm">{feature}</span>
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
