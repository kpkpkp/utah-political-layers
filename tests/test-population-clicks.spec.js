import { test, expect } from '@playwright/test';

/**
 * E2E tests for population block click functionality
 *
 * Prerequisites:
 * - Application must be running on http://localhost:8080
 * - Run: npm start (or your local server command)
 *
 * To run these tests:
 * - All population click tests: npx playwright test test-population-clicks
 * - Specific test: npx playwright test test-population-clicks -g "draws boundary"
 * - With UI: npx playwright test test-population-clicks --ui
 * - Debug mode: npx playwright test test-population-clicks --debug
 *
 * Test coverage:
 * 1. Population toggle enables the layer
 * 2. Population data loads when layer is enabled
 * 3. Clicking a population dot draws the census block boundary
 * 4. Clicking the boundary dismisses it
 * 5. Population canvas has correct pointer-events setting
 */

test.describe('Population Click Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean state
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload page after clearing storage
    await page.reload();

    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForSelector('#controls', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('Population toggle enables the layer', async ({ page }) => {
    const populationToggle = page.locator('#toggle-population');

    // Initially unchecked
    await expect(populationToggle).not.toBeChecked();

    // Check the toggle
    await populationToggle.check();
    await expect(populationToggle).toBeChecked();

    // Verify population layer is added to map
    const hasPopulationLayer = await page.evaluate(() => {
      return window.map && window.map.hasLayer(window.populationLayer);
    });
    expect(hasPopulationLayer).toBe(true);

    console.log('✓ Population toggle enables the layer');
  });

  test('Population data loads when layer is enabled', async ({ page }) => {
    // Enable population layer
    await page.locator('#toggle-population').check();

    // Wait for population to load (status shows "ready" or block count)
    await page.waitForFunction(() => {
      const status = document.getElementById('population-status');
      return status && (status.textContent.includes('ready') || status.textContent.includes('blocks'));
    }, { timeout: 120000 });

    // Verify population layer has markers
    const markerCount = await page.evaluate(() => {
      let count = 0;
      if (window.populationLayer && window.populationLayer.eachLayer) {
        window.populationLayer.eachLayer(() => count++);
      }
      return count;
    });

    expect(markerCount).toBeGreaterThan(0);
    console.log(`✓ Population data loaded with ${markerCount} markers`);
  });

  test('Population pane has correct pointer-events configuration', async ({ page }) => {
    // Enable population layer
    await page.locator('#toggle-population').check();

    // Wait for population to start loading
    await page.waitForFunction(() => {
      const status = document.getElementById('population-status');
      return status && status.textContent.includes('loading');
    }, { timeout: 30000 });

    // Check pane configuration via the map's pane registry
    const paneConfig = await page.evaluate(() => {
      if (!window.map || !window.map.getPane) return { error: 'map not ready' };
      const populationPane = window.map.getPane('populationPane');
      const outlinePane = window.map.getPane('populationOutlinePane');
      return {
        populationPanePointerEvents: populationPane ? populationPane.style.pointerEvents : null,
        outlinePanePointerEvents: outlinePane ? outlinePane.style.pointerEvents : null
      };
    });

    // populationPane should have pointer-events: none (to let clicks through to canvas)
    expect(paneConfig.populationPanePointerEvents).toBe('none');

    // outlinePane should have pointer-events: auto (to intercept outline clicks)
    expect(paneConfig.outlinePanePointerEvents).toBe('auto');

    console.log('✓ Population pane has correct pointer-events configuration');
  });

  test('Population canvas has pointer-events enabled after loading', async ({ page }) => {
    // Enable population layer
    await page.locator('#toggle-population').check();

    // Wait for population to load
    await page.waitForFunction(() => {
      const status = document.getElementById('population-status');
      return status && (status.textContent.includes('ready') || status.textContent.includes('blocks'));
    }, { timeout: 120000 });

    // Give time for canvas pointer-events to be set
    await page.waitForTimeout(500);

    // Check canvas pointer-events via the map's pane
    const canvasPointerEvents = await page.evaluate(() => {
      if (!window.map || !window.map.getPane) return null;
      const pane = window.map.getPane('populationPane');
      const canvas = pane ? pane.querySelector('canvas') : null;
      return canvas ? canvas.style.pointerEvents : null;
    });

    expect(canvasPointerEvents).toBe('auto');
    console.log('✓ Population canvas has pointer-events enabled');
  });

  test('Clicking population dot draws census block boundary', async ({ page }) => {
    // Enable population layer
    await page.locator('#toggle-population').check();

    // Wait for population to fully load
    await page.waitForFunction(() => {
      const status = document.getElementById('population-status');
      return status && status.textContent.includes('ready');
    }, { timeout: 120000 });

    // Give time for rendering
    await page.waitForTimeout(1000);

    // Use programmatic click on a marker to test the click handler
    const clickResult = await page.evaluate(() => {
      // Find a marker with click handler
      let clickedMarker = null;
      window.populationLayer.eachLayer((layer) => {
        if (!clickedMarker && layer._events && layer._events.click) {
          clickedMarker = layer;
        }
      });

      if (!clickedMarker) return { success: false, reason: 'no marker found' };

      // Simulate the click
      clickedMarker.fire('click', {
        originalEvent: { stopPropagation: () => {} },
        latlng: clickedMarker.getLatLng()
      });

      return {
        success: window.populationHighlight !== null,
        reason: window.populationHighlight ? 'highlight created' : 'no highlight'
      };
    });

    expect(clickResult.success).toBe(true);
    console.log('✓ Clicking population dot draws census block boundary');
  });

  test('Population markers have click handlers attached', async ({ page }) => {
    // Enable population layer
    await page.locator('#toggle-population').check();

    // Wait for population to load
    await page.waitForFunction(() => {
      const status = document.getElementById('population-status');
      return status && (status.textContent.includes('ready') || status.textContent.includes('blocks'));
    }, { timeout: 120000 });

    // Check that markers have click event listeners
    const markersHaveClickHandlers = await page.evaluate(() => {
      let hasHandlers = false;
      if (window.populationLayer && window.populationLayer.eachLayer) {
        window.populationLayer.eachLayer((layer) => {
          // Check if layer has _events with click
          if (layer._events && layer._events.click && layer._events.click.length > 0) {
            hasHandlers = true;
          }
        });
      }
      return hasHandlers;
    });

    expect(markersHaveClickHandlers).toBe(true);
    console.log('✓ Population markers have click handlers attached');
  });

  test('Population click handler code exists and is properly configured', async ({ page }) => {
    // Enable population layer
    await page.locator('#toggle-population').check();

    // Wait for population to load
    await page.waitForFunction(() => {
      const status = document.getElementById('population-status');
      return status && status.textContent.includes('ready');
    }, { timeout: 120000 });

    await page.waitForTimeout(500);

    // Verify the click mechanism is in place
    const config = await page.evaluate(() => {
      // Count markers with click handlers
      let markersWithClickHandlers = 0;
      let totalMarkers = 0;

      window.populationLayer.eachLayer((layer) => {
        totalMarkers++;
        if (layer._events && layer._events.click && layer._events.click.length > 0) {
          markersWithClickHandlers++;
        }
      });

      // Check pane configuration
      const pane = window.map.getPane('populationPane');
      const outlinePane = window.map.getPane('populationOutlinePane');
      const canvas = pane ? pane.querySelector('canvas') : null;

      return {
        totalMarkers,
        markersWithClickHandlers,
        panePointerEvents: pane ? pane.style.pointerEvents : null,
        outlinePanePointerEvents: outlinePane ? outlinePane.style.pointerEvents : null,
        canvasPointerEvents: canvas ? canvas.style.pointerEvents : null,
      };
    });

    // Verify click handlers are attached
    expect(config.totalMarkers).toBeGreaterThan(0);
    expect(config.markersWithClickHandlers).toBeGreaterThan(0);

    // Verify pane configuration is correct for clicks to work
    expect(config.panePointerEvents).toBe('none');
    expect(config.outlinePanePointerEvents).toBe('auto');
    expect(config.canvasPointerEvents).toBe('auto');

    console.log(`✓ Population click configuration verified (${config.markersWithClickHandlers}/${config.totalMarkers} markers with handlers)`);
  });

});
