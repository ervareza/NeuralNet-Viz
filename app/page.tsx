'use client';

import React, { useState } from 'react';
import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { Cpu, Settings2, Activity, Zap, Layers, Palette } from 'lucide-react';

const THEMES = [
    { name: 'Cyber Cyan', primary: { r: 34, g: 211, b: 238 }, secondary: { r: 16, g: 185, b: 129 } },
    { name: 'Neon Purple', primary: { r: 168, g: 85, b: 247 }, secondary: { r: 236, g: 72, b: 153 } },
    { name: 'Solar Flare', primary: { r: 250, g: 204, b: 21 }, secondary: { r: 249, g: 115, b: 22 } },
];

export default function Home() {
    const [speed, setSpeed] = useState(2.0);
    const [glowIntensity, setGlowIntensity] = useState(100);
    const [connectionDensity, setConnectionDensity] = useState(100);
    const [activeTheme, setActiveTheme] = useState(0);

    return (
        <main className="min-h-screen flex bg-[#03050a] overflow-hidden text-slate-300 font-sans relative">
            
            {/* Animated Mesh Gradient Background for true Glassmorphism */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                <div 
                    className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[100px] opacity-30 animate-pulse"
                    style={{ backgroundColor: `rgb(${THEMES[activeTheme].primary.r}, ${THEMES[activeTheme].primary.g}, ${THEMES[activeTheme].primary.b})` }}
                ></div>
                <div 
                    className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full mix-blend-screen filter blur-[120px] opacity-20"
                    style={{ backgroundColor: `rgb(${THEMES[activeTheme].secondary.r}, ${THEMES[activeTheme].secondary.g}, ${THEMES[activeTheme].secondary.b})` }}
                ></div>
            </div>

            {/* Left Sidebar - Control Panel */}
            <aside className="w-80 h-screen bg-white/[0.015] backdrop-blur-3xl border-r border-white/5 z-20 flex flex-col shadow-[10px_0_50px_rgba(0,0,0,0.5)]">
                {/* Header */}
                <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-white">
                        <Cpu size={20} className="text-cyan-400" />
                        <span className="font-bold tracking-widest text-[13px] uppercase">Nexus Core <span className="text-cyan-500/50">v5.0</span></span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    
                    {/* Status Card */}
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 shadow-lg">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="tracking-widest uppercase font-bold text-[10px] text-white">System Optimal</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-mono mt-2">Zero-Lag Additive Blending GPU Engaged</p>
                    </div>

                    {/* Simulation Parameters */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-white font-semibold uppercase tracking-widest text-[11px] mb-4">
                            <Settings2 size={14} className="text-slate-400" />
                            Simulation Params
                        </div>

                        {/* Speed Control */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5"><Activity size={12}/> Flow Speed</span>
                                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">{speed.toFixed(1)}x</span>
                            </div>
                            <input 
                                type="range" min="0" max="5" step="0.1" value={speed} 
                                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                        </div>

                        {/* Glow Intensity Control */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5"><Zap size={12}/> Optical Glow</span>
                                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">{glowIntensity}%</span>
                            </div>
                            <input 
                                type="range" min="0" max="200" step="10" value={glowIntensity} 
                                onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-purple-400"
                            />
                        </div>

                        {/* Connection Density Control */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-slate-400 flex items-center gap-1.5"><Layers size={12}/> Synapse Density</span>
                                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">{connectionDensity}%</span>
                            </div>
                            <input 
                                type="range" min="10" max="100" step="5" value={connectionDensity} 
                                onChange={(e) => setConnectionDensity(parseFloat(e.target.value))}
                                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                            />
                        </div>
                    </div>

                    <div className="h-px w-full bg-white/5"></div>

                    {/* Theme Selection */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-white font-semibold uppercase tracking-widest text-[11px]">
                            <Palette size={14} className="text-slate-400" />
                            Visual Theme
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            {THEMES.map((theme, idx) => (
                                <button
                                    key={theme.name}
                                    onClick={() => setActiveTheme(idx)}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-300 ${activeTheme === idx ? 'bg-white/10 border-white/20 shadow-md' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                                >
                                    <span className="text-xs font-medium tracking-wide">{theme.name}</span>
                                    <div className="flex gap-1">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: `rgb(${theme.primary.r},${theme.primary.g},${theme.primary.b})` }}></div>
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: `rgb(${theme.secondary.r},${theme.secondary.g},${theme.secondary.b})` }}></div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Visualizer Area */}
            <div className="flex-1 relative z-10 w-full h-full">
                <NeuralNetworkViewer 
                    speed={speed}
                    glowIntensity={glowIntensity}
                    themePrimary={THEMES[activeTheme].primary}
                    themeSecondary={THEMES[activeTheme].secondary}
                    connectionDensity={connectionDensity}
                />
            </div>
            
        </main>
    );
}
