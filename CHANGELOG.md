## [v0.5.0] - 2026-05-07

### Added
- **Full Customization Panel**: A dedicated Glassmorphism sidebar added to the left to control the visualization in real-time.
- Interactive controls for Flow Speed, Optical Glow Intensity, Synapse Density, and multiple Visual Themes (Cyber Cyan, Neon Purple, Solar Flare).
- True Glassmorphism aesthetic utilizing animated background mesh gradients that properly refract through `backdrop-blur` panels.

### Changed
- **Layout Architecture**: The visualization canvas now intelligently sits inside a flex container next to the sidebar, completely fixing the UI overlapping/collision ("nabrak") issues. The network perfectly centers itself in the available space.
- **Zero-Lag Rendering**: Removed `ctx.shadowBlur` completely (which forces software rendering in many browsers) and replaced it with a multi-layered Optical Glow engine utilizing `globalCompositeOperation = 'lighter'`. This guarantees ultra-smooth 60 FPS hardware acceleration even with thousands of bezier curves and flowing particles.

## [v0.4.0] - 2026-05-07

### Removed
- Uninstalled all 3D dependencies (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`) completely restarting the rendering approach from zero.

### Added
- Created a pure 2D HTML5 Canvas rendering engine for the Neural Network visualizer.
- Implemented smooth Bezier Curves (`bezierCurveTo`) for all 1,802 synaptic connections, replacing straight lines.
- Implemented animated "data flow particles" that travel along the cubic bezier paths between layers.
- Added native Canvas API `shadowBlur` and `globalCompositeOperation = 'lighter'` for high-performance 2D neon glow without WebGL shaders.

### Changed
- Re-aligned all UI panels to an ultra-flat, clean 2D glassmorphism aesthetic matching a modern premium web application.
- Rendered `IN_` and `OUT_` labels natively inside the Canvas API to eliminate HTML overlapping and ensure pixel-perfect alignment.

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
