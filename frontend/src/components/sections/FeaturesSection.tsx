import React from "react";
import { motion } from "framer-motion";
import { Globe, MessageSquare, MessageCircle, Brain, RefreshCw, BarChart3, Check } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Web Scraping Engine",
    description: "Extract business leads from any public source at scale. Google Maps, Yelp, LinkedIn — we scrape them all.",
    mesh: "mesh-cyan",
    accent: "from-cyan-500 to-blue-500",
    accentDot: "bg-cyan-400",
    bullets: ["High-speed extraction", "Multi-source extraction", "Auto rate-limiting"],
    span: "bento-2x", // wide card
  },
  {
    icon: MessageSquare,
    title: "Auto DM Outreach",
    description: "Automatically send personalized direct messages across Instagram, Facebook, and LinkedIn.",
    mesh: "mesh-violet",
    accent: "from-violet-500 to-purple-500",
    accentDot: "bg-violet-400",
    bullets: ["AI-personalized messages", "Smart scheduling", "Reply tracking"],
    span: "", // normal card
  },
  {
    icon: MessageCircle,
    title: "Auto Comment Engine",
    description: "Engage prospects by auto-commenting on their posts with relevant, AI-generated responses.",
    mesh: "mesh-blue",
    accent: "from-blue-500 to-cyan-500",
    accentDot: "bg-blue-400",
    bullets: ["Context-aware comments", "Natural language AI", "Platform-safe pacing"],
    span: "", // normal card
  },
  {
    icon: Brain,
    title: "AI Lead Qualification",
    description: "Score every lead with machine learning. Know exactly who's ready to buy before you reach out.",
    mesh: "mesh-emerald",
    accent: "from-emerald-500 to-green-500",
    accentDot: "bg-emerald-400",
    bullets: ["94% scoring accuracy", "Custom criteria", "Real-time ranking"],
    span: "", // normal card
  },
  {
    icon: RefreshCw,
    title: "CRM Sync",
    description: "Push qualified leads directly to your CRM. Salesforce, HubSpot, GoHighLevel — all supported.",
    mesh: "mesh-cyan",
    accent: "from-cyan-500 to-teal-500",
    accentDot: "bg-teal-400",
    bullets: ["One-click integration", "Two-way sync", "Zero data loss"],
    span: "bento-2x", // wide card
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track campaign performance, conversion rates, and ROI in real-time with beautiful dashboards.",
    mesh: "mesh-blue",
    accent: "from-blue-500 to-indigo-500",
    accentDot: "bg-indigo-400",
    bullets: ["Live metrics", "A/B testing", "Custom reports"],
    span: "", // normal card — fills remaining space
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-28 px-6 relative">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <span className="badge-cyan mb-4 inline-block">Features</span>
          <h2 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">
            <span className="gradient-text-subtle">Everything to </span>
            <span className="gradient-text-cyan">Dominate</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-xl font-light">
            Six powerful tools, one automated pipeline. No manual work.
          </p>
        </motion.div>

        {/* Bento grid */}
        <div className="bento-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                className={`group relative ${feature.span}`}
              >
                <div className={`${feature.mesh} border border-white/[0.04] rounded-2xl p-7 h-full hover:border-white/[0.08] transition-all duration-500 relative overflow-hidden`}>

                  {/* Top row: icon + title */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-1">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>

                  {/* Bullets */}
                  <ul className="space-y-2 ml-14">
                    {feature.bullets.map((item, j) => (
                      <li key={j} className="flex items-center gap-2.5 text-sm text-gray-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${feature.accentDot} flex-shrink-0`} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Hover glow — subtle */}
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                    style={{ background: `radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
