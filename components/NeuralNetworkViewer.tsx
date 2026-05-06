'use client';

import React, { useEffect, useRef, useMemo } from 'react';

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
    p0: {x: number, y: number};
    p1: {x: number, y: number};
    p2: {x: number, y: number};
    p3: {x: number, y: number};
    isActive: boolean; // Pre-filter based on density
}

export interface NeuralNetworkViewerProps {
    speed: number;
    glowIntensity: number;
    themePrimary: { r: number, g: number, b: number };
    themeSecondary: { r: number, g: number, b: number };
    connectionDensity: number;
}

export default function NeuralNetworkViewer({ 
    speed, glowIntensity, themePrimary, themeSecondary, connectionDensity 
}: NeuralNetworkViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Persist graph data across re-renders
    const graphData = useMemo(() => {
        let nodes: Node[] = [];
        let edges: Edge[] = [];

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
                        p0: {x:0, y:0}, p1: {x:0, y:0}, p2: {x:0, y:0}, p3: {x:0, y:0},
                        isActive: true
                    });
                });
            });
        }
        return { nodes, edges };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        // alpha: true so the parent div's background shows through
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        const { nodes, edges } = graphData;

        // Apply connection density
        edges.forEach(e => {
            e.isActive = Math.random() * 100 <= connectionDensity;
        });

        let width = 0;
        let height = 0;

        const layout = () => {
            // Margin so nodes don't touch the very edges of the canvas
            const marginX = width * 0.15; 
            const marginYTop = height * 0.1;
            const marginYBottom = height * 0.1;
            
            const usableWidth = width - marginX * 2;
            const usableHeight = height - marginYTop - marginYBottom;
            const layerSpacing = usableWidth / Math.max(1, NUM_LAYERS - 1);

            nodes.forEach(n => {
                n.x = marginX + n.layer * layerSpacing;
                const count = LAYER_SIZES[n.layer];
                const nodeSpacing = count > 1 ? usableHeight / (count - 1) : 0;
                const startY = count > 1 ? marginYTop : marginYTop + usableHeight / 2;
                n.y = startY + n.index * nodeSpacing;
            });

            edges.forEach(e => {
                const dx = e.target.x - e.source.x;
                e.p0 = { x: e.source.x, y: e.source.y };
                e.p1 = { x: e.source.x + dx * 0.4, y: e.source.y }; 
                e.p2 = { x: e.target.x - dx * 0.4, y: e.target.y }; 
                e.p3 = { x: e.target.x, y: e.target.y };
            });
        };

        const resize = () => {
            // Match canvas size to exact container size
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

        let animationFrameId: number;
        let startTime = Date.now();

        const getBezierPoint = (t: number, p0: number, p1: number, p2: number, p3: number) => {
            const mt = 1 - t;
            return mt*mt*mt*p0 + 3*mt*mt*t*p1 + 3*mt*t*t*p2 + t*t*t*p3;
        };

        const render = () => {
            const time = (Date.now() - startTime) / 1000;

            // --- SIMULATION ---
            nodes.filter(n => n.layer === 0).forEach((n, i) => {
                n.value = (Math.sin(time * speed + i * 1.5) * Math.cos(time * (speed * 0.25) - i) + 1) / 2;
            });

            for (let l = 1; l < NUM_LAYERS; l++) {
                const layerNodes = nodes.filter(n => n.layer === l);
                layerNodes.forEach(target => {
                    let sum = target.bias;
                    const incomingEdges = edges.filter(e => e.target === target && e.isActive);
                    incomingEdges.forEach(e => {
                        sum += e.source.value * e.weight;
                    });
                    target.value = 1 / (1 + Math.exp(-sum)); 
                });
            }

            const outputNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            let winningOutput = outputNodes[0];
            outputNodes.forEach(n => {
                if (n.value > winningOutput.value) winningOutput = n;
            });

            // --- RENDERING ---
            // Clear entire canvas (transparent background)
            ctx.clearRect(0, 0, width, height);

            // Use 'lighter' for Additive Blending (Optical Glow) without shadowBlur lag
            ctx.globalCompositeOperation = 'lighter';

            const pColor = themePrimary;
            const sColor = themeSecondary;

            // 1. Draw Edges
            ctx.beginPath(); // Batch drawing for better performance
            edges.filter(e => e.isActive).forEach(e => {
                const signal = Math.abs(e.source.value * e.weight);
                const opacity = Math.min(0.5, signal * 0.15) * (glowIntensity / 100);
                
                ctx.moveTo(e.p0.x, e.p0.y);
                ctx.bezierCurveTo(e.p1.x, e.p1.y, e.p2.x, e.p2.y, e.p3.x, e.p3.y);
                
                // Base edge line (we'll just use a single stroke per pass for speed)
                ctx.strokeStyle = `rgba(${sColor.r}, ${sColor.g}, ${sColor.b}, ${opacity})`;
            });
            ctx.lineWidth = 0.8;
            ctx.stroke();

            // Flow Particles (Optical Glow layering)
            edges.filter(e => e.isActive).forEach(e => {
                const signal = Math.abs(e.source.value * e.weight);
                if (signal > 0.4) {
                    const t = (time * (speed * 0.2) + (e.source.index * 0.1 + e.target.index * 0.05)) % 1;
                    const px = getBezierPoint(t, e.p0.x, e.p1.x, e.p2.x, e.p3.x);
                    const py = getBezierPoint(t, e.p0.y, e.p1.y, e.p2.y, e.p3.y);
                    
                    const edgeOpacity = Math.min(0.5, signal * 0.15);
                    const particleOp = edgeOpacity * 4 * (glowIntensity / 100);

                    // Multi-layer optical glow (no shadowBlur)
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${particleOp})`;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(px, py, 4, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${particleOp * 0.5})`;
                    ctx.fill();

                    ctx.beginPath();
                    ctx.arc(px, py, 8, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, ${particleOp * 0.2})`;
                    ctx.fill();
                }
            });

            // 2. Draw Nodes
            nodes.forEach(n => {
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isInput = n.layer === 0;
                const isWinner = isOutput && n === winningOutput;

                const radius = isWinner ? 5 : 3.5;
                const intensity = n.value * (glowIntensity / 100);
                
                let r, g, b;
                if (isWinner) { r = 253; g = 224; b = 71; }
                else if (isInput) { r = pColor.r; g = pColor.g; b = pColor.b; }
                else if (isOutput) { r = sColor.r; g = sColor.g; b = sColor.b; }
                else {
                    // Mix primary and secondary for hidden layers based on value
                    r = pColor.r * n.value + sColor.r * (1 - n.value);
                    g = pColor.g * n.value + sColor.g * (1 - n.value);
                    b = pColor.b * n.value + sColor.b * (1 - n.value);
                }

                // Node Core
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, 0.9)`;
                ctx.fill();

                // Optical Glow Layer 1
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.5 * intensity + 0.2})`;
                ctx.fill();

                // Optical Glow Layer 2
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius * 4, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.2 * intensity})`;
                ctx.fill();
            });

            // 3. Draw Labels (Back to Normal Blending)
            ctx.globalCompositeOperation = 'source-over';
            ctx.font = '11px "JetBrains Mono", monospace';
            ctx.textBaseline = 'middle';

            nodes.forEach(n => {
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isInput = n.layer === 0;
                const isWinner = isOutput && n === winningOutput;

                if (isInput) {
                    ctx.textAlign = 'right';
                    ctx.fillStyle = 'rgba(255,255,255,0.9)';
                    ctx.fillText(`IN_${n.index + 1}`, n.x - 20, n.y);
                    
                    ctx.fillStyle = `rgba(${pColor.r}, ${pColor.g}, ${pColor.b}, 1)`;
                    ctx.font = '10px monospace';
                    ctx.fillText(n.value.toFixed(2), n.x - 60, n.y);
                    ctx.font = '11px "JetBrains Mono", monospace'; 
                } 
                else if (isOutput) {
                    ctx.textAlign = 'left';
                    
                    if (isWinner) {
                        ctx.fillStyle = 'rgba(253, 224, 71, 0.2)'; 
                        const txt = `OUT_${String.fromCharCode(65 + n.index)}`;
                        const w = ctx.measureText(txt).width;
                        ctx.roundRect(n.x + 15, n.y - 12, w + 45, 24, 6);
                        ctx.fill();
                        ctx.fillStyle = '#fde047'; 
                        ctx.font = 'bold 11px "JetBrains Mono", monospace';
                    } else {
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    }
                    
                    ctx.fillText(`OUT_${String.fromCharCode(65 + n.index)}`, n.x + 20, n.y);
                    
                    ctx.fillStyle = isWinner ? '#fef08a' : 'rgba(255,255,255,0.4)';
                    ctx.font = '10px monospace';
                    ctx.fillText(n.value.toFixed(2), n.x + 60, n.y);
                    ctx.font = '11px "JetBrains Mono", monospace'; 
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            resizeObserver.disconnect();
            cancelAnimationFrame(animationFrameId);
        };
    }, [connectionDensity, speed, glowIntensity, themePrimary, themeSecondary, graphData]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}
