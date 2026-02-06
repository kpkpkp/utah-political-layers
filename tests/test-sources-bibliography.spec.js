// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Sources Bibliography", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("#map");
  });

  test("Sources details element exists below Appearance", async ({ page }) => {
    const sources = page.locator("#sources-group");
    await expect(sources).toBeVisible();
    // Verify it comes after Appearance
    const appearance = page.locator("details.appearance-group").first();
    await expect(appearance).toBeVisible();
  });

  test("Sources section is collapsed by default", async ({ page }) => {
    const sources = page.locator("#sources-group");
    await expect(sources).not.toHaveAttribute("open", "");
  });

  test("Sources section expands on click", async ({ page }) => {
    const summary = page.locator("#sources-group summary");
    await summary.click();
    const sources = page.locator("#sources-group");
    await expect(sources).toHaveAttribute("open", "");
  });

  test("Sources section contains expected links", async ({ page }) => {
    const summary = page.locator("#sources-group summary");
    await summary.click();
    const links = page.locator("#sources-group .sources-list a");
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(10);
  });

  test("All source links have valid href and target=_blank", async ({ page }) => {
    const summary = page.locator("#sources-group summary");
    await summary.click();
    const links = page.locator("#sources-group .sources-list a");
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const href = await links.nth(i).getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https?:\/\//);
      const target = await links.nth(i).getAttribute("target");
      expect(target).toBe("_blank");
    }
  });

  test("Key sources are present", async ({ page }) => {
    const summary = page.locator("#sources-group summary");
    await summary.click();
    const container = page.locator("#sources-group .sources-list");
    await expect(container.locator('a[href*="le.utah.gov"]')).toBeVisible();
    await expect(container.locator('a[href*="ballotpedia.org"]')).toBeVisible();
    await expect(container.locator('a[href*="opendata.gis.utah.gov"]').first()).toBeVisible();
    await expect(container.locator('a[href*="openstreetmap.org"]')).toBeVisible();
  });

  test("Summary text says Sources", async ({ page }) => {
    const summary = page.locator("#sources-group summary");
    await expect(summary).toHaveText("Sources");
  });

  test("Sources has same styling as Appearance group", async ({ page }) => {
    const sources = page.locator("#sources-group");
    const border = await sources.evaluate((el) => getComputedStyle(el).borderStyle);
    expect(border).toBe("solid");
  });
});
