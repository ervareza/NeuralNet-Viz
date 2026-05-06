'use client';

import { motion } from 'framer-motion';
import { Cpu, Terminal } from 'lucide-react';
import { AnimatedNumber } from '../ui/AnimatedNumber';

interface HeaderBarProps {
  fps?: number;
  version?: string;
  themePrimary?: string;
}

export function HeaderBar({ fps = 60, version = "v5.2", themePrimary = "#38bdf8" }: HeaderBarProps) {
  return (
    <motion.header 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute top-0 left-0 right-0 h-14 z-50 flex items-center justify-between px-6 pointer-events-none"
    >
      {/* Left side brand */}
      <div className="flex items-center gap-3 bg-[#030d1e]/40 backdrop-blur-md px-4 py-2 rounded-b-xl border border-white/5 border-t-0 pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <Cpu size={16} color={themePrimary} strokeWidth={2} />
        <div className="flex items-baseline gap-2">
          <span className="text-white font-bold tracking-[0.2em] text-[11px] uppercase">Nexus Core</span>
          <span className="font-mono text-[9px] opacity-60" style={{ color: themePrimary }}>{version}</span>
        </div>
      </div>

      {/* Right side status */}
      <div className="flex items-center gap-6 bg-[#030d1e]/40 backdrop-blur-md px-5 py-2 rounded-b-xl border border-white/5 border-t-0 pointer-events-auto shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        
        <div className="flex items-center gap-2">
          <Terminal size={13} className="text-slate-400" />
          <span className="text-slate-300 text-[10px] font-mono tracking-widest uppercase">Engine</span>
        </div>

        <div className="w-px h-3 bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">FPS</span>
          <AnimatedNumber 
            value={fps} 
            className="text-emerald-400 font-mono font-bold text-xs w-6 text-right" 
          />
        </div>

        <div className="w-px h-3 bg-white/10" />

        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#34d399]"></span>
          </span>
          <span className="text-emerald-400 text-[9px] uppercase tracking-[0.2em] font-mono font-bold">Online</span>
        </div>
      </div>
    </motion.header>
  );
}
