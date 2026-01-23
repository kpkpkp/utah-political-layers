import { test, expect } from '@playwright/test';

test.describe('Utah Political Layers - Layer Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Start on the main page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForTimeout(2000); // Give layers time to load
  });

  test('Test each layer individually', async ({ page }) => {
    const layers = [
      { id: 'toggle-boundary', name: 'Utah boundary' },
      { id: 'toggle-tiles', name: 'Map tiles' },
      { id: 'toggle-population', name: 'Population' },
      { id: 'toggle-house', name: 'State House' },
      { id: 'toggle-senate', name: 'State Senate' },
      { id: 'toggle-congress-current', name: 'Federal House (current)' },
      { id: 'toggle-congress-future', name: 'Federal House (coming)' }
    ];

    console.log('\n=== DISABLING ALL LAYERS ===');

    // Disable all layers first
    for (const layer of layers) {
      const checkbox = page.locator(`#${layer.id}`);
      const isChecked = await checkbox.isChecked();
      if (isChecked) {
        await checkbox.uncheck();
        console.log(`❌ Disabled: ${layer.name}`);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/00-all-disabled.png' });

    // Test each layer individually
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      console.log(`\n=== TESTING: ${layer.name} ===`);

      // Enable this layer
      const checkbox = page.locator(`#${layer.id}`);
      await checkbox.check();
      console.log(`✅ Enabled: ${layer.name}`);

      // Wait for layer to render
      await page.waitForTimeout(2000);

      // Check for visible canvas or SVG elements
      const canvasElements = await page.locator('canvas').count();
      const svgElements = await page.locator('svg').count();
      const pathElements = await page.locator('svg path').count();
      const circleElements = await page.locator('svg circle').count();

      console.log(`  Canvas elements: ${canvasElements}`);
      console.log(`  SVG elements: ${svgElements}`);
      console.log(`  Path elements: ${pathElements}`);
      console.log(`  Circle elements: ${circleElements}`);

      // For population layer, check loading status
      if (layer.id === 'toggle-population') {
        const statusText = await page.locator('#population-status').textContent();
        console.log(`  Population status: ${statusText}`);

        // Wait longer for population to load
        await page.waitForTimeout(5000);

        const updatedStatus = await page.locator('#population-status').textContent();
        console.log(`  Updated status: ${updatedStatus}`);

        // Check console for errors
        page.on('console', msg => {
          if (msg.type() === 'error' || msg.type() === 'warning') {
            console.log(`  Browser console [${msg.type()}]: ${msg.text()}`);
          }
        });
      }

      // Take screenshot
      const filename = `screenshots/${String(i + 1).padStart(2, '0')}-${layer.id}.png`;
      await page.screenshot({ path: filename });
      console.log(`  Screenshot saved: ${filename}`);

      // Disable this layer before moving to next
      await checkbox.uncheck();
      await page.waitForTimeout(500);
    }
  });

  test('Population layer detailed investigation', async ({ page }) => {
    console.log('\n=== POPULATION LAYER DETAILED TEST ===');

    // Listen to all console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      console.log(`[${msg.type()}] ${text}`);
    });

    // Listen to network requests
    const networkRequests = [];
    page.on('request', request => {
      if (request.url().includes('arcgis') || request.url().includes('population')) {
        networkRequests.push({ url: request.url(), method: request.method() });
        console.log(`[Request] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', async response => {
      if (response.url().includes('arcgis') || response.url().includes('population')) {
        console.log(`[Response] ${response.status()} ${response.url()}`);
        if (!response.ok()) {
          const text = await response.text();
          console.log(`  Error body: ${text.substring(0, 200)}`);
        }
      }
    });

    // Enable only population layer
    await page.locator('#toggle-population').check();
    console.log('Population layer enabled');

    // Wait for loading to start and finish
    await page.waitForTimeout(10000);

    // Check final status
    const status = await page.locator('#population-status').textContent();
    console.log(`Final status: ${status}`);

    // Check if any canvas circles were added
    const canvases = await page.locator('canvas').count();
    console.log(`Total canvas elements: ${canvases}`);

    // Check layer pane
    const panes = await page.evaluate(() => {
      const paneElements = document.querySelectorAll('.leaflet-pane');
      return Array.from(paneElements).map(pane => ({
        className: pane.className,
        childCount: pane.children.length,
        innerHTML: pane.innerHTML.substring(0, 100)
      }));
    });
    console.log('Leaflet panes:', JSON.stringify(panes, null, 2));

    // Take final screenshot
    await page.screenshot({ path: 'screenshots/population-detailed.png' });

    // Print summary
    console.log(`\n=== SUMMARY ===`);
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Network requests: ${networkRequests.length}`);
  });
});
