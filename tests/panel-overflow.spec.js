// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Control Panel Layout', () => {
  test('controls fit within panel bounds', async ({ page }) => {
    await page.goto('/');

    // Wait for panel to be visible
    const panel = page.locator('.control-panel');
    await expect(panel).toBeVisible();

    const panelBox = await panel.boundingBox();
    expect(panelBox).not.toBeNull();

    // Helper to check element is within panel
    const checkWithinBounds = async (selector, name) => {
      const element = page.locator(selector).first();
      if (await element.isVisible()) {
        const box = await element.boundingBox();
        if (box) {
          const rightEdge = box.x + box.width;
          const panelRightEdge = panelBox.x + panelBox.width;
          expect(rightEdge, `${name} should not overflow panel`).toBeLessThanOrEqual(panelRightEdge + 1); // 1px tolerance
        }
      }
    };

    // Check tile select dropdown
    await checkWithinBounds('.tile-select', 'Tile select dropdown');

    // Check sliders
    const sliders = page.locator('.slider-row input[type="range"]');
    const sliderCount = await sliders.count();
    for (let i = 0; i < sliderCount; i++) {
      const slider = sliders.nth(i);
      if (await slider.isVisible()) {
        const box = await slider.boundingBox();
        if (box) {
          const rightEdge = box.x + box.width;
          expect(rightEdge, `Slider ${i + 1} should not overflow`).toBeLessThanOrEqual(panelBox.x + panelBox.width + 1);
        }
      }
    }

    // Check reset button
    await checkWithinBounds('.reset-colors-btn', 'Reset button');
  });
});
