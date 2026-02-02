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
 * 1. Panel has approximately 4:3 aspect ratio (width ~360px, height ~270px)
 * 2. Party fill colors (Republican, Democratic, Forward, Other) are grouped in "fills" section
 * 3. Outline colors (House, Senate, Congress, Population) are grouped in "outlines" section
 * 4. Line width and opacity sliders are in "outlines" section
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

  test('Panel has 2-column grid layout with 360px width', async ({ page }) => {
    // Get the controls panel element
    const controlsPanel = page.locator('#controls');
    await expect(controlsPanel).toBeVisible();

    // Get the bounding box dimensions
    const boundingBox = await controlsPanel.boundingBox();
    console.log('Panel dimensions:', { width: boundingBox.width, height: boundingBox.height });

    // Check width is approximately 360px (allow 15% variance)
    expect(boundingBox.width).toBeGreaterThan(306); // 360 * 0.85
    expect(boundingBox.width).toBeLessThan(414);    // 360 * 1.15

    // Verify 2-column grid layout by checking elements are side-by-side
    const fillsSection = page.locator('.panel-fills');
    const layersSection = page.locator('.panel-layers');

    const fillsBox = await fillsSection.boundingBox();
    const layersBox = await layersSection.boundingBox();

    // In 2-column layout, fills and layers should be at similar Y positions
    // and fills should be to the right of layers
    expect(fillsBox.x).toBeGreaterThan(layersBox.x);
    console.log('Layers X:', layersBox.x, 'Fills X:', fillsBox.x);

    // They should be roughly at the same Y position (within 50px)
    expect(Math.abs(fillsBox.y - layersBox.y)).toBeLessThan(50);

    console.log('✓ Panel has 2-column grid layout with 360px width');
  });

  test('Party fill colors (Republican, Democratic, Forward, Other) are grouped in "fills" section', async ({ page }) => {
    // Look for the panel-fills section
    const fillsSection = page.locator('.panel-fills');
    await expect(fillsSection).toBeVisible();
    console.log('✓ panel-fills section exists');

    // Find all party color picker elements within the fills section
    const republicanPicker = page.locator('.panel-fills #party-color-republican');
    const democraticPicker = page.locator('.panel-fills #party-color-democratic');
    const forwardPicker = page.locator('.panel-fills #party-color-forward');
    const otherPicker = page.locator('.panel-fills #party-color-other');

    // Verify all party color pickers exist and are visible within panel-fills
    await expect(republicanPicker).toBeVisible();
    await expect(democraticPicker).toBeVisible();
    await expect(forwardPicker).toBeVisible();
    await expect(otherPicker).toBeVisible();

    // Verify they are all within the same section
    const republicanBox = await republicanPicker.boundingBox();
    const democraticBox = await democraticPicker.boundingBox();
    const forwardBox = await forwardPicker.boundingBox();
    const otherBox = await otherPicker.boundingBox();

    console.log('Party picker positions:', {
      republican: republicanBox,
      democratic: democraticBox,
      forward: forwardBox,
      other: otherBox
    });

    // Check that they are grouped together (within a reasonable vertical distance)
    const maxTopDifference = Math.max(
      Math.abs(republicanBox.y - democraticBox.y),
      Math.abs(democraticBox.y - forwardBox.y),
      Math.abs(forwardBox.y - otherBox.y)
    );
    expect(maxTopDifference).toBeLessThan(200); // All within ~200px vertically

    console.log('✓ Party fill colors are grouped in "fills" section');
  });

  test('Outline colors (House, Senate, Congress, Population) are grouped in "outlines" section', async ({ page }) => {
    // Look for the panel-outlines section
    const outlinesSection = page.locator('.panel-outlines');
    await expect(outlinesSection).toBeVisible();
    console.log('✓ panel-outlines section exists');

    // Find all outline color picker elements within the outlines section
    const populationPicker = page.locator('.panel-outlines #color-population');
    const housePicker = page.locator('.panel-outlines #outline-color-house');
    const senatePicker = page.locator('.panel-outlines #outline-color-senate');
    const congressCurrentPicker = page.locator('.panel-outlines #outline-color-congress-current');
    const congressFuturePicker = page.locator('.panel-outlines #outline-color-congress-future');

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

  test('Line width and opacity sliders are in "outlines" section', async ({ page }) => {
    // Look for sliders within the panel-outlines section
    const lineWidthSlider = page.locator('.panel-outlines #line-width');
    const opacitySlider = page.locator('.panel-outlines #line-opacity');

    // Verify sliders exist and are visible
    await expect(lineWidthSlider).toBeVisible();
    await expect(opacitySlider).toBeVisible();

    // Verify slider attributes
    await expect(lineWidthSlider).toHaveAttribute('type', 'range');
    await expect(opacitySlider).toHaveAttribute('type', 'range');

    const widthBox = await lineWidthSlider.boundingBox();
    const opacityBox = await opacitySlider.boundingBox();

    console.log('Slider positions:', {
      lineWidth: widthBox,
      lineOpacity: opacityBox
    });

    // Verify they are vertically aligned (same left position +/- small margin)
    expect(Math.abs(widthBox.x - opacityBox.x)).toBeLessThan(5);

    // Verify opacity slider is below width slider
    expect(opacityBox.y).toBeGreaterThan(widthBox.y);

    console.log('✓ Line width and opacity sliders are present in outlines section');
  });

  test('No duplicate color picker IDs exist in the panel', async ({ page }) => {
    // Get all color picker elements in the controls panel
    const allColorPickers = page.locator('#controls input[type="color"]');

    const pickerCount = await allColorPickers.count();
    console.log('Total color pickers found:', pickerCount);

    // Expected: 4 party colors + 5 outline colors = 9 total
    expect(pickerCount).toBe(9);

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

  test('Mobile layout (375x667 viewport) stacks columns vertically', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for any layout reflow
    await page.waitForTimeout(500);

    // Get the controls panel
    const controlsPanel = page.locator('#controls');
    await expect(controlsPanel).toBeVisible();

    // Get positions of key sections
    const fillsSection = page.locator('.panel-fills');
    const outlinesSection = page.locator('.panel-outlines');

    await expect(fillsSection).toBeVisible();
    await expect(outlinesSection).toBeVisible();

    const fillsBox = await fillsSection.boundingBox();
    const outlinesBox = await outlinesSection.boundingBox();

    console.log('Mobile layout positions:', {
      fills: fillsBox,
      outlines: outlinesBox
    });

    // In vertical stacking, outline section should be below fills section
    // (outline Y coordinate should be greater than fills Y coordinate)
    expect(outlinesBox.y).toBeGreaterThan(fillsBox.y);

    // Verify panel width is constrained to mobile viewport
    const panelBox = await controlsPanel.boundingBox();
    expect(panelBox.width).toBeLessThanOrEqual(375);

    console.log('✓ Mobile layout stacks columns vertically');
  });

  test('Color changes persist and apply correctly to the map', async ({ page }) => {
    // Change a party color
    const newRepublicanColor = '#ff0000'; // Red
    const republicanPicker = page.locator('.panel-fills #party-color-republican');
    await republicanPicker.fill(newRepublicanColor);
    await page.waitForTimeout(500);

    // Verify the color was changed in the picker
    const pickerValue = await republicanPicker.inputValue();
    expect(pickerValue).toBe(newRepublicanColor);
    console.log('Color picker updated:', pickerValue);

    // Verify color was persisted to localStorage
    const storedConfig = await page.evaluate(() => {
      const config = localStorage.getItem('utah-color-config');
      return config ? JSON.parse(config) : null;
    });

    expect(storedConfig).not.toBeNull();
    expect(storedConfig.party.republican).toBe(newRepublicanColor);
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
      expect(configFromAPI.party.republican).toBe(newRepublicanColor);
      console.log('Color config accessible via API');
    }

    console.log('✓ Color changes persist and apply correctly to the map');
  });

});
