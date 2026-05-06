import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { Cpu, Binary } from 'lucide-react';

export default function Home() {
    return (
        <main className="min-h-screen flex flex-col bg-[#050914] overflow-hidden text-slate-300 font-sans">
            
            {/* Top Bar - Flat 2D Glassmorphism */}
            <header className="h-14 bg-white/[0.02] backdrop-blur-md border-b border-white/[0.08] flex items-center justify-between px-8 z-20 relative">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2.5 text-cyan-400">
                        <Cpu size={18} strokeWidth={1.5} />
                        <span className="font-bold tracking-widest text-[11px] uppercase">Nexus Core <span className="opacity-50">v4.0</span></span>
                    </div>
                    <div className="hidden sm:flex items-center gap-2.5 opacity-40 font-mono">
                        <Binary size={16} strokeWidth={1.5} />
                        <span className="tracking-widest uppercase text-[10px]">Deep Learning Topology</span>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="tracking-widest uppercase font-semibold text-[10px] text-emerald-300">System Optimal</span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10 w-full h-full">
                <NeuralNetworkViewer />
                
                {/* Overlay Floating Panel (Bottom Left) */}
                <div className="absolute bottom-8 left-8 max-w-[320px] pointer-events-none p-6 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <h2 className="font-mono text-xs font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
                        <Binary size={16} className="text-cyan-400" strokeWidth={2} />
                        Network Activity
                    </h2>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed opacity-90">
                        Real-time 2D visualization of a deep neural network processing data streams. The simulation actively routes signals through over 1,800 active synaptic bezier connections at 60 FPS.
                    </p>
                </div>
            </div>
            
        </main>
    );
}
