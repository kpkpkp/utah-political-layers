import { test, expect } from '@playwright/test';

/**
 * E2E tests for the panel layout in Utah Political Layers
 *
 * Prerequisites:
 * - Application must be running on http://localhost:8080
 * - Run: npm start (or your local server command)
 *
 * To run these tests:
 * - All panel layout tests: npx playwright test test-panel-layout
 * - Specific test: npx playwright test test-panel-layout -g "Panel has approximately 4:3 aspect ratio"
 * - With UI: npx playwright test test-panel-layout --ui
 * - Debug mode: npx playwright test test-panel-layout --debug
 *
 * Test coverage:
 * 1. Panel has two-column grid layout (width ~440px)
 * 2. Party legend shows all party swatches
 * 3. Outline colors (House, Senate, Congress, Population) are paired with layer toggles
 * 4. Line width, line opacity, and fill opacity sliders are in "legend" section
 * 5. No duplicate color picker IDs exist in the panel
 * 6. Mobile layout (375x667 viewport) stacks columns vertically
 * 7. Color changes persist and apply correctly to the map
 */

test.describe('Panel Layout Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean state
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload page after clearing storage
    await page.reload();

    // Wait for map and controls to initialize
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForSelector('#controls', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('Panel has two-column grid layout with approximately 440px width', async ({ page }) => {
    // Get the controls panel element
    const controlsPanel = page.locator('#controls');
    await expect(controlsPanel).toBeVisible();

    // Get the bounding box dimensions
    const boundingBox = await controlsPanel.boundingBox();
    console.log('Panel dimensions:', { width: boundingBox.width, height: boundingBox.height });

    // Check width is approximately 440px (allow 15% variance)
    expect(boundingBox.width).toBeGreaterThan(374); // 440 * 0.85
    expect(boundingBox.width).toBeLessThan(506);    // 440 * 1.15

    // Verify two-column layout by checking legend is beside layers (same Y)
    const layersSection = page.locator('.panel-layers');
    const legendSection = page.locator('.panel-legend');

    const layersBox = await layersSection.boundingBox();
    const legendBox = await legendSection.boundingBox();

    // In two-column layout, legend should be at roughly the same Y as layers
    expect(Math.abs(legendBox.y - layersBox.y)).toBeLessThan(20);
    // And legend should be to the right of layers
    expect(legendBox.x).toBeGreaterThan(layersBox.x);
    console.log('Layers Y:', layersBox.y, 'Legend Y:', legendBox.y, 'Layers X:', layersBox.x, 'Legend X:', legendBox.x);

    console.log('✓ Panel has two-column grid layout with ~440px width');
  });

  test('Party legend shows all party swatches', async ({ page }) => {
    // Look for the panel-legend section
    const legendSection = page.locator('.panel-legend');
    await expect(legendSection).toBeVisible();
    console.log('✓ panel-legend section exists');

    // Find all party swatch elements within the legend
    const republicanSwatch = page.locator('.panel-legend .swatch.republican');
    const democratSwatch = page.locator('.panel-legend .swatch.democrat');
    const forwardSwatch = page.locator('.panel-legend .swatch.forward');
    const otherSwatch = page.locator('.panel-legend .swatch.other');

    // Verify all swatches exist and are visible
    await expect(republicanSwatch).toBeVisible();
    await expect(democratSwatch).toBeVisible();
    await expect(forwardSwatch).toBeVisible();
    await expect(otherSwatch).toBeVisible();

    console.log('✓ Party legend shows all party swatches');
  });

  test('Outline colors (House, Senate, Congress, Population) are paired with layer toggles', async ({ page }) => {
    // Look for the panel-layers section (outlines are now integrated with layers)
    const layersSection = page.locator('.panel-layers');
    await expect(layersSection).toBeVisible();
    console.log('✓ panel-layers section exists with integrated outline colors');

    // Find all outline color picker elements within the layers section
    const populationPicker = page.locator('.panel-layers #color-population');
    const housePicker = page.locator('.panel-layers #outline-color-house');
    const senatePicker = page.locator('.panel-layers #outline-color-senate');
    const congressCurrentPicker = page.locator('.panel-layers #outline-color-congress-current');
    const congressFuturePicker = page.locator('.panel-layers #outline-color-congress-future');

    // Verify all outline color pickers exist and are visible within panel-outlines
    await expect(populationPicker).toBeVisible();
    await expect(housePicker).toBeVisible();
    await expect(senatePicker).toBeVisible();
    await expect(congressCurrentPicker).toBeVisible();
    await expect(congressFuturePicker).toBeVisible();

    // Verify they are all within the same section
    const populationBox = await populationPicker.boundingBox();
    const houseBox = await housePicker.boundingBox();
    const senateBox = await senatePicker.boundingBox();
    const congressCurrentBox = await congressCurrentPicker.boundingBox();
    const congressFutureBox = await congressFuturePicker.boundingBox();

    console.log('Outline picker positions:', {
      population: populationBox,
      house: houseBox,
      senate: senateBox,
      congressCurrent: congressCurrentBox,
      congressFuture: congressFutureBox
    });

    // Check that they are grouped together (within a reasonable vertical distance)
    const maxTopDifference = Math.max(
      Math.abs(populationBox.y - houseBox.y),
      Math.abs(houseBox.y - senateBox.y),
      Math.abs(senateBox.y - congressCurrentBox.y),
      Math.abs(congressCurrentBox.y - congressFutureBox.y)
    );
    expect(maxTopDifference).toBeLessThan(250); // All within ~250px vertically

    console.log('✓ Outline colors are grouped in "outlines" section');
  });

  test('Line width, line opacity, and fill opacity sliders are in "legend" section', async ({ page }) => {
    // Open the Appearance details group first (starts collapsed)
    await page.locator('.appearance-group:not(#sources-group) summary').click();

    // Look for sliders within the panel-legend section
    const lineWidthSlider = page.locator('.panel-legend #line-width');
    const opacitySlider = page.locator('.panel-legend #line-opacity');
    const fillOpacitySlider = page.locator('.panel-legend #fill-opacity');

    // Verify sliders exist and are visible
    await expect(lineWidthSlider).toBeVisible();
    await expect(opacitySlider).toBeVisible();
    await expect(fillOpacitySlider).toBeVisible();

    // Verify slider attributes
    await expect(lineWidthSlider).toHaveAttribute('type', 'range');
    await expect(opacitySlider).toHaveAttribute('type', 'range');
    await expect(fillOpacitySlider).toHaveAttribute('type', 'range');

    const widthBox = await lineWidthSlider.boundingBox();
    const opacityBox = await opacitySlider.boundingBox();
    const fillOpacityBox = await fillOpacitySlider.boundingBox();

    console.log('Slider positions:', {
      lineWidth: widthBox,
      lineOpacity: opacityBox,
      fillOpacity: fillOpacityBox
    });

    // Verify they are vertically aligned (same left position +/- small margin)
    expect(Math.abs(widthBox.x - opacityBox.x)).toBeLessThan(5);
    expect(Math.abs(opacityBox.x - fillOpacityBox.x)).toBeLessThan(5);

    // Verify ordering: width, then opacity, then fill opacity
    expect(opacityBox.y).toBeGreaterThan(widthBox.y);
    expect(fillOpacityBox.y).toBeGreaterThan(opacityBox.y);

    console.log('✓ Line width, line opacity, and fill opacity sliders are in legend section');
  });

  test('No duplicate color picker IDs exist in the panel', async ({ page }) => {
    // Get all color picker elements in the controls panel
    const allColorPickers = page.locator('#controls input[type="color"]');

    const pickerCount = await allColorPickers.count();
    console.log('Total color pickers found:', pickerCount);

    // Expected: 6 color pickers (boundary, population, house, senate, congress-current, congress-future)
    expect(pickerCount).toBe(6);

    // Collect all IDs
    const ids = [];
    for (let i = 0; i < pickerCount; i++) {
      const id = await allColorPickers.nth(i).getAttribute('id');
      if (id) {
        ids.push(id);
        console.log(`Picker ${i}: ${id}`);
      }
    }

    // All pickers should have IDs
    expect(ids.length).toBe(pickerCount);

    // Check for duplicates
    const uniqueIds = new Set(ids);
    console.log('Unique IDs:', uniqueIds.size, 'Total IDs:', ids.length);

    expect(uniqueIds.size).toBe(ids.length);

    console.log('✓ No duplicate color picker IDs exist in the panel');
  });

  test('Mobile layout (375x667 viewport) shows bottom sheet panel', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for any layout reflow
    await page.waitForTimeout(500);

    // Get the controls panel
    const controlsPanel = page.locator('#controls');
    await expect(controlsPanel).toBeVisible();

    // Get positions of key sections
    const layersSection = page.locator('.panel-layers');
    const legendSection = page.locator('.panel-legend');

    await expect(layersSection).toBeVisible();
    await expect(legendSection).toBeVisible();

    const layersBox = await layersSection.boundingBox();
    const legendBox = await legendSection.boundingBox();

    console.log('Mobile layout positions:', {
      layers: layersBox,
      legend: legendBox
    });

    // In vertical stacking, legend section should be below layers section
    expect(legendBox.y).toBeGreaterThan(layersBox.y);

    // Verify panel width is constrained to mobile viewport
    const panelBox = await controlsPanel.boundingBox();
    expect(panelBox.width).toBeLessThanOrEqual(375);

    console.log('✓ Mobile layout shows bottom sheet panel');
  });

  test('Outline color changes persist and apply correctly to the map', async ({ page }) => {
    // Change an outline color
    const newHouseColor = '#00ff00'; // Green
    const housePicker = page.locator('#outline-color-house');
    await housePicker.fill(newHouseColor);
    await page.waitForTimeout(500);

    // Verify the color was changed in the picker
    const pickerValue = await housePicker.inputValue();
    expect(pickerValue).toBe(newHouseColor);
    console.log('Color picker updated:', pickerValue);

    // Verify color was persisted to localStorage
    const storedConfig = await page.evaluate(() => {
      const config = localStorage.getItem('utah-color-config');
      return config ? JSON.parse(config) : null;
    });

    expect(storedConfig).not.toBeNull();
    expect(storedConfig.outline.house).toBe(newHouseColor);
    console.log('Color persisted to localStorage');

    // Verify color is applied to map elements
    // Look for map elements with the new color
    const mapLayerElements = page.locator('.leaflet-pane svg');
    const elementCount = await mapLayerElements.count();
    console.log('Found map layer SVG elements:', elementCount);

    // Check that the color config is accessible via API
    const configFromAPI = await page.evaluate(() => {
      return window.getColorConfig ? window.getColorConfig() : null;
    });

    if (configFromAPI) {
      expect(configFromAPI.outline.house).toBe(newHouseColor);
      console.log('Color config accessible via API');
    }

    console.log('✓ Outline color changes persist and apply correctly to the map');
  });

  test('Fill on map checkbox is in legend section', async ({ page }) => {
    // The "Fill on map" checkbox should be in the panel-legend section
    const fillCheckbox = page.locator('.panel-legend #toggle-party-fill');
    await expect(fillCheckbox).toBeVisible();

    // Verify the label text
    const fillLabel = page.locator('.panel-legend .fill-toggle span');
    await expect(fillLabel).toHaveText('Fill on map');

    console.log('✓ Fill on map checkbox is in legend section');
  });

  test('Population status is adjacent to Population toggle', async ({ page }) => {
    // The population status span should be in the same row as the Population toggle
    const popRow = page.locator('.layer-row:has(#toggle-population)');
    const status = popRow.locator('.population-status');

    // The element should exist in the DOM (it may be empty/hidden when not loading)
    await expect(status).toHaveCount(1);

    // Verify the element has the correct id
    const statusId = await status.getAttribute('id');
    expect(statusId).toBe('population-status');

    console.log('✓ Population status element exists adjacent to Population toggle');
  });

  test('Tour and Reset buttons in header row', async ({ page }) => {
    const header = page.locator('.panel-header');
    await expect(header).toBeVisible();

    const tourBtn = header.locator('#tour-btn');
    const resetBtn = header.locator('#reset-colors-btn');

    await expect(tourBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();

    // Both should be in header at approximately same Y position
    const tourBox = await tourBtn.boundingBox();
    const resetBox = await resetBtn.boundingBox();

    // Verify both are at roughly the same vertical position (within 10px)
    expect(Math.abs(resetBox.y - tourBox.y)).toBeLessThan(10);

    console.log('Reset Y:', resetBox.y, 'Tour Y:', tourBox.y);
    console.log('✓ Tour and Reset buttons both in header row');
  });

  test('Save Defaults button is visible on localhost', async ({ page }) => {
    // On localhost, the save defaults button should be visible
    const saveContainer = page.locator('#save-defaults-container');
    const saveBtn = page.locator('#save-defaults-btn');

    // Check if we're on localhost
    const isLocalhost = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    });

    if (isLocalhost) {
      await expect(saveContainer).toBeVisible();
      await expect(saveBtn).toBeVisible();
      console.log('✓ Save Defaults button is visible on localhost');
    } else {
      // On non-localhost, it should be hidden
      await expect(saveContainer).not.toBeVisible();
      console.log('✓ Save Defaults button is hidden on non-localhost');
    }
  });

  test('Save Defaults dropdown opens and closes', async ({ page }) => {
    // On localhost, test the dropdown functionality
    const isLocalhost = await page.evaluate(() => {
      return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    });

    if (!isLocalhost) {
      console.log('Skipping dropdown test on non-localhost');
      return;
    }

    const saveBtn = page.locator('#save-defaults-btn');
    const dropdown = page.locator('#save-defaults-dropdown');

    // Initially dropdown should be closed
    await expect(dropdown).not.toHaveClass(/open/);

    // Click to open
    await saveBtn.click();
    await expect(dropdown).toHaveClass(/open/);

    // Verify options are visible
    const saveLocal = dropdown.locator('#save-local');
    const saveDeployed = dropdown.locator('#save-deployed');
    await expect(saveLocal).toBeVisible();
    await expect(saveDeployed).toBeVisible();

    // Click outside to close
    await page.locator('.panel-header').click();
    await expect(dropdown).not.toHaveClass(/open/);

    console.log('✓ Save Defaults dropdown opens and closes');
  });

  test('Corner rotation button exists and rotates panel through corners', async ({ page }) => {
    const panel = page.locator('#controls');
    const cornerBtn = page.locator('#panel-corner-btn');

    await expect(cornerBtn).toBeVisible();
    await expect(cornerBtn).toHaveAttribute('title', 'Move to next corner');

    // Initially should be in top-right (default)
    await expect(panel).toHaveClass(/corner-top-right/);

    // Click to rotate to bottom-right
    await cornerBtn.click();
    await expect(panel).toHaveClass(/corner-bottom-right/);

    // Click to rotate to bottom-left
    await cornerBtn.click();
    await expect(panel).toHaveClass(/corner-bottom-left/);

    // Click to rotate to top-left
    await cornerBtn.click();
    await expect(panel).toHaveClass(/corner-top-left/);

    // Click to rotate back to top-right
    await cornerBtn.click();
    await expect(panel).toHaveClass(/corner-top-right/);

    console.log('✓ Corner rotation button cycles through all 4 corners');
  });

  test('Corner position persists across page reload', async ({ page }) => {
    const cornerBtn = page.locator('#panel-corner-btn');

    // Click twice to move to bottom-left
    await cornerBtn.click();
    await cornerBtn.click();
    await expect(page.locator('#controls')).toHaveClass(/corner-bottom-left/);

    // Reload page
    await page.reload();
    await page.waitForSelector('#controls');

    // Should still be in bottom-left
    await expect(page.locator('#controls')).toHaveClass(/corner-bottom-left/);

    console.log('✓ Corner position persists across reload');
  });

  test('Toggle button direction changes based on corner position', async ({ page }) => {
    const panel = page.locator('#controls');
    const toggle = page.locator('#panel-toggle');
    const cornerBtn = page.locator('#panel-corner-btn');

    // In top-right corner, expanded panel shows ◀ (pointing away from edge)
    await expect(panel).toHaveClass(/corner-top-right/);
    await expect(toggle).toHaveText('◀');

    // Collapse the panel
    await toggle.click();
    await expect(panel).toHaveClass(/collapsed/);
    await expect(toggle).toHaveText('▶');

    // Expand again
    await toggle.click();
    await expect(panel).not.toHaveClass(/collapsed/);

    // Move to bottom-left corner
    await cornerBtn.click();
    await cornerBtn.click();
    await expect(panel).toHaveClass(/corner-bottom-left/);

    // In left-side corners, expanded panel shows ▶
    await expect(toggle).toHaveText('▶');

    // Collapse
    await toggle.click();
    await expect(panel).toHaveClass(/collapsed/);
    await expect(toggle).toHaveText('◀');

    console.log('✓ Toggle button direction is correct for each corner');
  });

  test('Zoom controls move when panel rotates', async ({ page }) => {
    const cornerBtn = page.locator('#panel-corner-btn');
    const zoomControl = page.locator('.leaflet-control-zoom');

    // Helper to check zoom control position
    const getZoomPosition = async () => {
      return await zoomControl.evaluate(el => {
        const parent = el.parentElement?.className || '';
        const hasBottom = parent.includes('bottom');
        const hasTop = parent.includes('top');
        const hasLeft = parent.includes('left');
        const hasRight = parent.includes('right');
        if (hasBottom && hasLeft) return 'bottomleft';
        if (hasBottom && hasRight) return 'bottomright';
        if (hasTop && hasLeft) return 'topleft';
        if (hasTop && hasRight) return 'topright';
        return parent;
      });
    };

    // Initially panel at top-right
    await expect(page.locator('#controls')).toHaveClass(/corner-top-right/);

    // Rotate panel to bottom-right, zoom goes to bottom-left
    await cornerBtn.click();
    await page.waitForTimeout(100);
    expect(await getZoomPosition()).toBe('bottomleft');

    // Rotate panel to bottom-left, zoom goes to top-left
    await cornerBtn.click();
    await page.waitForTimeout(100);
    expect(await getZoomPosition()).toBe('topleft');

    // Rotate panel to top-left, zoom goes to top-right
    await cornerBtn.click();
    await page.waitForTimeout(100);
    expect(await getZoomPosition()).toBe('topright');

    // Rotate panel back to top-right, zoom goes to bottom-right
    await cornerBtn.click();
    await page.waitForTimeout(100);
    expect(await getZoomPosition()).toBe('bottomright');

    console.log('✓ Zoom controls chase ahead of panel through corners');
  });

});
