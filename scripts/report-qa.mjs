import { readFile, writeFile } from "node:fs/promises";

const results = JSON.parse(
  await readFile("reports/playwright-results.json", "utf8"),
);
const tests = [];
function visit(suite) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests)
      tests.push({
        name: spec.title,
        project: test.projectName,
        status: test.status,
        expectedStatus: test.expectedStatus,
        results: test.results.map(({ status, duration }) => ({
          status,
          duration,
        })),
      });
  }
  for (const child of suite.suites || []) visit(child);
}
results.suites.forEach(visit);
const buildID = (await readFile(".next/BUILD_ID", "utf8")).trim();
const widths = [
  320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1366, 1440, 1600,
  1920,
];
const resultFor = (width, project) =>
  tests.find(
    (test) =>
      test.name === `complete page at ${width}px` && test.project === project,
  );
const status = (test) =>
  !test
    ? "Not run"
    : test.status === "expected" && test.expectedStatus === "passed"
      ? "Pass"
      : test.status;
const report = `# Novahomin — browser QA\n\nBuild ID: ${buildID}. Started: ${results.stats.startTime}. Duration: ${(results.stats.duration / 1000).toFixed(1)} s.\n\nActual Playwright result: **${results.stats.expected} passed, ${results.stats.unexpected} failed, ${results.stats.skipped} skipped, ${results.stats.flaky} flaky**.\n\n[Interactive browser report](./playwright/index.html) · [Raw results](./playwright-results.json) · [Screenshots](./screenshots/)\n\n## Requested widths\n\n| CSS width | Installed Chrome | Firefox | WebKit |\n|---|---|---|---|\n${widths.map((width) => `| ${width} | ${status(resultFor(width, "chrome"))} | ${status(resultFor(width, "firefox"))} | ${status(resultFor(width, "webkit"))} |`).join("\n")}\n\nEach width checks the whole page for horizontal overflow, heading/button/card clipping, hero overlap, menu operation where applicable, 44px navigation targets, FAQ operation and the expanded brief layout. Each successful width run saves a full-page screenshot.\n\n## Functional and accessibility coverage\n\n${tests
  .filter((test) => !test.name.startsWith("complete page at"))
  .map(
    (test) =>
      `- ${test.project}: ${test.name} — ${test.expectedStatus === "skipped" ? "SKIPPED" : status(test)}`,
  )
  .join(
    "\n",
  )}\n\nReal WebGL lifecycle checks use installed Chrome with native graphics, plus a separate Chrome SwiftShader software-rendering stress project. Equivalent checks are explicitly skipped in Firefox and WebKit; WebGL failure and content-fallback behavior are tested in all three engines. Firefox does not support Playwright's mobile-device emulation, so its phone touch-emulation case is skipped; its responsive layouts are still tested at every width.\n\nAutomated axe checks cover WCAG 2 A/AA, 2.1 A/AA and 2.2 A/AA with navigation, form and FAQ content expanded. Automated coverage is not a complete manual accessibility audit.\n\n## Problems addressed\n\n- The repository contained only a starter page: replaced it with server-rendered company content, a mobile-first page structure, service links, process, FAQ and a functional local project-brief download.\n- Large-screen layouts needed bounded widths; phones needed stacked copy/cards and tablets needed separate hero and process arrangements. Added tested breakpoints instead of scaling the desktop canvas.\n- Short landscape menus could put links below the viewport: added a bounded independently scrollable disclosure with touch, Escape, outside-click, resize and focus handling.\n- A heavy visual could block discovery: shipped a small poster and meaningful HTML first. The scene is split out and downloaded only on explicit intent. No GLB or texture is downloaded.\n- Mobile GPU work: reduced geometry, pixel ratio, lights and rendering frequency, omitted particles and orbit geometry.\n- Continuous/hidden animation work: demand-based frames stop after settling and while off screen or hidden. Added reduced-motion handling and full resource disposal.\n- Missing WebGL, context loss and failed chunk downloads: retain the poster and all company content.\n- Accessible naming: aligned service-link visible text with accessible names and excluded the inactive poster/scene from the accessibility tree.\n- The starter had generic metadata, unnecessary Tailwind packages and multiple fonts: replaced metadata, removed unused styling dependencies and retained one next/font family.\n- The project had no audit evidence: added repeatable production-build browser and Lighthouse scripts, request ledgers and screenshots.\n\n## Production checks still required\n\n- A public production URL is needed for PageSpeed Insights, CrUX field p75, WebPageTest and CDN/edge measurements. Local Lighthouse and scripted interactions are laboratory evidence.\n- Physical Android phones, iPhones and tablets and real Safari desktop are not available to this run. WebKit and touch/CPU/network emulation do not establish physical-device performance.\n- Set the confirmed SITE_URL and optional CONTACT_EMAIL before a release build; review the initial company copy/service categories with the business. The brief currently downloads locally; it does not claim to send an enquiry.\n- Collect real-user LCP, INP and CLS at p75 by device class before declaring the Core Web Vitals field targets met.\n`;
await writeFile("reports/QA.md", report);
console.log(
  `Saved QA report: ${results.stats.expected} passed, ${results.stats.unexpected} failed, ${results.stats.skipped} skipped.`,
);
if (results.stats.unexpected || results.stats.flaky) process.exitCode = 1;
