'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Zap, Layers, Waves, Palette, Settings, ChevronLeft } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { GlassSlider } from '../ui/GlassSlider';

interface Theme {
  name: string;
  primary: { r: number, g: number, b: number };
  secondary: { r: number, g: number, b: number };
}

interface ControlPanelProps {
  speed: number;
  setSpeed: (v: number) => void;
  glow: number;
  setGlow: (v: number) => void;
  density: number;
  setDensity: (v: number) => void;
  wiggle: number;
  setWiggle: (v: number) => void;
  themes: Theme[];
  activeTheme: number;
  setTheme: (idx: number) => void;
}

export function ControlPanel({
  speed, setSpeed,
  glow, setGlow,
  density, setDensity,
  wiggle, setWiggle,
  themes, activeTheme, setTheme
}: ControlPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="absolute bottom-8 left-8 z-40 pointer-events-auto">
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* Collapsed state — just a small pill button */
          <motion.button
            key="collapsed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
            style={{
              background: 'rgba(6, 14, 36, 0.8)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
            }}
          >
            <Settings size={14} className="text-cyan-400" />
            <span className="text-[10px] font-mono tracking-widest uppercase text-slate-300">Controls</span>
          </motion.button>
        ) : (
          /* Expanded state — full panel */
          <motion.div
            key="expanded"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <GlassCard
              className="w-80 p-6 flex flex-col gap-6"
              intensity="high"
              borderOpacity={0.15}
              initial={false}
              animate={{ opacity: 1 }}
            >
              {/* Header with collapse button */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-cyan-400" />
                  <h2 className="text-[11px] font-mono tracking-[0.2em] uppercase text-white font-semibold">
                    Simulation
                  </h2>
                </div>
                <button
                  onClick={() => setIsCollapsed(true)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors group"
                  title="Collapse panel"
                >
                  <ChevronLeft size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-5">
                <GlassSlider
                  label="Flow Speed"
                  icon={<Activity size={12}/>}
                  value={speed} min={0} max={5} step={0.1} unit="x"
                  color="#38bdf8"
                  onChange={setSpeed}
                />
                <GlassSlider
                  label="Optical Glow"
                  icon={<Zap size={12}/>}
                  value={glow} min={0} max={200} step={10} unit="%"
                  color="#a78bfa"
                  onChange={setGlow}
                />
                <GlassSlider
                  label="Synapse Density"
                  icon={<Layers size={12}/>}
                  value={density} min={10} max={100} step={5} unit="%"
                  color="#4ade80"
                  onChange={setDensity}
                />
                <GlassSlider
                  label="Node Wiggle"
                  icon={<Waves size={12}/>}
                  value={wiggle} min={0} max={30} step={1} unit="px"
                  color="#fbbf24"
                  onChange={setWiggle}
                />
              </div>

              {/* Theme Selector */}
              <div className="pt-4 border-t border-white/5 space-y-3">
                <div className="flex items-center gap-2">
                    <Palette size={14} className="text-fuchsia-400" />
                    <span className="text-[10px] font-mono tracking-[0.1em] uppercase text-slate-400">Theme</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {themes.map((th, idx) => (
                        <button
                            key={th.name}
                            onClick={() => setTheme(idx)}
                            className={`flex items-center justify-between p-2 rounded-lg text-[10px] font-medium transition-all duration-300 border ${
                                activeTheme === idx
                                ? 'bg-white/10 border-white/20 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]'
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-white/5 hover:text-slate-300'
                            }`}
                        >
                            {th.name}
                            <div className="flex -space-x-1">
                                <div className="w-2.5 h-2.5 rounded-full border border-black/50 shadow-sm z-10" style={{ background: `rgb(${th.primary.r},${th.primary.g},${th.primary.b})` }} />
                                <div className="w-2.5 h-2.5 rounded-full border border-black/50 shadow-sm" style={{ background: `rgb(${th.secondary.r},${th.secondary.g},${th.secondary.b})` }} />
                            </div>
                        </button>
                    ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
