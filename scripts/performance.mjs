import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { resolve } from "node:path";
import os from "node:os";
import lighthouse from "lighthouse";
import desktopConfig from "lighthouse/core/config/desktop-config.js";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "@playwright/test";

const baseURL = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const directory = resolve("reports");
const runCount = Number(process.env.LIGHTHOUSE_RUNS || 3);
await mkdir(`${directory}/lighthouse`, { recursive: true });
const bytes = (value) => `${(value / 1024).toFixed(2)} KiB`;
const metric = (lhr, key) => lhr.audits[key]?.numericValue ?? null;
const summary = {
  buildID: (await readFile(".next/BUILD_ID", "utf8")).trim(),
  measuredAt: new Date().toISOString(),
  baseURL,
  environment: {
    platform: os.platform(),
    release: os.release(),
    architecture: os.arch(),
    node: process.version,
    cpu: os.cpus()[0].model,
    cpuCount: os.cpus().length,
  },
  lighthouse: {},
  network: [],
  bundle: {},
};

// Run serially: concurrent audits would contaminate CPU/network measurements.
// "mobile-applied" uses DevTools (applied) throttling: observed metrics under the same
// mobile network/CPU limits, rather than Lantern's simulated estimate.
for (const device of ["mobile", "desktop", "mobile-applied"]) {
  const runs = [];
  for (let index = 1; index <= runCount; index++) {
    console.log(`Lighthouse ${device}: run ${index}/${runCount}`);
    const chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
    });
    try {
      const flags = {
        port: chrome.port,
        output: ["html", "json"],
        logLevel: "error",
        onlyCategories: [
          "performance",
          "accessibility",
          "best-practices",
          "seo",
        ],
        ...(device === "mobile-applied" ? { throttlingMethod: "devtools" } : {}),
      };
      // The desktop preset is a config, not a flag, in the Node API.
      const result = await lighthouse(
        baseURL,
        flags,
        device === "desktop" ? desktopConfig : undefined,
      );
      if (result.lhr.runtimeError)
        throw new Error(JSON.stringify(result.lhr.runtimeError));
      await writeFile(
        `${directory}/lighthouse/${device}-${index}.html`,
        result.report[0],
      );
      await writeFile(
        `${directory}/lighthouse/${device}-${index}.json`,
        result.report[1],
      );
      const lhr = result.lhr;
      runs.push({
        run: index,
        lighthouseVersion: lhr.lighthouseVersion,
        userAgent: lhr.userAgent,
        fetchTime: lhr.fetchTime,
        scores: Object.fromEntries(
          Object.entries(lhr.categories).map(([key, category]) => [
            key,
            Math.round(category.score * 100),
          ]),
        ),
        fcp: metric(lhr, "first-contentful-paint"),
        lcp: metric(lhr, "largest-contentful-paint"),
        cls: metric(lhr, "cumulative-layout-shift"),
        tbt: metric(lhr, "total-blocking-time"),
        inp: null,
        transferBytes: metric(lhr, "total-byte-weight"),
        settings: lhr.configSettings,
        failures: Object.values(lhr.audits)
          .filter(
            (audit) =>
              audit.score !== null &&
              audit.score < 0.9 &&
              audit.scoreDisplayMode !== "informative",
          )
          .map(({ id, title, displayValue, score }) => ({
            id,
            title,
            displayValue,
            score,
          })),
      });
      console.log(JSON.stringify(runs.at(-1).scores));
    } finally {
      await chrome.kill();
    }
  }
  const median = [...runs].sort((a, b) => a.lcp - b.lcp)[
    Math.floor(runs.length / 2)
  ];
  summary.lighthouse[device] = { runs, medianByLCP: median.run };
}

const vitalsScript = await readFile(
  "node_modules/web-vitals/dist/web-vitals.iife.js",
  "utf8",
);
const browser = await chromium.launch({
  channel: "chrome",
});
summary.browserVersion = browser.version();
try {
  for (const profile of [
    {
      name: "Slow 4G / low-powered mobile emulation",
      latency: 150,
      downloadMbps: 1.6,
      uploadMbps: 0.75,
      cpu: 4,
      width: 390,
      height: 844,
      mobile: true,
    },
    {
      name: "Fast 4G / mobile emulation",
      latency: 85,
      downloadMbps: 9,
      uploadMbps: 1.5,
      cpu: 4,
      width: 390,
      height: 844,
      mobile: true,
    },
    {
      name: "Broadband / desktop",
      latency: 20,
      downloadMbps: 40,
      uploadMbps: 10,
      cpu: 1,
      width: 1440,
      height: 1000,
      mobile: false,
    },
  ]) {
    console.log(`Network and interactions: ${profile.name}`);
    const context = await browser.newContext({
      viewport: { width: profile.width, height: profile.height },
      isMobile: profile.mobile,
      hasTouch: profile.mobile,
      deviceScaleFactor: profile.mobile ? 2 : 1,
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: profile.latency,
      downloadThroughput: (profile.downloadMbps * 1_000_000) / 8,
      uploadThroughput: (profile.uploadMbps * 1_000_000) / 8,
      connectionType: profile.mobile ? "cellular4g" : "ethernet",
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
    const network = new Map();
    cdp.on("Network.responseReceived", ({ requestId, type, response }) =>
      network.set(requestId, {
        url: response.url,
        type,
        status: response.status,
        mimeType: response.mimeType,
        headers: response.headers,
        encodedDataLength: 0,
      }),
    );
    cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
      if (network.has(requestId))
        network.get(requestId).encodedDataLength = encodedDataLength;
    });
    await page.addInitScript({
      content: `${vitalsScript}\nwindow.qaVitals={};for(const method of ['onFCP','onLCP','onCLS','onINP']){webVitals[method](m=>{window.qaVitals[m.name]={value:m.value,rating:m.rating}},{reportAllChanges:true,durationThreshold:16});}`,
    });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const initialRequests = [...network.values()].map((entry) => ({
      ...entry,
    }));
    const initial = {
      transferBytes: initialRequests.reduce(
        (sum, request) => sum + request.encodedDataLength,
        0,
      ),
      javascriptTransferBytes: initialRequests
        .filter((request) => request.type === "Script")
        .reduce((sum, request) => sum + request.encodedDataLength, 0),
      largestImage: initialRequests
        .filter((request) => request.type === "Image")
        .sort((a, b) => b.encodedDataLength - a.encodedDataLength)[0],
      requests: initialRequests,
    };
    // The 3D twin loads on the first interaction, so everything after this is "extra".
    const before3D = new Set(network.keys());
    if (profile.mobile) {
      await page.getByLabel("Toggle navigation").tap();
      await page
        .getByRole("navigation", { name: "Mobile navigation" })
        .getByRole("link", { name: /Services/ })
        .tap();
    } else
      await page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Services" })
        .click();
    await page.waitForFunction(
      () =>
        ["ready", "fallback", "poster"].includes(
          document.querySelector(".stage").dataset.state,
        ) && document.querySelector(".stage").dataset.state !== "loading",
      null,
      { timeout: 60_000 },
    );
    await page.waitForLoadState("networkidle");
    // Scroll through the whole choreography, then interact with the enquiry form.
    for (let step = 0; step < 24; step++) {
      await page.mouse.wheel(0, profile.height * 0.5);
      await page.waitForTimeout(120);
    }
    const form = page.locator("#contact form");
    await form.getByLabel("Name").fill("Performance Visitor");
    await form.getByLabel("Email").fill("perf@example.com");
    await form.getByLabel("Service").selectOption("SaaS Development");
    await form
      .getByLabel("Project")
      .fill("A responsive product with meaningful interactions.");
    await page.waitForTimeout(1500);
    // Trigger the documented on-hidden final metric flush using a real background tab.
    const otherPage = await context.newPage();
    await otherPage.bringToFront();
    await page.waitForTimeout(400);
    const vitals = await page.evaluate(() => window.qaVitals);
    const sceneDiagnostics = await page
      .locator(".stage")
      .evaluate((element) => ({ ...element.dataset }));
    const extra3DRequests = [...network.entries()]
      .filter(([id]) => !before3D.has(id))
      .map(([, request]) => request);
    const result = {
      profile,
      initial,
      scriptedSessionVitals: vitals,
      sceneDiagnostics,
      extra3DTransferBytes: extra3DRequests.reduce(
        (sum, request) => sum + request.encodedDataLength,
        0,
      ),
      extra3DRequests,
    };
    summary.network.push(result);
    console.log(
      JSON.stringify({
        profile: profile.name,
        transferBytes: initial.transferBytes,
        jsBytes: initial.javascriptTransferBytes,
        vitals,
        sceneDiagnostics,
      }),
    );
    await context.close();
  }
} finally {
  await browser.close();
}

async function filesBelow(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map(async (entry) =>
      entry.isDirectory()
        ? filesBelow(`${folder}/${entry.name}`)
        : [`${folder}/${entry.name}`],
    ),
  );
  return groups.flat();
}
const chunks = [];
for (const file of await filesBelow(".next/static/chunks")) {
  if (!file.endsWith(".js")) continue;
  const contents = await readFile(file);
  chunks.push({
    file,
    rawBytes: contents.byteLength,
    gzipBytes: gzipSync(contents).byteLength,
    brotliBytes: brotliCompressSync(contents).byteLength,
  });
}
summary.bundle = {
  chunks,
  totals: chunks.reduce(
    (sum, chunk) => ({
      rawBytes: sum.rawBytes + chunk.rawBytes,
      gzipBytes: sum.gzipBytes + chunk.gzipBytes,
      brotliBytes: sum.brotliBytes + chunk.brotliBytes,
    }),
    { rawBytes: 0, gzipBytes: 0, brotliBytes: 0 },
  ),
  modelDownloadBytes: 0,
  modelExplanation:
    "Procedural geometry; no GLB/GLTF, textures, KTX2 or Draco/Meshopt decoder requests. Optional Three.js/R3F code is included in extra3DTransferBytes.",
  posterFiles: Object.fromEntries(
    await Promise.all(
      (await readdir("public/robot")).map(async (file) => [
        file,
        (await stat(`public/robot/${file}`)).size,
      ]),
    ),
  ),
};
await writeFile(
  `${directory}/performance-summary.json`,
  JSON.stringify(summary, null, 2),
);

const medians = Object.entries(summary.lighthouse).map(([device, value]) => [
  device,
  value.runs.find((run) => run.run === value.medianByLCP),
]);
const report = `# Novahomin — measured performance\n\nMeasured: ${summary.measuredAt}. URL: ${baseURL}. Production build via next start.\n\n## Lighthouse\n\n${runCount} cold runs per profile; the row is the actual run with median LCP, not averaged metrics. "mobile" and "desktop" use Lighthouse's default simulated (Lantern) throttling. "mobile-applied" applies the same mobile network and 4× CPU limits in DevTools, so its metrics are observed rather than simulated.\n\n| Profile | Run | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT | Transfer |\n|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${medians.map(([device, run]) => `| ${device} | ${run.run} | ${run.scores.performance} | ${run.scores.accessibility} | ${run.scores["best-practices"]} | ${run.scores.seo} | ${(run.fcp / 1000).toFixed(3)} s | ${(run.lcp / 1000).toFixed(3)} s | ${run.cls.toFixed(4)} | ${run.tbt.toFixed(0)} ms | ${bytes(run.transferBytes)} |`).join("\n")}\n\nHTML and full JSON for all runs: [Lighthouse reports](./lighthouse/).\n\n## Network and scripted interactions\n\nCold-cache Chrome using actual CDP network and CPU throttling. Transferred bytes are CDP encodedDataLength (including response headers). Web Vitals measured with Google's web-vitals library. INP below is from a single scripted session with menu, navigation, a full scroll through the 3D choreography and form input. It is **not** real-user p75 or a field Core Web Vitals assessment.\n\n| Profile | Initial transfer | Initial JS transfer | FCP | LCP | Scripted INP | CLS | Optional 3D transfer |\n|---|---:|---:|---:|---:|---:|---:|---:|\n${summary.network.map((result) => `| ${result.profile.name} | ${bytes(result.initial.transferBytes)} | ${bytes(result.initial.javascriptTransferBytes)} | ${result.scriptedSessionVitals.FCP ? (result.scriptedSessionVitals.FCP.value / 1000).toFixed(3) + " s" : "Not observed"} | ${result.scriptedSessionVitals.LCP ? (result.scriptedSessionVitals.LCP.value / 1000).toFixed(3) + " s" : "Not observed"} | ${result.scriptedSessionVitals.INP?.value ?? "Not observed"} ms | ${result.scriptedSessionVitals.CLS?.value ?? "Not observed"} | ${bytes(result.extra3DTransferBytes)} |`).join("\n")}\n\n## Assets and bundles\n\n- All build JS, including optional chunks: ${bytes(summary.bundle.totals.rawBytes)} raw / ${bytes(summary.bundle.totals.gzipBytes)} gzip / ${bytes(summary.bundle.totals.brotliBytes)} Brotli. Compression sizes are measured locally; network transfer above records the server's actual encoding.\n- 3D model download: **0 bytes**. Procedurally constructed in the optional JS; no binary model or textures.\n- Robot poster files (pre-encoded AVIF/WebP, responsive): ${Object.entries(summary.bundle.posterFiles).map(([file, size]) => `${file} ${bytes(size)}`).join(", ")}. The largest image transfer per profile is recorded in performance-summary.json.\n- Full request ledger, per-chunk bundle sizes, browser version, CPU and configuration: [performance-summary.json](./performance-summary.json).\n\n## Assessment limits\n\nGoogle's current good thresholds at p75 are LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 ([Google Web Vitals](https://web.dev/articles/vitals)). Lighthouse does not measure field INP; TBT is separately reported and is not INP. This local report cannot establish real-user p75.\n\nNo public deployment URL was provided. PageSpeed Insights, CrUX field data, WebPageTest and CDN/edge latency checks require a reachable deployment and remain unverified. Playwright WebKit is engine coverage, not physical Safari/iPhone validation. CPU throttling is emulation, not a real low-powered device. Physical Android, iPhone and tablet testing remains outstanding.\n`;
await writeFile(`${directory}/PERFORMANCE.md`, report);
console.log(`Saved measured reports to ${directory}`);
