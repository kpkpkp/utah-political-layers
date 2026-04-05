import { test, expect } from '@playwright/test';

test.describe('BURRN Layer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForTimeout(2000);
    // Dismiss tour if it appears
    const skipBtn = page.locator('.tour-skip');
    if (await skipBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await skipBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('BURRN toggle exists and is unchecked by default', async ({ page }) => {
    const toggle = page.locator('#toggle-burrn');
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();
  });

  test('BURRN color picker has amber default', async ({ page }) => {
    const picker = page.locator('#outline-color-burrn');
    await expect(picker).toBeVisible();
    const value = await picker.inputValue();
    expect(value.toLowerCase()).toBe('#ff8c00');
  });

  test('enabling BURRN toggle adds county polygons to map', async ({ page }) => {
    const pathsBefore = await page.locator('#map svg path').count();
    await page.locator('#toggle-burrn').check();
    await page.waitForTimeout(1500);
    const pathsAfter = await page.locator('#map svg path').count();
    expect(pathsAfter).toBeGreaterThan(pathsBefore);
  });

  test('disabling BURRN toggle removes county polygons', async ({ page }) => {
    await page.locator('#toggle-burrn').check();
    await page.waitForTimeout(1500);
    const pathsEnabled = await page.locator('#map svg path').count();

    await page.locator('#toggle-burrn').uncheck();
    await page.waitForTimeout(500);
    const pathsDisabled = await page.locator('#map svg path').count();
    expect(pathsDisabled).toBeLessThan(pathsEnabled);
  });

  test('clicking county with BURRN enabled shows popup with BURRN links', async ({ page }) => {
    // Disable other layers to avoid interference
    const houseCb = page.locator('#toggle-house');
    if (await houseCb.isChecked()) await houseCb.uncheck();
    const senateCb = page.locator('#toggle-senate');
    if (await senateCb.isChecked()) await senateCb.uncheck();
    const ccCb = page.locator('#toggle-congress-current');
    if (await ccCb.isChecked()) await ccCb.uncheck();
    const cfCb = page.locator('#toggle-congress-future');
    if (await cfCb.isChecked()) await cfCb.uncheck();

    await page.locator('#toggle-burrn').check();
    await page.waitForTimeout(1500);

    // Click center of map (should hit a Utah county)
    const mapBox = await page.locator('#map').boundingBox();
    await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.waitForTimeout(1000);

    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const html = await popup.innerHTML();
    expect(html).toContain('BURRN');
    expect(html).toContain('burrn.org');
  });

  test('BURRN popup contains county clerk info', async ({ page }) => {
    // Disable other layers
    for (const id of ['toggle-house', 'toggle-senate', 'toggle-congress-current', 'toggle-congress-future']) {
      const cb = page.locator('#' + id);
      if (await cb.isChecked()) await cb.uncheck();
    }

    await page.locator('#toggle-burrn').check();
    await page.waitForTimeout(1500);

    const mapBox = await page.locator('#map').boundingBox();
    await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.waitForTimeout(1000);

    const popup = page.locator('.leaflet-popup-content');
    await expect(popup).toBeVisible({ timeout: 5000 });

    const html = await popup.innerHTML();
    expect(html).toContain('Clerk');
  });

  test('BURRN popup links open in new tab', async ({ page }) => {
    for (const id of ['toggle-house', 'toggle-senate', 'toggle-congress-current', 'toggle-congress-future']) {
      const cb = page.locator('#' + id);
      if (await cb.isChecked()) await cb.uncheck();
    }

    await page.locator('#toggle-burrn').check();
    await page.waitForTimeout(1500);

    const mapBox = await page.locator('#map').boundingBox();
    await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);
    await page.waitForTimeout(1000);

    const links = page.locator('.leaflet-popup-content a');
    const count = await links.count();
    expect(count).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < count; i++) {
      await expect(links.nth(i)).toHaveAttribute('target', '_blank');
    }
  });

  test('BURRN source appears in Sources section', async ({ page }) => {
    const sourcesGroup = page.locator('#sources-group');
    await sourcesGroup.locator('summary').click();
    await page.waitForTimeout(300);

    const burrnLink = sourcesGroup.locator('a[href*="burrn.org"]');
    await expect(burrnLink).toBeVisible();
  });
});
