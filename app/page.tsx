'use client';

import React, { useState, useCallback } from 'react';
import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { HeaderBar } from '@/components/dashboard/HeaderBar';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { TopologyStats } from '@/components/dashboard/TopologyStats';
import { ActivityMonitor } from '@/components/dashboard/ActivityMonitor';

const THEMES = [
    { name: 'Ocean Cyan',   primary: { r: 56,  g: 189, b: 248 }, secondary: { r: 34,  g: 211, b: 238 } },
    { name: 'Neon Violet',  primary: { r: 167, g: 139, b: 250 }, secondary: { r: 236, g: 72,  b: 153 } },
    { name: 'Aurora Green', primary: { r: 52,  g: 211, b: 153 }, secondary: { r: 56,  g: 189, b: 248 } },
    { name: 'Solar Amber',  primary: { r: 251, g: 191, b: 36  }, secondary: { r: 249, g: 115, b: 22  } },
];

export default function Home() {
    const [speed, setSpeed]               = useState(1.0);
    const [glowIntensity, setGlow]        = useState(100);
    const [connectionDensity, setDensity] = useState(100);
    const [wiggleAmount, setWiggle]       = useState(8);
    const [activeTheme, setTheme]         = useState(0);

    // Live data from canvas engine
    const [outputData, setOutputData] = useState<{ name: string; value: number }[]>([]);

    const theme = THEMES[activeTheme];

    const handleOutputUpdate = useCallback((data: { name: string; value: number }[]) => {
        setOutputData(data);
    }, []);

    return (
        <main className="h-screen w-screen overflow-hidden bg-[#020813] text-slate-300 relative selection:bg-cyan-900/50">

            {/* === Animated Mesh Background === */}
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden mix-blend-screen opacity-40">
                <div
                    className="absolute -top-1/4 -left-1/4 w-[120%] h-[120%] rounded-full blur-[160px] opacity-20"
                    style={{
                        background: `radial-gradient(circle, rgba(${theme.primary.r},${theme.primary.g},${theme.primary.b},0.4) 0%, transparent 70%)`
                    }}
                />
            </div>

            {/* === Fullscreen Canvas Engine (z-10) === */}
            <div className="absolute inset-0 z-10">
                <NeuralNetworkViewer
                    speed={speed}
                    glowIntensity={glowIntensity}
                    themePrimary={theme.primary}
                    themeSecondary={theme.secondary}
                    connectionDensity={connectionDensity}
                    wiggleAmount={wiggleAmount}
                    onOutputUpdate={handleOutputUpdate}
                />
            </div>

            {/* === Cinematic Vignette (z-20) === */}
            <div className="absolute inset-0 pointer-events-none z-20 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

            {/* === Floating Dashboard UI (z-30+) === */}
            <HeaderBar
                themePrimary={`rgb(${theme.primary.r},${theme.primary.g},${theme.primary.b})`}
            />

            <ControlPanel
                speed={speed} setSpeed={setSpeed}
                glow={glowIntensity} setGlow={setGlow}
                density={connectionDensity} setDensity={setDensity}
                wiggle={wiggleAmount} setWiggle={setWiggle}
                themes={THEMES} activeTheme={activeTheme} setTheme={setTheme}
            />

            <TopologyStats />

            <ActivityMonitor
                outputData={outputData}
                themePrimary={theme.primary}
            />
        </main>
    );
}
