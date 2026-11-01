import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const widths = [320, 360, 375, 390, 414, 430, 768, 1024, 1280, 1440, 1920];
const heightFor = (width: number) =>
  width < 700 ? 844 : width < 1024 ? 1024 : width >= 1920 ? 1080 : width === 1024 ? 768 : 900;

type Box = { x: number; y: number; width: number; height: number };
const intersects = (a: Box, b: Box) =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

async function figureBox(page: Page) {
  // The poster box is the robot's bounding box (the image is cropped to it).
  return (await page.locator(".stage-figure").boundingBox())!;
}

for (const width of widths) {
  test(`layout at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const height = heightFor(width);
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    // Let the hero's entrance (compact story) finish; looping ambience is ignored.
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished),
      ),
    );
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".hero").getByRole("link", { name: "Start a project" })).toBeVisible();
    await expect(page.locator(".stage-poster img")).toBeVisible();

    const layout = await page.evaluate(() => {
      const selectors = "h1,h2,h3,p,.button,.panel,.header-inner,.step,.chips li";
      // Effective opacity: skip invisible scroll-animation start states.
      const opacity = (element: Element | null): number =>
        element ? Number(getComputedStyle(element).opacity) * opacity(element.parentElement) : 1;
      const offenders = [...document.querySelectorAll<HTMLElement>(selectors)]
        .filter(
          (element) =>
            element.getClientRects().length > 0 &&
            getComputedStyle(element).visibility !== "hidden" &&
            opacity(element) > 0.02,
        )
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return {
            text: element.textContent?.trim().slice(0, 40),
            left: rect.left,
            right: rect.right,
            clipped: element.scrollWidth > element.clientWidth + 2,
          };
        })
        .filter(
          (item) => item.left < -1 || item.right > innerWidth + 1 || item.clipped,
        );
      return { document: document.documentElement.scrollWidth, offenders };
    });
    expect(layout.document).toBeLessThanOrEqual(width);
    expect(layout.offenders).toEqual([]);

    // The robot never hides the hero copy.
    const figure = await figureBox(page);
    const head = { ...figure, height: figure.height * 0.16 };
    const copy = (await page.locator(".hero-copy").boundingBox())!;
    const aside = (await page.locator(".hero-aside").boundingBox())!;
    if (width >= 1024) {
      expect(copy.x + copy.width).toBeLessThanOrEqual(figure.x + 1);
      expect(aside.x).toBeGreaterThanOrEqual(figure.x + figure.width - 1);
    } else {
      // Compact story: headline above the robot (its head starts ~1% into the
      // poster box), lead and calls to action below its feet.
      expect(copy.y + copy.height).toBeLessThanOrEqual(figure.y + figure.height * 0.012 + 4);
      expect(aside.y).toBeGreaterThanOrEqual(figure.y + figure.height * 0.985);
    }

    // Desktop: service panels orbit the robot without covering it.
    if (width >= 1024) {
      const panels = await page.locator(".service-panel").evaluateAll((elements) =>
        elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        }),
      );
      for (const panel of panels) {
        expect(intersects(panel, figure)).toBe(false);
        expect(intersects(panel, head)).toBe(false);
      }
    }

    if (width < 1024) {
      await page.getByLabel("Toggle navigation").click();
      const menu = page.getByRole("navigation", { name: "Mobile navigation" });
      await expect(menu).toBeVisible();
      const targets = await page
        .locator(".mobile-nav nav a, .mobile-nav summary")
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect()),
        );
      expect(targets.every((target) => target.width >= 44 && target.height >= 44)).toBe(true);
      await menu.getByRole("link", { name: /Services/ }).click();
      await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open");
    }

    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `reports/screenshots/${testInfo.project.name}-${width}.png`,
      animations: "disabled",
    });
    expect(errors).toEqual([]);
  });
}

test("mobile disclosure supports Escape, outside clicks and breakpoint changes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByLabel("Toggle navigation");
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open");
  await toggle.click();
  await page.locator("h1").click({ force: true });
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open");
  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open");
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
});

test("content, navigation and poster work without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    javaScriptEnabled: false,
    viewport: { width: 320, height: 740 },
  });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".stage-poster img")).toBeVisible();
  expect(await page.locator(".stage-canvas canvas").count()).toBe(0);
  await page.getByLabel("Toggle navigation").click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.getByLabel("Toggle navigation").click();
  for (const name of ["Website Development", "SEO & GEO", "Launch & scale", "Transparent delivery"])
    await expect(page.getByRole("heading", { name, exact: true })).toBeAttached();
  await page.locator("#services").scrollIntoViewIfNeeded();
  await expect(page.getByRole("heading", { name: "Website Development" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320);
  await context.close();
});

test("WebGL unavailable keeps the poster and all content usable", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.includes("webgl")) return null;
      return original.apply(this, [type, ...args] as Parameters<typeof original>);
    } as typeof original;
  });
  await page.goto("/");
  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(800);
  await expect(page.locator(".stage")).toHaveAttribute("data-state", "poster");
  expect(await page.locator(".stage-canvas canvas").count()).toBe(0);
  await expect(page.locator(".stage-poster img")).toBeVisible();
  await page.locator(".hero").getByRole("link", { name: "Explore services" }).click();
  await expect(page.getByRole("heading", { name: "What we build." })).toBeVisible();
});

test("failed enhancement downloads leave a complete, static page", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  await expect(page.locator("#contact form")).not.toHaveAttribute("hidden");
  // Block every lazily loaded chunk (3D scene and GSAP) before the first interaction.
  await page.route("**/_next/static/chunks/*.js", (route) => route.abort());
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 400);
  if (browserName === "chromium")
    await expect(page.locator(".stage")).toHaveAttribute("data-state", "fallback");
  await page.waitForTimeout(1500);
  await expect(page.locator(".stage")).not.toHaveAttribute("data-state", "ready");
  expect(await page.locator(".stage-canvas canvas").count()).toBe(0);
  await expect(page.locator(".stage-poster img")).toBeVisible();
  await expect(page.locator("h1")).toBeVisible();
  const hidden = await page
    .locator("[data-reveal], [data-panel], [data-step]")
    .evaluateAll((elements) =>
      elements.filter((element) => getComputedStyle(element).opacity !== "1").length,
    );
  expect(hidden).toBe(0);
});

test("project enquiry validates and saves the visitor's input", async ({ page }) => {
  await page.goto("/");
  await page.locator(".hero").getByRole("link", { name: "Start a project" }).click();
  const form = page.locator("#contact form");
  await form.getByRole("button").click();
  expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBe(false);
  await form.getByLabel("Name").fill("QA Visitor");
  await form.getByLabel("Email").fill("qa@example.com");
  await form.getByLabel("Service").selectOption("AI & Automation");
  await form.getByLabel("Project").fill("An internal tool that automates order processing.");
  const downloadEvent = page.waitForEvent("download");
  await form.getByRole("button", { name: /Save project brief/ }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("novahomin-project-enquiry.txt");
  const chunks: Buffer[] = [];
  for await (const chunk of (await download.createReadStream())!) chunks.push(chunk as Buffer);
  const content = Buffer.concat(chunks).toString();
  expect(content).toContain("qa@example.com");
  expect(content).toContain("AI & Automation");
  expect(content).toContain("automates order processing");
});

for (const width of [320, 768, 1440]) {
  test(`WCAG accessibility at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    if (width < 1024) await page.getByLabel("Toggle navigation").click();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"])
      .analyze();
    await testInfo.attach("accessibility-audit", {
      body: JSON.stringify(result, null, 2),
      contentType: "application/json",
    });
    expect(result.violations).toEqual([]);
  });
}

test("every in-page link has a real destination", async ({ page }) => {
  await page.goto("/");
  expect(
    await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute("href")!)
          .filter((href) => href !== "#" && !document.getElementById(href.slice(1))),
      ),
  ).toEqual([]);
});

test("phone touch navigation works in portrait and landscape", async ({
  browser,
  browserName,
}) => {
  test.skip(browserName === "firefox", "Firefox does not support isMobile emulation.");
  const context = await browser.newContext({
    baseURL: test.info().project.use.baseURL,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByLabel("Toggle navigation").tap();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: /Process/ })
    .tap();
  await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open");
  await page.setViewportSize({ width: 844, height: 390 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
  await page.getByLabel("Toggle navigation").tap();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await context.close();
});
