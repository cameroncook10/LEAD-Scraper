"use client";
import React from "react";
import { motion } from "framer-motion";
import { LampContainer } from "@/components/ui/lamp";
import { ArrowRight } from "lucide-react";

export function LampCTA() {
  return (
    <LampContainer>
      <motion.div
        initial={{ opacity: 0.5, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="flex flex-col items-center"
      >
        <h2 className="mt-8 bg-gradient-to-br from-cyan-300 to-blue-400 py-4 bg-clip-text text-center text-4xl font-bold tracking-tight text-transparent md:text-7xl">
          Ready to Scale<br />Your Outreach?
        </h2>
        <p className="text-gray-400 text-lg md:text-xl mt-4 max-w-xl text-center font-light">
          Join hundreds of businesses automating their lead generation with Agent Lead.
        </p>
        <button className="mt-8 group flex items-center gap-2 px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-gray-950 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25">
          Get Started Now
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </LampContainer>
  );
}
