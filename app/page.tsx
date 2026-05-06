import NeuralNetworkViewer from '@/components/NeuralNetworkViewer';
import { Cpu, Activity } from 'lucide-react';

export default function Home() {
    return (
        <main className="min-h-screen relative flex flex-col bg-slate-950 bg-grid">
            {/* Top Bar for OS aesthetic */}
            <header className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-10 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-400">
                        <Cpu size={16} />
                        <span className="font-semibold text-white">TurboOS 0.8.6</span>
                    </div>
                    <span className="hidden sm:inline">|</span>
                    <span className="hidden sm:inline">Module: Bilyar Mamediliev Simulator</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-2 relative border border-slate-700 bg-slate-800 px-3 py-1 text-slate-300 rounded-full">
                        <span className="absolute -left-1 top-2 w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Status: Active
                    </span>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden">
                <NeuralNetworkViewer />
                
                {/* Overlay Floating Panel */}
                <div className="absolute bottom-6 left-6 max-w-sm pointer-events-none p-4 rounded-lg border border-slate-800/80 bg-slate-950/80 backdrop-blur shadow-2xl">
                    <h2 className="font-mono text-sm font-bold text-white mb-2 flex items-center gap-2">
                        <Activity size={16} className="text-blue-400"/>
                        Network Activity
                    </h2>
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Real-time visualization of a synthetic neural network. Inputs dynamically vary over time, propagating forward through hidden layers using a Sigmoid activation function to trigger behavioral outputs.
                    </p>
                </div>
            </div>
        </main>
    );
}
