import { test, expect } from '@playwright/test';
import fs from 'fs';

test('Validate GeoJSON data files contain correct Utah coordinates', () => {
  console.log('\n=== DATA FILE VALIDATION ===\n');

  const dataFiles = [
    'public/data/utah_boundary.geojson',
    'public/data/utah_house_2022.geojson',
    'public/data/utah_senate_2022.geojson'
  ];

  // Utah bounds: lat 37-42, lng -114 to -109
  const utahBounds = {
    minLat: 37,
    maxLat: 42,
    minLng: -114,
    maxLng: -109
  };

  dataFiles.forEach(filePath => {
    console.log(`\nValidating ${filePath}...`);

    const fileExists = fs.existsSync(filePath);
    expect(fileExists, `File should exist: ${filePath}`).toBe(true);

    const content = fs.readFileSync(filePath, 'utf-8');
    const geojson = JSON.parse(content);

    expect(geojson.type, `${filePath} should be a FeatureCollection`).toBe('FeatureCollection');
    expect(geojson.features, `${filePath} should have features array`).toBeDefined();
    expect(geojson.features.length, `${filePath} should have at least 1 feature`).toBeGreaterThan(0);

    // Check the bounds of the actual coordinates
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let totalCoords = 0;

    const extractCoords = (coords) => {
      if (typeof coords[0] === 'number') {
        // This is a [lng, lat] pair
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        totalCoords++;
      } else {
        // Recurse into nested arrays
        coords.forEach(extractCoords);
      }
    };

    geojson.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        extractCoords(feature.geometry.coordinates);
      }
    });

    console.log(`  Coordinates found: ${totalCoords}`);
    console.log(`  Latitude range: ${minLat.toFixed(2)} to ${maxLat.toFixed(2)} (should be ~37 to ~42 for Utah)`);
    console.log(`  Longitude range: ${minLng.toFixed(2)} to ${maxLng.toFixed(2)} (should be ~-114 to ~-109 for Utah)`);

    const latInUtah = minLat > utahBounds.minLat - 1 && maxLat < utahBounds.maxLat + 1;
    const lngInUtah = minLng > utahBounds.minLng - 1 && maxLng < utahBounds.maxLng + 1;

    if (!latInUtah || !lngInUtah) {
      console.log(`  ❌ DATA ERROR: Coordinates are NOT in Utah bounds!`);
      console.log(`  ❌ This file contains invalid/corrupted geographic data`);
    } else {
      console.log(`  ✓ Coordinates appear to be in Utah`);
    }

    expect(latInUtah && lngInUtah,
      `${filePath} should contain coordinates within Utah bounds. Found lat ${minLat.toFixed(2)}-${maxLat.toFixed(2)}, lng ${minLng.toFixed(2)}-${maxLng.toFixed(2)}`
    ).toBe(true);
  });

  console.log('\n✓ All data files validated');
});

test('Map should render correctly when data is valid', async ({ page }) => {
  console.log('\n=== MAP RENDERING WITH DATA VALIDATION ===\n');

  // First validate the data exists
  const boundaryExists = fs.existsSync('public/data/utah_boundary.geojson');
  if (!boundaryExists) {
    console.log('❌ CRITICAL: utah_boundary.geojson is missing!');
  }

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  // Check that SVG paths are rendered
  const pathCount = await page.locator('.leaflet-pane path').count();
  console.log(`SVG paths rendered: ${pathCount}`);

  if (pathCount === 0) {
    console.log('❌ ERROR: No SVG paths found. Check:');
    console.log('   1. Are the GeoJSON files present?');
    console.log('   2. Do they contain valid coordinates?');
    console.log('   3. Are there console errors?');
  } else {
    console.log(`✓ ${pathCount} SVG paths are rendered`);
  }

  expect(pathCount, 'Map should have SVG paths for districts').toBeGreaterThan(0);

  // Check map zoom level - should be 6-9 for Utah, not 2-3 for world view
  const mapZoom = await page.evaluate(() => map.getZoom());
  console.log(`Map zoom level: ${mapZoom}`);

  if (mapZoom < 5) {
    console.log('⚠️  WARNING: Map is zoomed out (< 5)');
    console.log('   Possible causes:');
    console.log('   1. GeoJSON coordinates are invalid (not in Utah bounds)');
    console.log('   2. fitBounds() is using bad coordinate data');
    console.log('   3. Map initialization is not setting correct bounds');
  } else if (mapZoom >= 6 && mapZoom <= 9) {
    console.log('✓ Map is zoomed to appropriate level for Utah');
  }

  // Check map center is in Utah
  const center = await page.evaluate(() => {
    const c = map.getCenter();
    return { lat: c.lat, lng: c.lng };
  });

  const inUtah = center.lat > 37 && center.lat < 42 && center.lng > -114 && center.lng < -109;
  console.log(`Map center: ${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}`);

  if (inUtah) {
    console.log('✓ Map is centered on Utah');
  } else {
    console.log('❌ Map is NOT centered on Utah - data or zoom issue');
  }

  expect(mapZoom, 'Map should be zoomed to Utah level (6-9)').toBeGreaterThanOrEqual(5);
  expect(inUtah, 'Map should be centered on Utah').toBe(true);

  console.log('\n✓ Map rendering validation complete');
});
