import React from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Shango Roofing",
    title: "Richmond, Virginia",
    quote: "Agent Lead completely changed how we find homeowners who need roof repairs. We went from cold-calling to having qualified leads delivered straight to our inbox daily. Worth every penny.",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    title: "Marketing Agency Owner",
    quote: "The auto-DM feature alone pays for itself. We're booking 3x more discovery calls and our clients are thrilled with the lead quality.",
    rating: 5,
  },
  {
    name: "Jennifer Walsh",
    title: "Real Estate Broker, Dallas",
    quote: "The AI qualification is insanely accurate. It knows which leads are ready to list before they even realize it themselves. Game changer for our team.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="badge-cyan mb-4 inline-block">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Trusted by{" "}
              <span className="gradient-text-cyan">Industry Leaders</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
              Businesses generating 10x more qualified leads with Agent Lead.
            </p>
          </motion.div>
        </div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              viewport={{ once: true }}
              className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur-sm p-8 hover:border-cyan-500/20 transition-all duration-500"
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-4">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-5 h-5 fill-cyan-400 text-cyan-400" />
                ))}
              </div>

              <p className="text-gray-300 mb-6 leading-relaxed italic">"{t.quote}"</p>

              <div>
                <p className="font-bold text-white">{t.name}</p>
                <p className="text-sm text-gray-500">{t.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
