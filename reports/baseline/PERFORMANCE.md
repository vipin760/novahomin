# Novahomin — measured performance

Measured: 2026-11-01T05:04:05.537Z. URL: http://127.0.0.1:3200. Production build via next start.

## Lighthouse

3 cold runs per profile; the row is the actual run with median LCP, not averaged metrics. "mobile" and "desktop" use Lighthouse's default simulated (Lantern) throttling. "mobile-applied" applies the same mobile network and 4× CPU limits in DevTools, so its metrics are observed rather than simulated.

| Profile | Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| mobile | 3 | 97 | 100 | 100 | 100 | 0.908 s | 2.437 s | 0.0000 | 128 ms | 194.77 KiB |
| desktop | 3 | 100 | 100 | 100 | 100 | 0.242 s | 0.531 s | 0.0000 | 0 ms | 190.31 KiB |
| mobile-applied | 2 | 95 | 100 | 100 | 100 | 0.705 s | 1.793 s | 0.0002 | 235 ms | 194.77 KiB |

HTML and full JSON for all runs: [Lighthouse reports](./lighthouse/).

## Network and scripted interactions

Cold-cache Chrome using actual CDP network and CPU throttling. Transferred bytes are CDP encodedDataLength (including response headers). Web Vitals measured with Google's web-vitals library. INP below is from a single scripted session with menu, navigation, a full scroll through the 3D choreography and form input. It is **not** real-user p75 or a field Core Web Vitals assessment.

| Profile | Initial transfer | Initial JS transfer | FCP | LCP | Scripted INP | CLS | Optional 3D transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| Slow 4G / low-powered mobile emulation | 214.37 KiB | 140.69 KiB | 0.516 s | 1.240 s | 112 ms | 0 | 295.55 KiB |
| Fast 4G / mobile emulation | 214.37 KiB | 140.69 KiB | 0.452 s | 0.452 s | 88 ms | 0 | 295.55 KiB |
| Broadband / desktop | 194.77 KiB | 140.69 KiB | 0.332 s | 0.332 s | 32 ms | 0 | 295.55 KiB |

## Assets and bundles

- All build JS, including optional chunks: 1616.22 KiB raw / 468.34 KiB gzip / 394.49 KiB Brotli. Compression sizes are measured locally; network transfer above records the server's actual encoding.
- 3D model download: **0 bytes**. Procedurally constructed in the optional JS; no binary model or textures.
- Robot poster files (pre-encoded AVIF/WebP, responsive): novahomin-robot-360.avif 21.64 KiB, novahomin-robot-360.webp 56.43 KiB, novahomin-robot-420.avif 26.10 KiB, novahomin-robot-420.webp 69.67 KiB, novahomin-robot-540.avif 45.70 KiB, novahomin-robot-540.webp 98.73 KiB, novahomin-robot-670.avif 61.41 KiB, novahomin-robot-670.webp 127.65 KiB. The largest image transfer per profile is recorded in performance-summary.json.
- Full request ledger, per-chunk bundle sizes, browser version, CPU and configuration: [performance-summary.json](./performance-summary.json).

## Assessment limits

Google's current good thresholds at p75 are LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 ([Google Web Vitals](https://web.dev/articles/vitals)). Lighthouse does not measure field INP; TBT is separately reported and is not INP. This local report cannot establish real-user p75.

No public deployment URL was provided. PageSpeed Insights, CrUX field data, WebPageTest and CDN/edge latency checks require a reachable deployment and remain unverified. Playwright WebKit is engine coverage, not physical Safari/iPhone validation. CPU throttling is emulation, not a real low-powered device. Physical Android, iPhone and tablet testing remains outstanding.
