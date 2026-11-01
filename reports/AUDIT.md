# Novahomin: technical audit (phase 1–3)

Audited 2026-11-01 on branch `perf/production-readiness`, checkpoint `53dede7`. Measurements come from local production builds (`next start`), Chrome 156.0.8078.74, macOS 15.7 (Intel, dual GPU).

## 1. Inventory

**Stack (verified).** Next.js 16.4.3 (App Router, Turbopack, `cacheComponents`), React 19.3, TypeScript 5.9, three r187, @react-three/fiber 9.8.2, GSAP 3.15 (ScrollTrigger). Hand-written CSS (`app/globals.css`).

**Not present.** The brief lists these, but the project does not use them: Tailwind CSS, Framer Motion, GLB/GLTF models, textures, Draco/Meshopt/KTX2, API routes, third-party scripts, analytics.

**Rendering.** One statically prerendered route (`/`), plus `robots.txt`, `sitemap.xml` and `icon.svg`.

- Server components: the page, all sections and content.
- Client islands:
  - `Header`: mobile disclosure, Escape and outside-click handling.
  - `RobotStage`: poster, scan transition, 3D loader.
  - `ScrollDirector`: lazy GSAP loader.
  - `ProjectEnquiry`: form and mobile sheet.
- The 3D scene (`components/robot-canvas.tsx`) and GSAP (`lib/motion.ts`) are dynamic imports that load on first interaction.

**Assets (public/).**

| File | Size | Used |
|---|---:|---|
| robot/novahomin-robot-{360,420,540,670}.avif | 22–63 KB each | yes (one per device) |
| robot/novahomin-robot-{360,420,540,670}.webp | 58–131 KB each | fallback only |
| image.png (supplied reference render) | 2.1 MB | **no** (source material, publicly served) |
| file.svg, globe.svg, next.svg, vercel.svg, window.svg | < 1.4 KB each | **no** (create-next-app leftovers) |

**Fonts.** System UI stack, no webfont (Geist was removed earlier to bring simulated mobile LCP under 2.5 s).

**Environment variables.** Server-only `SITE_URL` and `CONTACT_EMAIL`, read in server components. No `NEXT_PUBLIC_*`. No secrets in the repository; `.env*` is git-ignored.

## 2. Baseline measurements

Lighthouse, three cold runs per profile (from `reports/baseline/PERFORMANCE.md`):

| Profile | Performance | A11y | Best practices | SEO | LCP | TBT | CLS |
|---|---:|---:|---:|---:|---:|---:|---:|
| Mobile (simulated) | 97 / 97 / 97 | 100 | 100 | 100 | 2.43–2.44 s | 123–128 ms | 0 |
| Desktop | 100 ×3 | 100 | 100 | 100 | 0.53–0.54 s | 0 ms | 0 |
| Mobile (applied throttling) | 95–96 | 100 | 100 | 100 | 1.78–1.80 s | 205–235 ms | 0 |

Scripted session (CDP throttling, full scroll through the story, form input): INP 32–112 ms, CLS 0.

**Bundles** (`reports/baseline/bundle.json`, measured from the build):

| | Raw | gzip | Brotli |
|---|---:|---:|---:|
| HTML (inline CSS + RSC payload) | 121.9 KB | 26.8 KB | n/a |
| Initial JS (6 files) | 471.3 KB | 140.3 KB | 119.8 KB |
| 3D chunk (three + R3F + robot) | 946.6 KB | 250.1 KB | 205.2 KB |
| GSAP + ScrollTrigger + motion | 113.9 KB | 44.7 KB | 40.6 KB |

**First-interaction profile** (long tasks after the first pointer/scroll, which loads GSAP and the 3D twin):

| Session | Longest task | Total long-task time | 3D start-up (`novahomin:3d-total`) |
|---|---:|---:|---:|
| Desktop 1440, no throttle | **928–970 ms** | 1,052 ms | 1,360 ms |
| Mobile 390, 4× CPU | 603 ms | 978 ms | 1,338 ms |

Steady state with the twin on screen: desktop ≈ 69 ms script per second (≈ 1.2 ms/frame, ≈ 109 draw calls/frame). Mobile 4× ≈ 92 ms/s at 30 fps (≈ 3 ms/frame).

Heap after forced GC across four full scroll passes: desktop 8.9 → 9.6 MB (+0.6 MB on first pass, then +25 KB/pass). Mobile 8.7 → 9.9 MB (+0.9 MB, then +75 KB/pass). Investigated in phase 6.

## 3. Findings (evidence → action)

| # | Finding | Evidence | Action |
|---|---|---|---|
| 1 | **WebGL context creation stalls the main thread for ~700 ms on desktop** | CPU profile: 695 ms self time in `canvas.getContext("webgl2")`. The renderer requested `powerPreference: "high-performance"`, which forces a discrete-GPU switch on dual-GPU laptops. | Use `"default"`. Measured after the change: longest task 246–501 ms, 3D start-up 660 ms (best run). |
| 2 | **3D start-up runs as one React commit** (context + build + environment + first render) | Trace: a single 970 ms `FunctionCall` from react-dom; the robot build begins 727 ms into it. | Mount the scene with R3F `createRoot` in stages that yield between steps. |
| 3 | **Whole three.js namespace bundled** | R3F's `<Canvas>` calls `extend(THREE)`. The 3D chunk contains AnimationMixer, ObjectLoader, audio, LOD and keyframe tracks, none of which are used. Module evaluation ≈ 150 ms at 4× CPU. | Use `createRoot` (does not extend THREE) and create lights imperatively. |
| 4 | Two WebGL contexts per visit | The capability probe creates a context, then three creates another. | Create the probe with the final attributes and hand it to the renderer. |
| 5 | PMREM environment ≈ 120–146 ms at 4× CPU | User Timing `novahomin:3d-environment`. | Size the environment by quality tier (64–256 px). |
| 6 | Redundant geometry clones in the robot builder | CPU profile: `clone` ≈ 146 ms inclusive at 4×. Non-indexed sources are cloned, then the original is disposed. Mirrored parts are triangulated twice. | Reuse non-indexed sources; cache identical plates. |
| 7 | Per-frame allocations in `applyPose` | Arrays/closures created every frame. | Hoist to module scope. |
| 8 | Redundant ScrollTrigger refreshes | `document.fonts.ready → refresh()` (no webfonts any more) and a deferred story refresh; `refresh` ≈ 170 ms at 4×. | Remove both. |
| 9 | Quality tiers use 3 levels driven mainly by width and cores | `chooseQuality` | Five tiers (desktop high/standard, tablet, mobile high/low) using cores, memory, GPU class, pointer and runtime frame time. |
| 10 | Unused public assets | Table above. The 2.1 MB reference PNG is publicly downloadable. | Remove starter SVGs; move the reference out of `public/`. |
| 11 | Missing security headers | No CSP, HSTS or COOP. | Add a static-compatible CSP (production), HSTS and COOP. |
| 12 | Undeclared direct dependency | `scripts/performance.mjs` imports `chrome-launcher` (transitive via lighthouse). Two extraneous packages in node_modules. | Declare it; prune. |
| 13 | Duplicate code | Arm-rest pose objects; WebGL-blocking and hydration helpers repeated across test files. | Consolidate. |
| 14 | Dev-tool advisories | `npm audit`: 45 (35 moderate, 10 high), all in eslint/lighthouse chains. Production dependencies: 0. | Apply non-breaking fixes only; document the rest. |

Checked and fine:

- No per-frame React state: animation values live in a store and refs, and the frameloop is on demand.
- Rendering stops while the poster shows.
- Listeners, observers, the renderer, geometries and materials are disposed.
- No unused CSS classes or keyframes; no `console.*` debugging statements.
- No `dangerouslySetInnerHTML` except the static pre-paint script.
- Axe WCAG 2.2 AA passes at 320, 768 and 1440 px.
- No hydration errors in the browser suites.
