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
    // For wiggle effect - nodes themselves float slightly
    wigglePhase: number;
}

interface EdgeData {
    source: NodeData;
    target: NodeData;
    weight: number;
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
    speed, glowIntensity, themePrimary, connectionDensity, wiggleAmount
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
                    x: 0, y: 0, wigglePhase: Math.random() * Math.PI * 2
                });
            }
        });
        for (let l = 0; l < NUM_LAYERS - 1; l++) {
            const cur = nodes.filter(n => n.layer === l);
            const nxt = nodes.filter(n => n.layer === l + 1);
            cur.forEach(s => nxt.forEach(t => edges.push({ source: s, target: t, weight: (Math.random() - 0.5) * 4 })));
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
        // Layout zones (matching video proportions)
        const INPUT_PANEL_W = 200;   // input label area width
        const OUTPUT_PANEL_W = 160;  // output label area width
        const NODE_RADIUS = 6;
        const LAYER_CARD_H = 56;     // top info card height per layer

        let animFrameId: number;
        const startTime = Date.now();

        const layout = () => {
            const netLeft = INPUT_PANEL_W + 12;
            const netRight = width - OUTPUT_PANEL_W - 12;
            const netW = netRight - netLeft;

            const marginTop = LAYER_CARD_H + 24;
            const marginBottom = Math.max(height * 0.28, 100); // grid floor area
            const usableH = height - marginTop - marginBottom;

            nodes.forEach(n => {
                const count = LAYER_SIZES[n.layer];
                const spacing = count > 1 ? usableH / (count - 1) : 0;
                const startY = count > 1 ? marginTop : marginTop + usableH / 2;
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

        // === RENDER ===
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

            // Apply wiggle to node positions
            const wA = wiggleAmount;
            nodes.forEach(n => {
                n.x = n.x; // base X stays
                // We compute live wiggle offset below inline
            });

            // --- Background ---
            ctx.fillStyle = '#030d1e';
            ctx.fillRect(0, 0, width, height);

            // Subtle radial glow center
            const grd = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.4, width * 0.6);
            grd.addColorStop(0, 'rgba(15,40,100,0.5)');
            grd.addColorStop(1, 'transparent');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, width, height);

            // --- Perspective Grid (floor area below nodes) ---
            drawPerspectiveGrid(ctx, width, height, elapsed);

            // --- Layer Info Cards (glassmorphism) ---
            const netLeft = INPUT_PANEL_W + 12;
            const netRight = width - OUTPUT_PANEL_W - 12;
            const netW = netRight - netLeft;

            LAYER_NAMES.forEach((name, li) => {
                if (li === 0) return; // no card for input layer
                const count = LAYER_SIZES[li];
                const tVal = NUM_LAYERS > 1 ? li / (NUM_LAYERS - 1) : 0;
                const cx = netLeft + tVal * netW;
                const cardW = 130;
                const cardX = cx - cardW / 2;
                const cardY = 12;

                // Glass card
                ctx.save();
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = 'rgba(10, 30, 80, 0.55)';
                ctx.strokeStyle = 'rgba(100, 160, 255, 0.25)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, LAYER_CARD_H, 8);
                ctx.fill();
                ctx.stroke();
                ctx.globalAlpha = 1;
                ctx.restore();

                ctx.fillStyle = 'rgba(150, 200, 255, 0.9)';
                ctx.font = 'bold 10px "JetBrains Mono", monospace';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'top';
                ctx.fillText(name, cardX + 10, cardY + 8);

                ctx.fillStyle = 'rgba(180, 210, 255, 0.6)';
                ctx.font = '9px "JetBrains Mono", monospace';
                ctx.fillText(`Neurons: ${count}`, cardX + 10, cardY + 22);
                ctx.fillText(`Activation: ${ACTIVATIONS[li]}`, cardX + 10, cardY + 34);
            });

            // --- Edges ---
            ctx.globalCompositeOperation = 'lighter';

            activeEdges.forEach(e => {
                const signal = Math.abs(e.source.value * e.weight);
                const op = (0.06 + Math.min(0.35, signal * 0.28)) * (glowIntensity / 100);

                // Wiggle applied to both endpoints
                const wigX1 = Math.sin(elapsed * 2.5 + e.source.wigglePhase) * wA * 0.3;
                const wigY1 = Math.cos(elapsed * 2.0 + e.source.wigglePhase) * wA;
                const wigX2 = Math.sin(elapsed * 2.5 + e.target.wigglePhase + 1) * wA * 0.3;
                const wigY2 = Math.cos(elapsed * 2.0 + e.target.wigglePhase + 1) * wA;

                const sx = e.source.x + wigX1;
                const sy = e.source.y + wigY1;
                const tx = e.target.x + wigX2;
                const ty = e.target.y + wigY2;

                // Glow layer
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${op * 0.4})`;
                ctx.lineWidth = 2.5;
                ctx.stroke();

                // Core bright line
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                ctx.lineTo(tx, ty);
                ctx.strokeStyle = `rgba(220, 235, 255, ${op * 1.2})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            });

            // --- Nodes ---
            nodes.forEach(n => {
                const isInput = n.layer === 0;
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isWinner = isOutput && n === winner;

                const wigX = Math.sin(elapsed * 2.5 + n.wigglePhase) * wA * 0.3;
                const wigY = Math.cos(elapsed * 2.0 + n.wigglePhase) * wA;
                const nx = n.x + wigX;
                const ny = n.y + wigY;

                const gI = glowIntensity / 100;

                // Outer aura
                ctx.beginPath();
                ctx.arc(nx, ny, NODE_RADIUS * 3, 0, Math.PI * 2);
                ctx.fillStyle = isWinner
                    ? `rgba(250, 220, 0, ${0.15 * gI})`
                    : `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${0.08 * n.value * gI})`;
                ctx.fill();

                // Mid ring
                ctx.beginPath();
                ctx.arc(nx, ny, NODE_RADIUS * 1.6, 0, Math.PI * 2);
                ctx.fillStyle = isWinner
                    ? `rgba(255, 230, 30, ${0.4 * gI})`
                    : `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${(0.2 + n.value * 0.3) * gI})`;
                ctx.fill();

                // Core solid
                ctx.beginPath();
                ctx.arc(nx, ny, NODE_RADIUS, 0, Math.PI * 2);
                ctx.fillStyle = isWinner ? '#fde047' : 'rgba(240, 248, 255, 0.95)';
                ctx.fill();

                // Tiny label for hidden layer nodes
                if (!isInput && !isOutput) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.fillStyle = 'rgba(180, 210, 255, 0.5)';
                    ctx.font = '7px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`n${n.index + 1}`, nx, ny);
                    ctx.globalCompositeOperation = 'lighter';
                }
            });

            ctx.globalCompositeOperation = 'source-over';

            // --- Input Panel ---
            const inputNodes = nodes.filter(n => n.layer === 0);
            inputNodes.forEach((n, i) => {
                const wigY = Math.cos(elapsed * 2.0 + n.wigglePhase) * wA;
                const ny = n.y + wigY;
                const isHighlighted = n.value > 0.75; // dynamic highlight

                const panelX = 6;
                const panelW = INPUT_PANEL_W - 14;
                const panelH = 30;

                // Highlight pill
                if (isHighlighted) {
                    ctx.fillStyle = 'rgba(200, 170, 0, 0.25)';
                    ctx.strokeStyle = 'rgba(250, 210, 0, 0.5)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.roundRect(panelX, ny - panelH / 2 - 2, panelW, panelH + 4, 4);
                    ctx.fill();
                    ctx.stroke();
                }

                // Label
                ctx.fillStyle = isHighlighted ? '#fde047' : 'rgba(210, 230, 255, 0.9)';
                ctx.font = `bold 10px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(INPUTS[i], panelX + 4, ny - 7);

                // Value
                ctx.fillStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.85)`;
                ctx.font = `9px monospace`;
                ctx.fillText(n.value.toFixed(3), panelX + 4, ny + 6);

                // Mini sine wave
                const waveStartX = INPUT_PANEL_W - 56;
                const waveEndX = n.x - NODE_RADIUS - 6;
                const waveW = waveEndX - waveStartX;
                if (waveW > 0) {
                    ctx.globalCompositeOperation = 'lighter';
                    ctx.beginPath();
                    for (let w = 0; w <= waveW; w++) {
                        const wx = waveStartX + w;
                        const wy = ny + Math.sin(elapsed * speed * 5 + w * 0.28 + i * 0.8) * 5 * (0.3 + n.value * 0.7);
                        w === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
                    }
                    ctx.strokeStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.8)`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.globalCompositeOperation = 'source-over';
                }
            });

            // --- Output Panel ---
            const outputNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            outputNodes.forEach((n) => {
                const isWin = n === winner;
                const wigY = Math.cos(elapsed * 2.0 + n.wigglePhase) * wA;
                const ny = n.y + wigY;
                const nx = n.x;
                const labelX = nx + NODE_RADIUS + 8;
                const labelW = width - labelX - 4;

                // Winner highlight box (yellow, like in video)
                if (isWin) {
                    ctx.fillStyle = 'rgba(230, 190, 0, 0.3)';
                    ctx.strokeStyle = 'rgba(253, 224, 71, 0.7)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.roundRect(labelX - 4, ny - 14, labelW + 4, 28, 4);
                    ctx.fill();
                    ctx.stroke();
                }

                ctx.fillStyle = isWin ? '#fde047' : 'rgba(200, 225, 255, 0.8)';
                ctx.font = `${isWin ? 'bold ' : ''}10px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(OUTPUTS[n.index], labelX, ny - 4);

                ctx.fillStyle = isWin ? 'rgba(254, 240, 138, 0.7)' : 'rgba(180, 200, 255, 0.4)';
                ctx.font = '9px monospace';
                ctx.fillText(n.value.toFixed(3), labelX, ny + 7);
            });

            animFrameId = requestAnimationFrame(render);
        };

        render();
        return () => { ro.disconnect(); cancelAnimationFrame(animFrameId); };
    }, [connectionDensity, speed, glowIntensity, themePrimary, wiggleAmount, graphData]);

    return (
        <div ref={containerRef} className="w-full h-full relative cursor-crosshair overflow-hidden">
            <canvas ref={canvasRef} className="block w-full h-full" />
        </div>
    );
}

// === Perspective Grid Floor (exactly like video) ===
function drawPerspectiveGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    // The grid floor starts at ~72% of screen height (below network nodes)
    const gridTop = height * 0.70;
    const horizon = height * 0.70;
    const vpX = width * 0.48;

    ctx.save();
    ctx.strokeStyle = 'rgba(50, 100, 200, 0.3)';
    ctx.lineWidth = 0.7;

    // Horizontal lines (perspective scroll)
    const numH = 12;
    for (let i = 0; i < numH; i++) {
        const scroll = (time * 0.18) % (1 / numH);
        const prog = Math.pow(((i / numH) + scroll) % 1.0, 2.0);
        const y = horizon + prog * (height - horizon);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Vertical lines converging to vanishing point
    const numV = 22;
    for (let i = 0; i <= numV; i++) {
        const xBottom = (i / numV) * width;
        ctx.beginPath();
        ctx.moveTo(vpX, horizon);
        ctx.lineTo(xBottom, height * 1.05);
        ctx.stroke();
    }

    // Horizon glow
    const hgrd = ctx.createLinearGradient(0, gridTop - 30, 0, gridTop + 60);
    hgrd.addColorStop(0, 'transparent');
    hgrd.addColorStop(0.5, 'rgba(30, 70, 180, 0.12)');
    hgrd.addColorStop(1, 'transparent');
    ctx.fillStyle = hgrd;
    ctx.fillRect(0, gridTop - 30, width, 90);

    ctx.restore();
}
