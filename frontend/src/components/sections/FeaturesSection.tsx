import React from "react";
import { motion } from "framer-motion";
import {
  Globe,
  MessageCircle,
  MessageSquare,
  Brain,
  RefreshCw,
  BarChart3,
  Check,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    title: "Web Scraping Engine",
    description: "Extract business leads from any public source at scale. Google Maps, Yelp, LinkedIn — we scrape them all.",
    bullets: ["2,500+ leads per minute", "Multi-source extraction", "Auto rate-limiting"],
    color: "cyan",
  },
  {
    icon: MessageCircle,
    title: "Auto DM Outreach",
    description: "Automatically send personalized direct messages to prospects across Instagram, Facebook, and LinkedIn.",
    bullets: ["AI-personalized messages", "Smart scheduling", "Reply tracking"],
    color: "blue",
  },
  {
    icon: MessageSquare,
    title: "Auto Comment",
    description: "Engage prospects by automatically commenting on their posts with relevant, AI-generated responses.",
    bullets: ["Context-aware comments", "Natural language AI", "Platform-safe pacing"],
    color: "indigo",
  },
  {
    icon: Brain,
    title: "AI Lead Qualification",
    description: "Score and prioritize every lead with machine learning. Know exactly who's ready to buy.",
    bullets: ["94% scoring accuracy", "Custom criteria", "Real-time ranking"],
    color: "purple",
  },
  {
    icon: RefreshCw,
    title: "CRM Sync",
    description: "Push qualified leads directly to your CRM. Salesforce, HubSpot, GoHighLevel — all supported.",
    bullets: ["One-click integration", "Two-way sync", "Zero data loss"],
    color: "emerald",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track campaign performance, conversion rates, and ROI in real-time with beautiful dashboards.",
    bullets: ["Live metrics", "A/B testing", "Custom reports"],
    color: "amber",
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  cyan:    { bg: "bg-cyan-500/10",    border: "hover:border-cyan-500/40",    text: "text-cyan-400",    icon: "group-hover:bg-cyan-500/20" },
  blue:    { bg: "bg-blue-500/10",    border: "hover:border-blue-500/40",    text: "text-blue-400",    icon: "group-hover:bg-blue-500/20" },
  indigo:  { bg: "bg-indigo-500/10",  border: "hover:border-indigo-500/40",  text: "text-indigo-400",  icon: "group-hover:bg-indigo-500/20" },
  purple:  { bg: "bg-purple-500/10",  border: "hover:border-purple-500/40",  text: "text-purple-400",  icon: "group-hover:bg-purple-500/20" },
  emerald: { bg: "bg-emerald-500/10", border: "hover:border-emerald-500/40", text: "text-emerald-400", icon: "group-hover:bg-emerald-500/20" },
  amber:   { bg: "bg-amber-500/10",   border: "hover:border-amber-500/40",   text: "text-amber-400",   icon: "group-hover:bg-amber-500/20" },
};

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">Features</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to{" "}
              <span className="gradient-text-cyan">Dominate</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              From scraping to outreach to analytics — Agent Lead handles the entire pipeline.
            </p>
          </motion.div>
        </div>

        {/* Feature grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => {
            const colors = colorMap[feature.color];
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`group relative rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-8 transition-all duration-500 hover:bg-gray-900/80 ${colors.border}`}
              >
                {/* Icon */}
                <div className={`${colors.bg} ${colors.icon} w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300`}>
                  <Icon className={`w-7 h-7 ${colors.text}`} />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>

                <ul className="space-y-2">
                  {feature.bullets.map((bullet, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
