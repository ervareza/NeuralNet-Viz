'use client';

import { Network } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export function TopologyStats() {
  const stats = [
    { label: 'Inputs',   value: 9,    color: '#4ade80' },
    { label: 'Outputs',  value: 13,   color: '#7dd3fc' },
    { label: 'Hidden',   value: 4,    color: '#c084fc', unit: ' Layers' },
    { label: 'Synapses', value: 1802, color: '#fbbf24' },
  ];

  return (
    <GlassCard 
      className="absolute top-20 right-8 w-64 p-5 flex flex-col gap-4 z-40 pointer-events-auto"
      intensity="medium"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
            <Network size={14} className="text-indigo-400" />
            <h2 className="text-[10px] font-mono tracking-[0.2em] uppercase text-white font-semibold">
            Topology
            </h2>
        </div>
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
            Active
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div 
            key={s.label} 
            className="rounded-xl p-3 flex flex-col items-start gap-1 relative overflow-hidden group"
            style={{ 
                background: 'rgba(255,255,255,0.03)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05)'
            }}
          >
            {/* Subtle hover gradient */}
            <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at center, ${s.color}, transparent)` }}
            />
            
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium z-10">
                {s.label}
            </span>
            <div className="flex items-baseline gap-1 z-10">
                <AnimatedNumber 
                    value={s.value} 
                    className="font-mono font-bold text-lg" 
                    style={{ color: s.color, textShadow: `0 0 12px ${s.color}60` }}
                    delay={0.3 + i * 0.1}
                />
                {s.unit && <span className="text-[9px] text-slate-400">{s.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
