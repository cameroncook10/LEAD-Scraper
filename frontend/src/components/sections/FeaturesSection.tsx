import React from "react";
import { motion } from "framer-motion";
import { Globe, MessageSquare, MessageCircle, Brain, RefreshCw, BarChart3, Check } from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Web Scraping Engine",
    description: "Extract business leads from any public source at scale. Google Maps, Yelp, LinkedIn — we scrape them all.",
    color: "from-cyan-500 to-blue-500",
    bullets: ["2,500+ leads per minute", "Multi-source extraction", "Auto rate-limiting"],
  },
  {
    icon: MessageSquare,
    title: "Auto DM Outreach",
    description: "Automatically send personalized direct messages to prospects across Instagram, Facebook, and LinkedIn.",
    color: "from-purple-500 to-pink-500",
    bullets: ["AI-personalized messages", "Smart scheduling", "Reply tracking"],
  },
  {
    icon: MessageCircle,
    title: "Auto Comment",
    description: "Engage prospects by automatically commenting on their posts with relevant, AI-generated responses.",
    color: "from-blue-500 to-cyan-500",
    bullets: ["Context-aware comments", "Natural language AI", "Platform-safe pacing"],
  },
  {
    icon: Brain,
    title: "AI Lead Qualification",
    description: "Score and prioritize every lead with machine learning. Know exactly who's ready to buy.",
    color: "from-violet-500 to-purple-500",
    bullets: ["94% scoring accuracy", "Custom criteria", "Real-time ranking"],
  },
  {
    icon: RefreshCw,
    title: "CRM Sync",
    description: "Push qualified leads directly to your CRM. Salesforce, HubSpot, GoHighLevel — all supported.",
    color: "from-green-500 to-emerald-500",
    bullets: ["One-click integration", "Two-way sync", "Zero data loss"],
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track campaign performance, conversion rates, and ROI in real-time with beautiful dashboards.",
    color: "from-amber-500 to-orange-500",
    bullets: ["Live metrics", "A/B testing", "Custom reports"],
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-6 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl bg-cyan-500/10 border border-cyan-500/20 mb-6">
            <span className="text-sm text-cyan-300">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Dominate
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Six powerful tools working together to automate your entire lead generation pipeline.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8 }}
                className="group relative"
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" />

                <div className="backdrop-blur-xl bg-black/40 border border-cyan-500/20 rounded-2xl p-6 h-full hover:border-cyan-500/40 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/20 relative overflow-hidden">
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                    initial={{ x: -200 }}
                    whileHover={{ x: 200 }}
                    transition={{ duration: 0.6 }}
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(6, 182, 212, 0.1), transparent)",
                    }}
                  />

                  <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg relative z-10`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>

                  <h3 className="text-xl font-semibold mb-3 text-white relative z-10">{feature.title}</h3>
                  <p className="text-gray-400 mb-4 text-sm leading-relaxed relative z-10">{feature.description}</p>

                  <ul className="space-y-2 relative z-10">
                    {feature.bullets.map((item, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                        <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
