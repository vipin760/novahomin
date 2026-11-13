import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = ["/", "/about", "/services", "/pricing", "/insights", "/insights/rag-vs-fine-tuning", "/contact"];
const widths = [320, 375, 414, 768, 1024, 1280, 1440, 1920];

for (const route of routes) {
  test.describe(`page ${route}`, () => {
    for (const width of widths) {
      test(`fits ${width}px without horizontal scroll`, async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.setViewportSize({ width, height: width < 768 ? 844 : 900 });
        await page.goto(route);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        expect(errors).toEqual([]);
      });
    }

    test("has no automatically detectable accessibility violations", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(route);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(results.violations.map((violation) => violation.id)).toEqual([]);
    });
  });
}

test("unknown article returns 404", async ({ page }) => {
  const response = await page.goto("/insights/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Page not found" })).toBeVisible();
});

test("mobile menu opens, navigates and closes", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Pricing" }).click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
});

test("pages dropdown opens on hover and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/pricing");
  const trigger = page.getByRole("button", { name: "Pages" });
  await trigger.hover();
  await expect(page.locator("#pages-menu").getByRole("link", { name: "Insights" })).toBeVisible();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("review cards expand on hover", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const cards = page.locator(".review-card");
  await expect(cards.nth(0)).toHaveClass(/is-active/);
  await cards.nth(2).scrollIntoViewIfNeeded();
  await cards.nth(2).hover();
  await expect(cards.nth(2)).toHaveClass(/is-active/);
  await expect(cards.nth(0)).not.toHaveClass(/is-active/);
  await expect(page.getByRole("button", { name: "Show: AI-native" })).toHaveAttribute("aria-expanded", "true");
});

test("header hides on scroll down and returns on scroll up", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const header = page.locator(".site-header");
  await page.evaluate(() => window.scrollTo(0, 800));
  await expect(header).toHaveAttribute("data-hidden", "true");
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(header).not.toHaveAttribute("data-hidden");
  await expect(header).toHaveAttribute("data-scrolled", "true");
});

test("scroll animations replay every time content comes back into view", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const card = page.locator(".pillar").first();
  const heading = page.locator("h1");
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS("opacity", "1");
  // Scroll far past: the card resets off screen…
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(card).toHaveCSS("opacity", "0");
  await expect(heading).toHaveCSS("opacity", "0");
  // …and animates in again on the way back up, as does the hero.
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveCSS("opacity", "1");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(heading).toHaveCSS("opacity", "1");
});

test("contact form saves a project brief", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Full name *").fill("Test Person");
  await page.getByLabel("Email address *").fill("test@example.com");
  await page.getByLabel("Message *").fill("We need a new marketing website.");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Save project brief|Send message/ }).click();
  if (!process.env.CONTACT_EMAIL) {
    expect((await download).suggestedFilename()).toBe("novahomin-project-enquiry.txt");
  }
});
