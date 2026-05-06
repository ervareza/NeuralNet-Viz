import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { Cpu, Activity } from 'lucide-react';

export default function Home() {
    return (
        <main className="min-h-screen relative flex flex-col bg-slate-950 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none z-0"></div>

            {/* Top Bar for OS aesthetic - Glassmorphism */}
            <header className="h-14 bg-white/[0.02] backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 z-20 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-md border border-blue-500/20">
                        <Cpu size={16} />
                        <span className="font-semibold text-blue-100 tracking-wide">NexusCore v2.1</span>
                    </div>
                    <span className="hidden sm:inline opacity-30">|</span>
                    <span className="hidden sm:inline font-light tracking-wide text-slate-400">Module: Deep Learning Visualizer</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 relative border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-green-200 rounded-md">
                        <span className="absolute -left-1.5 top-2 w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.6)]"></span>
                        Status: Optimal
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative z-10">
                <NeuralNetworkViewer />
                
                {/* Overlay Floating Panel */}
                <div className="absolute bottom-8 left-8 max-w-sm pointer-events-none p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                    <h2 className="font-mono text-sm font-bold text-white mb-3 flex items-center gap-2 uppercase tracking-widest">
                        <Activity size={18} className="text-blue-400"/>
                        Network Topology
                    </h2>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed opacity-80">
                        Real-time 3D visualization of a deep neural network. The synthetic topology consists of 105 active nodes and over 1,800 synaptic connections propagating signals dynamically.
                    </p>
                </div>
            </div>
        </main>
    );
}
