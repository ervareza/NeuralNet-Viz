'use client';

import React, { useState } from 'react';
import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { Cpu, Activity, Zap, Layers, Palette, GitBranch, Waves } from 'lucide-react';

const THEMES = [
    { name: 'Ocean Cyan',   primary: { r: 56,  g: 189, b: 248 }, secondary: { r: 34,  g: 211, b: 238 } },
    { name: 'Neon Violet',  primary: { r: 167, g: 139, b: 250 }, secondary: { r: 236, g: 72,  b: 153 } },
    { name: 'Aurora Green', primary: { r: 52,  g: 211, b: 153 }, secondary: { r: 56,  g: 189, b: 248 } },
    { name: 'Solar Amber',  primary: { r: 251, g: 191, b: 36  }, secondary: { r: 249, g: 115, b: 22  } },
];

type SliderProps = {
    label: string;
    icon: React.ReactNode;
    value: number;
    min: number;
    max: number;
    step: number;
    unit: string;
    color: string;
    onChange: (v: number) => void;
};

function Slider({ label, icon, value, min, max, step, unit, color, onChange }: SliderProps) {
    return (
        <div className="space-y-2.5">
            <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">{icon}{label}</span>
                <span className={`font-mono text-white bg-white/[0.08] px-2 py-0.5 rounded text-[11px]`}>
                    {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}{unit}
                </span>
            </div>
            <div className="relative">
                <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="w-full h-[3px] rounded-full appearance-none cursor-pointer"
                    style={{
                        background: `linear-gradient(to right, ${color} ${((value - min) / (max - min)) * 100}%, rgba(255,255,255,0.1) ${((value - min) / (max - min)) * 100}%)`
                    }}
                />
            </div>
        </div>
    );
}

export default function Home() {
    const [speed, setSpeed]               = useState(1.0);
    const [glowIntensity, setGlow]        = useState(100);
    const [connectionDensity, setDensity] = useState(100);
    const [wiggleAmount, setWiggle]       = useState(8);
    const [activeTheme, setTheme]         = useState(0);

    const theme = THEMES[activeTheme];

    return (
        <main className="min-h-screen flex overflow-hidden bg-[#030d1e] text-slate-300 relative">

            {/* === Animated Mesh Gradient Background === */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute -top-1/4 -left-1/4 w-3/4 h-3/4 rounded-full blur-[140px] opacity-20 mix-blend-screen"
                    style={{ backgroundColor: `rgb(${theme.primary.r},${theme.primary.g},${theme.primary.b})` }}
                />
                <div
                    className="absolute -bottom-1/4 left-1/3 w-2/3 h-2/3 rounded-full blur-[160px] opacity-10 mix-blend-screen"
                    style={{ backgroundColor: `rgb(${theme.secondary.r},${theme.secondary.g},${theme.secondary.b})` }}
                />
            </div>

            {/* === Left Sidebar === */}
            <aside className="relative z-20 w-72 flex-shrink-0 h-screen flex flex-col"
                   style={{ background: 'rgba(4, 12, 32, 0.65)', backdropFilter: 'blur(32px)', borderRight: '1px solid rgba(100,160,255,0.1)' }}>

                {/* Header */}
                <div className="h-14 flex items-center gap-3 px-5 border-b border-white/[0.06]">
                    <Cpu size={18} className="text-cyan-400 shrink-0" strokeWidth={1.5} />
                    <div>
                        <span className="text-white font-bold tracking-widest text-[11px] uppercase">Nexus Core</span>
                        <span className="text-cyan-600 font-mono text-[10px] ml-1.5">v5.1</span>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" />
                        <span className="text-emerald-400 text-[9px] uppercase tracking-widest font-mono">Live</span>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto py-5 px-5 space-y-7">

                    {/* Status */}
                    <div className="rounded-xl border border-white/[0.06] p-4 space-y-3"
                         style={{ background: 'rgba(10,25,70,0.4)' }}>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Topology</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {[
                                { label: 'Inputs',   value: '9',    col: '#4ade80' },
                                { label: 'Outputs',  value: '13',   col: '#7dd3fc' },
                                { label: 'Hidden',   value: '4 HL', col: '#c084fc' },
                                { label: 'Synapses', value: '1802', col: '#fbbf24' },
                            ].map(s => (
                                <div key={s.label} className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <p className="text-[9px] text-slate-500 uppercase">{s.label}</p>
                                    <p className="font-mono font-bold text-sm mt-0.5" style={{ color: s.col }}>{s.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Simulation Controls */}
                    <div className="space-y-5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                            <Activity size={11} /> Simulation
                        </p>
                        <Slider label="Flow Speed"      icon={<Activity size={11}/>}   value={speed}            min={0} max={5}   step={0.1}  unit="x"  color="#38bdf8" onChange={setSpeed} />
                        <Slider label="Optical Glow"    icon={<Zap size={11}/>}        value={glowIntensity}    min={0} max={200} step={10}   unit="%"  color="#a78bfa" onChange={setGlow} />
                        <Slider label="Synapse Density" icon={<Layers size={11}/>}     value={connectionDensity}min={10}max={100} step={5}    unit="%"  color="#4ade80" onChange={setDensity} />
                        <Slider label="Node Wiggle"     icon={<Waves size={11}/>}      value={wiggleAmount}     min={0} max={30}  step={1}    unit="px" color="#fbbf24" onChange={setWiggle} />
                    </div>

                    <div className="h-px bg-white/[0.05]" />

                    {/* Layer Architecture Info */}
                    <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                            <GitBranch size={11} /> Architecture
                        </p>
                        {['Input (9)', 'HL1 — Sigmoid (18)', 'HL2 — ReLU (27)', 'HL3 — Tanh (22)', 'HL4 — Sigmoid (16)', 'Output (13)'].map((l, i) => (
                            <div key={l} className="flex items-center gap-2 text-[10px] font-mono rounded-lg px-3 py-2"
                                 style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <span className="w-4 h-4 rounded text-center text-[9px] font-bold shrink-0 flex items-center justify-center"
                                      style={{ background: `rgba(${theme.primary.r},${theme.primary.g},${theme.primary.b},0.2)`, color: `rgb(${theme.primary.r},${theme.primary.g},${theme.primary.b})` }}>
                                    {i}
                                </span>
                                <span className="text-slate-300">{l}</span>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-white/[0.05]" />

                    {/* Theme */}
                    <div className="space-y-3">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2">
                            <Palette size={11} /> Visual Theme
                        </p>
                        <div className="space-y-1.5">
                            {THEMES.map((th, idx) => (
                                <button key={th.name} onClick={() => setTheme(idx)}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-300 text-xs ${activeTheme === idx ? 'bg-white/10 border-white/15 shadow-inner' : 'bg-transparent border-transparent hover:bg-white/[0.04]'}`}>
                                    <span className={activeTheme === idx ? 'text-white font-medium' : 'text-slate-400'}>{th.name}</span>
                                    <div className="flex gap-1.5">
                                        <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/10" style={{ background: `rgb(${th.primary.r},${th.primary.g},${th.primary.b})` }} />
                                        <div className="w-3.5 h-3.5 rounded-full ring-1 ring-white/10" style={{ background: `rgb(${th.secondary.r},${th.secondary.g},${th.secondary.b})` }} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/[0.06] text-[9px] font-mono text-slate-600">
                    GPU Accelerated · 60 FPS · 2D Optical Glow
                </div>
            </aside>

            {/* === Main Canvas === */}
            <div className="relative z-10 flex-1 h-screen">
                <NeuralNetworkViewer
                    speed={speed}
                    glowIntensity={glowIntensity}
                    themePrimary={theme.primary}
                    themeSecondary={theme.secondary}
                    connectionDensity={connectionDensity}
                    wiggleAmount={wiggleAmount}
                />
            </div>
        </main>
    );
}
