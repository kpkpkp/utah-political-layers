import { test, expect } from '@playwright/test';

test.describe('Background Population Loading', () => {
  /**
   * Helper function to skip tour if present
   */
  const skipTourIfPresent = async (page) => {
    try {
      const skipBtn = page.locator('#tour-skip');
      if (await skipBtn.isVisible({ timeout: 1000 })) {
        await skipBtn.click();
        await page.waitForTimeout(300);
      }
    } catch {
      // Tour not present or skip button not visible, continue
    }
  };

  test('starts loading on page init', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });

    // Wait for background load to start (init() is async, needs time for JSON loads)
    await page.waitForFunction(() => {
      return window.populationState?.loading === true || window.populationState?.loaded === true;
    }, { timeout: 30000 });

    const populationState = await page.evaluate(() => window.populationState);

    // Verify the state is valid
    const isLoadingOrLoaded = populationState.loading || populationState.loaded;
    expect(isLoadingOrLoaded).toBe(true);

    // Population checkbox should NOT be checked - load happens without user action
    const isChecked = await page.locator('#toggle-population').isChecked();
    expect(isChecked).toBe(false);
  });

  test('instant toggle after load complete', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });

    // Skip tour if present
    await skipTourIfPresent(page);

    // Wait for background load to complete (up to 60s timeout)
    const loaded = await page.evaluate(async () => {
      // Poll until loaded or timeout
      const startTime = Date.now();
      const timeout = 120000;

      while (Date.now() - startTime < timeout) {
        if (window.populationState?.loaded === true) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return false;
    });

    expect(loaded).toBe(true);

    // Record timestamp before toggle
    const timestamp = Date.now();

    // Click population checkbox to enable
    const populationCheckbox = page.locator('#toggle-population');
    await populationCheckbox.check();

    // Record end timestamp
    const endTime = Date.now();
    const duration = endTime - timestamp;

    // Wait a moment for rendering
    await page.waitForTimeout(100);

    // Check that markers are in the population layer
    const markerCount = await page.evaluate(() => {
      if (!window.populationLayer) return 0;

      let count = 0;
      window.populationLayer.eachLayer((layer) => {
        count++;
      });

      return count;
    });

    // Should have markers loaded
    expect(markerCount).toBeGreaterThan(0);

    // Verify operation took less than 500ms (instant feel)
    // This demonstrates that toggling is instant because data was already loaded
    expect(duration).toBeLessThan(500);
  });

  test('toggle during load shows status', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });

    // Skip tour if present
    await skipTourIfPresent(page);

    // Small delay to catch loading state before it completes
    await page.waitForTimeout(100);

    // Immediately click population checkbox (may be during load)
    const populationCheckbox = page.locator('#toggle-population');
    await populationCheckbox.check();

    // Wait a moment for status to update
    await page.waitForTimeout(300);

    // Check that status indicator shows loading message or is ready
    const statusText = await page.locator('#population-status').textContent();

    // Status should indicate loading or ready, not empty
    expect(statusText).toBeTruthy();
    expect(statusText).toMatch(/Population|loading|ready/i);

    // Wait for load to complete
    const loaded = await page.evaluate(async () => {
      const startTime = Date.now();
      const timeout = 120000;

      while (Date.now() - startTime < timeout) {
        if (window.populationState?.loaded === true) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return false;
    });

    expect(loaded).toBe(true);

    // Wait for rendering after load complete
    await page.waitForTimeout(200);

    // Verify dots are visible by checking layer has markers
    const markerCount = await page.evaluate(() => {
      if (!window.populationLayer) return 0;

      let count = 0;
      window.populationLayer.eachLayer((layer) => {
        count++;
      });

      return count;
    });

    // Should have markers after load completes
    expect(markerCount).toBeGreaterThan(0);

    // Verify status shows ready status
    const finalStatusText = await page.locator('#population-status').textContent();
    expect(finalStatusText).toMatch(/ready/i);
  });

  test('population state is exposed on window', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });

    // Skip tour if present
    await skipTourIfPresent(page);

    // Check that window.populationState is accessible
    const populationState = await page.evaluate(() => {
      return {
        hasPopulationState: typeof window.populationState !== 'undefined',
        hasLoaded: typeof window.populationState?.loaded !== 'undefined',
        hasLoading: typeof window.populationState?.loading !== 'undefined',
        hasMaxDensity: typeof window.populationState?.maxDensity !== 'undefined',
        hasTotalCount: typeof window.populationState?.totalCount !== 'undefined',
        hasPopulationLayer: typeof window.populationLayer !== 'undefined',
        hasPopulationRenderer: typeof window.populationRenderer !== 'undefined'
      };
    });

    expect(populationState.hasPopulationState).toBe(true);
    expect(populationState.hasLoaded).toBe(true);
    expect(populationState.hasLoading).toBe(true);
    expect(populationState.hasMaxDensity).toBe(true);
    expect(populationState.hasTotalCount).toBe(true);
    expect(populationState.hasPopulationLayer).toBe(true);
    expect(populationState.hasPopulationRenderer).toBe(true);
  });

  test('toggle population checkbox adds/removes layer', async ({ page }) => {
    // Navigate to the page
    await page.goto('http://localhost:8080');

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });

    // Skip tour if present
    await skipTourIfPresent(page);

    // Wait for background load to complete
    const loaded = await page.evaluate(async () => {
      const startTime = Date.now();
      const timeout = 120000;

      while (Date.now() - startTime < timeout) {
        if (window.populationState?.loaded === true) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return false;
    });

    expect(loaded).toBe(true);

    // Check initial state - checkbox should not be checked
    const populationCheckbox = page.locator('#toggle-population');
    let isChecked = await populationCheckbox.isChecked();
    expect(isChecked).toBe(false);

    // Check layer is not on map initially
    let layerOnMap = await page.evaluate(() => {
      return window.map.hasLayer(window.populationLayer);
    });
    expect(layerOnMap).toBe(false);

    // Enable the layer
    await populationCheckbox.check();
    await page.waitForTimeout(200);

    // Verify checkbox is now checked
    isChecked = await populationCheckbox.isChecked();
    expect(isChecked).toBe(true);

    // Verify layer is on map
    layerOnMap = await page.evaluate(() => {
      return window.map.hasLayer(window.populationLayer);
    });
    expect(layerOnMap).toBe(true);

    // Disable the layer
    await populationCheckbox.uncheck();
    await page.waitForTimeout(200);

    // Verify checkbox is now unchecked
    isChecked = await populationCheckbox.isChecked();
    expect(isChecked).toBe(false);

    // Verify layer is removed from map
    layerOnMap = await page.evaluate(() => {
      return window.map.hasLayer(window.populationLayer);
    });
    expect(layerOnMap).toBe(false);
  });
});
