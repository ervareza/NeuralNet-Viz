import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { Cpu, ScanEye } from 'lucide-react';

export default function Home() {
    return (
        <main className="min-h-screen relative flex flex-col bg-[#01020a] overflow-hidden">
            {/* Ambient Background Glow - Subtle so Bloom stands out */}
            <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] bg-purple-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

            {/* Top Bar for OS aesthetic - Ultra Premium Glassmorphism */}
            <header className="h-16 bg-white/[0.01] backdrop-blur-md border-b border-white/5 flex items-center justify-between px-8 z-20 font-mono text-xs text-slate-300 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 text-cyan-400 bg-cyan-950/30 px-4 py-2 rounded-lg border border-cyan-800/30 shadow-[inset_0_0_15px_rgba(34,211,238,0.05)]">
                        <Cpu size={18} />
                        <span className="font-bold text-cyan-50 tracking-widest text-[11px]">NEXUS CORE <span className="text-cyan-500/50">v3.0</span></span>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 opacity-40">
                        <ScanEye size={16} />
                        <span className="font-light tracking-widest uppercase text-[10px]">Deep Learning Visualizer Module</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-3 relative border border-emerald-800/30 bg-emerald-950/30 px-5 py-2 text-emerald-100 rounded-lg shadow-[inset_0_0_15px_rgba(16,185,129,0.05)]">
                        <span className="absolute -left-1.5 top-2.5 w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,0.8)]"></span>
                        <span className="tracking-widest uppercase font-semibold text-[10px]">System Optimal</span>
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10">
                <NeuralNetworkViewer />
            </div>
        </main>
    );
}
