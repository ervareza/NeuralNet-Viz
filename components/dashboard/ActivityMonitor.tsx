'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '../ui/GlassCard';
import { Activity } from 'lucide-react';

interface OutputTrace {
  name: string;
  color: string;
  values: number[];
}

interface ActivityMonitorProps {
  outputData: { name: string; value: number }[];
  themePrimary: { r: number; g: number; b: number };
}

const TRACE_COLORS = [
  '#fde047', // Yellow (winner)
  '#38bdf8', // Cyan
  '#a78bfa', // Violet
  '#4ade80', // Green
  '#fb923c', // Orange
];

const MAX_POINTS = 120; // ~2s of data at 60fps

export function ActivityMonitor({ outputData, themePrimary }: ActivityMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracesRef = useRef<OutputTrace[]>([]);

  // Update traces with new data
  useEffect(() => {
    if (!outputData || outputData.length === 0) return;

    // Get top 3 outputs by current value
    const sorted = [...outputData].sort((a, b) => b.value - a.value);
    const top3 = sorted.slice(0, 3);

    // Update or create traces
    top3.forEach((out, i) => {
      let trace = tracesRef.current.find(t => t.name === out.name);
      if (!trace) {
        trace = { name: out.name, color: TRACE_COLORS[i], values: [] };
        tracesRef.current.push(trace);
      }
      trace.color = TRACE_COLORS[i]; // Update color based on rank
      trace.values.push(out.value);
      if (trace.values.length > MAX_POINTS) {
        trace.values.shift();
      }
    });

    // Remove traces not in top 3
    const topNames = new Set(top3.map(t => t.name));
    tracesRef.current = tracesRef.current.filter(t => topNames.has(t.name));
  }, [outputData]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      const cw = canvas.offsetWidth;
      const ch = canvas.offsetHeight;

      // Clear
      ctx.clearRect(0, 0, cw, ch);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = (ch / 4) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
        ctx.stroke();
      }

      // Draw traces
      tracesRef.current.forEach(trace => {
        if (trace.values.length < 2) return;

        const step = cw / MAX_POINTS;

        // Glow layer
        ctx.beginPath();
        trace.values.forEach((val, i) => {
          const x = cw - (trace.values.length - 1 - i) * step;
          const y = ch - val * ch * 0.85 - ch * 0.05;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle = trace.color + '40';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Core line
        ctx.beginPath();
        trace.values.forEach((val, i) => {
          const x = cw - (trace.values.length - 1 - i) * step;
          const y = ch - val * ch * 0.85 - ch * 0.05;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
        ctx.strokeStyle = trace.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Endpoint dot
        const lastVal = trace.values[trace.values.length - 1];
        const lastX = cw;
        const lastY = ch - lastVal * ch * 0.85 - ch * 0.05;
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = trace.color;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <GlassCard
      className="absolute bottom-8 right-8 w-72 p-4 flex flex-col gap-3 z-40 pointer-events-auto"
      intensity="high"
      borderOpacity={0.15}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-emerald-400" />
          <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-white font-bold text-shadow-sm">
            Signal Monitor
          </span>
        </div>
        <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[8px] font-mono text-emerald-500/80 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="relative w-full rounded-md overflow-hidden border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] bg-black/40 p-1">
        <canvas
          ref={canvasRef}
          className="w-full block"
          style={{ height: '85px' }}
        />
        {/* Subtle scanline overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)' }} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
        {tracesRef.current?.slice(0, 3).map((trace, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[9px] font-mono text-slate-300">
            <div className="w-2 h-2 rounded-sm shadow-sm" style={{ backgroundColor: TRACE_COLORS[i], boxShadow: `0 0 6px ${TRACE_COLORS[i]}80` }} />
            <span className="truncate max-w-[70px] uppercase tracking-wider">{trace.name || '...'}</span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
