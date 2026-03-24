import React from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Shango Roofing",
    title: "Richmond, Virginia",
    quote: "Agent Lead completely changed how we find homeowners who need roof repairs. We went from cold-calling to having qualified leads delivered straight to our inbox daily. Worth every penny.",
    rating: 5,
    initials: "SR",
    color: "from-cyan-500 to-blue-500",
  },
  {
    name: "Marcus Rivera",
    title: "Marketing Agency Owner",
    quote: "The auto-DM feature alone pays for itself. We're booking 3x more discovery calls and our clients are thrilled with the lead quality.",
    rating: 5,
    initials: "MR",
    color: "from-violet-500 to-purple-500",
  },
  {
    name: "Jennifer Walsh",
    title: "Real Estate Broker, Dallas",
    quote: "The AI qualification is insanely accurate. It knows which leads are ready to list before they even realize it themselves. Game changer for our team.",
    rating: 5,
    initials: "JW",
    color: "from-blue-500 to-cyan-500",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="badge-cyan mb-4 inline-block">Testimonials</span>
          <h2 className="text-display text-4xl md:text-5xl lg:text-6xl mb-4">
            <span className="gradient-text-subtle">What </span>
            <span className="gradient-text-cyan">Users Say</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto font-light">
            Hear from early adopters using Agent Lead to grow their pipeline.
          </p>
        </motion.div>

        {/* Testimonial cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
              className="glass-liquid rounded-2xl p-7 group hover:border-white/[0.08] transition-all duration-500 relative"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-white/[0.04] absolute top-6 right-6" />

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-5">
                {[...Array(t.rating)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
                ))}
              </div>

              <p className="text-gray-300 mb-7 leading-relaxed text-sm">"{t.quote}"</p>

              {/* Avatar + name */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
