# Novahomin

A dark, single-page Next.js site built around a central humanoid robot. A fixed stage keeps the robot in the middle of the screen while eight short sections (Hero, About, Services, Expertise, Process, SEO & GEO, Why Novahomin, Contact) scroll around it. A scroll-driven timeline makes the robot turn its head, gesture at panels, put on and adjust spectacles, switch them for a VR headset, work a holographic interface, hold a search globe, and return to its original appearance at Contact.

## Run

```sh
npm ci
npm run dev
```

Production:

```sh
npm run build
npm run start
```

Optional build-time configuration (`.env.local`, see `.env.example`):

- `SITE_URL`: production origin; enables canonical metadata and sitemap entries.
- `CONTACT_EMAIL`: enquiry address. With it, the contact form opens a pre-filled email. Without it, the form saves the enquiry as a text brief on the visitor's device. Nothing is submitted to a server: no enquiry endpoint has been confirmed.

## The robot

**Reference.** `public/image.png` is the supplied reference render (graphite armour, navy panels, cyan lights, orange accents). It is the visual identity and is not replaced.

**Poster (`public/robot/`).** The reference was cut out with macOS Vision's on-device subject mask, cropped to the robot's bounds (670 × 1494, 16 px top and bottom padding) and encoded as responsive AVIF and WebP at 360, 420, 540 and 670 px wide (22–63 KB AVIF). The poster is the first thing visitors see, the LCP element, and the fallback whenever 3D is unavailable. It is also what the hero and contact sections show: the robot's original appearance.

**3D twin (`lib/robot/build.ts`).** No GLB/GLTF model was supplied. The interactive robot is a procedural digital twin built from bevelled plates, discs and frames that follows the reference's proportions, silhouette and palette. It uses PBR materials with procedural wear, so no textures are downloaded. It is rigged as a joint hierarchy (pelvis, spine, chest, neck, head, shoulders, elbows, wrists, fingers, hips, knees, ankles). Hard-surface robots are rigid segments, so no skinning is needed. Parts are merged per joint and material to keep draw calls low. Spectacles, VR headset, holographic panels and the globe are separate fadeable groups.

It is a stylised reconstruction, not a copy of the render: it lacks the reference's surface detail. Exact fidelity needs an artist-made model. To use one, export a GLB with equivalent joint nodes and replace `buildRobot`. The pose system and choreography only drive joint rotations.

**Poster ↔ twin.** The camera is calibrated so the twin's rest pose overlays the poster's silhouette. Switching between them is a scroll-driven cyan scan line that wipes from one to the other, in both directions.

## Scroll choreography

- `lib/robot/pose.ts`: every value the timeline can drive (joint angles, spectacles, visor, hologram, globe, poster/twin).
- `lib/robot/choreography.ts`: keyframes anchored to sections, not pixels (`p` = how far a section has entered, `q` = travel through a taller sticky section), so the same choreography holds on every breakpoint. Values interpolate per property with a cubic ease, so scrolling backwards replays everything in reverse.
- `lib/motion.ts`: GSAP ScrollTrigger samples the pose from scroll position and runs the DOM panel animations: scrubbed fade/slide/scale/rotation reveals, the desktop service-orbit scene (left wave, then right wave, matching the robot's gaze and gestures) and the process scene (one step at a time, in sync with the hologram panel in focus).
- `components/robot-canvas.tsx`: the React Three Fiber scene. It damps the current pose towards the scroll target each frame and adds a small, deterministic idle (breathing, slow head drift). Nothing moves randomly.

## Responsive behaviour

- **Desktop (≥ 1024 px).** Three columns with the centre kept clear for the robot (≈ 84 % of the viewport height). Services and Process are sticky scenes with panels on both sides. Tests assert that no panel intersects the robot.
- **Tablet (700–1023 px).** Smaller, bottom-anchored robot. Content flows over it on soft dark bands. Services become a two-column grid instead of floating panels.
- **Mobile (< 700 px).** The headline sits above the robot; the robot is sized from the viewport height so it never touches the hero copy (asserted at every tested width). Thumb-zone CTAs, vertical-only reveals, no particles, low-quality 3D at 30 fps. Narrow phones (< 380 px) show a single CTA.

## Loading and performance decisions

- The hero headline and poster are server-rendered HTML; CSS is inlined (`experimental.inlineCss`, ~6 KB).
- GSAP (≈ 45 KB gzip) and the 3D scene (three.js + R3F + robot, ≈ 294 KB transfer) load on the visitor's first interaction (scroll, touch, pointer or key), not on page load. If the page opens already scrolled, they load immediately. Every scroll animation starts below the hero, so nothing on arrival waits for them.
- Text uses the system UI font stack (SF Pro, Segoe UI Variable, Roboto). Measured with Geist as a webfont, Lighthouse's simulated mobile LCP was 2.52–2.59 s. With the system stack it is 2.39–2.48 s, and the font-swap layout shift disappears. To restore Geist, re-add `next/font/google` in `app/layout.tsx` and accept that cost.
- WebGL frames are rendered on demand. Rendering stops entirely while the poster is showing (hero, contact, failed or unsupported 3D) and when the tab is hidden.
- Quality tiers: high (desktop: antialiasing, particles, 60 fps, DPR ≤ 1.5), medium (tablet), low (phones: no particles or antialiasing, simplified geometry, 30 fps, DPR ≤ 1.25).
- No 3D for reduced motion, Save-Data, < 2 GB device memory, missing WebGL or software rasterisers (SwiftShader/llvmpipe). Those visitors keep the poster. Context loss, failed chunk downloads and render errors all fall back to the poster.
- Reduced motion also skips GSAP: content is static and fully visible.
- ScrollTrigger runs an empty `requestAnimationFrame` keep-alive loop by design (a repaint workaround in the library). It does no rendering. The tests therefore measure idle by counting WebGL draw calls, not rAF callbacks.

## Verify

```sh
npx playwright install chromium firefox webkit
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

`TEST_PORT` selects the local production server port (default 3000; the suite starts `next start` if nothing is listening). `TEST_BASE_URL` targets a deployment instead.

The suite runs in Chrome, Firefox, WebKit and Chrome with SwiftShader. It covers:

- **Layout:** 320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440 and 1920 px, checking horizontal overflow, clipped or off-screen text, robot/hero-copy clearance, panels never covering the robot, mobile navigation and touch-target sizes.
- **3D behaviour:** the full choreography forwards and backwards (poster → spectacles → VR → none → poster), the desktop sticky scenes and render idling.
- **Fallbacks:** no JavaScript, WebGL unavailable, software WebGL, blocked chunk downloads, context loss and reduced motion.
- **Other:** the enquiry form, in-page links and WCAG 2.2 AA (axe).

With a production server running:

```sh
TEST_BASE_URL=http://127.0.0.1:3000 npm run test:performance
```

This runs three cold Lighthouse audits each for mobile (simulated throttling), desktop and mobile with applied DevTools throttling. It then records CDP-throttled network transfer and scripted Web Vitals (including a full scroll through the 3D choreography) under Slow 4G, Fast 4G and broadband. Results go to `reports/PERFORMANCE.md`, `reports/lighthouse/` and `reports/performance-summary.json`. `node scripts/report-qa.mjs` summarises the Playwright run in `reports/QA.md`.

## Still to verify before launch

- Copy and the technology list are an initial draft and need business review. No clients, results or credentials are claimed.
- The contact form needs a real enquiry endpoint (or `CONTACT_EMAIL`) before launch.
- Local lab measurements are not field data. PageSpeed Insights/CrUX, real iPhone/Android/tablet testing, Safari on macOS and CDN behaviour need a deployed origin and real devices.
