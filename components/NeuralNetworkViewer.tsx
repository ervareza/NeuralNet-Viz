'use client';

import React, { useEffect, useRef } from 'react';

const INPUTS = [
    "Hunger Level", "Food Distance", "Smell Fox", "Fox Distance", 
    "Thirst Level", "Buddy Distance", "Water Distance", "Health Level", "Day Time"
];

const OUTPUTS = [
    "Go Towards Food", "Eat", "Hide", "Flee", "Idle", "Roaming", 
    "Go Towards Water", "Drink", "Suicide", "Die", "Sex", "Alerted", "Sleep"
];

// Replicating the video's dense hidden layers
const HIDDEN_LAYERS = [18, 27, 22, 16]; 

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
}

export default function NeuralNetworkViewer() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // alpha: false can improve performance when we handle the background fill manually
        const ctx = canvas.getContext('2d', { alpha: false }); 
        if (!ctx) return;

        // --- 1. Graph Data Setup ---
        const layerSizes = [INPUTS.length, ...HIDDEN_LAYERS, OUTPUTS.length];
        const numLayers = layerSizes.length;
        
        let nodes: Node[] = [];
        let edges: Edge[] = [];

        // Initialize Nodes
        layerSizes.forEach((size, layerIdx) => {
            for(let i=0; i<size; i++) {
                nodes.push({
                    id: `l${layerIdx}-n${i}`,
                    layer: layerIdx,
                    index: i,
                    value: 0.1,
                    bias: Math.random() * 2 - 1, // Random bias between -1 and 1
                    x: 0,
                    y: 0
                });
            }
        });

        // Initialize Edges (fully connected adjacent layers)
        for(let l=0; l<numLayers - 1; l++) {
            const currentNodes = nodes.filter(n => n.layer === l);
            const nextNodes = nodes.filter(n => n.layer === l + 1);
            currentNodes.forEach(source => {
                nextNodes.forEach(target => {
                    edges.push({
                        source,
                        target,
                        // Weight tuned for visualization dynamics
                        weight: (Math.random() - 0.5) * 4 
                    });
                });
            });
        }

        // --- 2. Resize & Layout ---
        let width = 0;
        let height = 0;

        const resize = () => {
            width = container.clientWidth;
            height = container.clientHeight;
            
            // Support high-DPI displays for crisp rendering
            const dpr = window.devicePixelRatio || 1;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
            
            layout();
        };

        const layout = () => {
            const marginX = width > 800 ? 250 : 150; // Dynamic side margins based on screen
            const marginYTop = 100; // Space for the top table headers
            const marginYBottom = window.innerHeight > 800 ? 80 : 40;
            const usableWidth = width - marginX * 2;
            const usableHeight = height - marginYTop - marginYBottom;
            
            const layerSpacing = usableWidth / Math.max(1, numLayers - 1);

            nodes.forEach(n => {
                n.x = marginX + n.layer * layerSpacing;
                const count = layerSizes[n.layer];
                
                // If a layer has 1 node, center it. Otherwise distribute evenly.
                const nodeSpacing = count > 1 ? usableHeight / (count - 1) : 0;
                const startY = count > 1 ? marginYTop : marginYTop + usableHeight / 2;
                
                n.y = startY + n.index * nodeSpacing;
            });
        };

        window.addEventListener('resize', resize);
        resize();

        // --- 3. Animation & Rendering Loop ---
        let animationFrameId: number;
        let startTime = Date.now();

        const render = () => {
            const time = (Date.now() - startTime) / 1000;

            // Clear Background
            ctx.fillStyle = '#020617'; // tailwind slate-950
            ctx.fillRect(0, 0, width, height);

            // Draw subtle background grid
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 1;
            const gridSize = 40;
            ctx.beginPath();
            for(let x=0; x<=width; x+=gridSize) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
            for(let y=0; y<=height; y+=gridSize) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
            ctx.stroke();

            // -- Simulation Phase --
            
            // Generate oscillating input patterns
            nodes.filter(n => n.layer === 0).forEach((n, i) => {
                n.value = (Math.sin(time * 0.8 + i * 1.5) * Math.cos(time * 0.3 - i) + 1) / 2; 
            });

            // Propagate signals forward
            for(let l=1; l<numLayers; l++) {
                const layerNodes = nodes.filter(n => n.layer === l);
                layerNodes.forEach(target => {
                    let sum = target.bias;
                    const incomingEdges = edges.filter(e => e.target === target);
                    incomingEdges.forEach(e => {
                        sum += e.source.value * e.weight;
                    });
                    // Sigmoid activation function
                    target.value = 1 / (1 + Math.exp(-sum));
                });
            }

            // Determine the "winning" output for highlighting
            const outputNodes = nodes.filter(n => n.layer === numLayers - 1);
            let winningOutput = outputNodes[0];
            outputNodes.forEach(n => {
                if (n.value > winningOutput.value) winningOutput = n;
            });

            // -- Render Phase --

            // 1. Draw Layer Info Panels (Behind lines)
            ctx.font = '10px "JetBrains Mono", monospace';
            layerSizes.forEach((size, l) => {
                // The video skips the panel on the input layer
                if (l === 0) return; 
                
                const count = layerSizes[l];
                const nodeSpacing = count > 1 ? (height - 100 - 80) / (count - 1) : 0;
                
                // Get approximate layer X based on the first node in the layer
                const representativeNode = nodes.find(n => n.layer === l);
                if (!representativeNode) return;
                
                const panelWidth = 140;
                const px = representativeNode.x - panelWidth / 2;
                
                // Draw rounded rect panel
                ctx.fillStyle = 'rgba(30, 58, 138, 0.15)'; // tailwind blue-900 transparent
                ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)'; // tailwind blue-500
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                ctx.roundRect(px, 50, panelWidth, height - 100, 8);
                ctx.fill();
                ctx.stroke();

                // Panel Header Details
                ctx.fillStyle = 'rgba(147, 197, 253, 0.8)'; // blue-300
                ctx.textAlign = 'left';
                const layerTitle = l === numLayers - 1 ? 'Outputs' : `HL ${l}`;
                ctx.fillText(layerTitle, px + 12, 70);
                
                ctx.fillStyle = 'rgba(148, 163, 184, 0.8)'; // slate-400
                ctx.fillText(`Neurons: ${size}`, px + 12, 85);
                if (l !== numLayers - 1) {
                    ctx.fillText(`Activation: Sigmoid`, px + 12, 100);
                }
            });

            // 2. Draw Edges (Lines)
            ctx.lineWidth = 1;
            edges.forEach(e => {
                const signal = e.source.value * e.weight;
                const absSignal = Math.abs(signal);
                
                // Modulate line opacity based on how much "signal" is flowing through
                const baseOpacity = 0.03;
                const dynamicOpacity = Math.min(0.8, absSignal * 0.4);
                const isActive = dynamicOpacity > 0.3;
                
                ctx.strokeStyle = isActive 
                    ? `rgba(224, 242, 254, ${dynamicOpacity})` // Bright sky blue when active
                    : `rgba(148, 163, 184, ${baseOpacity})`;    // Dim slate otherwise

                ctx.beginPath();
                ctx.moveTo(e.source.x, e.source.y);
                ctx.lineTo(e.target.x, e.target.y);
                ctx.stroke();
            });

            // 3. Draw Nodes and Labels
            nodes.forEach(n => {
                const isOutput = n.layer === numLayers - 1;
                const isInput = n.layer === 0;
                const isWinner = isOutput && n === winningOutput;

                // Glowing Node Circle
                ctx.beginPath();
                ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = isWinner 
                    ? '#fbbf24' // Highlight winner with gold (amber-400)
                    : `rgba(255, 255, 255, ${0.3 + n.value * 0.7})`;
                
                if (n.value > 0.8 || isWinner) {
                    ctx.shadowBlur = isWinner ? 15 : 10;
                    ctx.shadowColor = isWinner ? '#fbbf24' : '#60a5fa'; // Blue glow
                } else {
                    ctx.shadowBlur = 0;
                }
                
                ctx.fill();
                ctx.shadowBlur = 0; // reset shadow early

                // Typography
                if (isInput) {
                    // Left align text, relative to node
                    ctx.textAlign = 'right';
                    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)'; // slate-200
                    ctx.fillText(INPUTS[n.index], n.x - 15, n.y + 3);
                    
                    // Simulate sensor reading value
                    ctx.fillStyle = '#4ade80'; // green-400
                    ctx.font = '9px monospace';
                    ctx.textAlign = 'left';
                    ctx.fillText(n.value.toFixed(3), n.x - 120, n.y + 3);
                    
                    // Small simulated Sine-wave icon next to input
                    const waveX = n.x - 140;
                    const waveY = n.y;
                    ctx.beginPath();
                    ctx.moveTo(waveX, waveY);
                    for(let w=0; w<=15; w++) {
                        ctx.lineTo(waveX + w, waveY + Math.sin(time*2 + w*0.5)*3);
                    }
                    ctx.strokeStyle = '#4ade80';
                    ctx.stroke();
                    
                    ctx.font = '10px "JetBrains Mono", monospace'; // Reset font
                } 
                else if (isOutput) {
                    // Right align text, relative to node
                    ctx.textAlign = 'left';
                    
                    if (isWinner) {
                        ctx.fillStyle = 'rgba(251, 191, 36, 0.2)'; 
                        const textWidth = ctx.measureText(OUTPUTS[n.index]).width;
                        ctx.fillRect(n.x + 10, n.y - 12, textWidth + 10, 20);
                        ctx.fillStyle = '#fbbf24'; // amber-400
                    } else {
                        ctx.fillStyle = 'rgba(226, 232, 240, 0.7)';
                    }
                    
                    ctx.fillText(OUTPUTS[n.index], n.x + 15, n.y + 3);

                    // Output probability value
                    ctx.fillStyle = '#94a3b8'; // slate-400
                    ctx.font = '9px monospace';
                    ctx.fillText(n.value.toFixed(3), n.x + 15, n.y + 14);
                    ctx.font = '10px "JetBrains Mono", monospace'; // Reset font
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
            <canvas ref={canvasRef} className="block w-full h-full" />
            
            {/* Minimal HUD overlay inside canvas container */}
            <div className="absolute top-4 right-6 flex flex-col md:flex-row items-end md:items-center gap-2 pointer-events-none text-xs font-mono text-slate-500">
                <span className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">FPS: 60</span>
                <span className="hidden md:inline text-slate-700">•</span>
                <span className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800">Nodes: 115</span>
                <span className="hidden md:inline text-slate-700">•</span>
                <span className="bg-slate-900/80 px-2 py-1 rounded border border-slate-800 text-blue-400/80">Params: 1,852</span>
            </div>
            
            <div className="absolute top-4 left-6 pointer-events-none text-xs font-mono">
                <div className="flex flex-col gap-1 items-start text-slate-400">
                    <span className="px-2 py-1 bg-blue-900/30 text-blue-400 rounded-md border border-blue-800/50">SIMULATION MODE</span>
                    <span className="opacity-60 ml-1">Learning Rate: 0.001</span>
                    <span className="opacity-60 ml-1">Optimizer: AdamW</span>
                </div>
            </div>
        </div>
    );
}
