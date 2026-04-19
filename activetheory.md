Active Theory (activetheory.net) — Comprehensive UI/UX & Animation Research Report

1. OVERALL VIBE & DESIGN PHILOSOPHY
Active Theory's site is a full-screen, real-time 3D experience disguised as a website. It's not a traditional scrollable webpage — it's a WebGL-rendered interactive world where scroll is just a camera/scene controller. The experience evokes: deep-space exploration, bioluminescent underwater life, sci-fi intelligence, and premium craft. Everything is dark, cinematic, and alive.
Core aesthetic pillars:

Deep black/near-black backgrounds (#000000 base)
Iridescent, chromatic, holographic materials (metallic rings, shifting blues/purples/teals/golds)
Particle systems that drift, float, and react to scroll (gold/green bioluminescent dots)
3D objects from their client work floating in "space" (ECHO, Racer, Sustainable Horizons, etc.)
Monospace/tech typography — all caps, wide letter spacing, sci-fi terminal aesthetic
Minimal, floating UI that doesn't fight the canvas
Mix-blend-mode tricks to make HTML text feel part of the WebGL world


2. TECHNICAL ARCHITECTURE (how it actually works)
Rendering Engine
The entire visual experience runs through a custom proprietary WebGL 2.0 renderer — no Three.js, no Babylon, no Pixi, no GSAP. It's a bespoke engine built by Active Theory, bundled into two files:

app.js — application logic, scenes, UI components
modules.js — the core rendering engine/framework

The canvas runs at native device pixel ratio (2× on retina) — 1642×1248px at 2× DPR on a 821×624 CSS viewport.
WebGL state: blend enabled, depth test enabled, black clear color — classic deferred rendering setup for particles and transparent geometry.
The Scroll System (FXScroll)
This is the secret to the buttery smooth experience. They use a virtual scroll driver pattern:
html<div class="FXScroll" style="
  position: fixed; top: 0; left: 0; 
  width: 100%; height: 100%; 
  z-index: 2; 
  overflow: hidden scroll;
">
  <!-- Empty scroll spacers define scene lengths -->
  <div class="scrollElement" style="height: 420vh; position: absolute; top: 0;"></div>
  <div class="scrollElement" style="height: 105vh; position: absolute; top: 2620.8px;"></div>
  <div class="scrollElement" style="height: 1050vh; position: absolute; top: 3275.99px;"></div>
  <div class="scrollElement" style="height: 210vh; position: absolute; top: 9827.99px;"></div>
  <div class="scrollElement" style="height: 126vh; position: absolute; top: 11138.4px;"></div>
  <div class="scrollElement" style="height: 420vh; position: absolute; top: 11924.6px;"></div>
</div>
```

The FXScroll div is a transparent, fixed, full-screen overlay that **only captures scroll events**. It has no visible content. The 6 invisible `scrollElement` children stack together to create a total virtual scroll height of ~14,500px. The JS engine reads `FXScroll.scrollTop` every rAF tick, maps it to a scene progress value (0.0–1.0), and drives the 3D camera/scene transitions. **The actual page never scrolls** — it stays fixed, and the WebGL scene responds.

### Scene Sections (from scrollElement analysis):
| Section | Height | Purpose |
|---|---|---|
| 0 | 420vh (~2621px) | Hero — AT logo pendant + particle field |
| 1 | 105vh (~655px) | Crossfade/transition |
| 2 | 1050vh (~6552px) | Work portfolio flythrough (longest section) |
| 3 | 210vh (~1310px) | About/capabilities |
| 4 | 126vh (~786px) | Second transition |
| 5 | 420vh (~2621px) | Contact/end section |

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
    │   └── .scrollElement × 6
    ├── .CookieBanner    ← (display:none until triggered)
    ├── .VideoTextures   ← Hidden off-screen video elements (for texture streaming)
    ├── .VideoModal      ← Project video lightbox (display:none until triggered)
    └── .MusicPlayerDOM  ← Bottom-right music player ticker

3. SCROLL-DRIVEN CAMERA ANIMATION
The core of what feels so smooth is the lerping (linear interpolation) of scroll progress to camera state. Here's how to recreate it:
javascript// The pattern they use:
let currentScroll = 0;
let targetScroll = 0;

fxScrollEl.addEventListener('scroll', () => {
  targetScroll = fxScrollEl.scrollTop;
});

function tick(dt) {
  // Smooth lerp — this creates the "inertia" feel
  // ~0.08–0.12 lerp factor gives their signature smoothness
  currentScroll += (targetScroll - currentScroll) * 0.08;

  const progress = currentScroll / totalScrollHeight; // 0.0 to 1.0

  // Map progress to camera position/rotation via keyframes
  camera.position.z = lerp(startZ, endZ, easedProgress);
  camera.rotation.y = lerp(startRY, endRY, easedProgress);

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
The easing applied on top of the lerp creates the "falling through space" sensation — it's not linear, it accelerates and decelerates based on scroll velocity.

4. VISUAL EFFECTS BREAKDOWN
Particle System
Thousands of volumetric particles drifting through 3D space. Properties:

Color shifts: dark green → gold → yellow-green → teal-white as scroll progresses
Particles have varying sizes, opacity, and depth
They react to the camera's current position — particles near the "camera" are larger/brighter
This is likely a GPU-instanced particle system rendered in WebGL with billboarding

3D Objects / Scene Assets
High-quality pre-rendered 3D models of their client work appear as "physical objects" in the space — displayed as flat video textures on geometry. The .VideoTextures div holds hidden <video> elements that are used as texture sources for the WebGL scene. Each portfolio card is a textured mesh plane in 3D space with:

Rounded corners (via UV-mapped mask or SDF technique)
Subtle environment reflections
Parallax depth on scroll

Logo Pendant
The central AT logo is a 3D metallic object with:

A circular chrome ring (iridescent blue-to-teal gradient, physically-based material)
Two crossing wire curves forming a teardrop/lens shape behind it
Slow auto-rotation + scroll-driven rotation
Iridescent/chromatic aberration material — the color changes with viewing angle
The color palette shifts dramatically during scroll (dark → bright blue → gold)

Rain/Grid Effect (top-right nav area)
Behind the navigation pill, there's a subtle falling vertical line/rain animation — appears to be a GLSL shader effect on a small canvas region or a WebGL overlay.

5. TYPOGRAPHY & FONTS
Primary font: NBArchitekt (NB Architekt Std) — a geometric, sci-fi monospaced display typeface. Three weights loaded:

Regular (400)
Light (300)
Bold (700)

All text is uppercase, with wide letter-spacing. This font is available from Neubau Berlin.
Usage patterns:

Navigation links: NBArchitekt 400, ~14px, uppercase, all-caps, tracked wide
Chat/AI overlay: "nbarchitekt", monospace, 14px, 400 weight, line-height 1.5
Category links: NBArchitekt, monospace, ~12–14px, cyan/purple colors
Music ticker: NBArchitekt, 10px, 400 weight, white

Color palette for text:

Primary white: #eeeeee
Active/hover: #ffffff with text-shadow: #fff 1px 0px 5px
Category links: #9ca5ff (soft periwinkle/lavender)
Cyan accent: #00ffff (cursor blink, highlights)


6. UI COMPONENT DETAILS
Navigation Pill (top-right)
The pill is rendered entirely on the WebGL canvas — the .NavigationUI in the DOM is just for screen readers (it's inside .GLA11y which has width:0; overflow:hidden; z-index:-1). The visual nav bar is a real-time rendered UI element in the 3D scene.
To recreate it:
css.nav-pill {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 500px;  /* full pill */
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

/* The separator line between WORK and CONTACT */
.nav-pill::after {
  content: '';
  display: inline-block;
  width: 40px;
  height: 1px;
  background: rgba(255,255,255,0.5);
}
Chat / AI Assistant Interface (bottom-left)
css.chat-wrapper {
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
  -webkit-mask-image: linear-gradient(
    to top, white 0%, white 75%, transparent 90%
  ); /* Messages fade out at the top */
}

/* Input field — the "ASK ME ANYTHING..." pill */
.chat-textarea {
  background: rgba(0,0,0,0.2);
  color: rgba(255,255,255,0.7);
  font-family: "nbarchitekt", monospace;
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 50px;
  padding: 14px 25px;
  transition: all 0.8s cubic-bezier(.17,.4,.02,.99);

  /* Expands on focus: */
  /* width: 200px → 330px */
}

.chat-textarea:focus {
  border: 2px solid rgba(255,255,255,0.8);
  background: rgba(0,0,0,0.5);
}

/* Cursor blink animation */
@keyframes cursor-blink {
  0%, 25% { background: transparent; }
  50% { background: #00ffff; }
  75%, 100% { background: transparent; }
}
The mix-blend-mode: color-dodge on the chat wrapper is crucial — it makes the purple/white text feel like it's glowing from within the 3D scene, not floating over it.
Category Navigation Links (left side)
css.category-links {
  font-family: "nbarchitekt", monospace;
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  pointer-events: auto;
}

.category-link {
  color: #9ca5ff; /* lavender/periwinkle */
  display: block;
  transition: transform 0.3s ease, color 0.3s ease;
}

.category-link:hover, .category-link.active {
  color: #ffffff;
  text-shadow: #ffffff 1px 0px 5px;
  transform: translateX(10px); /* slides right on hover/active */
}

.arrow-prefix { color: rgba(255,255,255,0.4); }
Music Player (bottom-right ticker)
css.music-ticker {
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

/* Control buttons */
.music-btn {
  opacity: 0.3;
  transition: opacity 0.4s ease-out;
}
.music-btn:hover { opacity: 1; }
Cookie Banner
css.cookie-banner {
  position: fixed;
  bottom: 20px; /* or wherever */
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255,255,255,0.3);
  border-radius: 12px;

  /* Buttons */
  button {
    border-radius: 500px;
    border: 2px solid rgba(255,255,255,0.5);
    transition: all 0.2s ease-out;
    cursor: pointer;
  }
}
Custom Scrollbar
css::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,var(--baropacity, 0.9));
  border-radius: 10px;
}
/* --baropacity CSS variable starts at 0 and animates in */
:root { --baropacity: 0.0; }

7. EASING & TRANSITIONS CHEAT SHEET
From the extracted CSS:
EffectTimingChat textarea expand0.8s cubic-bezier(.17,.4,.02,.99)Chat wrapper fade-in1000ms cubic-bezier(0.39, 0.575, 0.565, 1) (easeOutSine)Button hover0.4s ease-outClose button hover0.1s easeCookie button0.2s ease-outLink hover (active state)transform: translateX(10px) — no transition defined (instant snap)
The WebGL animation curves (scroll lerp, camera movements) are custom in JS — the signature is a low lerp factor (~0.05–0.1) applied every frame, creating a smooth spring-like follow that never quite "catches up" instantly.

8. HOW TO RECREATE THE VIBE — PRACTICAL BLUEPRINT
Step 1: Foundation
html<body style="margin:0; background:#000; overflow:hidden;">
  <canvas id="webgl"></canvas>                    <!-- Full-screen WebGL -->
  <div id="scroll-driver" style="            
    position:fixed; top:0; left:0; 
    width:100%; height:100%; 
    overflow-y:scroll; z-index:10;
  ">
    <div style="height: 1500vh;"></div>           <!-- Total virtual height -->
  </div>
  <nav class="pill-nav">...</nav>                 <!-- Fixed UI over canvas -->
  <aside class="chat-ui">...</aside>
</body>
Step 2: WebGL Setup (Three.js equivalent)
javascriptconst renderer = new THREE.WebGLRenderer({ 
  canvas, antialias: true, alpha: false 
});
renderer.setPixelRatio(devicePixelRatio);
renderer.setClearColor(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
Step 3: Smooth Scroll Driver
javascriptlet scroll = { current: 0, target: 0 };
const LERP = 0.08;

document.querySelector('#scroll-driver').addEventListener('scroll', e => {
  scroll.target = e.target.scrollTop;
});

function animate() {
  scroll.current += (scroll.target - scroll.current) * LERP;
  const progress = scroll.current / maxScroll; // 0–1

  // Drive camera, particles, materials from progress
  updateScene(progress);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
Step 4: Particle System
javascript// ~10,000–50,000 particles using instanced mesh or points
const count = 30000;
const geo = new THREE.BufferGeometry();
const positions = new Float32Array(count * 3);
// Scatter in a large 3D volume
for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 200;
}
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const mat = new THREE.PointsMaterial({ 
  size: 0.3, 
  color: new THREE.Color(0x88aa44), // yellow-green
  transparent: true, opacity: 0.8,
  sizeAttenuation: true 
});
scene.add(new THREE.Points(geo, mat));
Step 5: Iridescent Material (for logo)
The chrome/iridescent ring effect uses a custom GLSL shader that maps view-angle to a color gradient — chromatic aberration on normals:
glsl// Fragment shader
vec3 viewDir = normalize(vViewPosition);
float fresnel = pow(1.0 - dot(viewDir, vNormal), 3.0);
vec3 color = mix(
  vec3(0.0, 0.5, 1.0),   // deep blue
  vec3(0.0, 1.0, 0.8),   // teal/cyan
  fresnel
);
gl_FragColor = vec4(color, 1.0);
Step 6: mix-blend-mode for HTML/WebGL fusion
The most powerful technique to make HTML elements feel part of the 3D scene:
css.overlay-text {
  mix-blend-mode: color-dodge;  /* Makes dark text invisible, light text glows */
  /* or */
  mix-blend-mode: screen;       /* Similar additive blend */
}

9. KEY DESIGN TOKENS TO COPY
css:root {
  --bg: #000000;
  --font-primary: 'NBArchitekt', monospace;
  --text-primary: #eeeeee;
  --text-muted: rgba(255,255,255,0.4);
  --text-accent: #9ca5ff;      /* lavender for active links */
  --text-glow: #00ffff;        /* cyan glow cursor */
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

10. WHAT MAKES IT FEEL SO PREMIUM

No native scroll — scroll drives a 3D camera, not the page DOM
Lerp-smoothed scroll — the ~8% lerp factor per frame means motion never "stops" abruptly
Particle density — thousands of volumetric particles that fill empty space
mix-blend-mode: color-dodge — HTML text blends additively with the WebGL scene
DPR-aware rendering — renders at 2× on retina, zero blurriness
All-caps monospace + wide tracking — instantly reads as "technical/elite"
Video textures — project thumbnails are actual playing videos mapped onto 3D geometry
Persistent ambient animation — even when not scrolling, everything slowly rotates and drifts
Custom cursor — implied by touch-action:none and user-select:none (likely a custom cursor in the canvas)
No JavaScript animation libraries — pure custom WebGL + rAF = zero framework overhead, maximum performance
