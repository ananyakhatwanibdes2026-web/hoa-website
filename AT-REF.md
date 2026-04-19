68 stepsActive Theory — Complete Technical & Visual Teardown

1. Theme & Art Direction
Overall Aesthetic: The site is a full-blown dark-mode, sci-fi / deep-space immersive experience. It avoids conventional "website" aesthetics entirely — there is no traditional DOM layout. Everything lives inside a single WebGL canvas. The vibe is cinematic, premium, and otherworldly — closer to a AAA game intro sequence than a typical agency portfolio. Think: interstellar observatory meets luxury tech brand.
Color Palette:

Primary: Near-black (#0A0A0A–#111111) — the deep void background that dominates the experience
Secondary: Muted off-white/light gray (rgb(244,244,244) for headings, rgb(198,198,198) for body text) — used sparingly for typography rendered on the GPU
Accent 1 — Cyan/Teal: rgb(0,255,255) — appears in link hover states, UI glows, the bottom-edge atmospheric lighting, and the nav pill's subtle border glow
Accent 2 — Warm Gold/Amber: Visible in particle systems and the atmospheric edge-lighting at the viewport corners, giving a deep-sea bioluminescent feel
Accent 3 — Iridescent/Chromatic: The hero 3D logo uses a chromatic aberration PBR material that shifts through spectral colors (blue, magenta, red, gold) depending on view angle — this is a shader-driven effect, not a fixed color
Accent 4 — Lavender/Periwinkle: rgba(156,165,255,0.333) appears in the "Work" section links and filter categories on the left rail

Typography:

Primary Font: NB Architekt Std — a monospaced, geometric, industrial typeface. This is loaded in three weights (Light/300, Regular/400, Bold/700) as both WOFF2 files (for fallback) and JSON MSDF atlas files (for GPU-rendered text). All text you see on screen is rendered via Multi-channel Signed Distance Field (MSDF) shaders on the WebGL canvas, not as DOM elements.
Sizing: The hero heading "CREATIVE DIGITAL EXPERIENCES" uses an extremely large display size (roughly 10–12vw equivalent), while the descriptive body copy on the right ("Founded in 2012...") is much smaller (~14–16px equivalent). This creates a dramatic scale contrast.
Spacing: Generous letter-spacing on the monospaced face gives it a technical, terminal-like readability. All-caps treatment is used throughout.
The DOM accessibility layer (.GLA11y) contains invisible <a> tags for screen readers, with Times as a fallback font — this is never visually displayed.

Negative Space & Grid:

The hero section is overwhelmingly negative space — a vast dark void with a single 3D object centered. This creates an enormous sense of depth and premium feel.
The layout shifts to a split composition in the about section: large headline typography anchored left/bottom, body copy anchored right/middle.
The work/portfolio section uses a left sidebar for category filters while project cards float and rotate in 3D space in the main area — there is no conventional CSS grid. The grid is the 3D scene's z-depth layering.


2. Scrolling Mechanics
Scroll System: This is a custom virtual scroll implementation, not Lenis or Locomotive Scroll. Active Theory uses their own proprietary framework called Hydra with a custom component called FXScroll.
How it works technically:

The <div class="FXScroll"> is a position: fixed container covering the full viewport with overflow: hidden scroll.
Inside it are 6 invisible <div class="scrollElement"> spacers with absolute positioning and heights defined in vh units (420vh, 105vh, 1050vh, 210vh, 126vh, 420vh). These create a virtual scroll height of ~16,923px.
The scroll position is read from this container and fed as a uniform into the WebGL shaders. The actual visual response (camera movement, parallax, element reveal) happens entirely on the GPU.
Body and HTML both have overflow: hidden — native browser scroll is completely disabled.

Scroll Feel: The scroll feels buttery smooth with significant inertia/easing. This is achieved through their custom TweenManager which lerps between the raw scroll position and the rendered position, creating a momentum-based feel similar to Lenis's smooth-scroll but implemented at the WebGL level.
Parallax Effects: Extreme parallax is present throughout:

The hero 3D logo model moves on a different z-plane than the particle field — as you scroll, the logo descends while particles shift at different rates.
The "CREATIVE DIGITAL EXPERIENCES" text scrolls at a different rate than the 3D scene behind it, creating foreground/background separation.
In the portfolio section, project cards exist at different z-depths in the 3D scene and move at different scroll rates, creating a carousel-in-space effect.
Atmospheric light volumes (the teal/amber edge glows) shift subtly with scroll, giving the environment a sense of breathing.

Scroll-Triggered Animations: The text reveals are scroll-driven — as you scroll past threshold points in each of the 6 sections, typography animates in with a character-by-character or word-by-word reveal. The 3D camera transitions between "scenes" at section boundaries (hero → about → work → contact).

3. WebGL, Canvas & Advanced Visual Effects
This is where Active Theory truly flexes. The entire site is a single WebGL2 canvas rendering at 2x device pixel ratio (2122×1452 on a Retina display).
Rendering Engine: Active Theory uses their proprietary WebGL2 engine (not Three.js, not OGL). Key technical evidence includes the Hydra global framework, AntimatterUtil (their custom utility library), a custom Render loop manager running at 60Hz, and a compiled shader file (compiled.vs) that bundles all vertex/fragment shaders.
3D Elements:

Hero Logo: A 3D metallic torus/ring shape with the AT "a" logo emblem at the center, sitting atop an infinity/figure-eight wire structure. The material uses a PBR (Physically Based Rendering) pipeline with chromatic/iridescent refraction — visible as rainbow color shifts across the metallic surface. Draco WASM decoder is loaded, confirming compressed GLTF/GLB 3D model loading.
Hexagonal Geometry System: 123 geometry assets are loaded, many with names like "hexgrid/hexagon.bin" — suggesting a hexagonal grid-based design language used for environmental elements or particle attractors.
3D Jellyfish/Organic Creatures: Floating bio-luminescent organisms visible in the hero section background, adding life to the deep-space/deep-ocean environment.

Particle Systems: A dense GPU-instanced particle field fills the scene — thousands of small glowing particles (gold, cyan, white) with varying opacity and scale. These particles have physics-based drift and react to scroll position, creating a "swimming through a nebula" effect.
Post-Processing / Compositing Effects:

Chromatic Aberration / RGB Split: Clearly visible on the 3D logo and text — the red, green, and blue channels are offset, creating a prismatic fringe effect, particularly at the edges of the 3D logo.
Film Grain / Noise: A subtle per-frame noise texture is composited over the scene, adding analog warmth.
Bloom / Glow: The particle field and the nav button exhibit soft bloom — bright elements bleed light into surrounding dark areas.
Volumetric Light Shafts: The teal/amber atmospheric gradients at the viewport edges behave like volumetric lights or light volumes (confirmed by texture names like _lightvolume/light.jpg and _lightvolume/light-mask.jpg).
Depth of Field: Elements at different z-depths have varying sharpness, suggesting a DOF post-processing pass.
Distortion/Glitch on Text: The portfolio card titles exhibit a "double-vision" or stutter effect as they animate in — a deliberate glitch aesthetic applied via shader.

Background Reactivity: The scene subtly reacts to mouse position through the global Mouse object (tracking x, y, normalized coordinates, tilt, and delta). This likely drives slight camera orbit or parallax shift, and may also influence the light volume positions, giving the scene a subtle 3D feel even without scrolling.
Texture Pipeline: 228 texture assets are registered, using KTX2 compressed textures transcoded via the Basis Universal WASM transcoder — this is a GPU-optimal compressed texture format that allows for fast loading and low VRAM usage.

4. Transitions & Navigation
Page Load Animation:

The site loads with a deep-black screen while the WebGL context initializes and assets are decoded (Draco geometry, Basis textures, MSDF fonts).
The "SCROLL DOWN" text fades in at the center as an invitation to interact.
The 3D logo fades/scales in from the center with the particle field emerging around it — this is a timed entrance sequence, not a progress-bar preloader. The effect is cinematic: you're dropped into the void, then the scene materializes.

Page Routing / SPA Transitions:

This is a true Single Page Application built on the Hydra framework. The URL updates (from / to /work as you scroll into the portfolio) but there is zero page reload — the WebGL canvas persists across all "pages."
Transitions between sections are 3D camera movements through the scene. The camera dolly-zooms through the particle field, text fades out/in, and new 3D elements enter frame — all rendered on the same persistent canvas.
The AppState global manages routing state, and Gate likely controls transition sequencing.

Navigation Menu:

The nav is a floating pill/capsule in the top-right, rendered on the WebGL canvas (not a DOM element). It has a rounded border with a subtle semi-transparent dark fill and a soft glow emanating from its bottom edge.
Two links: "WORK" and "CONTACT", separated by a horizontal line.
The pill has a subtle luminescent border animation — a soft white/cyan glow pulses along the border.
On hover, the entire nav pill responds with a brightness/glow increase.
Top-left has an audio toggle icon (speaker), also rendered on the canvas.
Far right edge has a vertical scroll progress indicator — a small rounded rectangle/pill that represents scroll position.


5. Micro-interactions & UI Elements
Cursor:

There is no visible custom cursor element in the DOM — the cursor interaction is handled entirely within the WebGL canvas. The default system cursor is used, but the 3D scene reacts to the Mouse object's position, delta, and state.
Mouse movement subtly shifts the camera angle (gyroscopic parallax), creating a sense that you're looking around inside the scene.
The Mouse object tracks: x, y, normal (0–1 range), tilt, inverseNormal, delta, move, hold, and resetOnRelease — suggesting distinct behaviors for hover, drag, and idle states.

Buttons/Links:

The left-rail category links ("-> WEBSITES", "-> INSTALLATIONS", "-> XR / VR / AI", "-> MULTIPLAYER", "-> GAMES") use the monospaced NB Architekt font in a lavender/periwinkle accent color. The -> arrow prefix gives them a terminal/CLI aesthetic.
Hover states likely involve brightness changes or subtle text scramble/glitch effects (consistent with the glitchy text rendering seen elsewhere on the site).
The "ASK ME ANYTHING..." input field has a rounded pill border, matching the nav capsule design language — a consistent design system element.

Images/Media:

The portfolio section displays project cards as 3D planes with video textures floating in the WebGL scene. The VideoTextures DOM container holds hidden <video> elements whose frames are sampled as WebGL textures and mapped onto 3D card geometry.
The cards have rounded corners (matching the border-radius design system), applied via shader or geometry clipping.
Cards exhibit a chromatic aberration / distortion effect on their edges, particularly visible during scroll animation — this is a post-processing shader applied per-card.
The 3D cards rotate on their Y-axis as they enter/exit the viewport, creating a "gallery wall in space" effect.
Confirmed video assets include a reel.mp4, plus project-specific videos loaded from Google Cloud Storage.

Audio:

The site features a music player (.MusicPlayerDOM) with previous/next track controls and a ticker-style song/artist display — ambient audio is integral to the experience.
GlobalAudio3D, Audio3DN, Audio3DResonance, and Audio3DWA suggest spatial/3D audio capabilities — the audio may be positioned in the 3D scene or use Web Audio API resonance for immersive sound.


6. Developer "Cheat Sheet" for Recreation
Hypothetical Tech Stack:
To approximate this experience with publicly available tools, you would need:
LayerActive Theory UsesYou Would UseWebGL EngineCustom proprietary engine (Hydra + Antimatter)Three.js (most mature) or OGL (lighter, more control)Shader CompilationCustom compiled.vs shader bundleglslify or raw GLSL with custom post-processing passes via Three.js EffectComposerText RenderingMSDF font atlases rendered on GPUtroika-three-text or three-bmfont-text with MSDF shader3D ModelsDraco-compressed GLTF with Basis texturesThree.js GLTFLoader + DRACOLoader + KTX2LoaderAnimation/TweeningCustom TweenManagerGSAP 3 (gsap.to, ScrollTrigger for scroll binding)Smooth ScrollCustom FXScroll (virtual scroll)Lenis (by Studio Freight) with scroll position piped into shadersPost-ProcessingCustom shader passespostprocessing npm package (pmndrs) or Three.js EffectComposer with UnrealBloomPass, FilmPass, custom ChromaticAberrationShaderParticle SystemCustom GPU-instanced particlesThree.js InstancedMesh or custom particle shader with transform feedbackState/RoutingCustom AppState + GatePJAX/Barba.js for seamless page transitions, or a lightweight SPA routerAudioCustom 3D audio (Web Audio API + Resonance)Howler.js for basic, or Google Resonance Audio SDK for spatial audioBuild/Asset PipelineHydra build system with UIL asset managerVite + custom GLTF/KTX2 pipelineDesign ToolLikely Theatre.js (confirmed in globals) for animation timeline editingTheatre.js (open source) for keyframe animation
Key Libraries List:
Three.js (or OGL), GSAP + ScrollTrigger, Lenis, troika-three-text, postprocessing (pmndrs), Barba.js, Theatre.js, Howler.js, Draco decoder, Basis Universal transcoder, glslify.

3 Golden Rules to Achieve This Level of Polish
1. "The Canvas IS the Page — Commit Fully."
Active Theory doesn't compromise. There's no hybrid approach where some things are DOM and some are WebGL. Everything — navigation, typography, images, scroll, interactions — lives inside the canvas. The DOM is only used for accessibility (GLA11y) and hidden infrastructure (video elements for textures, the scroll spacer). This total commitment is what makes it feel like a cohesive experience rather than "a website with some 3D on it." If you're going this route, go all-in: render your text as MSDF on the GPU, make your buttons 3D objects with raycasting for interaction, and route transitions as camera movements through a single persistent scene.
2. "Post-Processing Is the Secret Sauce, Not the 3D Models."
The 3D assets on this site are relatively simple (a torus, some cards, particles, jellyfish). What makes it feel cinematic is the compositing stack: chromatic aberration, film grain, bloom, depth of field, and volumetric light volumes. These post-processing passes are what separate a "WebGL demo" from a "premium experience." Budget at least 40% of your development time on the post-processing pipeline. Start with bloom + grain + chromatic aberration and layer from there.
3. "Smooth Scroll Is the Skeleton — Everything Animates From It."
The scroll position is the single source of truth for the entire experience. Camera position, text reveals, particle density, card rotation, section transitions — everything is a function of the normalized scroll value, interpolated through easing. Build your scroll system first, pipe it as a uniform into every shader, and derive all animation from it. The smoothness of the lerp between raw scroll and rendered scroll (typically a lerp(current, target, 0.07–0.12) per frame) is what gives it that "underwater" feel. Get this right before you touch anything visual.