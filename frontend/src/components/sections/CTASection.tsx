import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CTASection() {
  const navigate = useNavigate();
  return (
    <section className="py-28 px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative">
        {/* Background glow — static, not animated */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(6,182,212,0.1) 0%, transparent 60%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-liquid liquid-border rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
        >
          {/* Mesh overlay */}
          <div className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at 30% 20%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(139,92,246,0.04) 0%, transparent 50%)',
            }}
          />
          
          <div className="relative z-10">
            <h2 className="text-display text-4xl md:text-5xl lg:text-6xl mb-6">
              <span className="gradient-text-subtle">Ready to Scale </span>
              <span className="gradient-text-cyan">Your Outreach?</span>
            </h2>

            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto font-light">
              Start automating your lead generation with Agent Lead.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={() => navigate('/dashboard')}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-10 py-4 text-base rounded-xl"
              >
                Get Started Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </motion.button>
            </div>

            <p className="mt-6 text-xs text-gray-600">
              No credit card required • Free 14-day trial
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
