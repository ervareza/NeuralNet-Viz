'use client';

import React, { useEffect, useRef, useMemo } from 'react';

// === EXACT labels from video ===
const INPUTS = [
    "Hunger Level", "Food Distance", "Smell Fox", "Fox Distance",
    "Thirst Level", "Buddy Distance", "Water Distance", "Health Level", "Day Time"
];
const OUTPUTS = [
    "Go Towards Food", "Eat", "Hide", "Flee", "Idle", "Roaming",
    "Go Towards Water", "Drink", "Suicide", "Die", "Sex", "Alerted", "Sleep"
];
const HIDDEN_LAYERS = [18, 27, 22, 16];
const LAYER_SIZES = [INPUTS.length, ...HIDDEN_LAYERS, OUTPUTS.length];
const NUM_LAYERS = LAYER_SIZES.length;
const LAYER_NAMES = ["Inputs", "HL 1", "HL 2", "HL 3", "HL 4", "Outputs"];
const ACTIVATIONS = ["—", "Sigmoid", "ReLU", "Tanh", "Sigmoid", "Sigmoid"];

interface NodeData {
    id: string;
    layer: number;
    index: number;
    value: number;
    bias: number;
    x: number;
    y: number;
}

interface EdgeData {
    source: NodeData;
    target: NodeData;
    weight: number;
    phaseOffset: number; // For line undulation
}

export interface NeuralNetworkViewerProps {
    speed: number;
    glowIntensity: number;
    themePrimary: { r: number, g: number, b: number };
    themeSecondary: { r: number, g: number, b: number };
    connectionDensity: number;
    wiggleAmount: number;
}

export default function NeuralNetworkViewer({
    speed, glowIntensity, themePrimary, themeSecondary, connectionDensity, wiggleAmount
}: NeuralNetworkViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const graphData = useMemo(() => {
        const nodes: NodeData[] = [];
        const edges: EdgeData[] = [];
        LAYER_SIZES.forEach((size, li) => {
            for (let i = 0; i < size; i++) {
                nodes.push({
                    id: `l${li}-n${i}`, layer: li, index: i,
                    value: 0.1, bias: Math.random() * 2 - 1,
                    x: 0, y: 0
                });
            }
        });
        for (let l = 0; l < NUM_LAYERS - 1; l++) {
            const cur = nodes.filter(n => n.layer === l);
            const nxt = nodes.filter(n => n.layer === l + 1);
            cur.forEach(s => nxt.forEach(t => edges.push({ 
                source: s, target: t, 
                weight: (Math.random() - 0.5) * 4,
                phaseOffset: Math.random() * Math.PI * 2
            })));
        }
        return { nodes, edges };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const { nodes, edges } = graphData;
        const activeEdges = edges.filter(() => Math.random() * 100 <= connectionDensity);

        let width = 0, height = 0;
        const INPUT_PANEL_W = 160;
        const OUTPUT_PANEL_W = 140;
        const NODE_RADIUS = 5;

        let animFrameId: number;
        const startTime = Date.now();

        const layout = () => {
            const netLeft = INPUT_PANEL_W + 40;
            const netRight = width - OUTPUT_PANEL_W - 40;
            const netW = netRight - netLeft;

            // Vertically center the network
            const marginTop = 80;
            const marginBottom = height * 0.25; 
            const usableH = height - marginTop - marginBottom;

            nodes.forEach(n => {
                const count = LAYER_SIZES[n.layer];
                const spacing = count > 1 ? usableH / (count - 1) : 0;
                
                // Calculate total height of this layer
                const layerHeight = (count - 1) * spacing;
                // Center it vertically within usableH
                const startY = marginTop + (usableH - layerHeight) / 2;
                
                n.y = startY + n.index * spacing;
                const tVal = NUM_LAYERS > 1 ? n.layer / (NUM_LAYERS - 1) : 0;
                n.x = netLeft + tVal * netW;
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

        const ro = new ResizeObserver(() => resize());
        ro.observe(container);
        resize();

        const render = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const t = elapsed * speed;

            // --- Simulate ---
            nodes.filter(n => n.layer === 0).forEach((n, i) => {
                n.value = (Math.sin(t * 2.1 + i * 1.7) * Math.cos(t * 0.6 - i * 0.3) + 1) / 2;
            });
            for (let l = 1; l < NUM_LAYERS; l++) {
                nodes.filter(n => n.layer === l).forEach(tgt => {
                    let sum = tgt.bias;
                    activeEdges.filter(e => e.target === tgt).forEach(e => { sum += e.source.value * e.weight; });
                    tgt.value = 1 / (1 + Math.exp(-sum));
                });
            }
            const outNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            let winner = outNodes[0];
            outNodes.forEach(n => { if (n.value > winner.value) winner = n; });

            // --- Background ---
            ctx.fillStyle = '#030d1e';
            ctx.fillRect(0, 0, width, height);
            drawPerspectiveGrid(ctx, width, height, elapsed);

            // --- Layer Info Cards ---
            const netLeft = INPUT_PANEL_W + 40;
            const netRight = width - OUTPUT_PANEL_W - 40;
            const netW = netRight - netLeft;

            LAYER_NAMES.forEach((name, li) => {
                if (li === 0 || li === NUM_LAYERS - 1) return; // Only hidden layers get top cards in video
                
                const layerNodes = nodes.filter(n => n.layer === li);
                if (layerNodes.length === 0) return;
                
                const topNodeY = layerNodes[0].y;
                const count = LAYER_SIZES[li];
                const tVal = NUM_LAYERS > 1 ? li / (NUM_LAYERS - 1) : 0;
                const cx = netLeft + tVal * netW;
                
                const cardW = 120;
                const cardH = 45;
                const cardX = cx - cardW / 2;
                // Position card just above the top node
                const cardY = topNodeY - cardH - 15;

                ctx.fillStyle = 'rgba(10, 30, 80, 0.4)';
                ctx.strokeStyle = 'rgba(80, 140, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 6);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
                ctx.font = 'bold 10px "JetBrains Mono", monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(name, cardX + 10, cardY + 8);

                ctx.fillStyle = 'rgba(150, 180, 255, 0.6)';
                ctx.font = '9px "JetBrains Mono", monospace';
                ctx.fillText(`Neurons: ${count}`, cardX + 10, cardY + 20);
                ctx.fillText(`Activation: ${ACTIVATIONS[li]}`, cardX + 10, cardY + 30);
            });

            // --- Edges ---
            ctx.globalCompositeOperation = 'screen'; // Screen blending is cleaner than lighter

            const gI = glowIntensity / 100;
            const wA = wiggleAmount;

            activeEdges.forEach(e => {
                const signal = Math.abs(e.source.value * e.weight);
                // Cap base opacity so it doesn't blow out
                const baseOp = 0.02 + Math.min(0.2, signal * 0.15) * gI;

                // Bezier curve undulation (creates the 'flowing string' look)
                const dx = e.target.x - e.source.x;
                const wigY1 = Math.sin(t * 3 + e.phaseOffset) * wA;
                const wigY2 = Math.sin(t * 3 + e.phaseOffset + 1.5) * wA;

                const cp1x = e.source.x + dx * 0.35;
                const cp1y = e.source.y + wigY1;
                const cp2x = e.target.x - dx * 0.35;
                const cp2y = e.target.y + wigY2;

                // Thick soft glow
                ctx.beginPath();
                ctx.moveTo(e.source.x, e.source.y);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, e.target.x, e.target.y);
                ctx.strokeStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${baseOp * 0.5})`;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Core sharp line
                ctx.beginPath();
                ctx.moveTo(e.source.x, e.source.y);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, e.target.x, e.target.y);
                ctx.strokeStyle = `rgba(240, 248, 255, ${baseOp * 1.8})`;
                ctx.lineWidth = 0.6;
                ctx.stroke();
            });

            ctx.globalCompositeOperation = 'source-over';

            // --- Nodes ---
            nodes.forEach(n => {
                const isWinner = n.layer === NUM_LAYERS - 1 && n === winner;
                
                // Subtle glow
                ctx.beginPath();
                ctx.arc(n.x, n.y, NODE_RADIUS * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = isWinner 
                    ? `rgba(250, 220, 0, ${0.3 * gI})`
                    : `rgba(255, 255, 255, ${0.1 * n.value * gI})`;
                ctx.fill();

                // Solid core
                ctx.beginPath();
                ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                // Small labels for hidden layers
                if (n.layer > 0 && n.layer < NUM_LAYERS - 1) {
                    ctx.fillStyle = 'rgba(150, 180, 255, 0.4)';
                    ctx.font = '6px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`n${n.index + 1}`, n.x, n.y - NODE_RADIUS - 4);
                }
            });

            // --- Input Panel ---
            const inputNodes = nodes.filter(n => n.layer === 0);
            inputNodes.forEach((n, i) => {
                // Fixed index check to match fox distance like in user screenshot
                const isHighlighted = i === 3; 

                const labelRightX = n.x - NODE_RADIUS - 50; 
                const sineBoxW = 36;
                const sineBoxX = n.x - NODE_RADIUS - 10 - sineBoxW;
                
                // Draw Sine Wave Box
                ctx.fillStyle = 'rgba(30, 80, 50, 0.3)'; // Dark green tint for sine box
                ctx.strokeStyle = 'rgba(60, 180, 100, 0.6)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(sineBoxX, n.y - 10, sineBoxW, 20, 3);
                ctx.fill();
                ctx.stroke();

                // Draw Sine Wave inside box
                ctx.beginPath();
                for (let w = 0; w <= sineBoxW; w++) {
                    const wx = sineBoxX + w;
                    const wy = n.y + Math.sin(t * 4 + w * 0.4 + i) * 6 * n.value;
                    w === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
                }
                ctx.strokeStyle = '#4ade80'; // Bright green wave
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Draw Label & Value
                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                
                if (isHighlighted) {
                    // Exact match to video: Yellow bg, dark text
                    ctx.fillStyle = '#fde047'; // Yellow bg
                    const textW = ctx.measureText(INPUTS[i]).width;
                    ctx.beginPath();
                    ctx.roundRect(labelRightX - textW - 8, n.y - 12, textW + 16, 24, 3);
                    ctx.fill();
                    
                    ctx.fillStyle = '#0f172a'; // Dark slate text
                    ctx.font = `bold 10px 'JetBrains Mono', monospace`;
                    ctx.fillText(INPUTS[i], labelRightX, n.y - 3);
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelRightX, n.y + 8);
                } else {
                    ctx.fillStyle = 'rgba(210, 230, 255, 0.9)';
                    ctx.font = `bold 10px 'JetBrains Mono', monospace`;
                    ctx.fillText(INPUTS[i], labelRightX, n.y - 3);
                    ctx.fillStyle = 'rgba(100, 150, 255, 0.8)';
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelRightX, n.y + 8);
                }
            });

            // --- Output Panel ---
            const outputNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            outputNodes.forEach((n) => {
                const isWin = n === winner;
                const labelX = n.x + NODE_RADIUS + 12;

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                if (isWin) {
                    ctx.fillStyle = '#fde047'; // Yellow bg
                    const textW = ctx.measureText(OUTPUTS[n.index]).width;
                    ctx.beginPath();
                    ctx.roundRect(labelX - 6, n.y - 12, textW + 16, 24, 3);
                    ctx.fill();

                    ctx.fillStyle = '#0f172a'; // Dark text
                    ctx.font = `bold 10px 'JetBrains Mono', monospace`;
                    ctx.fillText(OUTPUTS[n.index], labelX, n.y - 3);
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelX, n.y + 8);
                } else {
                    ctx.fillStyle = 'rgba(200, 225, 255, 0.8)';
                    ctx.font = `10px 'JetBrains Mono', monospace`;
                    ctx.fillText(OUTPUTS[n.index], labelX, n.y - 3);
                    ctx.fillStyle = 'rgba(100, 150, 255, 0.6)';
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelX, n.y + 8);
                }
            });

            animFrameId = requestAnimationFrame(render);
        };

        render();
        return () => { ro.disconnect(); cancelAnimationFrame(animFrameId); };
    }, [connectionDensity, speed, glowIntensity, themePrimary, themeSecondary, wiggleAmount, graphData]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}

// === Perspective Grid Floor ===
function drawPerspectiveGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const gridTop = height * 0.75;
    const horizon = height * 0.75;
    const vpX = width * 0.5;

    ctx.save();
    ctx.strokeStyle = 'rgba(30, 80, 160, 0.25)'; // Darker, more subtle grid
    ctx.lineWidth = 0.8;

    const numH = 14;
    for (let i = 0; i < numH; i++) {
        const scroll = (time * 0.15) % (1 / numH);
        const prog = Math.pow(((i / numH) + scroll) % 1.0, 2.0);
        const y = horizon + prog * (height - horizon);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    const numV = 24;
    for (let i = 0; i <= numV; i++) {
        const xBottom = (i / numV) * width;
        ctx.beginPath();
        ctx.moveTo(vpX, horizon);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
    }

    const hgrd = ctx.createLinearGradient(0, gridTop - 20, 0, gridTop + 50);
    hgrd.addColorStop(0, 'transparent');
    hgrd.addColorStop(0.5, 'rgba(20, 50, 120, 0.15)');
    hgrd.addColorStop(1, 'transparent');
    ctx.fillStyle = hgrd;
    ctx.fillRect(0, gridTop - 20, width, 70);

    ctx.restore();
}
