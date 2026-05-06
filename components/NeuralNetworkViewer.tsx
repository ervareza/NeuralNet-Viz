'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

const INPUT_COUNT = 9;
const OUTPUT_COUNT = 13;
const HIDDEN_LAYERS = [18, 27, 22, 16];
const LAYER_SIZES = [INPUT_COUNT, ...HIDDEN_LAYERS, OUTPUT_COUNT];
const NUM_LAYERS = LAYER_SIZES.length;

// Precompute node positions
const createGraph = () => {
    const nodes: any[] = [];
    const edges: any[] = [];

    const layerSpacing = 10; // Z axis
    const nodeSpacing = 1.2; // Y axis

    // Create Nodes
    LAYER_SIZES.forEach((size, layerIdx) => {
        for (let i = 0; i < size; i++) {
            const x = (Math.random() - 0.5) * 3; // 3D scatter on X
            const y = (i - size / 2) * nodeSpacing;
            const z = (layerIdx - NUM_LAYERS / 2) * layerSpacing;

            nodes.push({
                id: `l${layerIdx}-n${i}`,
                layer: layerIdx,
                index: i,
                position: new THREE.Vector3(x, y, z),
                value: 0.1,
                bias: Math.random() * 2 - 1,
            });
        }
    });

    // Create Edges
    for (let l = 0; l < NUM_LAYERS - 1; l++) {
        const currentNodes = nodes.filter(n => n.layer === l);
        const nextNodes = nodes.filter(n => n.layer === l + 1);
        currentNodes.forEach(source => {
            nextNodes.forEach(target => {
                edges.push({
                    source,
                    target,
                    weight: (Math.random() - 0.5) * 4,
                });
            });
        });
    }

    return { nodes, edges };
};

const NetworkScene = () => {
    const { nodes, edges } = useMemo(() => createGraph(), []);

    // Refs for InstancedMesh and LineSegments
    const nodesRef = useRef<THREE.InstancedMesh>(null);
    const edgesRef = useRef<THREE.LineSegments>(null);

    const [activeOutput, setActiveOutput] = useState<number | null>(null);

    // Precompute Line Geometry Data
    const { linePositions, lineColors } = useMemo(() => {
        const positions = new Float32Array(edges.length * 6); // 2 points per edge
        const colors = new Float32Array(edges.length * 6);
        edges.forEach((edge, i) => {
            positions[i * 6] = edge.source.position.x;
            positions[i * 6 + 1] = edge.source.position.y;
            positions[i * 6 + 2] = edge.source.position.z;

            positions[i * 6 + 3] = edge.target.position.x;
            positions[i * 6 + 4] = edge.target.position.y;
            positions[i * 6 + 5] = edge.target.position.z;

            // Default color
            for (let j = 0; j < 6; j++) colors[i * 6 + j] = 0.5;
        });
        return { linePositions: positions, lineColors: colors };
    }, [edges]);

    const dummy = useMemo(() => new THREE.Object3D(), []);
    const color = useMemo(() => new THREE.Color(), []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // Simulation Phase
        nodes.filter(n => n.layer === 0).forEach((n, i) => {
            n.value = (Math.sin(time * 1.5 + i * 2.0) * Math.cos(time * 0.8 - i) + 1) / 2;
        });

        for (let l = 1; l < NUM_LAYERS; l++) {
            const layerNodes = nodes.filter(n => n.layer === l);
            layerNodes.forEach(target => {
                let sum = target.bias;
                const incomingEdges = edges.filter(e => e.target === target);
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

        if (activeOutput !== winningOutput.index) {
            setActiveOutput(winningOutput.index);
        }

        // Render Phase (Nodes)
        if (nodesRef.current) {
            nodes.forEach((n, i) => {
                dummy.position.copy(n.position);

                // Scale pulse based on value
                const scale = 0.5 + n.value * 1.5;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                nodesRef.current!.setMatrixAt(i, dummy.matrix);

                // Color based on value
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isWinner = isOutput && n === winningOutput;

                if (isWinner) {
                    color.set('#fbbf24'); // Amber for winner
                } else if (isOutput) {
                    color.set('#38bdf8'); // Light blue for other outputs
                } else if (n.layer === 0) {
                    color.set('#4ade80'); // Green for inputs
                } else {
                    // Mix between dim slate and bright blue for hidden nodes
                    color.lerpColors(new THREE.Color('#1e293b'), new THREE.Color('#38bdf8'), Math.pow(n.value, 1.5));
                }

                nodesRef.current!.setColorAt(i, color);
            });
            nodesRef.current.instanceMatrix.needsUpdate = true;
            if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
        }

        // Render Phase (Edges)
        if (edgesRef.current) {
            const colors = edgesRef.current.geometry.attributes.color.array as Float32Array;
            edges.forEach((e, i) => {
                const signal = Math.abs(e.source.value * e.weight);
                const dynamicOpacity = Math.min(1.0, signal * 0.4);

                const r = 0.1 + dynamicOpacity * 0.5;
                const g = 0.2 + dynamicOpacity * 0.7;
                const b = 0.4 + dynamicOpacity * 0.6;

                // Source color
                colors[i * 6] = r;
                colors[i * 6 + 1] = g;
                colors[i * 6 + 2] = b;

                // Target color (fade out slightly)
                colors[i * 6 + 3] = r * 0.3;
                colors[i * 6 + 4] = g * 0.3;
                colors[i * 6 + 5] = b * 0.3;
            });
            edgesRef.current.geometry.attributes.color.needsUpdate = true;
        }
    });

    return (
        <>
            <ambientLight intensity={0.8} />
            <pointLight position={[20, 20, 20]} intensity={2} color="#bae6fd" />
            <pointLight position={[-20, -20, -20]} intensity={1} color="#86efac" />

            <instancedMesh ref={nodesRef} args={[undefined, undefined, nodes.length]}>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial
                    transparent
                    opacity={0.85}
                    roughness={0.1}
                    metalness={0.9}
                    emissive="#ffffff"
                    emissiveIntensity={0.15}
                    toneMapped={false}
                />
            </instancedMesh>

            <lineSegments ref={edgesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
                    <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
                </bufferGeometry>
                <lineBasicMaterial vertexColors transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
            </lineSegments>

            {/* HTML Labels for Inputs and Outputs */}
            {nodes.filter(n => n.layer === 0).map(n => (
                <Html key={n.id} position={[n.position.x - 1, n.position.y, n.position.z]} center distanceFactor={25}>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-200 bg-white/5 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/20 shadow-[0_4px_15px_rgba(74,222,128,0.1)]">
                        <span className="text-green-400 font-semibold tracking-wider">IN_{n.index + 1}</span>
                        <span className="opacity-70">{(n.value).toFixed(2)}</span>
                    </div>
                </Html>
            ))}

            {nodes.filter(n => n.layer === NUM_LAYERS - 1).map(n => {
                const isWinner = activeOutput === n.index;
                return (
                    <Html key={n.id} position={[n.position.x + 1, n.position.y, n.position.z]} center distanceFactor={25}>
                        <div className={`transition-all duration-300 flex items-center gap-2 text-[10px] font-mono px-2.5 py-1.5 rounded-lg border backdrop-blur-md ${isWinner ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_4px_20px_rgba(251,191,36,0.3)] scale-110 z-10' : 'bg-white/5 border-white/20 text-slate-200'}`}>
                            <span className={`tracking-wider ${isWinner ? "font-bold text-amber-400" : "font-semibold text-blue-300"}`}>
                                OUT_{String.fromCharCode(65 + n.index)}
                            </span>
                            <span className="opacity-70">{(n.value).toFixed(2)}</span>
                        </div>
                    </Html>
                )
            })}
        </>
    );
};

export default function NeuralNetworkViewer() {
    return (
        <div className="w-full h-full relative cursor-crosshair">
            <Canvas camera={{ position: [25, 12, 35], fov: 45 }} gl={{ antialias: true, alpha: true }}>
                {/* Remove solid background to let the HTML background show through */}
                <fog attach="fog" args={['#020617', 25, 80]} />
                <NetworkScene />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={0.3}
                    maxDistance={70}
                    minDistance={10}
                />
            </Canvas>

            {/* Glassmorphism HUD Overlay (Top Right) */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-3 pointer-events-none text-xs font-mono">
                <div className="bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-3">
                    <span className="opacity-50">Nodes</span>
                    <span className="font-semibold text-white text-sm">105</span>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-3">
                    <span className="opacity-50">Connections</span>
                    <span className="font-semibold text-blue-400 text-sm">1,802</span>
                </div>
                <div className="bg-white/[0.03] backdrop-blur-xl px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-3">
                    <span className="opacity-50">FPS Target</span>
                    <span className="font-semibold text-green-400 text-sm">60</span>
                </div>
            </div>

            {/* Glassmorphism HUD Overlay (Top Left) */}
            <div className="absolute top-8 left-8 pointer-events-none text-xs font-mono">
                <div className="bg-white/[0.03] backdrop-blur-xl p-5 rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex flex-col gap-3 w-72">
                    <div className="flex items-center gap-3 mb-1 pb-3 border-b border-white/5">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                        <span className="text-white font-bold uppercase tracking-widest text-[11px]">Simulation Active</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="opacity-70">Learning Rate</span>
                        <span className="text-blue-300 font-medium bg-blue-500/10 px-2 py-0.5 rounded">0.001</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="opacity-70">Optimizer</span>
                        <span className="text-purple-300 font-medium bg-purple-500/10 px-2 py-0.5 rounded">AdamW</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="opacity-70">Render Engine</span>
                        <span className="text-green-300 font-medium bg-green-500/10 px-2 py-0.5 rounded">Three.js / WebGL</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
