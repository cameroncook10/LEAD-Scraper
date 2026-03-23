'use client';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DatabaseZap, Mail, UserSearch, Building2, Wifi } from 'lucide-react';
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
  const [packets, setPackets] = useState<{id: number; to: Node}[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver — pause when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate nodes
  useEffect(() => {
    const newNodes: Node[] = [];
    let id = 0;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        newNodes.push({
          id: id++,
          x: col * 55 + (row % 2) * 28,
          y: row * 48,
          type: Math.random() > 0.7 ? 'converted' : Math.random() > 0.5 ? 'business' : 'lead',
          delay: Math.random() * 2,
        });
      }
    }
    setNodes(newNodes);
  }, []);

  // Auto DM packets — only when visible
  useEffect(() => {
    if (!isVisible || nodes.length === 0) return;
    const interval = setInterval(() => {
      const target = nodes[Math.floor(Math.random() * nodes.length)];
      setPackets(prev => [...prev.slice(-8), { id: Date.now(), to: target }]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isVisible, nodes]);

  const getNodeColor = (type: string) => {
    switch(type) {
      case 'converted': return { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', icon: 'text-emerald-400' };
      case 'business': return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', icon: 'text-blue-400' };
      default: return { bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.3)', icon: 'text-cyan-400' };
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full h-full flex items-center justify-center", className)}>
      
      {/* Isometric Container */}
      <div 
        className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px]"
        style={{ perspective: '1200px' }}
      >
        <motion.div 
          animate={isVisible ? { rotateX: 55, rotateZ: -45 } : {}}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative w-full h-full preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Base Plane */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(15,23,42,0.6), rgba(59,130,246,0.03))',
              border: '1px solid rgba(6,182,212,0.1)',
              boxShadow: '0 40px 80px rgba(0,0,0,0.4), 0 0 60px rgba(6,182,212,0.05)',
            }}
          >
            {/* Scanner wave */}
            {isVisible && (
              <motion.div 
                animate={{ top: ['-15%', '115%'] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-24"
                style={{
                  background: 'linear-gradient(180deg, transparent, rgba(6,182,212,0.12), transparent)',
                  borderBottom: '1px solid rgba(6,182,212,0.2)',
                }}
              />
            )}
          </div>

          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ transform: 'translateZ(5px)' }}>
            {nodes.map((node) => (
              <line
                key={`line-${node.id}`}
                x1="50%"
                y1="50%"
                x2={`${(node.x / 220) * 100}%`}
                y2={`${(node.y / 192) * 100}%`}
                stroke="rgba(6,182,212,0.08)"
                strokeWidth="0.5"
              />
            ))}
          </svg>

          {/* Central SCION Hub */}
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-2xl flex flex-col items-center justify-center z-40"
            style={{ 
              transform: 'translate(-50%, -50%) translateZ(50px)',
              background: 'linear-gradient(135deg, rgba(5,5,5,0.95), rgba(15,23,42,0.9))',
              border: '1px solid rgba(6,182,212,0.3)',
              boxShadow: '0 0 40px rgba(6,182,212,0.2), 0 0 80px rgba(6,182,212,0.05)',
            }}
          >
            <DatabaseZap className="w-8 h-8 text-cyan-400 mb-1" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-cyan-400 uppercase">SCION</span>
            
            {/* Orbiting ring */}
            {isVisible && (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-8px] rounded-full border border-cyan-500/20"
                style={{ borderTopColor: 'rgba(6,182,212,0.5)' }}
              />
            )}
          </motion.div>

          {/* Data Nodes */}
          {nodes.map((node) => {
            const colors = getNodeColor(node.type);
            return (
              <motion.div
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={isVisible ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: node.delay * 0.3, type: 'spring' }}
                className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-lg flex items-center justify-center z-20"
                style={{ 
                  left: `${(node.x / 220) * 100}%`, 
                  top: `${(node.y / 192) * 100}%`,
                  transform: 'translateZ(15px)',
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                }}
              >
                {node.type === 'business' ? (
                  <Building2 className={cn("w-3.5 h-3.5", colors.icon)} />
                ) : node.type === 'converted' ? (
                  <Wifi className={cn("w-3.5 h-3.5", colors.icon)} />
                ) : (
                  <UserSearch className={cn("w-3.5 h-3.5", colors.icon)} />
                )}
              </motion.div>
            );
          })}

          {/* Flying DM Packets */}
          <AnimatePresence>
            {packets.map(packet => (
              <motion.div
                key={packet.id}
                initial={{ left: '50%', top: '50%', opacity: 1, scale: 0.4 }}
                animate={{ 
                  left: `${(packet.to.x / 220) * 100}%`, 
                  top: `${(packet.to.y / 192) * 100}%`,
                  opacity: [1, 1, 0],
                  scale: [0.4, 0.8, 1.2],
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full flex items-center justify-center z-30"
                style={{ 
                  transform: 'translateZ(30px)',
                  background: 'rgba(6,182,212,0.8)',
                  boxShadow: '0 0 15px rgba(6,182,212,0.6)',
                }}
              >
                <Mail className="w-2.5 h-2.5 text-black" />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Floating Stat Cards */}
      <motion.div 
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        className="absolute top-8 right-4 md:right-8 glass-liquid p-4 rounded-xl z-50 pointer-events-none"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Scraping Active</span>
        </div>
        <div className="text-xl font-black text-white">4,281</div>
        <div className="text-[11px] text-gray-500">Leads / 24h</div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 0.8 }}
        className="absolute bottom-8 left-4 md:left-8 glass-liquid p-4 rounded-xl z-50 pointer-events-none"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <Mail className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Auto DM</span>
        </div>
        <div className="text-xl font-black text-white">892</div>
        <div className="text-[11px] text-gray-500">Sent Today</div>
      </motion.div>
    </div>
  );
}
