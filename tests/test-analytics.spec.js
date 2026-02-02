import { test, expect } from '@playwright/test';

test.describe('Analytics Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForTimeout(3000); // Wait for all resources to load

    // Set up gtag mock (replace the existing gtag from Google)
    await page.evaluate(() => {
      window.gtagCalls = [];
      window.gtag = function(...args) {
        window.gtagCalls.push(args);
      };
    });
  });

  test('gtag function is defined on window', async ({ page }) => {
    const gtagDefined = await page.evaluate(() => {
      return typeof window.gtag === 'function';
    });

    expect(gtagDefined).toBe(true);
  });

  test('Layer toggle fires analytics event with correct parameters', async ({ page }) => {
    // Toggle House layer on
    await page.locator('#toggle-house').check();
    await page.waitForTimeout(500);

    // Check that analytics was called
    const calls = await page.evaluate(() => window.gtagCalls);

    expect(calls.length).toBeGreaterThan(0);

    // Find the layer_toggle event
    const layerToggleCall = calls.find(call => call[0] === 'event' && call[1] === 'layer_toggle');

    expect(layerToggleCall).toBeDefined();
    expect(layerToggleCall[0]).toBe('event');
    expect(layerToggleCall[1]).toBe('layer_toggle');
    expect(layerToggleCall[2]).toMatchObject({
      layer: 'house',
      enabled: true
    });
  });

  test('Panel toggle fires analytics event', async ({ page }) => {
    // Clear previous calls
    await page.evaluate(() => {
      window.gtagCalls = [];
    });

    // Click panel toggle button
    await page.locator('#panel-toggle').click();
    await page.waitForTimeout(500);

    // Check that analytics was called
    const calls = await page.evaluate(() => window.gtagCalls);

    expect(calls.length).toBeGreaterThan(0);

    // Find the panel_toggle event
    const panelToggleCall = calls.find(call => call[0] === 'event' && call[1] === 'panel_toggle');

    expect(panelToggleCall).toBeDefined();
    expect(panelToggleCall[0]).toBe('event');
    expect(panelToggleCall[1]).toBe('panel_toggle');
    expect(panelToggleCall[2]).toHaveProperty('expanded');
    expect(typeof panelToggleCall[2].expanded).toBe('boolean');
  });

  test('Events have correct parameters', async ({ page }) => {
    // Clear previous calls
    await page.evaluate(() => {
      window.gtagCalls = [];
    });

    // Trigger various events
    await page.locator('#toggle-senate').check();
    await page.waitForTimeout(500);

    const calls = await page.evaluate(() => window.gtagCalls);

    expect(calls.length).toBeGreaterThan(0);

    // Verify all event calls have the correct structure
    calls.forEach(call => {
      if (call[0] === 'event') {
        expect(call).toHaveLength(3); // ['event', eventName, params]
        expect(typeof call[1]).toBe('string'); // eventName is a string
        expect(typeof call[2]).toBe('object'); // params is an object
        expect(call[2]).not.toBeNull();
      }
    });

    // Verify the layer_toggle event has the correct structure
    const layerEvent = calls.find(c => c[1] === 'layer_toggle');
    expect(layerEvent).toBeDefined();
    expect(layerEvent[2]).toMatchObject({
      layer: 'senate',
      enabled: true
    });
  });

  test('Multiple interaction types fire analytics events', async ({ page }) => {
    // Clear previous calls
    await page.evaluate(() => {
      window.gtagCalls = [];
    });

    // Perform multiple different actions
    await page.locator('#toggle-senate').check();
    await page.waitForTimeout(300);

    await page.locator('#panel-toggle').click();
    await page.waitForTimeout(300);

    await page.locator('#tile-style-select').selectOption('satellite');
    await page.waitForTimeout(300);

    // Check that all analytics events were called
    const calls = await page.evaluate(() => window.gtagCalls);

    expect(calls.length).toBeGreaterThanOrEqual(3);

    const eventNames = calls
      .filter(call => call[0] === 'event')
      .map(call => call[1]);

    expect(eventNames).toContain('layer_toggle');
    expect(eventNames).toContain('panel_toggle');
    expect(eventNames).toContain('tile_source_changed');
  });
});
