# Active Theory — Master Technical & Visual Reference

Consolidated from: AT-REF.md (68-step teardown), activetheory.md (UI/UX research), and WebGL Implementation Spec (React/R3F stack blueprint).

---

## 1. THEME & ART DIRECTION

### Overall Aesthetic
Active Theory's site is a full-screen, real-time 3D experience disguised as a website. It is not a traditional scrollable webpage — it is a WebGL-rendered interactive world where scroll is just a camera/scene controller. The experience evokes deep-space exploration, bioluminescent underwater life, sci-fi intelligence, and premium craft. Everything is dark, cinematic, and alive. It avoids conventional "website" aesthetics entirely — there is no traditional DOM layout. Everything lives inside a single WebGL canvas. The vibe is cinematic, premium, and otherworldly — closer to a AAA game intro sequence than a typical agency portfolio. Think: interstellar observatory meets luxury tech brand.

### Color Palette
- **Primary:** Near-black `#0A0A0A–#111111` / pure `#000000` base — the deep void background
- **Secondary:** Muted off-white/light gray `rgb(244,244,244)` headings, `rgb(198,198,198)` body — used sparingly for GPU-rendered typography
- **Accent 1 — Cyan/Teal:** `rgb(0,255,255)` / `#00ffff` — link hover states, UI glows, bottom-edge atmospheric lighting, nav pill border glow
- **Accent 2 — Warm Gold/Amber:** Visible in particle systems and atmospheric edge-lighting at viewport corners, giving a deep-sea bioluminescent feel
- **Accent 3 — Iridescent/Chromatic:** Hero 3D logo uses a chromatic aberration PBR material that shifts through spectral colors (blue, magenta, red, gold) depending on view angle — shader-driven, not a fixed color
- **Accent 4 — Lavender/Periwinkle:** `rgba(156,165,255,0.333)` / `#9ca5ff` — "Work" section links and filter categories on the left rail
- **Text primary:** `#eeeeee`
- **Text muted:** `rgba(255,255,255,0.4)`
- **Text glow:** `#00ffff`
- **Border subtle:** `rgba(255,255,255,0.2)`
- **Border active:** `rgba(255,255,255,0.8)`
- **Glass bg:** `rgba(0,0,0,0.5–0.6)`

### Typography
- **Primary Font:** NB Architekt Std — monospaced, geometric, industrial typeface. Loaded in three weights (Light/300, Regular/400, Bold/700) as WOFF2 files AND JSON MSDF atlas files (for GPU-rendered text). All visible text is rendered via Multi-channel Signed Distance Field (MSDF) shaders on the WebGL canvas, not as DOM elements.
- **Hero heading** "CREATIVE DIGITAL EXPERIENCES": extremely large display size (~10–12vw equivalent)
- **Body copy** right column: ~14–16px equivalent
- **Sizing contrast:** dramatic scale difference between headline and body creates premium feel
- **Spacing:** generous letter-spacing on monospaced face gives terminal-like readability. All-caps treatment throughout.
- **Accessibility DOM layer** (`.GLA11y`): invisible `<a>` tags for screen readers, Times as fallback font — never visually displayed.
- **Recreation stack equivalent:** `troika-three-text` or `three-bmfont-text` with MSDF shader

### Negative Space & Grid
- Hero section is overwhelmingly negative space — a vast dark void with a single 3D object centered. Creates enormous sense of depth and premium feel.
- About section shifts to split composition: large headline typography anchored left/bottom, body copy anchored right/middle.
- Work/portfolio section uses left sidebar for category filters while project cards float and rotate in 3D space. No conventional CSS grid — the grid is the 3D scene's z-depth layering.

---

## 2. SCROLLING MECHANICS

### Scroll System (FXScroll)
Active Theory uses their own proprietary framework called Hydra with a custom component called `FXScroll`. This is NOT Lenis or Locomotive Scroll.

**How it works technically:**
- `<div class="FXScroll">` is a `position: fixed` container covering the full viewport with `overflow: hidden scroll`
- Inside are 6 invisible `<div class="scrollElement">` spacers with absolute positioning and heights defined in vh units — these create a virtual scroll height of ~14,500–16,923px
- Scroll position is read from this container and fed as a uniform into WebGL shaders
- The actual visual response (camera movement, parallax, element reveal) happens entirely on the GPU
- `body` and `html` both have `overflow: hidden` — native browser scroll is completely disabled

```html
<div class="FXScroll" style="
  position: fixed; top: 0; left: 0; 
  width: 100%; height: 100%; 
  z-index: 2; 
  overflow: hidden scroll;
">
  <div class="scrollElement" style="height: 420vh; position: absolute; top: 0;"></div>
  <div class="scrollElement" style="height: 105vh; position: absolute; top: 2620.8px;"></div>
  <div class="scrollElement" style="height: 1050vh; position: absolute; top: 3275.99px;"></div>
  <div class="scrollElement" style="height: 210vh; position: absolute; top: 9827.99px;"></div>
  <div class="scrollElement" style="height: 126vh; position: absolute; top: 11138.4px;"></div>
  <div class="scrollElement" style="height: 420vh; position: absolute; top: 11924.6px;"></div>
</div>
```

### Scene Sections (from scrollElement analysis)
| Section | Height | Purpose |
|---------|--------|---------|
| 0 | 420vh (~2621px) | Hero — AT logo pendant + particle field |
| 1 | 105vh (~655px) | Crossfade/transition |
| 2 | 1050vh (~6552px) | Work portfolio flythrough (longest section) |
| 3 | 210vh (~1310px) | About/capabilities |
| 4 | 126vh (~786px) | Second transition |
| 5 | 420vh (~2621px) | Contact/end section |

### Scroll Feel & Lerp
The scroll feels buttery smooth with significant inertia/easing. This is achieved through their custom TweenManager which lerps between raw scroll position and the rendered position.

**Lerp factor:** ~0.08–0.12 applied every frame. This low factor means motion never "stops" abruptly — it creates a momentum-based, spring-like follow.

```javascript
let scroll = { current: 0, target: 0 };
const LERP = 0.08;

fxScrollEl.addEventListener('scroll', () => {
  scroll.target = fxScrollEl.scrollTop;
});

function tick(dt) {
  scroll.current += (scroll.target - scroll.current) * LERP;
  const progress = scroll.current / totalScrollHeight; // 0.0 to 1.0
  camera.position.z = lerp(startZ, endZ, easedProgress);
  camera.rotation.y = lerp(startRY, endRY, easedProgress);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
```

**Recreation stack equivalent:** Lenis (by Studio Freight) with scroll position piped into shaders as a uniform.

### Parallax Effects
- Hero 3D logo moves on a different z-plane than the particle field — as you scroll, the logo descends while particles shift at different rates
- "CREATIVE DIGITAL EXPERIENCES" text scrolls at a different rate than the 3D scene behind it
- In the portfolio section, project cards exist at different z-depths and move at different scroll rates, creating a carousel-in-space effect
- Atmospheric light volumes (teal/amber edge glows) shift subtly with scroll, giving the environment a sense of breathing

### Scroll-Triggered Animations
Text reveals are scroll-driven — as you scroll past threshold points in each of the 6 sections, typography animates in with a character-by-character or word-by-word reveal. The 3D camera transitions between "scenes" at section boundaries (hero → about → work → contact).

---

## 3. WEBGL, CANVAS & ADVANCED VISUAL EFFECTS

### Rendering Engine
Active Theory uses their proprietary WebGL2 engine (NOT Three.js, NOT OGL). Key technical evidence: Hydra global framework, AntimatterUtil (custom utility library), custom Render loop manager running at 60Hz, compiled shader file (`compiled.vs`) bundling all vertex/fragment shaders.

The entire visual experience runs through `app.js` (application logic) + `modules.js` (core rendering engine). Canvas runs at native device pixel ratio (2x on Retina) — 2122x1452 on a Retina display.

WebGL state: blend enabled, depth test enabled, black clear color — classic deferred rendering setup for particles and transparent geometry.

**Recreation stack equivalent:** Three.js (most mature) or OGL (lighter, more control)

### DOM Architecture
```
body
└── #Stage (width:100%; height:100%; overflow:hidden; touch-action:none)
    ├── .GLA11y          ← Accessibility shadow-DOM layer (z-index:-1, width:0)
    │   └── .NavigationUI ← Invisible anchor tags for screen readers
    ├── .Container       ← Holds the WebGL canvas
    │   └── <canvas>     ← THE entire visual experience (pointer-events:none)
    ├── .ChatDOM         ← AI chat interface overlay (mix-blend-mode:color-dodge)
    ├── .FXScroll        ← Scroll event interceptor (z-index:2, invisible)
    │   └── .scrollElement x6
    ├── .CookieBanner    ← (display:none until triggered)
    ├── .VideoTextures   ← Hidden off-screen video elements (for texture streaming)
    ├── .VideoModal      ← Project video lightbox (display:none until triggered)
    └── .MusicPlayerDOM  ← Bottom-right music player ticker
```

### 3D Elements
- **Hero Logo:** A 3D metallic torus/ring shape with the AT "a" logo emblem at the center, sitting atop an infinity/figure-eight wire structure. Material uses PBR pipeline with chromatic/iridescent refraction — visible as rainbow color shifts across the metallic surface. Draco WASM decoder is loaded, confirming compressed GLTF/GLB 3D model loading. Has a circular chrome ring (iridescent blue-to-teal gradient, physically-based material), two crossing wire curves forming a teardrop/lens shape, slow auto-rotation + scroll-driven rotation, and iridescent/chromatic aberration material that changes color with viewing angle.
- **Hexagonal Geometry System:** 123 geometry assets loaded, many named `hexgrid/hexagon.bin` — hexagonal grid-based design language for environmental elements or particle attractors.
- **3D Jellyfish/Organic Creatures:** Floating bio-luminescent organisms in the hero section background, adding life to the deep-space/deep-ocean environment.
- **Portfolio Cards:** 3D planes with video textures floating in the WebGL scene. The `VideoTextures` DOM container holds hidden `<video>` elements whose frames are sampled as WebGL textures and mapped onto 3D card geometry. Cards have rounded corners (via shader or geometry clipping) and chromatic aberration/distortion on their edges during scroll animation. Cards rotate on their Y-axis as they enter/exit the viewport.

### Particle System
A dense GPU-instanced particle field fills the scene — thousands of small glowing particles (gold, cyan, white) with varying opacity and scale. These particles have physics-based drift and react to scroll position, creating a "swimming through a nebula" effect. Color shifts: dark green → gold → yellow-green → teal-white as scroll progresses. Particles near the camera are larger/brighter.

**Recreation technique (React/R3F stack):**
```javascript
// ~10,000–50,000 particles using THREE.Points
const count = 30000;
const geo = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 200;
}
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const mat = new THREE.PointsMaterial({ 
  size: 0.3, 
  color: new THREE.Color(0x88aa44),
  transparent: true, opacity: 0.8,
  sizeAttenuation: true 
});
scene.add(new THREE.Points(geo, mat));
```

**For massive particle count (100k+) — GPGPU/FBO Simulation:**
Use an FBO (Framebuffer Object) simulation. Store particle positions and velocities in data textures. Use a combination of Curl Noise (for fluid, swirling motion) and Distance Fields (to attract particles to the central logo shape). Use `THREE.Points` combined with a `RawShaderMaterial` or `ShaderMaterial` — NOT `InstancedMesh` for simple particles. Point sprites are much faster for this dust/energy aesthetic.

**Mouse interaction on particles:**
Pass a `uMouse` uniform (vec3, derived from a Raycaster intersecting an invisible plane) to the GPGPU shader. Use a simple distance check in the fragment shader to apply a repelling force vector, displacing particles fluidly — rather than running a full Navier-Stokes fluid simulation.

### Post-Processing / Compositing Effects
- **Chromatic Aberration / RGB Split:** Clearly visible on the 3D logo and text — red, green, and blue channels are offset, creating a prismatic fringe effect, particularly at the edges of the 3D logo.
- **Film Grain / Noise:** Subtle per-frame noise texture composited over the scene, adding analog warmth.
- **Bloom / Glow:** The particle field and nav button exhibit soft bloom — bright elements bleed light into surrounding dark areas.
- **Volumetric Light Shafts:** The teal/amber atmospheric gradients at viewport edges behave like volumetric lights (confirmed by texture names `_lightvolume/light.jpg` and `_lightvolume/light-mask.jpg`).
- **Depth of Field:** Elements at different z-depths have varying sharpness, suggesting a DOF post-processing pass.
- **Distortion/Glitch on Text:** Portfolio card titles exhibit a "double-vision" or stutter effect as they animate in — a deliberate glitch aesthetic applied via shader.
- **Rain/Grid Effect:** Behind the navigation pill, a subtle falling vertical line/rain animation — appears to be a GLSL shader effect on a small canvas region.

**Recreation stack equivalent:** `@react-three/postprocessing` with `EffectComposer`, `UnrealBloomPass`, `FilmPass`, custom ChromaticAberrationShader.

**3D Emission / Bloom setup:**
- Use `@react-three/postprocessing`. Implement `EffectComposer` with a Bloom pass.
- The central logo material should have an `emissive` color and `emissiveIntensity > 1`. The Bloom pass will catch these high values.
- To avoid the UI looking washed out, ensure the Bloom pass only affects the 3D scene.
- **Material for central logo:** Drei's `<MeshTransmissionMaterial>` configured with high `thickness`, low `roughness`, and `chromaticAberration` to achieve the high-end refractive look.

### Shaders — Iridescent/Fresnel Material (for logo)
The chrome/iridescent ring effect uses a custom GLSL shader that maps view-angle to a color gradient:
```glsl
// Fragment shader
vec3 viewDir = normalize(vViewPosition);
float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
vec3 color = mix(
  vec3(0.0, 0.5, 1.0),   // deep blue
  vec3(0.0, 1.0, 0.8),   // teal/cyan
  fresnel
);
gl_FragColor = vec4(color, 1.0);
```

### Background Reactivity
The scene subtly reacts to mouse position through the global `Mouse` object (tracking x, y, normalized coordinates, tilt, and delta). This drives slight camera orbit or parallax shift, and may also influence the light volume positions, giving the scene a subtle 3D feel even without scrolling. `Mouse` object tracks: x, y, normal (0–1 range), tilt, inverseNormal, delta, move, hold, and resetOnRelease — distinct behaviors for hover, drag, and idle states.

### Texture Pipeline
228 texture assets registered, using KTX2 compressed textures transcoded via the Basis Universal WASM transcoder — GPU-optimal compressed texture format that allows fast loading and low VRAM usage.

**Recreation stack equivalent:** Three.js `GLTFLoader` + `DRACOLoader` + `KTX2Loader`

---

## 4. TRANSITIONS & NAVIGATION

### Page Load Animation
- Site loads with a deep-black screen while WebGL context initializes and assets are decoded (Draco geometry, Basis textures, MSDF fonts)
- "SCROLL DOWN" text fades in at the center as an invitation to interact
- 3D logo fades/scales in from center with the particle field emerging around it — timed entrance sequence, not a progress-bar preloader. Cinematic: you are dropped into the void, then the scene materializes.

### Page Routing / SPA Transitions
This is a true Single Page Application built on the Hydra framework. The URL updates (from `/` to `/work` as you scroll into the portfolio) but there is zero page reload — the WebGL canvas persists across all "pages." Transitions between sections are 3D camera movements through the scene. The camera dolly-zooms through the particle field, text fades out/in, and new 3D elements enter frame — all rendered on the same persistent canvas.

**Recreation approach (React/R3F stack):**

**Single Canvas Architecture:** The `<Canvas>` component must live at the root of the React tree, completely independent of your React Router setup. It should never unmount.

**Route Hijacking / Transition Mechanics:**
1. When a user clicks a link, prevent the default navigation.
2. **Exit Timeline:** Trigger a GSAP timeline that fades out the current DOM (`div.page-content`), moving it along the Y-axis (the "bottom-to-top" feel).
3. **WebGL Sync:** Simultaneously, use GSAP to animate WebGL uniforms (e.g., `material.uniforms.uTransitionProgress.value`) to dissolve the current 3D object, or move the `camera.position` to a new coordinate space.
4. **Enter Timeline:** Once the 3D scene is positioned for the new page, mount the new DOM route and run the GSAP enter timeline.

**Recreation stack equivalent:** PJAX/Barba.js for seamless page transitions, or a lightweight SPA router.

### Navigation Menu
- The nav is a floating pill/capsule in the top-right, rendered on the WebGL canvas (not a DOM element). It has a rounded border with a subtle semi-transparent dark fill and a soft glow emanating from its bottom edge.
- Two links: "WORK" and "CONTACT", separated by a horizontal line.
- The pill has a subtle luminescent border animation — a soft white/cyan glow pulses along the border.
- On hover, the entire nav pill responds with a brightness/glow increase.
- Top-left has an audio toggle icon (speaker), also rendered on the canvas.
- Far right edge has a vertical scroll progress indicator — a small rounded rectangle/pill representing scroll position.

**Recreation CSS (DOM equivalent):**
```css
.nav-pill {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 500px;
  padding: 8px 24px;
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  gap: 20px;
  font-family: 'NBArchitekt', monospace;
  font-size: 13px;
  color: white;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
.nav-pill::after {
  content: '';
  display: inline-block;
  width: 40px;
  height: 1px;
  background: rgba(255,255,255,0.5);
}
```

---

## 5. MICRO-INTERACTIONS & UI ELEMENTS

### Cursor
There is no visible custom cursor element in the DOM — cursor interaction is handled entirely within the WebGL canvas. The default system cursor is used, but the 3D scene reacts to the `Mouse` object's position, delta, and state. Mouse movement subtly shifts the camera angle (gyroscopic parallax), creating a sense that you are looking around inside the scene.

### Buttons/Links
- Left-rail category links ("-> WEBSITES", "-> INSTALLATIONS", "-> XR / VR / AI", etc.) use the monospaced NB Architekt font in a lavender/periwinkle accent color. The `->` arrow prefix gives them a terminal/CLI aesthetic.
- Hover states involve brightness changes or subtle text scramble/glitch effects.
- "ASK ME ANYTHING..." input field has a rounded pill border, matching the nav capsule design language.

**Category links CSS:**
```css
.category-link {
  color: #9ca5ff;
  font-family: "nbarchitekt", monospace;
  font-size: 14px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  display: block;
  transition: transform 0.3s ease, color 0.3s ease;
}
.category-link:hover, .category-link.active {
  color: #ffffff;
  text-shadow: #ffffff 1px 0px 5px;
  transform: translateX(10px);
}
.arrow-prefix { color: rgba(255,255,255,0.4); }
```

### Chat / AI Assistant Interface
```css
.chat-wrapper {
  position: fixed;
  bottom: 0; left: 0;
  z-index: 3;
  width: min(450px, 100%);
  height: calc(100% - 100px);
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  mix-blend-mode: color-dodge;  /* KEY — makes text blend with WebGL */
  pointer-events: none;
  background: transparent;
}
.chat-messages {
  -webkit-mask-image: linear-gradient(to top, white 0%, white 75%, transparent 90%);
}
.chat-textarea {
  background: rgba(0,0,0,0.2);
  color: rgba(255,255,255,0.7);
  font-family: "nbarchitekt", monospace;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50px;
  padding: 14px 25px;
  transition: all 0.8s cubic-bezier(.17,.4,.02,.99);
}
.chat-textarea:focus {
  border: 2px solid rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.5);
}
```

### Music Player (bottom-right ticker)
```css
.music-ticker {
  display: inline-block;
  height: 30px;
  line-height: 30px;
  width: 80px;
  overflow: hidden;
  mix-blend-mode: color-dodge;
  opacity: 0.4;
}
.music-ticker-item {
  animation: ticker 9s linear infinite;
  font-family: "nbarchitekt", monospace;
  font-size: 10px;
  color: white;
}
@keyframes ticker {
  0%   { transform: translate3d(0, 0, 0); }
  100% { transform: translate3d(-100%, 0, 0); }
}
.music-btn { opacity: 0.3; transition: opacity 0.4s ease-out; }
.music-btn:hover { opacity: 1; }
```

**Audio notes:** `GlobalAudio3D`, `Audio3DN`, `Audio3DResonance`, `Audio3DWA` suggest spatial/3D audio capabilities — audio may be positioned in the 3D scene or use Web Audio API resonance. **Recreation stack equivalent:** Howler.js for basic, or Google Resonance Audio SDK for spatial audio.

### Custom Scrollbar
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,var(--baropacity, 0.9));
  border-radius: 10px;
}
:root { --baropacity: 0.0; } /* animates in via JS */
```

### Cookie Banner
```css
.cookie-banner {
  position: fixed;
  bottom: 20px;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px;
}
.cookie-banner button {
  border-radius: 500px;
  border: 2px solid rgba(255,255,255,0.5);
  transition: all 0.2s ease-out;
  cursor: pointer;
}
```

---

## 6. SCROLL ARCHITECTURE & INTERACTIVITY (React/R3F Stack)

### Smooth Scrolling Engine
Implement **Lenis** (by Studio Freight) — currently the most performant and modern smooth scroll library, playing extremely well with GSAP and R3F.

### DOM/Canvas Synchronization
- Do NOT use native scroll events directly inside R3F `useFrame`, as this causes layout thrashing.
- Use Lenis to track scroll progress (0 to 1). Store this progress in a lightweight state manager like **Zustand**.
- Inside your R3F components, use `useFrame` to read the Zustand store and interpolate (`THREE.MathUtils.lerp`) camera positions, object rotations, or shader uniforms based on the scroll progress.

### Recreation Scroll Driver (Three.js)
```javascript
// Foundation HTML
<body style="margin:0; background:#000; overflow:hidden;">
  <canvas id="webgl"></canvas>
  <div id="scroll-driver" style="
    position:fixed; top:0; left:0; 
    width:100%; height:100%; 
    overflow-y:scroll; z-index:10;
  ">
    <div style="height: 1500vh;"></div>
  </div>
  <nav class="pill-nav">...</nav>
  <aside class="chat-ui">...</aside>
</body>

// Smooth scroll driver
let scroll = { current: 0, target: 0 };
document.querySelector('#scroll-driver').addEventListener('scroll', e => {
  scroll.target = e.target.scrollTop;
});
function animate() {
  scroll.current += (scroll.target - scroll.current) * 0.08;
  const progress = scroll.current / maxScroll;
  updateScene(progress);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

---

## 7. DOM vs. CANVAS STRUCTURE (React/R3F Stack)

Getting the layering wrong results in broken click events or scroll hijacking issues. Architecture must be explicitly layered.

### Z-Index Blueprint
- **z-index: 0** — The Background. A solid dark color applied to the `<body>`.
- **z-index: 1** — The WebGL Canvas. Wrapped in a `div` with `position: fixed, top: 0, left: 0, width: 100vw, height: 100vh`. Ensure `pointer-events: none` is set on this container, unless the user is interacting with a specific 3D element, at which point R3F's raycaster handles the event.
- **z-index: 10** — The DOM Router. This is your scrolling HTML content. It must have `pointer-events: none` on the main container, but `pointer-events: auto` on specific interactive elements (buttons, links, text). This allows the user to click through empty space to interact with the 3D scene behind it.
- **z-index: 100** — Global Navigation. The top header is fixed and outside the router, ensuring it never unmounts.

### WebGL Setup (Three.js equivalent)
```javascript
const renderer = new THREE.WebGLRenderer({ 
  canvas, antialias: true, alpha: false 
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
```

### mix-blend-mode for HTML/WebGL fusion
The most powerful technique to make HTML elements feel part of the 3D scene:
```css
.overlay-text {
  mix-blend-mode: color-dodge;  /* Makes dark text invisible, light text glows */
  /* or */
  mix-blend-mode: screen;       /* Similar additive blend */
}
```
The `mix-blend-mode: color-dodge` on the chat wrapper is crucial — it makes purple/white text feel like it is glowing from within the 3D scene, not floating over it.

---

## 8. EASING & TRANSITIONS CHEAT SHEET

| Effect | Timing |
|--------|--------|
| Chat textarea expand | `0.8s cubic-bezier(.17,.4,.02,.99)` |
| Chat wrapper fade-in | `1000ms cubic-bezier(0.39, 0.575, 0.565, 1)` (easeOutSine) |
| Button hover | `0.4s ease-out` |
| Close button hover | `0.1s ease` |
| Cookie button | `0.2s ease-out` |
| Link hover (active) | `transform: translateX(10px)` — instant snap |
| Scroll lerp | `lerp(current, target, 0.05–0.1)` per frame |

The WebGL animation curves (scroll lerp, camera movements) are custom in JS — the signature is a low lerp factor (~0.05–0.1) applied every frame, creating a smooth spring-like follow that never quite "catches up" instantly.

---

## 9. KEY DESIGN TOKENS
```css
:root {
  --bg: #000000;
  --font-primary: 'NBArchitekt', monospace;
  --text-primary: #eeeeee;
  --text-muted: rgba(255,255,255,0.4);
  --text-accent: #9ca5ff;       /* lavender for active links */
  --text-glow: #00ffff;         /* cyan glow cursor */
  --border-subtle: rgba(255,255,255,0.2);
  --border-active: rgba(255,255,255,0.8);
  --glass-bg: rgba(0,0,0,0.5);
  --blur: blur(4px);
  --radius-pill: 500px;
  --radius-card: 12px;
  --ease-chat: cubic-bezier(.17,.4,.02,.99);
  --ease-fade: cubic-bezier(0.39, 0.575, 0.565, 1);
  --particle-color-1: #556600;  /* dark yellow-green */
  --particle-color-2: #88aa00;  /* bright yellow-green */
  --particle-color-3: #aaccff;  /* pale blue-white */
}
```

---

## 10. RECREATION STACK COMPARISON

| Layer | Active Theory Uses | React/R3F Equivalent |
|-------|-------------------|----------------------|
| WebGL Engine | Custom proprietary (Hydra + Antimatter) | Three.js (most mature) or OGL (lighter) |
| Shader Compilation | Custom `compiled.vs` shader bundle | glslify or raw GLSL with custom post-processing via Three.js EffectComposer |
| Text Rendering | MSDF font atlases rendered on GPU | `troika-three-text` or `three-bmfont-text` with MSDF shader |
| 3D Models | Draco-compressed GLTF with Basis textures | Three.js `GLTFLoader` + `DRACOLoader` + `KTX2Loader` |
| Animation/Tweening | Custom TweenManager | GSAP 3 (`gsap.to`, ScrollTrigger for scroll binding) |
| Smooth Scroll | Custom FXScroll (virtual scroll) | Lenis with scroll position piped into shaders |
| Post-Processing | Custom shader passes | `postprocessing` npm package (pmndrs) or Three.js EffectComposer with `UnrealBloomPass`, `FilmPass`, custom `ChromaticAberrationShader` |
| Particle System | Custom GPU-instanced particles | Three.js `InstancedMesh` or custom particle shader with transform feedback |
| State/Routing | Custom AppState + Gate | PJAX/Barba.js for seamless page transitions, or lightweight SPA router |
| Audio | Custom 3D audio (Web Audio API + Resonance) | Howler.js for basic, or Google Resonance Audio SDK for spatial audio |
| Build/Asset Pipeline | Hydra build system with UIL asset manager | Vite + custom GLTF/KTX2 pipeline |
| Design Tool | Theatre.js (confirmed in globals) for animation timeline editing | Theatre.js (open source) for keyframe animation |

**Key Libraries List:**
Three.js (or OGL), GSAP + ScrollTrigger, Lenis, troika-three-text, postprocessing (pmndrs), Barba.js, Theatre.js, Howler.js, Draco decoder, Basis Universal transcoder, glslify.

---

## 11. THE 3 GOLDEN RULES TO ACHIEVE THIS LEVEL OF POLISH

### Rule 1: The Canvas IS the Page — Commit Fully
Active Theory does not compromise. There is no hybrid approach where some things are DOM and some are WebGL. Everything — navigation, typography, images, scroll, interactions — lives inside the canvas. The DOM is only used for accessibility (GLA11y) and hidden infrastructure (video elements for textures, the scroll spacer). This total commitment is what makes it feel like a cohesive experience rather than "a website with some 3D on it."

If you are going this route, go all-in: render your text as MSDF on the GPU, make your buttons 3D objects with raycasting for interaction, and route transitions as camera movements through a single persistent scene.

### Rule 2: Post-Processing Is the Secret Sauce, Not the 3D Models
The 3D assets on this site are relatively simple (a torus, some cards, particles, jellyfish). What makes it feel cinematic is the compositing stack: chromatic aberration, film grain, bloom, depth of field, and volumetric light volumes. These post-processing passes are what separate a "WebGL demo" from a "premium experience."

Budget at least 40% of your development time on the post-processing pipeline. Start with bloom + grain + chromatic aberration and layer from there.

### Rule 3: Smooth Scroll Is the Skeleton — Everything Animates From It
The scroll position is the single source of truth for the entire experience. Camera position, text reveals, particle density, card rotation, section transitions — everything is a function of the normalized scroll value, interpolated through easing. Build your scroll system first, pipe it as a uniform into every shader, and derive all animation from it.

The smoothness of the lerp between raw scroll and rendered scroll (typically a `lerp(current, target, 0.07–0.12)` per frame) is what gives it that "underwater" feel. Get this right before you touch anything visual.

---

## 12. WHAT MAKES IT FEEL PREMIUM — SUMMARY CHECKLIST
- No native scroll — scroll drives a 3D camera, not the page DOM
- Lerp-smoothed scroll — the ~8% lerp factor per frame means motion never "stops" abruptly
- Particle density — thousands of volumetric particles that fill empty space
- `mix-blend-mode: color-dodge` — HTML text blends additively with the WebGL scene
- DPR-aware rendering — renders at 2x on Retina, zero blurriness
- All-caps monospace + wide tracking — instantly reads as "technical/elite"
- Video textures — project thumbnails are actual playing videos mapped onto 3D geometry
- Persistent ambient animation — even when not scrolling, everything slowly rotates and drifts
- Custom cursor — implied by `touch-action:none` and `user-select:none`
- Zero JavaScript animation libraries — pure custom WebGL + rAF = zero framework overhead, maximum performance
- Post-processing compositing stack — bloom, grain, chromatic aberration, DOF, volumetric lights
- MSDF GPU text rendering — typography is part of the 3D scene, not on top of it
- Camera movement as navigation — routing IS a camera dolly through the persistent scene
