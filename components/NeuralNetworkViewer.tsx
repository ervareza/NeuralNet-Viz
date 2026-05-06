'use client';

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react';

const INPUTS = [
    "Hunger Level", "Food Distance", "Smell Fox", "Fox Distance",
    "Thirst Level", "Buddy Distance", "Water Distance", "Health Level", "Day Time"
];
const OUTPUTS = [
    "Go Towards Food", "Eat", "Hide", "Flee", "Idle", "Roaming",
    "Go Towards Water", "Drink", "Suicide", "Die", "Sex", "Alerted", "Sleep"
];
// Relaksasi layout: jumlah node tersembunyi dikurangi agar lebih luas secara vertikal
const HIDDEN_LAYERS = [12, 16, 14, 10]; 
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
    onOutputUpdate?: (data: { name: string; value: number }[]) => void;
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
    const u = f * f * (3.0 - 2.0 * f); 
    return hash(i) * (1.0 - u) + hash(i + 1) * u;
};

export default function NeuralNetworkViewer({
    speed, glowIntensity, themePrimary, themeSecondary, connectionDensity, wiggleAmount,
    onOutputUpdate
}: NeuralNetworkViewerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Node inspector state
    const [hoveredNode, setHoveredNode] = useState<{
        node: NodeData;
        screenX: number;
        screenY: number;
    } | null>(null);
    const hoveredNodeRef = useRef<NodeData | null>(null);

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

    // Mouse move handler for node inspector
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const { nodes } = graphData;
        const HIT_RADIUS = 15;
        let found: NodeData | null = null;

        for (const n of nodes) {
            const dx = mx - n.x;
            const dy = my - n.y;
            if (dx * dx + dy * dy < HIT_RADIUS * HIT_RADIUS) {
                found = n;
                break;
            }
        }

        if (found) {
            setHoveredNode({ node: found, screenX: e.clientX, screenY: e.clientY });
            hoveredNodeRef.current = found;
        } else {
            setHoveredNode(null);
            hoveredNodeRef.current = null;
        }
    }, [graphData]);

    const handleMouseLeave = useCallback(() => {
        setHoveredNode(null);
        hoveredNodeRef.current = null;
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
        let animFrameId: number;
        const startTime = Date.now();
        let lastWinner: NodeData | null = null;
        let winnerTime = 0;
        let frameCount = 0;

        const layout = () => {
            const leftPanelSpace = width > 768 ? 340 : 20;
            const rightPanelSpace = width > 768 ? 290 : 20;
            // Diperlebar agar label tidak menabrak node
            const labelSpaceL = 200; 
            const labelSpaceR = 190;

            const netLeft = leftPanelSpace + labelSpaceL;
            const netRight = width - rightPanelSpace - labelSpaceR;
            const netW = Math.max(netRight - netLeft, 300);

            const marginTop = height * 0.14;
            const marginBottom = height * 0.18;
            const usableH = height - marginTop - marginBottom;

            nodes.forEach(n => {
                const count = LAYER_SIZES[n.layer];
                const spacing = count > 1 ? Math.min(usableH / (count - 1), 45) : 0;
                const layerHeight = (count - 1) * spacing;
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
            frameCount++;

            // --- Multi-Frequency Organic Noise Data Generator ---
            // Pure random organic simulation, no strict scenarios
            nodes.filter(n => n.layer === 0).forEach((n, i) => {
                const lowFreq = noise1D(t * 0.2 + n.noiseOffsets.x);
                const midFreq = noise1D(t * 0.8 + n.noiseOffsets.y) * 0.5;
                const highFreq = noise1D(t * 2.0 + n.noiseOffsets.z) * 0.2;
                
                let val = (lowFreq + midFreq + highFreq) * 1.2 - 0.1;
                n.value = Math.min(1, Math.max(0, val));
            });

            // Forward propagation
            for (let l = 1; l < NUM_LAYERS; l++) {
                nodes.filter(n => n.layer === l).forEach(tgt => {
                    let sum = tgt.bias;
                    activeEdges.filter(e => e.target === tgt).forEach(e => {
                        sum += e.source.value * e.weight;
                    });
                    tgt.value = 1 / (1 + Math.exp(-sum));
                });
            }

            const outNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            let winner = outNodes[0];
            outNodes.forEach(n => { if (n.value > winner.value) winner = n; });

            if (winner !== lastWinner) {
                lastWinner = winner;
                winnerTime = elapsed;
            }

            // Report outputs to parent (throttled)
            if (frameCount % 6 === 0 && onOutputUpdate) {
                onOutputUpdate(outNodes.map(n => ({
                    name: OUTPUTS[n.index],
                    value: n.value
                })));
            }

            // --- Background ---
            ctx.fillStyle = '#020813';
            ctx.fillRect(0, 0, width, height);

            const bgGlow = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 1.5);
            bgGlow.addColorStop(0, `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, 0.04)`);
            bgGlow.addColorStop(1, 'transparent');
            ctx.fillStyle = bgGlow;
            ctx.fillRect(0, 0, width, height);

            drawPerspectiveGrid(ctx, width, height, t);

            // Fetch active node for interactive highlight
            const activeNode = hoveredNodeRef.current;

            // --- Layer Info Cards ---
            LAYER_NAMES.forEach((name, li) => {
                if (li === 0 || li === NUM_LAYERS - 1) return;
                const layerNodes = nodes.filter(n => n.layer === li);
                if (layerNodes.length === 0) return;

                const topNodeY = layerNodes[0].y;
                const count = LAYER_SIZES[li];
                const cx = layerNodes[0].x;

                const cardW = 115;
                const cardH = 42;
                const cardX = cx - cardW / 2;
                const floatY = Math.sin(t * 2 + li) * 2;
                const cardY = topNodeY - cardH - 20 + floatY;

                const isLayerActive = activeNode && activeNode.layer === li;
                const cardOp = activeNode && !isLayerActive ? 0.3 : 0.6;

                ctx.fillStyle = `rgba(10, 20, 40, ${cardOp})`;
                ctx.beginPath();
                ctx.roundRect(cardX, cardY, cardW, cardH, 8);
                ctx.fill();

                const textOp = activeNode && !isLayerActive ? 0.4 : 0.9;
                ctx.fillStyle = `rgba(255, 255, 255, ${textOp})`;
                ctx.font = 'bold 10px "JetBrains Mono", monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(name, cx, cardY + 13);

                ctx.fillStyle = `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${activeNode && !isLayerActive ? 0.3 : 0.7})`;
                ctx.font = '9px "JetBrains Mono", monospace';
                ctx.fillText(`${count} ${ACTIVATIONS[li]}`, cx, cardY + 28);
            });

            // --- Edges ---
            ctx.globalCompositeOperation = 'screen';
            const gI = glowIntensity / 100;
            const wA = wiggleAmount;

            activeEdges.forEach(e => {
                // Determine if edge is connected to hovered node
                const isRelatedToActive = !activeNode || e.source === activeNode || e.target === activeNode;
                
                const signal = Math.abs(e.source.value * e.weight);
                const isStrong = signal > 1.5 && isRelatedToActive;
                
                // Aggressively dim unrelated edges
                const baseOp = isRelatedToActive 
                    ? (0.04 + Math.min(0.25, signal * 0.15) * gI) 
                    : 0.005; // almost invisible

                const dx = e.target.x - e.source.x;
                const wigY1 = Math.sin(t * 3 + e.phaseOffset) * wA;
                const wigY2 = Math.sin(t * 3 + e.phaseOffset + 1.5) * wA;

                const cp1x = e.source.x + dx * 0.35;
                const cp1y = e.source.y + wigY1;
                const cp2x = e.target.x - dx * 0.35;
                const cp2y = e.target.y + wigY2;

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

                const cr = isStrong ? 255 : themeSecondary.r;
                const cg = isStrong ? 255 : themeSecondary.g;
                const cb = isStrong ? 255 : themeSecondary.b;

                ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${isRelatedToActive ? baseOp * 0.6 : baseOp})`;
                ctx.lineWidth = isStrong ? 2 : 1;
                ctx.stroke();

                if (isStrong) {
                    ctx.strokeStyle = `rgba(255, 255, 255, ${baseOp * 2})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });

            ctx.globalCompositeOperation = 'source-over';
            const NODE_RADIUS = 5.5;

            // --- Nodes ---
            nodes.forEach(n => {
                const isWinner = n.layer === NUM_LAYERS - 1 && n === winner;
                const isHovered = activeNode === n;
                const isRelatedToActive = !activeNode || isHovered || activeEdges.some(e => 
                    (e.source === n && e.target === activeNode) || 
                    (e.target === n && e.source === activeNode)
                );
                
                const nodeOpMultiplier = isRelatedToActive ? 1 : 0.15;

                if (isWinner) {
                    const timeSinceWin = elapsed - winnerTime;
                    const pulseRadius = NODE_RADIUS + (timeSinceWin * 20) % 25;
                    const pulseOp = Math.max(0, 1 - (pulseRadius / 25)) * nodeOpMultiplier;
                    ctx.beginPath();
                    ctx.arc(n.x, n.y, pulseRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(253, 224, 71, ${pulseOp * 0.8})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Node Aura
                ctx.beginPath();
                ctx.arc(n.x, n.y, NODE_RADIUS * (isHovered ? 3.5 : 2.5), 0, Math.PI * 2);
                ctx.fillStyle = isWinner
                    ? `rgba(250, 220, 0, ${0.4 * gI * nodeOpMultiplier})`
                    : `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${0.15 * n.value * gI * nodeOpMultiplier})`;
                ctx.fill();

                // Node Core
                ctx.beginPath();
                ctx.arc(n.x, n.y, NODE_RADIUS * (isHovered ? 1.5 : 1), 0, Math.PI * 2);
                ctx.fillStyle = isWinner 
                    ? `rgba(253, 224, 71, ${nodeOpMultiplier})` 
                    : `rgba(255, 255, 255, ${nodeOpMultiplier})`;
                ctx.fill();
            });

            // --- Input Panel ---
            const inputNodes = nodes.filter(n => n.layer === 0);
            inputNodes.forEach((n, i) => {
                const isHighlighted = n.value > 0.75;
                const isRelatedToActive = !activeNode || activeNode === n || activeEdges.some(e => e.source === n && e.target === activeNode);
                const opMult = isRelatedToActive ? 1 : 0.2;

                const labelRightX = n.x - NODE_RADIUS - 65; // Pushed further left
                const sineBoxW = 36;
                const sineBoxX = n.x - NODE_RADIUS - 15 - sineBoxW; // Sine box pushed left too

                ctx.fillStyle = isHighlighted 
                    ? `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${0.2 * opMult})` 
                    : `rgba(30, 40, 60, ${0.3 * opMult})`;
                ctx.strokeStyle = isHighlighted 
                    ? `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${0.6 * opMult})` 
                    : `rgba(100, 150, 255, ${0.15 * opMult})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.roundRect(sineBoxX, n.y - 10, sineBoxW, 20, 4);
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                for (let w = 0; w <= sineBoxW; w++) {
                    const wx = sineBoxX + w;
                    const wy = n.y + Math.sin(t * 6 + w * 0.4 + i) * 6 * n.value;
                    w === 0 ? ctx.moveTo(wx, wy) : ctx.lineTo(wx, wy);
                }
                ctx.strokeStyle = isHighlighted 
                    ? `rgba(253, 224, 71, ${opMult})` 
                    : `rgba(${themePrimary.r}, ${themePrimary.g}, ${themePrimary.b}, ${opMult})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.textAlign = 'right';
                ctx.textBaseline = 'middle';

                if (isHighlighted) {
                    ctx.fillStyle = `rgba(253, 224, 71, ${opMult})`;
                    const textW = ctx.measureText(INPUTS[i]).width;
                    ctx.beginPath();
                    ctx.roundRect(labelRightX - textW - 8, n.y - 13, textW + 16, 26, 4);
                    ctx.fill();

                    ctx.fillStyle = `rgba(15, 23, 42, ${opMult})`;
                    ctx.font = `bold 11px 'JetBrains Mono', monospace`;
                    ctx.fillText(INPUTS[i], labelRightX, n.y - 3);
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelRightX, n.y + 8);
                } else {
                    ctx.fillStyle = `rgba(210, 230, 255, ${0.9 * opMult})`;
                    ctx.font = `bold 11px 'JetBrains Mono', monospace`;
                    ctx.fillText(INPUTS[i], labelRightX, n.y - 3);
                    ctx.fillStyle = `rgba(100, 150, 255, ${0.8 * opMult})`;
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelRightX, n.y + 8);
                }
            });

            // --- Output Panel ---
            const outputNodes = nodes.filter(n => n.layer === NUM_LAYERS - 1);
            outputNodes.forEach((n) => {
                const isWin = n === winner;
                const isRelatedToActive = !activeNode || activeNode === n || activeEdges.some(e => e.target === n && e.source === activeNode);
                const opMult = isRelatedToActive ? 1 : 0.2;

                const labelX = n.x + NODE_RADIUS + 25; // Pushed further right

                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';

                if (isWin) {
                    ctx.fillStyle = `rgba(253, 224, 71, ${opMult})`;
                    const textW = ctx.measureText(OUTPUTS[n.index]).width;
                    ctx.beginPath();
                    ctx.roundRect(labelX - 6, n.y - 13, textW + 16, 26, 4);
                    ctx.fill();

                    ctx.fillStyle = `rgba(15, 23, 42, ${opMult})`;
                    ctx.font = `bold 11px 'JetBrains Mono', monospace`;
                    ctx.fillText(OUTPUTS[n.index], labelX, n.y - 3);
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelX, n.y + 8);
                } else {
                    ctx.fillStyle = `rgba(200, 225, 255, ${0.8 * opMult})`;
                    ctx.font = `11px 'JetBrains Mono', monospace`;
                    ctx.fillText(OUTPUTS[n.index], labelX, n.y - 3);
                    ctx.fillStyle = `rgba(100, 150, 255, ${0.6 * opMult})`;
                    ctx.font = `9px monospace`;
                    ctx.fillText(n.value.toFixed(3), labelX, n.y + 8);
                }
            });

            animFrameId = requestAnimationFrame(render);
        };

        render();
        return () => { ro.disconnect(); cancelAnimationFrame(animFrameId); };
    }, [connectionDensity, speed, glowIntensity, themePrimary, themeSecondary, wiggleAmount, graphData, onOutputUpdate]);

    const getNodeName = (node: NodeData) => {
        if (node.layer === 0) return INPUTS[node.index];
        if (node.layer === NUM_LAYERS - 1) return OUTPUTS[node.index];
        return `${LAYER_NAMES[node.layer]} — Neuron ${node.index + 1}`;
    };

    return (
        <div
            ref={containerRef}
            className="w-full h-full relative cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Node Inspector Tooltip */}
            {hoveredNode && (
                <div
                    className="fixed z-[100] pointer-events-none"
                    style={{
                        left: hoveredNode.screenX + 16,
                        top: hoveredNode.screenY - 10,
                    }}
                >
                    <div
                        className="px-4 py-3 rounded-xl border text-xs font-mono space-y-1.5"
                        style={{
                            background: 'rgba(6, 14, 36, 0.9)',
                            backdropFilter: 'blur(20px)',
                            borderColor: `rgba(${themePrimary.r},${themePrimary.g},${themePrimary.b},0.3)`,
                            boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 20px rgba(${themePrimary.r},${themePrimary.g},${themePrimary.b},0.1)`,
                        }}
                    >
                        <div className="text-white font-semibold text-[11px]">
                            {getNodeName(hoveredNode.node)}
                        </div>
                        <div className="h-px bg-white/10" />
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                            <span className="text-slate-500">Activation</span>
                            <span style={{ color: `rgb(${themePrimary.r},${themePrimary.g},${themePrimary.b})` }}>
                                {hoveredNode.node.value.toFixed(4)}
                            </span>
                            <span className="text-slate-500">Bias</span>
                            <span className="text-slate-300">{hoveredNode.node.bias.toFixed(4)}</span>
                            <span className="text-slate-500">Layer</span>
                            <span className="text-slate-300">{LAYER_NAMES[hoveredNode.node.layer]}</span>
                            <span className="text-slate-500">Index</span>
                            <span className="text-slate-300">#{hoveredNode.node.index}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function getBezierXY(t: number, p0: number, p1: number, p2: number, p3: number) {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function drawPerspectiveGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
    const horizon = height * 0.72;
    const vpX = width * 0.5;

    ctx.save();
    ctx.strokeStyle = 'rgba(20, 60, 140, 0.18)';
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

    const hgrd = ctx.createLinearGradient(0, horizon - 20, 0, horizon + 60);
    hgrd.addColorStop(0, 'transparent');
    hgrd.addColorStop(0.5, 'rgba(10, 40, 100, 0.25)');
    hgrd.addColorStop(1, 'transparent');
    ctx.fillStyle = hgrd;
    ctx.fillRect(0, horizon - 20, width, 80);

    ctx.restore();
}
