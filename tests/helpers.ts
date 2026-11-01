import { expect, type Page } from "@playwright/test";

/** Makes every WebGL context request fail, as on devices without WebGL. */
export async function blockWebGL(page: Page) {
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
}

/** Interaction listeners attach on hydration; the enquiry form un-hides at the same time. */
export async function hydrated(page: Page) {
  await expect(page.locator("#contact form")).not.toHaveAttribute("hidden");
}
