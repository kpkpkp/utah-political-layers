import { test, expect } from '@playwright/test';

/**
 * E2E tests for the tour feature in Utah Political Layers
 *
 * Prerequisites:
 * - Application must be running on http://localhost:8080
 * - Run: npm start (or your local server command)
 *
 * To run these tests:
 * - All tour tests: npx playwright test test-tour
 * - Specific test: npx playwright test test-tour -g "Tour button exists"
 * - With UI: npx playwright test test-tour --ui
 * - Debug mode: npx playwright test test-tour --debug
 *
 * Test coverage:
 * 1. Tour button exists and is clickable
 * 2. Clicking tour button shows overlay and callout
 * 3. Next button advances to next step
 * 4. Previous button navigates backward
 * 5. Skip button ends tour early
 * 6. Tour completion is stored in localStorage
 * 7. Tour does not auto-start for returning visitors
 * 8. Tour auto-starts for first-time visitors
 * 9. Tour updates map view for each step
 * 10. Tour toggles layer visibility
 * 11. Tour button text changes to "Finish" on last step
 * 12. Tour can be restarted after skipping
 * 13. Tour restores original map state after completion
 * 14. Tour controller accessible via window.tour
 * 15. Tour can be programmatically controlled
 * 16. Tour reset function clears localStorage
 * 17. Tour overlay has correct styling
 */

test.describe('Tour Feature', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload page after clearing localStorage
    await page.reload();
    // Wait for map to initialize
    await page.waitForSelector('#map', { timeout: 5000 });
    await page.waitForTimeout(2000);
  });

  test('Tour button exists and is clickable', async ({ page }) => {
    // Check that tour button exists
    const tourBtn = page.locator('#tour-btn');
    await expect(tourBtn).toBeVisible();

    // Verify button text
    const buttonText = await tourBtn.textContent();
    expect(buttonText).toBe('Take Tour');

    // Verify button is clickable
    await expect(tourBtn).toBeEnabled();

    console.log('✅ Tour button exists and is clickable');
  });

  test('Clicking tour button shows overlay and callout', async ({ page }) => {
    // Click the tour button
    const tourBtn = page.locator('#tour-btn');
    await tourBtn.click();

    // Wait for tour overlay to appear
    await page.waitForTimeout(500);

    // Check that overlay is visible
    const overlay = page.locator('.tour-overlay');
    await expect(overlay).toBeVisible();

    // Check that callout is visible
    const callout = page.locator('.tour-callout');
    await expect(callout).toBeVisible();

    // Check that progress indicator is visible
    const progress = page.locator('.tour-progress');
    await expect(progress).toBeVisible();
    const progressText = await progress.textContent();
    expect(progressText).toContain('Step 1 of');

    // Check that tour title is visible
    const title = page.locator('.tour-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText).toBe('Welcome to Utah Political Layers');

    // Check that content area is visible
    const content = page.locator('.tour-content');
    await expect(content).toBeVisible();

    // Check that buttons are visible
    const nextBtn = page.locator('.tour-next');
    await expect(nextBtn).toBeVisible();

    const skipBtn = page.locator('.tour-skip');
    await expect(skipBtn).toBeVisible();

    console.log('✅ Tour overlay and callout are displayed correctly');
  });

  test('Next button advances to next step', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Verify we're on step 1
    let progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 1 of');

    let title = await page.locator('.tour-title').textContent();
    expect(title).toBe('Welcome to Utah Political Layers');

    // Click next button
    await page.locator('.tour-next').click();
    await page.waitForTimeout(500);

    // Verify we advanced to step 2
    progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 2 of');

    title = await page.locator('.tour-title').textContent();
    expect(title).toBe('Utah State Boundary');

    // Click next again
    await page.locator('.tour-next').click();
    await page.waitForTimeout(500);

    // Verify we advanced to step 3
    progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 3 of');

    title = await page.locator('.tour-title').textContent();
    expect(title).toBe('State House Districts');

    console.log('✅ Next button successfully advances through tour steps');
  });

  test('Previous button goes back to previous step', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Advance to step 2
    await page.locator('.tour-next').click();
    await page.waitForTimeout(500);

    // Verify we're on step 2
    let progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 2 of');

    // Previous button should now be visible
    const prevBtn = page.locator('.tour-prev');
    await expect(prevBtn).toBeVisible();

    // Click previous button
    await prevBtn.click();
    await page.waitForTimeout(500);

    // Verify we went back to step 1
    progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 1 of');

    let title = await page.locator('.tour-title').textContent();
    expect(title).toBe('Welcome to Utah Political Layers');

    console.log('✅ Previous button successfully navigates backward');
  });

  test('Skip button ends tour early', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Verify tour is active
    const overlay = page.locator('.tour-overlay');
    await expect(overlay).toBeVisible();

    // Click skip button
    await page.locator('.tour-skip').click();
    await page.waitForTimeout(500);

    // Verify tour is closed
    await expect(overlay).not.toBeVisible();

    const callout = page.locator('.tour-callout');
    await expect(callout).not.toBeVisible();

    console.log('✅ Skip button successfully ends tour early');
  });

  test('Tour completion is stored in localStorage', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Get total number of steps
    const progressText = await page.locator('.tour-progress').textContent();
    const totalSteps = parseInt(progressText.match(/of (\d+)/)[1]);

    // Click through all steps to complete the tour
    for (let i = 0; i < totalSteps; i++) {
      await page.locator('.tour-next').click();
      await page.waitForTimeout(500);
    }

    // Verify tour is closed
    const overlay = page.locator('.tour-overlay');
    await expect(overlay).not.toBeVisible();

    // Check localStorage for completion status
    const tourCompleted = await page.evaluate(() => {
      return localStorage.getItem('utah-tour-completed');
    });

    expect(tourCompleted).toBe('true');

    console.log('✅ Tour completion is correctly stored in localStorage');
  });

  test('Tour does not auto-start for returning visitors', async ({ page }) => {
    // First visit - mark tour as completed
    await page.evaluate(() => {
      localStorage.setItem('utah-tour-completed', 'true');
    });

    // Reload the page
    await page.reload();
    await page.waitForSelector('#map', { timeout: 5000 });

    // Wait a bit to see if tour would auto-start
    await page.waitForTimeout(3000);

    // Verify tour did NOT auto-start
    const overlay = page.locator('.tour-overlay');
    await expect(overlay).not.toBeVisible();

    console.log('✅ Tour does not auto-start for returning visitors');
  });

  test('Tour auto-starts for first-time visitors', async ({ page }) => {
    // Make sure localStorage is clear (first-time visitor)
    await page.evaluate(() => {
      localStorage.removeItem('utah-tour-completed');
    });

    // Reload the page
    await page.reload();
    await page.waitForSelector('#map', { timeout: 5000 });

    // Wait for tour to auto-start (it has a 2-3 second delay)
    await page.waitForTimeout(4000);

    // Verify tour auto-started
    const overlay = page.locator('.tour-overlay');
    await expect(overlay).toBeVisible();

    const callout = page.locator('.tour-callout');
    await expect(callout).toBeVisible();

    // Close tour for cleanup
    await page.locator('.tour-skip').click();

    console.log('✅ Tour auto-starts for first-time visitors');
  });

  test('Tour updates map view for each step', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Get initial map view (step 1: Welcome)
    let mapView = await page.evaluate(() => {
      const center = window.map.getCenter();
      return { lat: center.lat, lng: center.lng, zoom: window.map.getZoom() };
    });

    console.log('Initial map view:', mapView);

    // Advance past step 2 (same bounds as step 1) to step 3 (State House - different view)
    await page.locator('.tour-next').click();
    await page.waitForTimeout(500);
    await page.locator('.tour-next').click();
    await page.waitForTimeout(1500); // Wait for map animation

    // Get new map view (step 3: State House zoomed into SLC)
    const newMapView = await page.evaluate(() => {
      const center = window.map.getCenter();
      return { lat: center.lat, lng: center.lng, zoom: window.map.getZoom() };
    });

    console.log('New map view:', newMapView);

    // Verify map view changed (step 3 zooms into SLC at zoom 11)
    const viewChanged = mapView.lat !== newMapView.lat || mapView.lng !== newMapView.lng || mapView.zoom !== newMapView.zoom;
    expect(viewChanged).toBeTruthy();

    console.log('✅ Tour updates map view for each step');
  });

  test('Tour toggles layer visibility for each step', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Step 1 should have boundary layer visible, others hidden
    let layerState = await page.evaluate(() => {
      return {
        boundary: window.layerState?.boundary && window.map.hasLayer(window.layerState.boundary),
        house: window.layerState?.house && window.map.hasLayer(window.layerState.house),
        senate: window.layerState?.senate && window.map.hasLayer(window.layerState.senate)
      };
    });

    expect(layerState.boundary).toBe(true);
    expect(layerState.house).toBe(false);
    expect(layerState.senate).toBe(false);

    console.log('Step 1 layers:', layerState);

    // Advance to State House step (step 3)
    await page.locator('.tour-next').click();
    await page.waitForTimeout(500);
    await page.locator('.tour-next').click();
    await page.waitForTimeout(1000);

    // Step 3 should have house layer visible
    layerState = await page.evaluate(() => {
      return {
        boundary: window.layerState?.boundary && window.map.hasLayer(window.layerState.boundary),
        house: window.layerState?.house && window.map.hasLayer(window.layerState.house),
        senate: window.layerState?.senate && window.map.hasLayer(window.layerState.senate)
      };
    });

    expect(layerState.boundary).toBe(true);
    expect(layerState.house).toBe(true);
    expect(layerState.senate).toBe(false);

    console.log('Step 3 layers:', layerState);
    console.log('✅ Tour correctly toggles layer visibility');
  });

  test('Tour button text changes to "Finish" on last step', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Get total number of steps
    const progressText = await page.locator('.tour-progress').textContent();
    const totalSteps = parseInt(progressText.match(/of (\d+)/)[1]);

    // Click through to the last step
    for (let i = 1; i < totalSteps; i++) {
      await page.locator('.tour-next').click();
      await page.waitForTimeout(300);
    }

    // Verify we're on the last step
    const finalProgress = await page.locator('.tour-progress').textContent();
    expect(finalProgress).toContain(`Step ${totalSteps} of ${totalSteps}`);

    // Verify button text changed to "Finish"
    const nextBtn = page.locator('.tour-next');
    const buttonText = await nextBtn.textContent();
    expect(buttonText).toBe('Finish');

    console.log('✅ Tour button text changes to "Finish" on last step');
  });

  test('Tour can be restarted after skipping', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Skip the tour
    await page.locator('.tour-skip').click();
    await page.waitForTimeout(500);

    // Verify tour is closed
    let overlay = page.locator('.tour-overlay');
    await expect(overlay).not.toBeVisible();

    // Restart the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Verify tour started again from the beginning
    overlay = page.locator('.tour-overlay');
    await expect(overlay).toBeVisible();

    const progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 1 of');

    const title = await page.locator('.tour-title').textContent();
    expect(title).toBe('Welcome to Utah Political Layers');

    console.log('✅ Tour can be restarted after skipping');
  });

  test('Tour restores original map state after completion', async ({ page }) => {
    // Dismiss auto-started tour first (localStorage was cleared in beforeEach)
    const autoTourOverlay = page.locator('.tour-overlay');
    if (await autoTourOverlay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await page.locator('.tour-skip').click();
      await page.waitForTimeout(500);
    }

    // Enable house and senate layers and wait for GeoJSON to load
    await page.locator('#toggle-house').check();
    await page.locator('#toggle-senate').check();

    // Wait until layers actually appear on the map
    await page.waitForFunction(() => {
      return window.layerState?.house && window.map.hasLayer(window.layerState.house)
          && window.layerState?.senate && window.map.hasLayer(window.layerState.senate);
    }, { timeout: 15000 });

    console.log('Initial layer state: house=true, senate=true');

    // Start a fresh tour and skip it
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);
    await page.locator('.tour-skip').click();
    await page.waitForTimeout(1000);

    // Verify layers and checkboxes were restored
    const finalState = await page.evaluate(() => {
      return {
        houseLayer: window.layerState?.house && window.map.hasLayer(window.layerState.house),
        senateLayer: window.layerState?.senate && window.map.hasLayer(window.layerState.senate),
        houseCheckbox: document.getElementById('toggle-house')?.checked,
        senateCheckbox: document.getElementById('toggle-senate')?.checked
      };
    });

    console.log('Final state:', finalState);

    expect(finalState.houseLayer).toBe(true);
    expect(finalState.senateLayer).toBe(true);
    expect(finalState.houseCheckbox).toBe(true);
    expect(finalState.senateCheckbox).toBe(true);

    console.log('✅ Tour restores original map state after completion');
  });

  test('Tour controller is accessible via window.tour', async ({ page }) => {
    // Check that window.tour exists
    const tourExists = await page.evaluate(() => {
      return typeof window.tour !== 'undefined';
    });

    expect(tourExists).toBe(true);

    // Check that tour has expected methods
    const tourMethods = await page.evaluate(() => {
      if (!window.tour) return null;
      return {
        hasStart: typeof window.tour.start === 'function',
        hasNext: typeof window.tour.next === 'function',
        hasSkip: typeof window.tour.skip === 'function',
        hasComplete: typeof window.tour.complete === 'function',
        hasShouldShowTour: typeof window.tour.shouldShowTour === 'function',
        hasResetTourStatus: typeof window.tour.resetTourStatus === 'function'
      };
    });

    expect(tourMethods.hasStart).toBe(true);
    expect(tourMethods.hasNext).toBe(true);
    expect(tourMethods.hasSkip).toBe(true);
    expect(tourMethods.hasComplete).toBe(true);
    expect(tourMethods.hasShouldShowTour).toBe(true);
    expect(tourMethods.hasResetTourStatus).toBe(true);

    console.log('✅ Tour controller is accessible via window.tour with all expected methods');
  });

  test('Tour can be programmatically controlled', async ({ page }) => {
    // Start tour programmatically
    await page.evaluate(() => {
      window.tour.start();
    });

    await page.waitForTimeout(500);

    // Verify tour started
    const overlay = page.locator('.tour-overlay');
    await expect(overlay).toBeVisible();

    // Advance programmatically
    await page.evaluate(() => {
      window.tour.next();
    });

    await page.waitForTimeout(500);

    // Verify we advanced
    const progress = await page.locator('.tour-progress').textContent();
    expect(progress).toContain('Step 2 of');

    // Skip programmatically
    await page.evaluate(() => {
      window.tour.skip();
    });

    await page.waitForTimeout(500);

    // Verify tour ended
    await expect(overlay).not.toBeVisible();

    console.log('✅ Tour can be programmatically controlled');
  });

  test('Tour reset function clears localStorage', async ({ page }) => {
    // Complete the tour
    await page.evaluate(() => {
      localStorage.setItem('utah-tour-completed', 'true');
    });

    // Verify it's set
    let tourCompleted = await page.evaluate(() => {
      return localStorage.getItem('utah-tour-completed');
    });
    expect(tourCompleted).toBe('true');

    // Reset tour status
    await page.evaluate(() => {
      window.tour.resetTourStatus();
    });

    // Verify it's cleared
    tourCompleted = await page.evaluate(() => {
      return localStorage.getItem('utah-tour-completed');
    });
    expect(tourCompleted).toBeNull();

    // Verify shouldShowTour returns true
    const shouldShow = await page.evaluate(() => {
      return window.tour.shouldShowTour();
    });
    expect(shouldShow).toBe(true);

    console.log('✅ Tour reset function clears localStorage');
  });

  test('Tour overlay has correct styling', async ({ page }) => {
    // Start the tour
    await page.locator('#tour-btn').click();
    await page.waitForTimeout(500);

    // Check overlay styles
    const overlayStyles = await page.evaluate(() => {
      const overlay = document.querySelector('.tour-overlay');
      if (!overlay) return null;
      const styles = window.getComputedStyle(overlay);
      return {
        position: styles.position,
        zIndex: styles.zIndex,
        backgroundColor: styles.backgroundColor
      };
    });

    expect(overlayStyles.position).toBe('fixed');
    expect(parseInt(overlayStyles.zIndex)).toBeGreaterThan(9000);

    // Check callout styles
    const calloutStyles = await page.evaluate(() => {
      const callout = document.querySelector('.tour-callout');
      if (!callout) return null;
      const styles = window.getComputedStyle(callout);
      return {
        position: styles.position,
        zIndex: styles.zIndex,
        backgroundColor: styles.backgroundColor
      };
    });

    expect(calloutStyles.position).toBe('fixed');
    expect(parseInt(calloutStyles.zIndex)).toBeGreaterThan(9000);

    console.log('✅ Tour overlay has correct styling');
  });
});
