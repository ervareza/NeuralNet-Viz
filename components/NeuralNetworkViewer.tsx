'use client';

import React, { useEffect, useRef, useMemo } from 'react';

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
    // For organic movement
    noiseOffsets: { x: number, y: number, z: number };
}

interface EdgeData {
    source: NodeData;
    target: NodeData;
    weight: number;
    phaseOffset: number;
}

export interface NeuralNetworkViewerProps {
    speed: number;
    glowIntensity: number;
    themePrimary: { r: number, g: number, b: number };
    themeSecondary: { r: number, g: number, b: number };
    connectionDensity: number;
    wiggleAmount: number;
}

// Simple pseudo-random hash function for noise
const hash = (n: number) => {
    n = Math.sin(n) * 43758.5453123;
    return n - Math.floor(n);
};

// Simple 1D noise for organic data generation
const noise1D = (x: number) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3.0 - 2.0 * f); // Smoothstep
    return hash(i) * (1.0 - u) + hash(i + 1) * u;
};

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
                    x: 0, y: 0,
                    noiseOffsets: {
                        x: Math.random() * 100,
                        y: Math.random() * 100,
                        z: Math.random() * 100
                    }
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
        
        // Dynamic center offset for layout
        const layoutOffset = { x: 0, y: 0 };

        let animFrameId: number;
        const startTime = Date.now();
        let lastWinner: NodeData | null = null;
        let winnerTime = 0;

        const layout = () => {
            const INPUT_PANEL_W = 160;
            const OUTPUT_PANEL_W = 140;
            const netLeft = INPUT_PANEL_W + Math.max(80, width * 0.05); // Give more breathing room on wide screens
            const netRight = width - OUTPUT_PANEL_W - Math.max(80, width * 0.05);
            const netW = netRight - netLeft;

            const marginTop = height * 0.20;
            const marginBottom = height * 0.25; 
            const usableH = height - marginTop - marginBottom;

            nodes.forEach(n => {
                const count = LAYER_SIZES[n.layer];
                const spacing = count > 1 ? Math.min(usableH / (count - 1), 35) : 0; // Cap vertical spacing
                const layerHeight = (count - 1) * spacing;
                const startY = marginTop + (usableH - layerHeight) / 2;
                
                n.y = startY + n.index * spacing;
                const tVal = NUM_LAYERS > 1 ? n.layer / (NUM_LAYERS - 1) : 0;
                n.x = netLeft + tVal * netW;
            });
            
            // Move network slightly to the right to accommodate the floating control panel on the left
            layoutOffset.x = width > 1200 ? 50 : 0; 
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

            // --- Organic Data Flow Simulation ---
            nodes.filter(n => n.layer === 0).forEach((n, i) => {
                // Combine multiple noise frequencies for a very organic "breathing/flowing" feel
                const lowFreq = noise1D(t * 0.2 + n.noiseOffsets.x);
                const highFreq = noise1D(t * 1.5 + n.noiseOffsets.y) * 0.2;
                n.value = Math.min(1, Math.max(0, (lowFreq + highFreq) * 1.5 - 0.2));
            });
            
            for (let l = 1; l < NUM_LAYERS; l++) {
                nodes.filter(n => n.layer === l).forEach(tgt => {
                    let sum = tgt.bias;
                    activeEdges.filter(e => e.target === tgt).forEach(e => { sum += e.source.value * e.weight; });
                    tgt.value = 1 / (1 + Math.exp(-sum)); // Sigmoid
                });
            }
            
            const outNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            let winner = outNodes[0];
            outNodes.forEach(n => { if (n.value > winner.value) winner = n; });
            
            if (winner !== lastWinner) {
                lastWinner = winner;
                winnerTime = elapsed; // Track when this node became the winner for explosion effect
            }

            // --- Background ---
            ctx.fillStyle = '#020813'; // Very dark, matches page bg
            ctx.fillRect(0, 0, width, height);
            
            // Central subtle glow
            const bgGlow = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width/1.5);
            bgGlow.addColorStop(0, `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.05)`);
            bgGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGlow;
            ctx.fillRect(0, 0, width, height);

            drawPerspectiveGrid(ctx, width, height, t);

            // Apply layout offset
            ctx.save();
            ctx.translate(layoutOffset.x, layoutOffset.y);

            // --- Layer Info Cards (Floating Glass look) ---
            LAYER_NAMES.forEach((name, li) => {
                if (li === 0 || li === NUM_LAYERS - 1) return;
                
                const layerNodes = nodes.filter(n => n.layer === li);
                if (layerNodes.length === 0) return;
                
                const topNodeY = layerNodes[0].y;
                const count = LAYER_SIZES[li];
                const cx = layerNodes[0].x;
                
                const cardW = 110;
                const cardH = 40;
                const cardX = cx - cardW / 2;
                // Add a slight hover animation effect using sine wave
                const floatY = Math.sin(t * 2 + li) * 3;
                const cardY = topNodeY - cardH - 25 + floatY;

                // Glass backdrop
                ctx.fillStyle = 'rgba(10, 20, 40, 0.6)';
                ctx.strokeStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.3)`;
                ctx.lineWidth = 1;
                
                // Draw pill shape
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 8);
                ctx.fill();
                
                // Top highlight border
                const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
                grad.addColorStop(0, 'rgba(255,255,255,0)');
                grad.addColorStop(0.5, 'rgba(255,255,255,0.4)');
                grad.addColorStop(1, 'rgba(255,255,255,0)');
                ctx.strokeStyle = grad;
                ctx.beginPath();
                ctx.moveTo(cardX + 8, cardY);
                ctx.lineTo(cardX + cardW - 8, cardY);
                ctx.stroke();

                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.font = 'bold 9px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(name, cx, cardY + 12);

                ctx.fillStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.8)`;
                ctx.font = '8px "JetBrains Mono", monospace';
                ctx.fillText(`${count} ${ACTIVATIONS[li]}`, cx, cardY + 26);
            });

            // --- Edges ---
            ctx.globalCompositeOperation = 'screen';
            const gI = glowIntensity / 100;
            const wA = wiggleAmount;

            activeEdges.forEach(e => {
                const signal = Math.abs(e.source.value * e.weight);
                const isStrong = signal > 1.5;
                const baseOp = 0.02 + Math.min(0.25, signal * 0.15) * gI;

                const dx = e.target.x - e.source.x;
                const wigY1 = Math.sin(t * 3 + e.phaseOffset) * wA;
                const wigY2 = Math.sin(t * 3 + e.phaseOffset + 1.5) * wA;

                const cp1x = e.source.x + dx * 0.35;
                const cp1y = e.source.y + wigY1;
                const cp2x = e.target.x - dx * 0.35;
                const cp2y = e.target.y + wigY2;

                // Flowing particles on strong connections
                if (isStrong && speed > 0) {
                    const pt = (elapsed * speed * 0.5 + e.phaseOffset) % 1;
                    const px = getBezierXY(pt, e.source.x, cp1x, cp2x, e.target.x);
                    const py = getBezierXY(pt, e.source.y, cp1y, cp2y, e.target.y);
                    
                    ctx.beginPath();
                    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${gI})`;
                    ctx.fill();
                }

                ctx.beginPath();
                ctx.moveTo(e.source.x, e.source.y);
                ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, e.target.x, e.target.y);
                
                // Color mapping: weak = themeSecondary, strong = white
                const r = isStrong ? 255 : themeSecondary.r;
                const g = isStrong ? 255 : themeSecondary.g;
                const b = isStrong ? 255 : themeSecondary.b;
                
                ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${baseOp * 0.6})`;
                ctx.lineWidth = isStrong ? 2 : 1;
                ctx.stroke();

                if (isStrong) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${baseOp * 2})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });

            ctx.globalCompositeOperation = 'source-over';
            const NODE_RADIUS = 4.5;

            // --- Nodes ---
            nodes.forEach(n => {
                const isWinner = n.layer === NUM_LAYERS - 1 && n === winner;
                
                // Pulsing ring for winner
                if (isWinner) {
                    const timeSinceWin = elapsed - winnerTime;
                    const pulseRadius = NODE_RADIUS + (timeSinceWin * 20) % 25;
                    const pulseOp = Math.max(0, 1 - (pulseRadius / 25));
                    
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(253, 224, 71, ${pulseOp * 0.8})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Node Aura
                ctx.beginPath();
                ctx.arc(n.x, n.y, NODE_RADIUS * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = isWinner 
                    ? `rgba(250, 220, 0, ${0.4 * gI})`
                    : `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${0.15 * n.value * gI})`;
                ctx.fill();

                // Node Core
                ctx.beginPath();
                ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = isWinner ? '#fde047' : '#ffffff';
                ctx.fill();
            });

            // --- Input Panel ---
            const inputNodes = nodes.filter(n => n.layer === 0);
            inputNodes.forEach((n, i) => {
                const isHighlighted = n.value > 0.8; 
                const labelRightX = n.x - NODE_RADIUS - 50; 
                const sineBoxW = 36;
                const sineBoxX = n.x - NODE_RADIUS - 10 - sineBoxW;
                
                ctx.fillStyle = isHighlighted ? `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.2)` : 'rgba(30, 40, 60, 0.3)';
                ctx.strokeStyle = isHighlighted ? `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.6)` : 'rgba(100, 150, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(sineBoxX, n.y - 10, sineBoxW, 20, 4);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                for (let w = 0; w <= sineBoxW; w++) {
                    const wx = sineBoxX + w;
                    // Connect organic data to sine wave amplitude
                    const wy = n.y + Math.sin(t * 6 + w * 0.4 + i) * 6 * n.value;
                    w === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
                }
                ctx.strokeStyle = isHighlighted ? '#fde047' : `rgb(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';
                
                if (isHighlighted) {
                    ctx.fillStyle = '#fde047';
                    const textW = ctx.measureText(INPUTS[i]).width;
                    ctx.beginPath();
                    ctx.roundRect(labelRightX - textW - 8, n.y - 12, textW + 16, 24, 4);
                    ctx.fill();
                    
                    ctx.fillStyle = '#0f172a';
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
                    ctx.fillStyle = '#fde047';
                    const textW = ctx.measureText(OUTPUTS[n.index]).width;
                    ctx.beginPath();
                    ctx.roundRect(labelX - 6, n.y - 12, textW + 16, 24, 4);
                    ctx.fill();

                    ctx.fillStyle = '#0f172a';
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

            ctx.restore(); // Restore layout translation
            animFrameId = requestAnimationFrame(render);
        };

        render();
        return () => { ro.disconnect(); cancelAnimationFrame(animFrameId); };
    }, [connectionDensity, speed, glowIntensity, themePrimary, themeSecondary, wiggleAmount, graphData]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}

// Utility for bezier particle positions
function getBezierXY(t: number, sx: number, sy: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, ex: number, ey: number) {
    return sx; // Simplified for speed, particles follow x roughly
}
function getBezierXY(t: number, p0: number, p1: number, p2: number, p3: number) {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function drawPerspectiveGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const gridTop = height * 0.70;
    const horizon = height * 0.70;
    const vpX = width * 0.5;

    ctx.save();
    // Grid matches deep blue background
    ctx.strokeStyle = 'rgba(20, 60, 140, 0.2)'; 
    ctx.lineWidth = 1;

    const numH = 16;
    for (let i = 0; i < numH; i++) {
        const scroll = (time * 0.1) % (1 / numH);
        const prog = Math.pow(((i / numH) + scroll) % 1.0, 2.0);
        const y = horizon + prog * (height - horizon);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    const numV = 28;
    for (let i = 0; i <= numV; i++) {
        const xBottom = (i / numV) * width;
        ctx.beginPath();
        ctx.moveTo(vpX, horizon);
        ctx.lineTo(xBottom, height);
        ctx.stroke();
    }

    const hgrd = ctx.createLinearGradient(0, gridTop - 20, 0, gridTop + 80);
    hgrd.addColorStop(0, 'transparent');
    hgrd.addColorStop(0.5, 'rgba(10, 40, 100, 0.4)');
    hgrd.addColorStop(1, 'transparent');
    ctx.fillStyle = hgrd;
    ctx.fillRect(0, gridTop - 20, width, 100);

    ctx.restore();
}
