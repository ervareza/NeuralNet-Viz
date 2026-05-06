## [v0.2.0] - 2026-05-07

### Added
- Three.js dependencies (`three`, `@react-three/fiber`, `@react-three/drei`)
- 3D rendering engine for the Neural Network visualizer
- Dynamic glowing sphere nodes (InstancedMesh) and animated connection edges (LineSegments)
- Glassmorphism Sci-Fi HUD overlay with real-time stats

### Changed
- Replaced 2D HTML5 Canvas rendering in `NeuralNetworkViewer.tsx` with full 3D WebGL context
- Redesigned `page.tsx` layout to emphasize depth and "glass" aesthetics (`backdrop-blur-xl`, semi-transparent borders)
- Changed input/output labels to be generic (`IN_1` to `IN_9`, `OUT_A` to `OUT_M`) instead of specific animal behavior strings
