## [v0.3.0] - 2026-05-07

### Added
- Integrated `@react-three/postprocessing` for high-end cinematic Bloom effects.
- Added 3D Floating Node animations and dynamic light/particle flows along the synaptic connections.
- Substituted overlapping `Html` DOM labels with native 3D `Text` from `@react-three/drei` for inputs and outputs.

### Changed
- Massively increased the scale and spatial distribution of the Neural Network layout (`layerSpacing` and `nodeSpacing`), ensuring it completely fills the 3D space rather than grouping in the center.
- Refined the Glassmorphism UI in `page.tsx` with deeper blur, inset shadow highlights, and ultra-premium color palettes to achieve an authentic "Sci-Fi Spaceship HUD" look.

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
