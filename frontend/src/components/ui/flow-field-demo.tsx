import React from "react";
import NeuralBackground from "@/components/ui/flow-field-background";
import { ArrowRight, Sparkles } from "lucide-react";

export function NeuralHeroDemo() {
  return (
    // Container must have a defined height, or use h-screen
    <div className="relative w-full h-[600px]">
      <div className="absolute inset-0 z-0">
        <NeuralBackground 
              color="#818cf8" // Indigo-400
              trailOpacity={0.1} // Lower = longer trails
              speed={0.8}
          />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-white pointer-events-none">
        <h1 className="text-4xl md:text-6xl font-bold mb-4 font-sans tracking-tight">
          Neural Intelligence
        </h1>
        <p className="text-lg md:text-xl text-indigo-200 mb-8 max-w-lg text-center font-light">
          Experience the flow of data mapping paths to new discoveries.
        </p>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors rounded-full font-medium pointer-events-auto">
          <Sparkles className="w-5 h-5" />
          Get Started
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </div>
    </div>
  );
}
