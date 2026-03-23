'use client';
import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { DatabaseZap, Mail, UserSearch, Target, Sparkles, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Node {
  id: number;
  x: number;
  y: number;
  type: 'business' | 'lead' | 'converted';
  delay: number;
}

export function LeadScrapingVisual({ className }: { className?: string }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [packets, setPackets] = useState<{id: number, from: Node, to: {x: number, y: number}}[]>([]);

  // Generate an isometric grid of nodes
  useEffect(() => {
    const newNodes: Node[] = [];
    let id = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        newNodes.push({
          id: id++,
          x: col * 60 + (row % 2) * 30, // staggered
          y: row * 50,
          type: Math.random() > 0.8 ? 'business' : 'lead',
          delay: Math.random() * 2,
        });
      }
    }
    setNodes(newNodes);

    // Simulate "Auto DM" packets flying from the center to nodes
    const interval = setInterval(() => {
      const targetNode = newNodes[Math.floor(Math.random() * newNodes.length)];
      setPackets(prev => [
        ...prev.slice(-10), // keep last 10
        { id: Date.now(), from: { x: 150, y: 100, id: 999, type: 'business', delay: 0 }, to: targetNode }
      ]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center perspective-[2000px]", className)}>
      
      {/* 3D Container */}
      <motion.div 
        initial={{ rotateX: 60, rotateZ: -45, scale: 0.8 }}
        animate={{ rotateZ: [-45, -40, -45] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] preserve-3d"
      >
        {/* Base Grid Plane */}
        <div className="absolute inset-0 bg-cyan-900/10 border border-cyan-500/20 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.1)] backdrop-blur-3xl overflow-hidden">
            {/* Animated Scanner Wave */}
            <motion.div 
              animate={{ top: ['-20%', '120%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent border-b border-cyan-400/50"
            />
        </div>

        {/* Central AI Engine Hub */}
        <motion.div 
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-black/80 border border-cyan-400 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.4)] z-50 backdrop-blur-xl"
          animate={{ z: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformStyle: 'preserve-3d', transform: 'translateZ(40px)' }}
        >
          <DatabaseZap className="w-10 h-10 text-cyan-400" />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-10px] border border-cyan-500/30 rounded-full border-t-cyan-400"
          />
        </motion.div>

        {/* Nodes and Links */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1, z: [0, 10, 0] }}
            transition={{ 
              opacity: { duration: 0.5, delay: node.delay },
              scale: { duration: 0.5, delay: node.delay, type: 'spring' },
              z: { duration: 3, repeat: Infinity, delay: node.delay, ease: "easeInOut" }
            }}
            className={cn(
              "absolute w-8 h-8 -ml-4 -mt-4 rounded-xl border flex items-center justify-center backdrop-blur-md shadow-lg transition-colors duration-500",
              node.type === 'business' 
                ? "bg-blue-900/40 border-blue-400/50 shadow-blue-500/20" 
                : "bg-cyan-900/40 border-cyan-400/50 shadow-cyan-500/20"
            )}
            style={{ 
              left: `${(node.x / 240) * 100}%`, 
              top: `${(node.y / 200) * 100}%`,
              transformStyle: 'preserve-3d'
            }}
          >
            {node.type === 'business' ? <Building2 className="w-4 h-4 text-blue-300" /> : <UserSearch className="w-4 h-4 text-cyan-300" />}
          </motion.div>
        ))}

        {/* Flying Packets (Auto DMs) */}
        {packets.map(packet => (
            <motion.div
                key={packet.id}
                initial={{ 
                    left: '50%', 
                    top: '50%', 
                    opacity: 1, 
                    scale: 0.5,
                    z: 20
                }}
                animate={{ 
                    left: `${(packet.to.x / 240) * 100}%`, 
                    top: `${(packet.to.y / 200) * 100}%`,
                    opacity: [1, 1, 0],
                    scale: [0.5, 1, 1.5],
                    z: 0
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute w-6 h-6 -ml-3 -mt-3 bg-cyan-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)]"
                style={{ transformStyle: 'preserve-3d' }}
            >
                <Mail className="w-3 h-3 text-black" />
            </motion.div>
        ))}
      </motion.div>

      {/* Floating Status Cards */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1 }}
        className="absolute top-10 right-0 md:right-10 bg-black/60 backdrop-blur-xl border border-cyan-500/30 p-4 rounded-xl shadow-xl z-50 pointer-events-none"
      >
        <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
            <span className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Live Scraping Matrix</span>
        </div>
        <div className="text-2xl font-black text-white">4,281</div>
        <div className="text-xs text-gray-400">Leads Identified (Last 24h)</div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-10 left-0 md:left-10 bg-black/60 backdrop-blur-xl border border-blue-500/30 p-4 rounded-xl shadow-xl z-50 pointer-events-none"
      >
        <div className="flex items-center gap-3 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-400 uppercase tracking-wider font-bold">Auto DM Engine</span>
        </div>
        <div className="text-2xl font-black text-white">892</div>
        <div className="text-xs text-gray-400">DMs Sent Successfully</div>
      </motion.div>

    </div>
  );
}
