import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "What types of businesses is Agent Lead designed for?",
    a: "Agent Lead is built for service-based businesses — HVAC, roofing, plumbing, landscaping, real estate, law firms, auto detailing, pet services, home healthcare, and more. We have pre-built templates for 12+ industries, and you can create custom templates for any niche.",
  },
  {
    q: "Is the scraping legal and compliant?",
    a: "Agent Lead only scrapes publicly available business data from directories, search engines, and social media profiles. However, you are responsible for ensuring your use of scraped data complies with all applicable laws in your jurisdiction, including GDPR, CCPA, CAN-SPAM, and the terms of service of any platforms you interact with. We provide tools to help with compliance, and enterprise customers can request data processing agreements.",
  },
  {
    q: "How accurate is the scraped data?",
    a: "All lead data is sourced from publicly available information and is provided on an \"as-is\" basis. While we strive for accuracy, we cannot guarantee that all data (phone numbers, emails, business details) is current or complete. Publicly available data can change at any time. We recommend verifying critical contact information before launching outreach campaigns.",
  },
  {
    q: "How does the Auto DM and Auto Comment feature work?",
    a: "Our AI generates personalized messages based on each prospect's profile, recent posts, and business needs. Messages are sent at human-like intervals to avoid platform detection. You control templates, timing, and targeting criteria. You are responsible for ensuring your outreach complies with anti-spam laws and platform terms of service.",
  },
  {
    q: "Can I integrate with my existing CRM?",
    a: "Absolutely. We offer native integrations with GoHighLevel, HubSpot, Salesforce, and Pipedrive. For other tools, use our Zapier integration or webhooks to connect with additional apps.",
  },
  {
    q: "How accurate is the AI lead qualification?",
    a: "Our AI scoring system analyzes engagement signals, business size, online activity, and custom criteria you define to prioritize leads. Accuracy varies depending on data quality and your specific criteria. We recommend using AI scores as a prioritization tool alongside your own judgment.",
  },
  {
    q: "How do I get started?",
    a: "We scope each engagement on a quick setup call, then configure your scrapers, AI qualification, and outreach for you. There's a one-time setup fee — no monthly plans to manage. Book a call or email support@agentlead.io to get started.",
  },
  {
    q: "What kind of support do you offer?",
    a: "Every engagement includes priority onboarding and support to help optimize your campaigns. Dedicated, higher-touch support is available — we'll cover exactly what you need on your setup call.",
  },
  {
    q: "Can I white-label the dashboard for my clients?",
    a: "Yes — white-label dashboards, custom branding, and multi-client management are available for agencies managing lead gen for multiple businesses. Mention it on your setup call and we'll include it in your build.",
  },
];

function FAQItem({ faq, isOpen, onClick }: { faq: typeof faqs[0]; isOpen: boolean; onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group"
    >
      <button
        onClick={onClick}
        className={`w-full text-left backdrop-blur-xl bg-white/[0.03] border rounded-2xl p-6 transition-all duration-500 ${
          isOpen
            ? "border-cyan-500/30 bg-white/[0.06] shadow-lg shadow-cyan-500/5"
            : "border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.05]"
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white pr-4">{faq.q}</h3>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="flex-shrink-0"
          >
            <ChevronDown className={`w-5 h-5 ${isOpen ? "text-cyan-400" : "text-gray-500"}`} />
          </motion.div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-gray-400 mt-4 leading-relaxed text-sm">{faq.a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 px-4 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-3xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Frequently Asked{" "}
              <span className="gradient-text-cyan">Questions</span>
            </h2>
          </motion.div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              faq={faq}
              isOpen={openIndex === i}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
