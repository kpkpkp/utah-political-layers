import { test, expect } from '@playwright/test';

test('Debug zoom and bounds behavior', async ({ page }) => {
  console.log('\n=== ZOOM & BOUNDS DEBUG ===\n');

  await page.goto('http://localhost:8080');

  // Wait for init to complete
  await page.waitForTimeout(3000);

  // Check initial zoom and bounds
  const initialState = await page.evaluate(() => {
    const zoom = map.getZoom();
    const center = map.getCenter();
    const bounds = map.getBounds();
    return {
      zoom,
      center: { lat: center.lat.toFixed(4), lng: center.lng.toFixed(4) },
      bounds: {
        north: bounds.getNorth().toFixed(4),
        south: bounds.getSouth().toFixed(4),
        east: bounds.getEast().toFixed(4),
        west: bounds.getWest().toFixed(4)
      }
    };
  });

  console.log('Initial map state:');
  console.log(JSON.stringify(initialState, null, 2));

  // Check if layerState.boundary has valid bounds
  const boundaryBounds = await page.evaluate(() => {
    if (!window.layerState || !window.layerState.boundary) {
      return 'boundary layer not found';
    }
    try {
      const bounds = window.layerState.boundary.getBounds();
      return {
        north: bounds.getNorth().toFixed(4),
        south: bounds.getSouth().toFixed(4),
        east: bounds.getEast().toFixed(4),
        west: bounds.getWest().toFixed(4)
      };
    } catch (e) {
      return `error: ${e.message}`;
    }
  });

  console.log('\nBoundary layer bounds:');
  console.log(JSON.stringify(boundaryBounds, null, 2));

  // Check Utah's expected bounds
  const expectedUtahBounds = {
    north: 42.0,
    south: 37.0,
    east: -109.04,
    west: -114.05
  };

  console.log('\nExpected Utah bounds:');
  console.log(JSON.stringify(expectedUtahBounds, null, 2));

  // Manually fit to boundary bounds to see if it works
  console.log('\nManually fitting to boundary bounds...');
  await page.evaluate(() => {
    if (window.layerState && window.layerState.boundary) {
      map.fitBounds(window.layerState.boundary.getBounds(), { padding: [20, 20] });
    }
  });

  await page.waitForTimeout(500);

  const afterManualFit = await page.evaluate(() => {
    const zoom = map.getZoom();
    const center = map.getCenter();
    const bounds = map.getBounds();
    return {
      zoom,
      center: { lat: center.lat.toFixed(4), lng: center.lng.toFixed(4) },
      bounds: {
        north: bounds.getNorth().toFixed(4),
        south: bounds.getSouth().toFixed(4),
        east: bounds.getEast().toFixed(4),
        west: bounds.getWest().toFixed(4)
      }
    };
  });

  console.log('\nState after manual fitBounds:');
  console.log(JSON.stringify(afterManualFit, null, 2));

  // Take a screenshot
  await page.screenshot({ path: 'screenshots/zoom-debug.png', fullPage: true });
  console.log('\n✓ Screenshot: zoom-debug.png');

  expect(afterManualFit.zoom, 'Zoom should be at least 6 for Utah view').toBeGreaterThanOrEqual(6);
});
