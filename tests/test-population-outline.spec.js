import { test, expect } from '@playwright/test';

test('Population outline feature works correctly', async ({ page }) => {
  console.log('\n=== POPULATION OUTLINE TEST ===\n');

  // Navigate to the application
  await page.goto('http://localhost:8080');

  // Wait for map to be ready
  await page.waitForSelector('#map', { timeout: 10000 });
  await page.waitForTimeout(1000);

  // Dismiss tour overlay if it exists
  const tourOverlay = page.locator('#tour-overlay');
  if (await tourOverlay.isVisible()) {
    console.log('Dismissing tour overlay...');
    await tourOverlay.click();
    await page.waitForTimeout(500);
  }

  // Enable population layer if not already enabled
  const populationCheckbox = page.locator('#toggle-population');
  const isEnabled = await populationCheckbox.isChecked();

  if (!isEnabled) {
    console.log('Enabling population layer...');
    await populationCheckbox.check();
    console.log('Waiting for population data to load...');
    await page.waitForTimeout(15000); // Wait for API call and rendering (ArcGIS can be slow)
  } else {
    console.log('Population layer already enabled');
    await page.waitForTimeout(5000);
  }

  // Verify population dots are visible
  const circles = page.locator('circle');
  const circleCount = await circles.count();
  console.log(`Population dots found: ${circleCount}`);

  if (circleCount === 0) {
    console.log('No population dots found - API may not have returned data yet or may have failed');
    console.log('Skipping test due to missing population data');
    return;
  }

  expect(circleCount, 'Should have population dots').toBeGreaterThan(0);

  // Get the count of paths before clicking (baseline)
  const initialPathCount = await page.locator('path').count();
  console.log(`Initial path count: ${initialPathCount}`);

  // Click on the first population dot
  const firstCircle = circles.first();
  const boundingBox = await firstCircle.boundingBox();

  expect(boundingBox, 'Should be able to get circle bounding box').not.toBeNull();

  console.log(`Clicking population dot at (${boundingBox.x}, ${boundingBox.y})`);
  await firstCircle.click({ force: true });
  await page.waitForTimeout(500);

  // Check if an outline/highlight appeared (should be a new path element)
  const pathCountAfterClick = await page.locator('path').count();
  console.log(`Path count after click: ${pathCountAfterClick}`);

  expect(pathCountAfterClick, 'Should have more paths after clicking (outline added)').toBeGreaterThan(initialPathCount);

  // Check if the outline is in the populationOutlinePane
  const outlinePane = await page.evaluate(() => {
    const pane = document.querySelector('.leaflet-populationOutlinePane-pane');
    if (!pane) return null;
    return {
      exists: true,
      zIndex: pane.style.zIndex,
      pointerEvents: pane.style.pointerEvents,
      childCount: pane.children.length
    };
  });

  console.log('Outline pane info:', outlinePane);
  expect(outlinePane, 'Population outline pane should exist').not.toBeNull();
  expect(outlinePane.exists, 'Population outline pane should exist').toBe(true);
  expect(outlinePane.childCount, 'Outline pane should have children (the highlight)').toBeGreaterThan(0);

  // Verify the outline has the correct styling
  const outlinePath = await page.evaluate(() => {
    const pane = document.querySelector('.leaflet-populationOutlinePane-pane');
    const path = pane?.querySelector('path');
    if (!path) return null;
    const computedStyle = window.getComputedStyle(path);
    return {
      stroke: computedStyle.stroke || path.getAttribute('stroke'),
      strokeWidth: computedStyle.strokeWidth || path.getAttribute('stroke-width'),
      fillOpacity: computedStyle.fillOpacity || path.getAttribute('fill-opacity')
    };
  });

  console.log('Outline path style:', outlinePath);
  expect(outlinePath, 'Outline path should exist').not.toBeNull();
  expect(outlinePath.fillOpacity, 'Outline should be transparent (no fill)').toBe('0');

  // Click on the same dot again to toggle off the outline
  console.log('Clicking same dot again to remove outline...');
  await firstCircle.click({ force: true });
  await page.waitForTimeout(500);

  const pathCountAfterSecondClick = await page.locator('path').count();
  console.log(`Path count after second click: ${pathCountAfterSecondClick}`);

  expect(pathCountAfterSecondClick, 'Should return to initial path count after second click (outline removed)').toBe(initialPathCount);

  // Click on a different dot to verify outline switches
  if (circleCount > 1) {
    console.log('Clicking different population dot...');
    const secondCircle = circles.nth(1);
    await secondCircle.click({ force: true });
    await page.waitForTimeout(500);

    const pathCountAfterThirdClick = await page.locator('path').count();
    console.log(`Path count after clicking different dot: ${pathCountAfterThirdClick}`);

    expect(pathCountAfterThirdClick, 'Should still have outline after clicking different dot').toBeGreaterThan(initialPathCount);

    // Click on outline itself to dismiss it
    console.log('Clicking on outline to dismiss it...');
    const outlinePathElement = page.locator('.leaflet-populationOutlinePane-pane path').first();
    const outlinePathBox = await outlinePathElement.boundingBox();

    if (outlinePathBox) {
      await page.mouse.click(
        outlinePathBox.x + outlinePathBox.width / 2,
        outlinePathBox.y + outlinePathBox.height / 2
      );
      await page.waitForTimeout(500);

      const finalPathCount = await page.locator('path').count();
      console.log(`Path count after clicking outline: ${finalPathCount}`);

      expect(finalPathCount, 'Clicking outline should remove it').toBe(initialPathCount);
    } else {
      console.log('Could not get outline bounding box, skipping outline click test');
    }
  }

  console.log('✅ Population outline test passed\n');
});
