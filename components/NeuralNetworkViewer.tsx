'use client';

import React, { useEffect, useRef } from 'react';

const INPUT_COUNT = 9;
const OUTPUT_COUNT = 13;
const HIDDEN_LAYERS = [18, 27, 22, 16];
const LAYER_SIZES = [INPUT_COUNT, ...HIDDEN_LAYERS, OUTPUT_COUNT];
const NUM_LAYERS = LAYER_SIZES.length;

interface Node {
    id: string;
    layer: number;
    index: number;
    value: number;
    bias: number;
    x: number;
    y: number;
}

interface Edge {
    source: Node;
    target: Node;
    weight: number;
    // P0, P1, P2, P3 for cubic bezier
    p0: {x: number, y: number};
    p1: {x: number, y: number};
    p2: {x: number, y: number};
    p3: {x: number, y: number};
}

export default function NeuralNetworkViewer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        let nodes: Node[] = [];
        let edges: Edge[] = [];

        // 1. Initialize Graph Data
        LAYER_SIZES.forEach((size, layerIdx) => {
            for (let i = 0; i < size; i++) {
                nodes.push({
                    id: `l${layerIdx}-n${i}`,
                    layer: layerIdx,
                    index: i,
                    value: 0.1,
                    bias: Math.random() * 2 - 1,
                    x: 0,
                    y: 0
                });
            }
        });

        for (let l = 0; l < NUM_LAYERS - 1; l++) {
            const currentNodes = nodes.filter(n => n.layer === l);
            const nextNodes = nodes.filter(n => n.layer === l + 1);
            currentNodes.forEach(source => {
                nextNodes.forEach(target => {
                    edges.push({
                        source,
                        target,
                        weight: (Math.random() - 0.5) * 4,
                        p0: {x:0, y:0}, p1: {x:0, y:0}, p2: {x:0, y:0}, p3: {x:0, y:0}
                    });
                });
            });
        }

        // 2. Resize & Layout Logic
        let width = 0;
        let height = 0;

        const layout = () => {
            const marginX = width > 1000 ? 300 : 150;
            const marginYTop = 80;
            const marginYBottom = 80;
            
            const usableWidth = width - marginX * 2;
            const usableHeight = height - marginYTop - marginYBottom;
            const layerSpacing = usableWidth / Math.max(1, NUM_LAYERS - 1);

            // Compute Node Positions
            nodes.forEach(n => {
                n.x = marginX + n.layer * layerSpacing;
                const count = LAYER_SIZES[n.layer];
                const nodeSpacing = count > 1 ? usableHeight / (count - 1) : 0;
                const startY = count > 1 ? marginYTop : marginYTop + usableHeight / 2;
                n.y = startY + n.index * nodeSpacing;
            });

            // Compute Bezier Control Points for smooth curves
            edges.forEach(e => {
                const dx = e.target.x - e.source.x;
                e.p0 = { x: e.source.x, y: e.source.y };
                e.p1 = { x: e.source.x + dx * 0.4, y: e.source.y }; // Control point 1 (pull right)
                e.p2 = { x: e.target.x - dx * 0.4, y: e.target.y }; // Control point 2 (pull left)
                e.p3 = { x: e.target.x, y: e.target.y };
            });
        };

        const resize = () => {
            width = container.clientWidth;
            height = container.clientHeight;
            
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            
            layout();
        };

        const resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(container);
        resize();

        // 3. Animation Loop
        let animationFrameId: number;
        let startTime = Date.now();

        // Helper for cubic bezier interpolation
        const getBezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
            const mt = 1 - t;
            return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
        };

        const render = () => {
            const time = (Date.now() - startTime) / 1000;

            // --- A. Simulation ---
            nodes.filter(n => n.layer === 0).forEach((n, i) => {
                n.value = (Math.sin(time * 2.0 + i * 1.5) * Math.cos(time * 0.5 - i) + 1) / 2;
            });

            for (let l = 1; l < NUM_LAYERS; l++) {
                const layerNodes = nodes.filter(n => n.layer === l);
                layerNodes.forEach(target => {
                    let sum = target.bias;
                    const incomingEdges = edges.filter(e => e.target === target);
                    incomingEdges.forEach(e => {
                        sum += e.source.value * e.weight;
                    });
                    target.value = 1 / (1 + Math.exp(-sum)); // Sigmoid
                });
            }

            const outputNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            let winningOutput = outputNodes[0];
            outputNodes.forEach(n => {
                if (n.value > winningOutput.value) winningOutput = n;
            });

            // --- B. Rendering ---
            
            // Background
            ctx.fillStyle = '#050914'; // Very deep blue/black
            ctx.fillRect(0, 0, width, height);

            // Draw subtle background grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.lineWidth = 1;
            const gridSize = 50;
            ctx.beginPath();
            for(let x=0; x<=width; x+=gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for(let y=0; y<=height; y+=gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            // Set blend mode for glowing effect
            ctx.globalCompositeOperation = 'lighter';

            // 1. Draw Edges (Curved)
            edges.forEach(e => {
                const signal = Math.abs(e.source.value * e.weight);
                const opacity = Math.min(0.5, signal * 0.15);
                
                ctx.beginPath();
                ctx.moveTo(e.p0.x, e.p0.y);
                ctx.bezierCurveTo(e.p1.x, e.p1.y, e.p2.x, e.p2.y, e.p3.x, e.p3.y);
                
                ctx.strokeStyle = `rgba(56, 189, 248, ${opacity})`; // sky-400
                ctx.lineWidth = 0.5 + opacity * 2;
                ctx.stroke();

                // Draw flowing particles if active
                if (signal > 0.4) {
                    // Particle position t goes from 0 to 1 cyclically
                    // Add an offset so particles are spread out
                    const speed = 0.4;
                    let t = (time * speed + (e.source.index * 0.1 + e.target.index * 0.05)) % 1;
                    
                    const px = getBezierPoint(t, e.p0.x, e.p1.x, e.p2.x, e.p3.x);
                    const py = getBezierPoint(t, e.p0.y, e.p1.y, e.p2.y, e.p3.y);
                    
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(134, 239, 172, ${opacity * 4})`; // green glow
                    ctx.shadowColor = '#86efac';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.shadowBlur = 0; // reset
                }
            });

            // 2. Draw Nodes
            nodes.forEach(n => {
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isInput = n.layer === 0;
                const isWinner = isOutput && n === winningOutput;

                const radius = isWinner ? 5 : 3.5;
                
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
                
                if (isWinner) {
                    ctx.fillStyle = '#fde047'; // yellow-300
                    ctx.shadowColor = '#eab308';
                    ctx.shadowBlur = 20;
                } else if (isInput) {
                    ctx.fillStyle = '#4ade80'; // green-400
                    ctx.shadowColor = '#22c55e';
                    ctx.shadowBlur = n.value * 15;
                } else if (isOutput) {
                    ctx.fillStyle = '#7dd3fc'; // light blue
                    ctx.shadowColor = '#0ea5e9';
                    ctx.shadowBlur = n.value * 15;
                } else {
                    const intensity = Math.floor(n.value * 255);
                    ctx.fillStyle = `rgb(${intensity * 0.2}, ${intensity * 0.6}, ${intensity})`;
                    ctx.shadowColor = `rgb(56, 189, 248)`;
                    ctx.shadowBlur = n.value * 12;
                }

                ctx.fill();
                ctx.shadowBlur = 0; // reset
            });

            // Reset blend mode for clear text
            ctx.globalCompositeOperation = 'source-over';

            // 3. Draw Labels
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.textBaseline = 'middle';

            nodes.forEach(n => {
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isInput = n.layer === 0;
                const isWinner = isOutput && n === winningOutput;

                if (isInput) {
                    ctx.textAlign = 'right';
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.fillText(`IN_${n.index + 1}`, n.x - 15, n.y);
                    
                    // Small value badge
                    ctx.fillStyle = '#4ade80';
                    ctx.font = '10px monospace';
                    ctx.fillText(n.value.toFixed(2), n.x - 55, n.y);
                    ctx.font = '11px "JetBrains Mono", monospace'; // reset
                } 
                else if (isOutput) {
                    ctx.textAlign = 'left';
                    
                    if (isWinner) {
                        ctx.fillStyle = 'rgba(253, 224, 71, 0.15)'; // highlight bg
                        const txt = `OUT_${String.fromCharCode(65 + n.index)}`;
                        const w = ctx.measureText(txt).width;
                        ctx.roundRect(n.x + 10, n.y - 12, w + 45, 24, 4);
                        ctx.fill();
                        ctx.fillStyle = '#fde047'; // text
                        ctx.font = 'bold 11px "JetBrains Mono", monospace';
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    }
                    
                    ctx.fillText(`OUT_${String.fromCharCode(65 + n.index)}`, n.x + 15, n.y);
                    
                    ctx.fillStyle = isWinner ? '#fef08a' : '#94a3b8';
                    ctx.font = '10px monospace';
                    ctx.fillText(n.value.toFixed(2), n.x + 55, n.y);
                    ctx.font = '11px "JetBrains Mono", monospace'; // reset
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#050914] overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-full" />
            
            {/* 2D Flat Glassmorphism UI (Overlay) */}
            <div className="absolute top-8 left-8 p-6 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] min-w-[280px] font-mono">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                    <div className="relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping opacity-75"></div>
                    </div>
                    <span className="text-white font-bold uppercase tracking-widest text-[11px] opacity-90">Engine Active</span>
                </div>
                
                <div className="space-y-4 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Learning Rate</span>
                        <span className="text-cyan-300 font-medium tracking-wide">0.001</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Optimizer</span>
                        <span className="text-indigo-300 font-medium tracking-wide">AdamW</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">Architecture</span>
                        <span className="text-emerald-300 font-medium tracking-wide">2D Bezier Core</span>
                    </div>
                </div>
            </div>

            <div className="absolute top-8 right-8 flex flex-col gap-3 font-mono text-xs text-right">
                <div className="bg-white/[0.02] backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 shadow-xl flex items-center justify-between gap-6 min-w-[200px]">
                    <span className="text-slate-400 uppercase text-[10px] tracking-widest">Active Nodes</span>
                    <span className="text-white font-semibold text-sm">105</span>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 shadow-xl flex items-center justify-between gap-6 min-w-[200px]">
                    <span className="text-slate-400 uppercase text-[10px] tracking-widest">Synapses</span>
                    <span className="text-sky-400 font-semibold text-sm">1,802</span>
                </div>
                <div className="bg-white/[0.02] backdrop-blur-xl px-5 py-3 rounded-xl border border-white/10 shadow-xl flex items-center justify-between gap-6 min-w-[200px]">
                    <span className="text-slate-400 uppercase text-[10px] tracking-widest">Engine Target</span>
                    <span className="text-emerald-400 font-semibold text-sm">60 FPS</span>
                </div>
            </div>
        </div>
    );
}
