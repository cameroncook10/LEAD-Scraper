import React, { useEffect, useRef } from "react";

export default function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -100, y: -100 });
  const target = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      target.current = { x: -100, y: -100 };
      pos.current = { x: -100, y: -100 };
    };

    let animId: number;

    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x - 4}px, ${target.current.y - 4}px)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${pos.current.x - 20}px, ${pos.current.y - 20}px)`;
      }
      animId = requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    animId = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Hide on touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return null;
  }

  return (
    <>
      {/* Small dot - follows cursor exactly */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-cyan-400 pointer-events-none z-[9999] mix-blend-screen"
        style={{ willChange: "transform" }}
      />
      {/* Larger ring - follows with delay */}
      <div
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-cyan-400/40 pointer-events-none z-[9999] mix-blend-screen"
        style={{
          willChange: "transform",
          boxShadow: "0 0 15px rgba(34, 211, 238, 0.15), 0 0 30px rgba(34, 211, 238, 0.05)",
        }}
      />
    </>
  );
}
