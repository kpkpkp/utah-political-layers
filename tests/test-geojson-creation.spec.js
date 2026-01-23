import { test, expect } from '@playwright/test';

test('Test L.geoJSON creation with loaded data', async ({ page }) => {
  console.log('\n=== GeoJSON Creation Debug ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  const result = await page.evaluate(async () => {
    try {
      // Load the boundary data
      const response = await fetch('data/utah_boundary.geojson');
      const boundary = await response.json();

      console.log('boundary loaded:', boundary ? 'yes' : 'no');
      console.log('boundary type:', boundary?.type);
      console.log('boundary features:', boundary?.features ? boundary.features.length : 'none');

      if (!boundary) {
        return { error: 'boundary is null' };
      }

      // Try to create L.geoJSON layer
      console.log('Attempting to create L.geoJSON...');
      const boundaryStyle = {
        color: "#2c3e50",
        weight: 2,
        fillOpacity: 0
      };

      try {
        const layer = L.geoJSON(boundary, { style: boundaryStyle });
        console.log('✓ L.geoJSON created successfully');
        return { success: true, features: boundary.features.length };
      } catch (e) {
        console.log('✗ Error creating L.geoJSON:', e.message, e.stack);
        return { error: e.message, stack: e.stack.substring(0, 200) };
      }
    } catch (e) {
      console.log('Error:', e.message);
      return { error: e.message };
    }
  });

  console.log('\nResult:', result);
  expect(result.success, 'Should be able to create L.geoJSON layer').toBe(true);
});

test('Test what the loadJson function actually returns', async ({ page }) => {
  console.log('\n=== LoadJson Function Debug ===\n');

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(1000);

  const result = await page.evaluate(async () => {
    // The loadJson function is defined in app.js
    console.log('loadJson function exists:', typeof loadJson);

    try {
      const boundary = await loadJson('data/utah_boundary.geojson');
      console.log('loadJson returned:', boundary ? 'data' : 'null');
      console.log('typeof:', typeof boundary);
      console.log('is object:', boundary instanceof Object);
      if (boundary) {
        console.log('type property:', boundary.type);
        console.log('features:', boundary.features ? 'yes' : 'no');
        return { success: true, hasType: !!boundary.type, hasFeatures: !!boundary.features };
      } else {
        return { success: false, returned: boundary };
      }
    } catch (e) {
      console.log('Error calling loadJson:', e.message);
      return { error: e.message };
    }
  });

  console.log('\nResult:', result);
  expect(result.success, 'loadJson should return valid GeoJSON data').toBe(true);
});
