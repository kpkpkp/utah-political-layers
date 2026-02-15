import { test, expect } from '@playwright/test';

test.describe('Pixel 10 Desktop/Mobile mode switch', () => {
  test('Switch from desktop mode (1024px) to mobile mode (411px)', async ({ page }) => {
    // Simulate "Request Desktop Site" on Pixel 10
    await page.setViewportSize({ width: 1024, height: 923 });
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForTimeout(1500);

    // Dismiss tour
    const skipBtn = page.locator('#tour-skip');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(300);
    }

    // In desktop mode: panel visible, FAB hidden
    const panel = page.locator('.control-panel');
    const fab = page.locator('#mobile-fab');
    
    let panelCollapsed = await panel.evaluate(el => el.classList.contains('collapsed'));
    expect(panelCollapsed).toBe(false);
    console.log('Desktop mode (1024px): panel expanded, FAB hidden');

    let fabDisplay = await fab.evaluate(el => window.getComputedStyle(el).display);
    expect(fabDisplay).toBe('none');

    // Page should NOT scroll
    let pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let viewportHeight = await page.evaluate(() => window.innerHeight);
    console.log(`Desktop: page=${pageHeight}px, viewport=${viewportHeight}px`);
    expect(pageHeight).toBeLessThanOrEqual(viewportHeight + 5);

    await page.screenshot({ path: 'screenshots/p10-desktop-mode.png' });

    // NOW switch to mobile mode (Pixel 10: 411x923 CSS pixels)
    await page.setViewportSize({ width: 411, height: 923 });
    await page.waitForTimeout(500);

    // Panel should now be in mobile overlay mode
    let panelPosition = await panel.evaluate(el => window.getComputedStyle(el).position);
    expect(panelPosition).toBe('fixed');

    // FAB should be visible
    fabDisplay = await fab.evaluate(el => window.getComputedStyle(el).display);
    expect(fabDisplay).toBe('flex');

    // Page should still NOT scroll
    pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    viewportHeight = await page.evaluate(() => window.innerHeight);
    console.log(`Mobile: page=${pageHeight}px, viewport=${viewportHeight}px`);
    expect(pageHeight).toBeLessThanOrEqual(viewportHeight + 5);

    await page.screenshot({ path: 'screenshots/p10-mobile-mode-collapsed.png' });

    // FAB should be tappable and opens the panel
    await fab.click();
    await page.waitForTimeout(400);

    panelCollapsed = await panel.evaluate(el => el.classList.contains('collapsed'));
    expect(panelCollapsed).toBe(false);

    // Legend should be visible
    const legend = page.locator('.legend');
    await expect(legend).toBeVisible();

    // All layer toggles accessible
    await expect(page.locator('#toggle-house')).toBeVisible();
    await expect(page.locator('#toggle-senate')).toBeVisible();
    await expect(page.locator('#toggle-boundary')).toBeVisible();

    await page.screenshot({ path: 'screenshots/p10-mobile-mode-expanded.png' });

    // Close button works
    await page.locator('#panel-close-btn').click();
    await page.waitForTimeout(400);
    panelCollapsed = await panel.evaluate(el => el.classList.contains('collapsed'));
    expect(panelCollapsed).toBe(true);

    // FAB visible again
    fabDisplay = await fab.evaluate(el => window.getComputedStyle(el).display);
    expect(fabDisplay).toBe('flex');

    console.log('Pixel 10 desktop↔mobile mode switch: ALL PASS');
  });

  test('Switch from mobile mode back to desktop mode', async ({ page }) => {
    // Start in mobile mode
    await page.setViewportSize({ width: 411, height: 923 });
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForTimeout(1500);

    const skipBtn = page.locator('#tour-skip');
    if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(300);
    }

    const panel = page.locator('.control-panel');
    const fab = page.locator('#mobile-fab');

    // Mobile: panel collapsed, FAB visible
    expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(true);
    expect(await fab.evaluate(el => window.getComputedStyle(el).display)).toBe('flex');

    // Switch to desktop mode
    await page.setViewportSize({ width: 1024, height: 923 });
    await page.waitForTimeout(500);

    // Desktop: panel toggle visible, FAB hidden
    let fabDisplay = await fab.evaluate(el => window.getComputedStyle(el).display);
    expect(fabDisplay).toBe('none');

    let toggleDisplay = await page.locator('#panel-toggle').evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(toggleDisplay).not.toBe('none');

    // Panel still has collapsed class from mobile, but desktop toggle is visible to expand
    await page.locator('#panel-toggle').click();
    await page.waitForTimeout(400);

    expect(await panel.evaluate(el => el.classList.contains('collapsed'))).toBe(false);
    console.log('Mobile→Desktop mode switch: ALL PASS');
  });
});
