# Novahomin — browser QA

Build ID: x_HO28Eu28UW_Hxcm-zLr. Started: 2026-10-31T22:03:45.961Z. Duration: 192.0 s.

Actual Playwright result: **73 passed, 0 failed, 10 skipped, 0 flaky**.

[Interactive browser report](./playwright/index.html) · [Raw results](./playwright-results.json) · [Screenshots](./screenshots/)

## Requested widths

| CSS width | Installed Chrome | Firefox | WebKit |
|---|---|---|---|
| 320 | Not run | Not run | Not run |
| 360 | Not run | Not run | Not run |
| 375 | Not run | Not run | Not run |
| 390 | Not run | Not run | Not run |
| 414 | Not run | Not run | Not run |
| 430 | Not run | Not run | Not run |
| 600 | Not run | Not run | Not run |
| 768 | Not run | Not run | Not run |
| 820 | Not run | Not run | Not run |
| 1024 | Not run | Not run | Not run |
| 1280 | Not run | Not run | Not run |
| 1366 | Not run | Not run | Not run |
| 1440 | Not run | Not run | Not run |
| 1600 | Not run | Not run | Not run |
| 1920 | Not run | Not run | Not run |

Each width checks the whole page for horizontal overflow, heading/button/card clipping, hero overlap, menu operation where applicable, 44px navigation targets, FAQ operation and the expanded brief layout. Each successful width run saves a full-page screenshot.

## Functional and accessibility coverage

- chrome: layout at 320px — Pass
- chrome: layout at 360px — Pass
- chrome: layout at 375px — Pass
- chrome: layout at 390px — Pass
- chrome: layout at 414px — Pass
- chrome: layout at 430px — Pass
- chrome: layout at 768px — Pass
- chrome: layout at 1024px — Pass
- chrome: layout at 1280px — Pass
- chrome: layout at 1440px — Pass
- chrome: layout at 1920px — Pass
- chrome: mobile disclosure supports Escape, outside clicks and breakpoint changes — Pass
- chrome: content, navigation and poster work without JavaScript — Pass
- chrome: WebGL unavailable keeps the poster and all content usable — Pass
- chrome: failed enhancement downloads leave a complete, static page — Pass
- chrome: project enquiry validates and saves the visitor's input — Pass
- chrome: WCAG accessibility at 320px — Pass
- chrome: WCAG accessibility at 768px — Pass
- chrome: WCAG accessibility at 1440px — Pass
- chrome: every in-page link has a real destination — Pass
- chrome: phone touch navigation works in portrait and landscape — Pass
- firefox: layout at 320px — Pass
- firefox: layout at 360px — Pass
- firefox: layout at 375px — Pass
- firefox: layout at 390px — Pass
- firefox: layout at 414px — Pass
- firefox: layout at 430px — Pass
- firefox: layout at 768px — Pass
- firefox: layout at 1024px — Pass
- firefox: layout at 1280px — Pass
- firefox: layout at 1440px — Pass
- firefox: layout at 1920px — Pass
- firefox: mobile disclosure supports Escape, outside clicks and breakpoint changes — Pass
- firefox: content, navigation and poster work without JavaScript — Pass
- firefox: WebGL unavailable keeps the poster and all content usable — Pass
- firefox: failed enhancement downloads leave a complete, static page — Pass
- firefox: project enquiry validates and saves the visitor's input — Pass
- firefox: WCAG accessibility at 320px — Pass
- firefox: WCAG accessibility at 768px — Pass
- firefox: WCAG accessibility at 1440px — Pass
- firefox: every in-page link has a real destination — Pass
- firefox: phone touch navigation works in portrait and landscape — SKIPPED
- webkit: layout at 320px — Pass
- webkit: layout at 360px — Pass
- webkit: layout at 375px — Pass
- webkit: layout at 390px — Pass
- webkit: layout at 414px — Pass
- webkit: layout at 430px — Pass
- webkit: layout at 768px — Pass
- webkit: layout at 1024px — Pass
- webkit: layout at 1280px — Pass
- webkit: layout at 1440px — Pass
- webkit: layout at 1920px — Pass
- webkit: mobile disclosure supports Escape, outside clicks and breakpoint changes — Pass
- webkit: content, navigation and poster work without JavaScript — Pass
- webkit: WebGL unavailable keeps the poster and all content usable — Pass
- webkit: failed enhancement downloads leave a complete, static page — Pass
- webkit: project enquiry validates and saves the visitor's input — Pass
- webkit: WCAG accessibility at 320px — Pass
- webkit: WCAG accessibility at 768px — Pass
- webkit: WCAG accessibility at 1440px — Pass
- webkit: every in-page link has a real destination — Pass
- webkit: phone touch navigation works in portrait and landscape — Pass
- chrome: scroll choreography runs in both directions at 390px — Pass
- chrome: scroll choreography runs in both directions at 1440px — Pass
- chrome: desktop services and process scenes stay in sync with scroll — Pass
- chrome: context loss restores the poster — Pass
- chrome: reduced motion: static content, no 3D, no scroll animation — Pass
- firefox: scroll choreography runs in both directions at 390px — SKIPPED
- firefox: scroll choreography runs in both directions at 1440px — SKIPPED
- firefox: desktop services and process scenes stay in sync with scroll — SKIPPED
- firefox: context loss restores the poster — SKIPPED
- firefox: reduced motion: static content, no 3D, no scroll animation — Pass
- webkit: scroll choreography runs in both directions at 390px — SKIPPED
- webkit: scroll choreography runs in both directions at 1440px — SKIPPED
- webkit: desktop services and process scenes stay in sync with scroll — SKIPPED
- webkit: context loss restores the poster — SKIPPED
- webkit: reduced motion: static content, no 3D, no scroll animation — Pass
- chrome-software: scroll choreography runs in both directions at 390px — Pass
- chrome-software: scroll choreography runs in both directions at 1440px — Pass
- chrome-software: desktop services and process scenes stay in sync with scroll — Pass
- chrome-software: context loss restores the poster — SKIPPED
- chrome-software: reduced motion: static content, no 3D, no scroll animation — Pass

Real WebGL lifecycle checks use installed Chrome with native graphics, plus a separate Chrome SwiftShader software-rendering stress project. Equivalent checks are explicitly skipped in Firefox and WebKit; WebGL failure and content-fallback behavior are tested in all three engines. Firefox does not support Playwright's mobile-device emulation, so its phone touch-emulation case is skipped; its responsive layouts are still tested at every width.

Automated axe checks cover WCAG 2 A/AA, 2.1 A/AA and 2.2 A/AA with navigation, form and FAQ content expanded. Automated coverage is not a complete manual accessibility audit.

## Problems addressed

- The repository contained only a starter page: replaced it with server-rendered company content, a mobile-first page structure, service links, process, FAQ and a functional local project-brief download.
- Large-screen layouts needed bounded widths; phones needed stacked copy/cards and tablets needed separate hero and process arrangements. Added tested breakpoints instead of scaling the desktop canvas.
- Short landscape menus could put links below the viewport: added a bounded independently scrollable disclosure with touch, Escape, outside-click, resize and focus handling.
- A heavy visual could block discovery: shipped a small poster and meaningful HTML first. The scene is split out and downloaded only on explicit intent. No GLB or texture is downloaded.
- Mobile GPU work: reduced geometry, pixel ratio, lights and rendering frequency, omitted particles and orbit geometry.
- Continuous/hidden animation work: demand-based frames stop after settling and while off screen or hidden. Added reduced-motion handling and full resource disposal.
- Missing WebGL, context loss and failed chunk downloads: retain the poster and all company content.
- Accessible naming: aligned service-link visible text with accessible names and excluded the inactive poster/scene from the accessibility tree.
- The starter had generic metadata, unnecessary Tailwind packages and multiple fonts: replaced metadata, removed unused styling dependencies and retained one next/font family.
- The project had no audit evidence: added repeatable production-build browser and Lighthouse scripts, request ledgers and screenshots.

## Production checks still required

- A public production URL is needed for PageSpeed Insights, CrUX field p75, WebPageTest and CDN/edge measurements. Local Lighthouse and scripted interactions are laboratory evidence.
- Physical Android phones, iPhones and tablets and real Safari desktop are not available to this run. WebKit and touch/CPU/network emulation do not establish physical-device performance.
- Set the confirmed SITE_URL and optional CONTACT_EMAIL before a release build; review the initial company copy/service categories with the business. The brief currently downloads locally; it does not claim to send an enquiry.
- Collect real-user LCP, INP and CLS at p75 by device class before declaring the Core Web Vitals field targets met.
