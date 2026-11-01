# Novahomin — measured performance

Measured: 2026-10-31T22:07:10.144Z. URL: http://127.0.0.1:3200. Production build via next start.

## Lighthouse

3 cold runs per profile; the row is the actual run with median LCP, not averaged metrics. "mobile" and "desktop" use Lighthouse's default simulated (Lantern) throttling. "mobile-applied" applies the same mobile network and 4× CPU limits in DevTools, so its metrics are observed rather than simulated.

| Profile | Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT | Transfer |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| mobile | 1 | 95 | 100 | 100 | 100 | 0.956 s | 2.403 s | 0.0000 | 197 ms | 185.88 KiB |
| desktop | 1 | 100 | 100 | 100 | 100 | 0.251 s | 0.541 s | 0.0000 | 0 ms | 181.42 KiB |
| mobile-applied | 2 | 94 | 100 | 100 | 100 | 0.752 s | 2.368 s | 0.0002 | 230 ms | 185.88 KiB |

HTML and full JSON for all runs: [Lighthouse reports](./lighthouse/).

## Network and scripted interactions

Cold-cache Chrome using actual CDP network and CPU throttling. Transferred bytes are CDP encodedDataLength (including response headers). Web Vitals measured with Google's web-vitals library. INP below is from a single scripted session with menu, navigation, a full scroll through the 3D choreography and form input. It is **not** real-user p75 or a field Core Web Vitals assessment.

| Profile | Initial transfer | Initial JS transfer | FCP | LCP | Scripted INP | CLS | Optional 3D transfer |
|---|---:|---:|---:|---:|---:|---:|---:|
| Slow 4G / low-powered mobile emulation | 205.48 KiB | 140.19 KiB | 0.392 s | 1.268 s | 160 ms | 0 | 294.16 KiB |
| Fast 4G / mobile emulation | 205.48 KiB | 140.19 KiB | 0.308 s | 0.720 s | 120 ms | 0 | 294.16 KiB |
| Broadband / desktop | 185.88 KiB | 140.19 KiB | 0.488 s | 0.488 s | 40 ms | 0 | 294.16 KiB |

## Assets and bundles

- All build JS, including optional chunks: 1610.27 KiB raw / 466.46 KiB gzip / 392.79 KiB Brotli. Compression sizes are measured locally; network transfer above records the server's actual encoding.
- 3D model download: **0 bytes**. Procedurally constructed in the optional JS; no binary model or textures.
- Robot poster files (pre-encoded AVIF/WebP, responsive): novahomin-robot-360.avif 21.64 KiB, novahomin-robot-360.webp 56.43 KiB, novahomin-robot-420.avif 26.10 KiB, novahomin-robot-420.webp 69.67 KiB, novahomin-robot-540.avif 45.70 KiB, novahomin-robot-540.webp 98.73 KiB, novahomin-robot-670.avif 61.41 KiB, novahomin-robot-670.webp 127.65 KiB. The largest image transfer per profile is recorded in performance-summary.json.
- Full request ledger, per-chunk bundle sizes, browser version, CPU and configuration: [performance-summary.json](./performance-summary.json).

## Assessment limits

Google's current good thresholds at p75 are LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 ([Google Web Vitals](https://web.dev/articles/vitals)). Lighthouse does not measure field INP; TBT is separately reported and is not INP. This local report cannot establish real-user p75.

No public deployment URL was provided. PageSpeed Insights, CrUX field data, WebPageTest and CDN/edge latency checks require a reachable deployment and remain unverified. Playwright WebKit is engine coverage, not physical Safari/iPhone validation. CPU throttling is emulation, not a real low-powered device. Physical Android, iPhone and tablet testing remains outstanding.
