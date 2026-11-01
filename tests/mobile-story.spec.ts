import { expect, test, type Page } from "@playwright/test";

/** Required phone widths, each at a realistic height (including a 568 px-tall phone). */
const phones: [number, number][] = [
  [320, 568],
  [360, 740],
  [375, 667],
  [390, 844],
  [414, 896],
  [430, 932],
];

/** The required storytelling order and entrance sides. */
const sequence = [
  ["Hero introduction", "left"],
  ["About Novahomin", "right"],
  ["Website development", "left"],
  ["Mobile applications", "right"],
  ["SaaS development", "left"],
  ["AI & Automation", "right"],
  ["E-commerce", "left"],
  ["SEO & GEO", "right"],
  ["Technology expertise", "left"],
  ["Development process", "right"],
  ["Why Novahomin", "left"],
  ["Final contact CTA", "right"],
] as const;

async function startStory(page: Page, width: number, height: number) {
  // These tests cover layout and motion; the robot's box comes from the poster/rig,
  // so WebGL is switched off to keep them fast in every engine (3D: scene.spec.ts).
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
  await page.setViewportSize({ width, height });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-cinema", "");
  await expect(page.locator("#contact form")).not.toHaveAttribute("hidden");
  await page.mouse.wheel(0, 4);
  await expect(page.locator("html")).toHaveAttribute("data-motion", "ready");
  await expect(page.locator(".story")).toHaveAttribute("data-beat", /\d+/);
  return page.evaluate(() => {
    const story = document.querySelector<HTMLElement>(".story")!;
    const viewport = story.querySelector<HTMLElement>(".story-viewport")!;
    return {
      start: story.getBoundingClientRect().top + scrollY,
      unit: (story.offsetHeight - viewport.offsetHeight) / 12,
    };
  });
}

type Snapshot = {
  beat: number;
  from: string;
  opacity: number;
  tx: number;
  ty: number;
  rect: { left: number; right: number; top: number; bottom: number };
  clipped: boolean;
};

/** Every story element that is currently rendered, with its motion state. */
function snapshot(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>("[data-story]")]
      .filter((element) => getComputedStyle(element).display !== "none")
      .map((element) => {
        const style = getComputedStyle(element);
        const matrix = new DOMMatrix(style.transform);
        const rect = element.getBoundingClientRect();
        const texts = [...element.querySelectorAll<HTMLElement>("h1,h2,h3,p,li,dt,.button")];
        return {
          beat: Number(element.dataset.story),
          exit: Number(element.dataset.storyExit ?? element.dataset.story),
          from: element.dataset.from!,
          opacity: style.visibility === "hidden" ? 0 : Number(style.opacity),
          tx: matrix.m41,
          ty: matrix.m42,
          rect: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
          clipped: texts.some((text) => text.scrollWidth > text.clientWidth + 2),
        };
      }),
  );
}

const robotBox = (page: Page) =>
  page.evaluate(() => {
    const rect = document.querySelector(".stage-figure")!.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  });

const overlaps = (a: Snapshot["rect"], b: Snapshot["rect"]) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test("the twelve beats follow the required order and alternate sides", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const sides = await page.evaluate(() =>
    Array.from({ length: 12 }, (_, beat) =>
      [...document.querySelectorAll<HTMLElement>(`[data-story="${beat}"]`)].map(
        (element) => element.dataset.from,
      ),
    ),
  );
  sequence.forEach(([name, side], beat) => {
    expect(sides[beat].length, name).toBeGreaterThan(0);
    expect(new Set(sides[beat]), name).toEqual(new Set([side]));
  });
});

for (const [width, height] of phones) {
  test(`horizontal story at ${width}×${height}`, async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const story = await startStory(page, width, height);
    const header = await page
      .locator(".site-header")
      .evaluate((element) => (element as HTMLElement).offsetHeight);
    const at = async (units: number) => {
      await page.evaluate((top) => scrollTo({ top, behavior: "instant" }), story.start + units * story.unit);
      await page.waitForTimeout(950); // scrub smoothing settles
    };
    const verticalMotion: string[] = [];

    for (let beat = 0; beat < 12; beat++) {
      const [name, side] = sequence[beat];
      if (beat > 0) {
        // Mid-entrance: moving in horizontally from its side, partly transparent.
        await at(beat + 0.03);
        const entering = (await snapshot(page)).filter((item) => item.beat === beat);
        for (const item of entering) {
          expect(item.opacity, `${name} opacity mid-entrance`).toBeGreaterThan(0.02);
          expect(item.opacity, `${name} opacity mid-entrance`).toBeLessThan(0.98);
          expect(Math.sign(item.tx), `${name} enters from the ${side}`).toBe(side === "left" ? -1 : 1);
          if (Math.abs(item.ty) > 0.5) verticalMotion.push(`${name} entering`);
        }
      }

      // At rest: fully visible, readable, on screen, clear of the robot.
      await at(beat + 0.4);
      const items = await snapshot(page);
      const robot = await robotBox(page);
      const face = {
        left: robot.left + (robot.right - robot.left) * 0.3,
        right: robot.left + (robot.right - robot.left) * 0.7,
        top: robot.top,
        bottom: robot.top + (robot.bottom - robot.top) * 0.18,
      };
      const active = items.filter((item) => item.beat <= beat && beat <= item.exit);
      expect(active.length, name).toBeGreaterThan(0);
      for (const item of active) {
        expect(item.opacity, `${name} fully visible`).toBe(1);
        expect(Math.abs(item.tx), `${name} settled`).toBeLessThan(1);
        expect(item.clipped, `${name} text clipped`).toBe(false);
        expect(item.rect.left, `${name} inside left edge`).toBeGreaterThanOrEqual(-1);
        expect(item.rect.right, `${name} inside right edge`).toBeLessThanOrEqual(width + 1);
        expect(item.rect.top, `${name} below header`).toBeGreaterThanOrEqual(header - 1);
        expect(item.rect.bottom, `${name} above bottom edge`).toBeLessThanOrEqual(height + 1);
        expect(overlaps(item.rect, face), `${name} covers the robot's face`).toBe(false);
        expect(overlaps(item.rect, robot), `${name} covers the robot`).toBe(false);
        if (Math.abs(item.ty) > 0.5) verticalMotion.push(`${name} at rest`);
      }
      // Everything from other beats is out of view.
      for (const item of items.filter((other) => !active.includes(other)))
        expect(item.opacity, `${name}: other beats hidden`).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (width === 390 || [0, 8, 11].includes(beat))
        await page.screenshot({
          path: `reports/screenshots/mobile-story-${testInfo.project.name}-${width}-${String(beat).padStart(2, "0")}.png`,
        });
    }

    // Backwards: earlier beats come back from their sides.
    for (const beat of [7, 2, 1, 0]) {
      await at(beat + 0.4);
      const active = (await snapshot(page)).filter((item) => item.beat <= beat && beat <= item.exit);
      for (const item of active) expect(item.opacity, `beat ${beat} on the way back`).toBe(1);
    }
    expect(verticalMotion).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("menu links land on the right beat", async ({ page }) => {
  await startStory(page, 390, 844);
  for (const [label, beat] of [
    ["Expertise", "8"],
    ["Services", "2"],
    ["Contact", "11"],
  ] as const) {
    await page.getByLabel("Toggle navigation").click();
    await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: label }).click();
    await expect(page.locator(".story")).toHaveAttribute("data-beat", beat);
    await expect(page.locator(".mobile-nav")).not.toHaveAttribute("open");
  }
});

test("the contact sheet slides in, traps focus and closes with Escape", async ({ page }) => {
  await startStory(page, 390, 844);
  await page.getByLabel("Toggle navigation").click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Contact" }).click();
  await expect(page.locator(".story")).toHaveAttribute("data-beat", "11");
  await page.waitForTimeout(900);
  const cta = page.locator(".enquiry-cta .button");
  await cta.click();
  const sheet = page.getByRole("dialog", { name: "Project enquiry" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByLabel("Name")).toBeFocused();
  // Slides in from the right edge to fill the screen.
  await expect.poll(async () => Math.round((await sheet.boundingBox())!.x)).toBe(0);
  expect(Math.round((await sheet.boundingBox())!.width)).toBe(390);
  await page.keyboard.press("Shift+Tab");
  await expect(sheet.getByRole("button", { name: "Close project enquiry" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(sheet.getByRole("button", { name: /Save project brief/ })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(cta).toBeFocused();
});

test("if the scroll library cannot load, the static layout shows everything", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#contact form")).not.toHaveAttribute("hidden");
  await page.route("**/_next/static/chunks/*.js", (route) => route.abort());
  await page.mouse.wheel(0, 300);
  await expect(page.locator("html")).not.toHaveAttribute("data-cinema");
  const hidden = await page
    .locator("[data-story]")
    .evaluateAll((elements) =>
      elements.filter(
        (element) =>
          getComputedStyle(element).display !== "none" &&
          (getComputedStyle(element).opacity !== "1" ||
            getComputedStyle(element).visibility === "hidden"),
      ).length,
    );
  expect(hidden).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
