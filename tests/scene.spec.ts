import { expect, test, type Page } from "@playwright/test";
import { hydrated } from "./helpers";

// Rendering tests share a GPU; keep this file sequential to avoid competing scenes.
test.describe.configure({ mode: "default" });

// Count real WebGL draw calls: the measure of whether the 3D scene is rendering.
// (rAF callbacks are not a useful idle signal: ScrollTrigger keeps an empty rAF
// loop alive by design.)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const counter = window as unknown as { qaDraws: number };
    counter.qaDraws = 0;
    const prototypes = [
      window.WebGLRenderingContext?.prototype,
      window.WebGL2RenderingContext?.prototype,
    ].filter(Boolean) as unknown as Record<string, unknown>[];
    for (const prototype of prototypes)
      for (const name of [
        "drawArrays",
        "drawElements",
        "drawArraysInstanced",
        "drawElementsInstanced",
        "drawRangeElements",
      ]) {
        const original = prototype[name] as ((...args: unknown[]) => unknown) | undefined;
        if (!original) continue;
        prototype[name] = function (this: unknown, ...args: unknown[]) {
          counter.qaDraws++;
          return original.apply(this, args);
        };
      }
  });
});

/** Compact screens: scroll to a position in the story, in beat units (lib/story.ts). */
async function scrollToBeat(page: Page, units: number) {
  await page.evaluate((units) => {
    const story = document.querySelector<HTMLElement>(".story")!;
    const viewport = story.querySelector<HTMLElement>(".story-viewport")!;
    const unit = (story.offsetHeight - viewport.offsetHeight) / 12;
    scrollTo({ top: story.getBoundingClientRect().top + scrollY + units * unit, behavior: "instant" });
  }, units);
}

/** Scroll so a section is at entry progress p (1 = its top at the viewport top). */
async function scrollToSection(page: Page, id: string, p = 1, q = 0) {
  await page.evaluate(
    ({ id, p, q }) => {
      const rect = document.getElementById(id)!.getBoundingClientRect();
      const top = rect.top + scrollY;
      scrollTo({
        top: top + (p - 1) * innerHeight + q * Math.max(rect.height - innerHeight, 0),
        behavior: "instant",
      });
    },
    { id, p, q },
  );
}

const draws = (page: Page) =>
  page.evaluate(() => (window as unknown as { qaDraws: number }).qaDraws);

async function drawsDuring(page: Page, ms = 500) {
  const before = await draws(page);
  await page.waitForTimeout(ms);
  return (await draws(page)) - before;
}

async function expectIdle(page: Page) {
  await expect.poll(() => drawsDuring(page), { timeout: 10_000 }).toBe(0);
}

for (const width of [390, 1440]) {
  test(`scroll choreography runs in both directions at ${width}px`, async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(browserName !== "chromium", "Real WebGL lifecycle verified in Chrome.");
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: width < 700 ? 844 : 900 });
    await page.goto("/");
    const stage = page.locator(".stage");
    await expect(page.locator(".stage-canvas canvas")).toHaveCount(0);
    await hydrated(page);
    await page.mouse.move(width / 2, 300);
    if (testInfo.project.name === "chrome-software") {
      // Software rasterisers get the poster, never the 3D scene.
      await scrollToSection(page, "expertise", 1.1);
      await page.waitForTimeout(1500);
      await expect(stage).toHaveAttribute("data-state", "poster");
      await expect(stage).toHaveAttribute("data-view", "poster");
      await expect(page.locator(".stage-canvas canvas")).toHaveCount(0);
      await expect(page.locator(".stage-poster img")).toBeVisible();
      return;
    }
    await expect(stage).toHaveAttribute("data-state", "ready", { timeout: 30_000 });
    // Adaptive tiers (lib/robot/quality.ts): phones get a mobile tier, desktops a desktop tier.
    await expect(stage).toHaveAttribute(
      "data-quality",
      width < 700 ? /^mobile-(high|low)$/ : /^desktop(-high)?$/,
    );
    await expect(page.locator("html")).toHaveAttribute("data-motion", "ready");

    // Hero shows the supplied reference; the 3D scene is idle.
    await expect(stage).toHaveAttribute("data-view", "poster");
    await expectIdle(page);

    // Desktop: section positions. Compact: story beats (SEO & GEO precedes Expertise there).
    const checkpoints: [string, number, number, string, string][] =
      width >= 1024
        ? [
            ["about", 1.08, 0, "3d", "spectacles"],
            ["services", 1, 0.6, "3d", "spectacles"],
            ["expertise", 1.12, 0, "3d", "vr"],
            ["process", 1, 0.6, "3d", "vr"],
            ["visibility", 1, 0, "3d", "vr"],
            ["why", 1.22, 0, "3d", "none"],
            ["contact", 1, 0, "poster", "none"],
          ]
        : [
            ["about", 1.5, 0, "3d", "spectacles"],
            ["services", 3.4, 0, "3d", "spectacles"],
            ["visibility", 7.4, 0, "3d", "spectacles"],
            ["expertise", 8.5, 0, "3d", "vr"],
            ["process", 9.4, 0, "3d", "vr"],
            ["why", 10.5, 0, "3d", "none"],
            ["contact", 11.5, 0, "poster", "none"],
          ];
    const run = async (list: typeof checkpoints) => {
      for (const [id, p, q, view, eyewear] of list) {
        if (width >= 1024) await scrollToSection(page, id, p, q);
        else await scrollToBeat(page, p);
        await expect(stage, `${id} view`).toHaveAttribute("data-view", view);
        if (view === "3d")
          await expect(stage, `${id} eyewear`).toHaveAttribute("data-eyewear", eyewear);
        if (width >= 1024 && ["about", "expertise", "process", "visibility"].includes(id)) {
          await page.waitForTimeout(900);
          await page.screenshot({
            path: `reports/screenshots/interactive-3d-${testInfo.project.name}-${width}-${id}.png`,
          });
        }
      }
    };
    await run(checkpoints.slice(0, 2));
    // While the twin is on screen it renders (idle motion), proving the counter works.
    expect(await drawsDuring(page)).toBeGreaterThan(0);
    await run(checkpoints.slice(2));
    // At the contact section the robot is back to its original appearance and idle.
    await expectIdle(page);
    // Reverse direction.
    await run([...checkpoints].reverse().slice(1));
    if (width >= 1024) await scrollToSection(page, "top", 1);
    else await scrollToBeat(page, 0);
    await expect(stage).toHaveAttribute("data-view", "poster");
    await expectIdle(page);
    expect(errors).toEqual([]);
  });
}

test("desktop services and process scenes stay in sync with scroll", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Scene timing verified in Chrome.");
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await hydrated(page);
  await page.mouse.move(700, 300);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "ready");
  await scrollToSection(page, "services", 1, 0.2);
  await expect(page.locator("#services")).toHaveAttribute("data-focus", "left");
  await scrollToSection(page, "services", 1, 0.62);
  await expect(page.locator("#services")).toHaveAttribute("data-focus", "right");
  await page.waitForTimeout(800);
  const visible = await page
    .locator(".service-panel")
    .evaluateAll((panels) => panels.map((panel) => Number(getComputedStyle(panel).opacity)));
  expect(visible.slice(0, 3).every((opacity) => opacity > 0.95)).toBe(true);
  for (const [q, step] of [
    [0, "0"],
    [0.3, "1"],
    [0.6, "2"],
    [0.95, "3"],
  ] as const) {
    await scrollToSection(page, "process", 1, q);
    await expect(page.locator("#process")).toHaveAttribute("data-active", step);
  }
});

test("context loss restores the poster", async ({ page, browserName }, testInfo) => {
  test.skip(
    browserName !== "chromium" || testInfo.project.name === "chrome-software",
    "Requires a hardware Chrome WebGL context.",
  );
  await page.goto("/");
  await hydrated(page);
  await page.mouse.move(300, 300);
  await expect(page.locator(".stage")).toHaveAttribute("data-state", "ready", {
    timeout: 30_000,
  });
  await page.locator(".stage-canvas canvas").evaluate((canvas) => {
    const gl = (canvas as HTMLCanvasElement).getContext("webgl2");
    gl!.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(page.locator(".stage")).toHaveAttribute("data-state", "fallback");
  await expect(page.locator(".stage-canvas canvas")).toHaveCount(0);
  await scrollToSection(page, "expertise", 1.1);
  await expect(page.locator(".stage")).toHaveAttribute("data-view", "poster");
  await expect(page.locator(".stage-poster img")).toBeVisible();
});

test("reduced motion: static content, no 3D, no scroll animation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await page.mouse.wheel(0, 2000);
  await page.waitForTimeout(1500);
  await expect(page.locator(".stage-canvas canvas")).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-motion", "ready");
  const hidden = await page
    .locator("[data-reveal], [data-panel], [data-step]")
    .evaluateAll((elements) =>
      elements.filter((element) => getComputedStyle(element).opacity !== "1").length,
    );
  expect(hidden).toBe(0);
  await expect(page.locator(".stage-poster img")).toBeVisible();
});
