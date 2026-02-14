import { test, expect } from '@playwright/test';

test.describe('Mobile FAB & Controls Discoverability', () => {
  test.describe('Mobile viewport (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
      // Dismiss tour if it appears
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('FAB is visible on mobile viewport', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      await expect(fab).toBeVisible();

      const styles = await fab.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          position: computed.position,
          width: computed.width,
          height: computed.height,
        };
      });

      expect(styles.display).toBe('flex');
      expect(styles.position).toBe('fixed');
      expect(parseFloat(styles.width)).toBeGreaterThanOrEqual(48);
      expect(parseFloat(styles.height)).toBeGreaterThanOrEqual(48);
    });

    test('Panel starts collapsed on mobile', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const isCollapsed = await panel.evaluate((el) =>
        el.classList.contains('collapsed')
      );
      expect(isCollapsed).toBe(true);
    });

    test('FAB click opens the panel', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const fab = page.locator('#mobile-fab');

      // Panel should start collapsed
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);

      // Click FAB
      await fab.click();
      await page.waitForTimeout(400);

      // Panel should now be expanded
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(false);
    });

    test('FAB is hidden when panel is expanded', async ({ page }) => {
      const fab = page.locator('#mobile-fab');

      // Open panel via FAB
      await fab.click();
      await page.waitForTimeout(400);

      // FAB should be hidden (opacity 0, pointer-events none)
      const styles = await fab.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          pointerEvents: computed.pointerEvents,
        };
      });

      expect(styles.opacity).toBe('0');
      expect(styles.pointerEvents).toBe('none');
    });

    test('Close button collapses the panel', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const fab = page.locator('#mobile-fab');
      const closeBtn = page.locator('#panel-close-btn');

      // Open panel first
      await fab.click();
      await page.waitForTimeout(400);
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(false);

      // Click close button
      await closeBtn.click();
      await page.waitForTimeout(400);

      // Panel should be collapsed
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);
    });

    test('FAB reappears after panel is closed', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      const closeBtn = page.locator('#panel-close-btn');

      // Open panel
      await fab.click();
      await page.waitForTimeout(400);

      // Close panel
      await closeBtn.click();
      await page.waitForTimeout(400);

      // FAB should be visible again
      const styles = await fab.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          pointerEvents: computed.pointerEvents,
        };
      });

      expect(styles.opacity).toBe('1');
      expect(styles.pointerEvents).not.toBe('none');
    });

    test('Mobile header with title and close button is visible when expanded', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      const mobileHeader = page.locator('.panel-mobile-header');
      const mobileTitle = page.locator('.panel-mobile-title');
      const closeBtn = page.locator('#panel-close-btn');

      // Open panel
      await fab.click();
      await page.waitForTimeout(400);

      await expect(mobileHeader).toBeVisible();
      await expect(mobileTitle).toBeVisible();
      await expect(closeBtn).toBeVisible();

      const titleText = await mobileTitle.textContent();
      expect(titleText).toBe('Utah Political Layers');
    });

    test('Legend and layer toggles are accessible when panel is open', async ({ page }) => {
      const fab = page.locator('#mobile-fab');

      // Open panel
      await fab.click();
      await page.waitForTimeout(400);

      // Check legend is visible
      const legend = page.locator('.legend');
      await expect(legend).toBeVisible();

      // Check layer toggles are visible
      const houseToggle = page.locator('#toggle-house');
      const senateToggle = page.locator('#toggle-senate');
      await expect(houseToggle).toBeVisible();
      await expect(senateToggle).toBeVisible();

      // Check party legend rows
      const republicanSwatch = page.locator('.swatch.republican');
      const democratSwatch = page.locator('.swatch.democrat');
      await expect(republicanSwatch).toBeVisible();
      await expect(democratSwatch).toBeVisible();
    });

    test('Close button has adequate touch target size', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      await fab.click();
      await page.waitForTimeout(400);

      const closeBtn = page.locator('#panel-close-btn');
      const styles = await closeBtn.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          minWidth: computed.minWidth,
          minHeight: computed.minHeight,
        };
      });

      expect(parseFloat(styles.minWidth)).toBeGreaterThanOrEqual(44);
      expect(parseFloat(styles.minHeight)).toBeGreaterThanOrEqual(44);
    });
  });

  test.describe('Desktop viewport (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
      // Dismiss tour if it appears
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('FAB is hidden on desktop viewport', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      const display = await fab.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('Mobile header is hidden on desktop viewport', async ({ page }) => {
      const mobileHeader = page.locator('.panel-mobile-header');
      const display = await mobileHeader.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('Panel is NOT collapsed on desktop', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const isCollapsed = await panel.evaluate((el) =>
        el.classList.contains('collapsed')
      );
      expect(isCollapsed).toBe(false);
    });

    test('Desktop panel toggle still works', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const toggle = page.locator('#panel-toggle');

      await expect(toggle).toBeVisible();

      await toggle.click();
      await page.waitForTimeout(400);

      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);
    });
  });

  test.describe('Tablet viewport (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
      // Dismiss tour if it appears
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('FAB is hidden on tablet viewport', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      const display = await fab.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });
  });

  test.describe('iPhone 14 Pro Max viewport (430x932)', () => {
    test.use({ viewport: { width: 430, height: 932 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
      // Dismiss tour if it appears
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('FAB is visible on large phone viewport', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      await expect(fab).toBeVisible();
    });

    test('Panel starts collapsed on large phone', async ({ page }) => {
      const panel = page.locator('.control-panel');
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);
    });
  });
});
