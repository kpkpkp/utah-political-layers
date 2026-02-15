import { test, expect } from '@playwright/test';

test.describe('Mobile Responsive Panel - Upper-Left Overlay', () => {
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

    test('1. Panel uses upper-left overlay at mobile viewport', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const fab = page.locator('#mobile-fab');

      // Panel starts collapsed on mobile; expand via FAB
      await fab.click();
      await page.waitForTimeout(400);

      const styles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          top: computed.top,
          left: computed.left,
          width: computed.width,
          borderRadius: computed.borderRadius,
        };
      });

      // Upper-left panel overlay characteristics
      expect(styles.position).toBe('fixed');
      expect(styles.top).toBe('8px');
      expect(styles.left).toBe('8px');
      expect(parseFloat(styles.width)).toBe(220);
      expect(styles.borderRadius).toBe('10px');

      console.log('Panel uses upper-left overlay layout');
    });

    test('2. Panel starts collapsed on mobile', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const isCollapsed = await panel.evaluate((el) =>
        el.classList.contains('collapsed')
      );
      expect(isCollapsed).toBe(true);
    });

    test('3. Collapsed panel slides off-screen to the left', async ({ page }) => {
      const panel = page.locator('.control-panel');

      // Panel starts collapsed
      const isCollapsed = await panel.evaluate((el) =>
        el.classList.contains('collapsed')
      );
      expect(isCollapsed).toBe(true);

      const styles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          opacity: computed.opacity,
          pointerEvents: computed.pointerEvents,
        };
      });

      expect(styles.opacity).toBe('0');
      expect(styles.pointerEvents).toBe('none');
    });

    test('4. FAB click expands panel, close button collapses it', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const fab = page.locator('#mobile-fab');
      const closeBtn = page.locator('#panel-close-btn');

      // Expand via FAB
      await fab.click();
      await page.waitForTimeout(400);
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(false);

      // Collapse via close button
      await closeBtn.click();
      await page.waitForTimeout(400);
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);
    });

    test('5. Panel toggle button is hidden on mobile', async ({ page }) => {
      const panelToggle = page.locator('#panel-toggle');
      const display = await panelToggle.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('6. Corner button is hidden on mobile', async ({ page }) => {
      const cornerBtn = page.locator('#panel-corner-btn');
      const display = await cornerBtn.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('7. Drag handle is hidden on mobile (not a bottom sheet)', async ({ page }) => {
      const dragHandle = page.locator('.panel-drag-handle');
      const display = await dragHandle.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });

    test('8. Panel has single-column grid layout on mobile', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const fab = page.locator('#mobile-fab');

      // Expand panel
      await fab.click();
      await page.waitForTimeout(400);

      const styles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          gridTemplateColumns: computed.gridTemplateColumns,
        };
      });

      expect(styles.display).toBe('grid');
      // Single column layout
      expect(styles.gridTemplateColumns).not.toContain(' ');
    });

    test('9. Panel max-height constrains scrollable area', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const fab = page.locator('#mobile-fab');

      await fab.click();
      await page.waitForTimeout(400);

      const styles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          maxHeight: computed.maxHeight,
          overflowY: computed.overflowY,
        };
      });

      // 70vh of 667px = ~466.9px
      expect(parseFloat(styles.maxHeight)).toBeGreaterThan(400);
      expect(parseFloat(styles.maxHeight)).toBeLessThan(500);
      expect(styles.overflowY).toBe('auto');
    });

    test('10. Save defaults hidden on mobile', async ({ page }) => {
      const saveDefaults = page.locator('.panel-save-defaults');
      const display = await saveDefaults.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(display).toBe('none');
    });
  });

  test.describe('Tablet/Desktop viewport (800x600)', () => {
    test.use({ viewport: { width: 800, height: 600 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
    });

    test('11. Panel is side panel (not overlay) at 800px viewport', async ({ page }) => {
      const panel = page.locator('.control-panel');
      await expect(panel).toBeVisible();

      const styles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          width: computed.width,
        };
      });

      expect(styles.position).toBe('absolute');
      expect(parseFloat(styles.width)).toBeLessThan(600);
    });

    test('12. Panel toggle button is visible on desktop', async ({ page }) => {
      const panelToggle = page.locator('#panel-toggle');
      await expect(panelToggle).toBeVisible();
    });

    test('13. Panel toggle collapses panel on desktop', async ({ page }) => {
      const panel = page.locator('.control-panel');
      const panelToggle = page.locator('#panel-toggle');

      const initialCollapsed = await panel.evaluate((el) =>
        el.classList.contains('collapsed')
      );

      await panelToggle.click();
      await page.waitForTimeout(400);

      const afterClick = await panel.evaluate((el) =>
        el.classList.contains('collapsed')
      );

      expect(afterClick).toBe(!initialCollapsed);
    });
  });

  test.describe('Breakpoint transition (480px boundary)', () => {
    test('14. Panel layout changes at 480px breakpoint', async ({ page }) => {
      // Start at mobile width
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);

      const panel = page.locator('.control-panel');

      // Expand panel to check styles (it starts collapsed on mobile)
      const fab = page.locator('#mobile-fab');
      // Dismiss tour first
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
      await fab.click();
      await page.waitForTimeout(400);

      const mobileStyles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
          top: computed.top,
          left: computed.left,
        };
      });

      expect(mobileStyles.position).toBe('fixed');
      expect(mobileStyles.top).toBe('8px');
      expect(mobileStyles.left).toBe('8px');

      // Resize to just above breakpoint
      await page.setViewportSize({ width: 481, height: 667 });
      await page.waitForTimeout(500);

      const desktopStyles = await panel.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          position: computed.position,
        };
      });

      expect(desktopStyles.position).toBe('absolute');
    });

    test('15. Exactly at 480px uses mobile layout', async ({ page }) => {
      await page.setViewportSize({ width: 480, height: 667 });
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);

      const panel = page.locator('.control-panel');
      const panelToggle = page.locator('#panel-toggle');

      // Panel toggle should be hidden at mobile width
      const toggleDisplay = await panelToggle.evaluate((el) =>
        window.getComputedStyle(el).display
      );
      expect(toggleDisplay).toBe('none');
    });
  });

  test.describe('Accessibility on mobile', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('16. Close button has adequate touch target size (44px)', async ({ page }) => {
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

    test('17. Drag handle has proper ARIA attributes', async ({ page }) => {
      const dragHandle = page.locator('.panel-drag-handle');
      const ariaHidden = await dragHandle.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
    });
  });

  test.describe('Visual regression checks', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:8080');
      await page.waitForSelector('#map', { timeout: 10000 });
      await page.waitForTimeout(1000);
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('18. Mobile panel expanded state screenshot', async ({ page }) => {
      const fab = page.locator('#mobile-fab');
      await fab.click();
      await page.waitForTimeout(400);

      await page.screenshot({
        path: 'screenshots/mobile-panel-expanded.png',
        fullPage: true
      });
    });

    test('19. Mobile panel collapsed state screenshot', async ({ page }) => {
      const panel = page.locator('.control-panel');
      expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);

      await page.screenshot({
        path: 'screenshots/mobile-panel-collapsed.png',
        fullPage: true
      });
    });
  });
});
