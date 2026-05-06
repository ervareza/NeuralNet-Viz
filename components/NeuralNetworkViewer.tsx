'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
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

    const layerSpacing = 25; // Massive scale on Z axis
    const nodeSpacing = 3.5; // Massive scale on Y axis
    const scatter = 5; // Scatter on X axis to make it 3D volumetric

    // Create Nodes
    LAYER_SIZES.forEach((size, layerIdx) => {
        for (let i = 0; i < size; i++) {
            const x = (Math.random() - 0.5) * scatter; 
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

    // Helper colors for bloom (intensity multipliers > 1 make it bloom)
    const colorInput = useMemo(() => new THREE.Color(0.2, 1.0, 0.4).multiplyScalar(2), []);
    const colorOutputActive = useMemo(() => new THREE.Color(1.0, 0.8, 0.1).multiplyScalar(4), []);
    const colorOutputIdle = useMemo(() => new THREE.Color(0.1, 0.4, 0.8).multiplyScalar(1), []);
    const colorHiddenBase = useMemo(() => new THREE.Color(0.05, 0.1, 0.2), []);
    const colorHiddenActive = useMemo(() => new THREE.Color(0.2, 0.8, 1.0).multiplyScalar(2), []);

    useFrame((state) => {
        const time = state.clock.getElapsedTime();

        // 1. Simulation Phase
        nodes.filter(n => n.layer === 0).forEach((n, i) => {
            // Complex oscillating patterns for inputs
            n.value = (Math.sin(time * 2.5 + i * 3.0) * Math.cos(time * 1.2 - i) + 1) / 2;
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

        if (activeOutput !== winningOutput.index) {
            setActiveOutput(winningOutput.index);
        }

        // 2. Render Phase (Nodes)
        if (nodesRef.current) {
            nodes.forEach((n, i) => {
                // Floating animation for nodes
                const floatY = Math.sin(time * 2 + i) * 0.5;
                const floatX = Math.cos(time * 1.5 + i) * 0.5;
                dummy.position.set(n.position.x + floatX, n.position.y + floatY, n.position.z);

                // Scale pulse based on value
                const scale = 0.5 + Math.pow(n.value, 2) * 2.0;
                dummy.scale.set(scale, scale, scale);
                dummy.updateMatrix();
                nodesRef.current!.setMatrixAt(i, dummy.matrix);

                // Color assignment for Bloom
                const isOutput = n.layer === NUM_LAYERS - 1;
                const isWinner = isOutput && n === winningOutput;

                if (isWinner) {
                    color.copy(colorOutputActive);
                } else if (isOutput) {
                    color.copy(colorOutputIdle);
                } else if (n.layer === 0) {
                    color.copy(colorInput).multiplyScalar(n.value * 0.8 + 0.2); // Dim inputs that are low
                } else {
                    color.lerpColors(colorHiddenBase, colorHiddenActive, Math.pow(n.value, 2.0));
                }

                nodesRef.current!.setColorAt(i, color);
            });
            nodesRef.current.instanceMatrix.needsUpdate = true;
            if (nodesRef.current.instanceColor) nodesRef.current.instanceColor.needsUpdate = true;
        }

        // 3. Render Phase (Edges)
        if (edgesRef.current) {
            const colors = edgesRef.current.geometry.attributes.color.array as Float32Array;
            const positions = edgesRef.current.geometry.attributes.position.array as Float32Array;
            
            edges.forEach((e, i) => {
                // Flow effect: simulate data traveling along the line
                const distance = e.source.position.distanceTo(e.target.position);
                const flowSpeed = time * 4.0;
                const flowPattern = Math.sin(distance - flowSpeed + i * 0.1) * 0.5 + 0.5;
                
                const signal = Math.abs(e.source.value * e.weight);
                // Highlight active edges dramatically
                const intensity = Math.min(1.0, signal * 0.8) * flowPattern * 2.5;

                const r = 0.1 + intensity * 0.4;
                const g = 0.2 + intensity * 0.8;
                const b = 0.4 + intensity * 1.0;

                // Source color
                colors[i * 6] = r;
                colors[i * 6 + 1] = g;
                colors[i * 6 + 2] = b;

                // Target color
                colors[i * 6 + 3] = r * 0.2;
                colors[i * 6 + 4] = g * 0.2;
                colors[i * 6 + 5] = b * 0.2;

                // Update line positions to match floating nodes
                const floatY1 = Math.sin(time * 2 + e.source.index) * 0.5;
                const floatX1 = Math.cos(time * 1.5 + e.source.index) * 0.5;
                positions[i * 6] = e.source.position.x + floatX1;
                positions[i * 6 + 1] = e.source.position.y + floatY1;
                
                const floatY2 = Math.sin(time * 2 + e.target.index) * 0.5;
                const floatX2 = Math.cos(time * 1.5 + e.target.index) * 0.5;
                positions[i * 6 + 3] = e.target.position.x + floatX2;
                positions[i * 6 + 4] = e.target.position.y + floatY2;
            });
            edgesRef.current.geometry.attributes.color.needsUpdate = true;
            edgesRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            
            {/* Main network nodes */}
            <instancedMesh ref={nodesRef} args={[undefined, undefined, nodes.length]}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshBasicMaterial toneMapped={false} />
            </instancedMesh>

            {/* Network edges */}
            <lineSegments ref={edgesRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
                    <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
                </bufferGeometry>
                <lineBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
            </lineSegments>

            {/* 3D Labels for Inputs */}
            {nodes.filter(n => n.layer === 0).map(n => (
                <Text
                    key={`label-${n.id}`}
                    position={[n.position.x - 4, n.position.y, n.position.z]}
                    fontSize={2}
                    color="#86efac"
                    anchorX="right"
                    anchorY="middle"
                    material-toneMapped={false}
                >
                    IN_{n.index + 1}
                </Text>
            ))}

            {/* 3D Labels for Outputs */}
            {nodes.filter(n => n.layer === NUM_LAYERS - 1).map(n => {
                const isWinner = activeOutput === n.index;
                return (
                    <Text
                        key={`label-${n.id}`}
                        position={[n.position.x + 4, n.position.y, n.position.z]}
                        fontSize={isWinner ? 3.5 : 2}
                        color={isWinner ? "#fde047" : "#7dd3fc"}
                        anchorX="left"
                        anchorY="middle"
                        material-toneMapped={false}
                    >
                        OUT_{String.fromCharCode(65 + n.index)}
                    </Text>
                );
            })}
            
            {/* Post Processing for the Neon Glow (Bloom) */}
            <EffectComposer disableNormalPass multisampling={4}>
                <Bloom luminanceThreshold={0.5} mipmapBlur luminanceSmoothing={0.5} intensity={2.0} />
            </EffectComposer>
        </>
    );
};

export default function NeuralNetworkViewer() {
    return (
        <div className="w-full h-full relative cursor-crosshair">
            {/* Camera moved far back to accommodate massive scale */}
            <Canvas camera={{ position: [90, 40, 110], fov: 50 }} gl={{ antialias: false }}>
                {/* Very dark blue-black background */}
                <color attach="background" args={['#01020a']} />
                {/* Thick fog to hide edges and blend nicely */}
                <fog attach="fog" args={['#01020a', 50, 250]} />
                
                <NetworkScene />
                
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    autoRotate={true}
                    autoRotateSpeed={0.8} // Faster rotation for cinematic feel
                    maxDistance={250}
                    minDistance={30}
                />
            </Canvas>

            {/* ---------------- HUD OVERLAYS ---------------- */}
            {/* Top Right: Stats Panel */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-4 pointer-events-none text-xs font-mono">
                <div className="bg-black/30 backdrop-blur-2xl px-6 py-4 rounded-2xl border border-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02),0_8px_32px_rgba(0,0,0,0.8)] flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="opacity-40 uppercase tracking-widest text-[10px] mb-1">Nodes</span>
                        <span className="font-semibold text-white text-lg tracking-wider">105</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="opacity-40 uppercase tracking-widest text-[10px] mb-1">Synapses</span>
                        <span className="font-semibold text-cyan-400 text-lg tracking-wider">1,802</span>
                    </div>
                    <div className="w-px h-8 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="opacity-40 uppercase tracking-widest text-[10px] mb-1">FPS Target</span>
                        <span className="font-semibold text-green-400 text-lg tracking-wider">60</span>
                    </div>
                </div>
            </div>

            {/* Bottom Left: Info Panel */}
            <div className="absolute bottom-10 left-10 pointer-events-none text-xs font-mono">
                <div className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl border border-white/5 shadow-[inset_0_0_30px_rgba(255,255,255,0.03),0_20px_50px_rgba(0,0,0,0.5)] flex flex-col gap-4 w-80">
                    <div className="flex items-center gap-3 mb-2 pb-4 border-b border-white/5">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)]"></div>
                        <span className="text-white font-bold uppercase tracking-widest text-xs">Simulation Active</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                        <span className="opacity-50">Learning Rate</span>
                        <span className="text-cyan-300 font-medium bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800/30">0.001</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                        <span className="opacity-50">Optimizer</span>
                        <span className="text-purple-300 font-medium bg-purple-950/50 px-2 py-1 rounded border border-purple-800/30">AdamW</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-300">
                        <span className="opacity-50">Render Engine</span>
                        <span className="text-emerald-300 font-medium bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800/30">WebGL + Bloom</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
