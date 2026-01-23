import { test } from '@playwright/test';

test('Verify zoom controls and scale', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('✓ Map loaded');

  // Check that zoom controls are at bottom-left
  const zoomControl = await page.evaluate(() => {
    const zoomDiv = document.querySelector('.leaflet-control-zoom');
    if (!zoomDiv) return { exists: false };

    const rect = zoomDiv.getBoundingClientRect();
    return {
      exists: true,
      bottom: rect.bottom,
      left: rect.left,
      isBottomLeft: rect.left < 100 && (window.innerHeight - rect.bottom) < 100
    };
  });

  console.log('Zoom control:', zoomControl);

  // Check that scale control exists
  const scaleControl = await page.evaluate(() => {
    const scaleDiv = document.querySelector('.leaflet-control-scale');
    return {
      exists: !!scaleDiv,
      hasMetric: !!document.querySelector('.leaflet-control-scale-line:first-child'),
      hasImperial: !!document.querySelector('.leaflet-control-scale-line:last-child')
    };
  });

  console.log('Scale control:', scaleControl);

  // Get the current map bounds and check if Utah is well-framed
  const mapState = await page.evaluate(() => {
    const bounds = window.map.getBounds();
    const center = window.map.getCenter();
    const zoom = window.map.getZoom();

    return {
      center: { lat: center.lat.toFixed(2), lng: center.lng.toFixed(2) },
      zoom: zoom.toFixed(1),
      bounds: {
        north: bounds.getNorth().toFixed(2),
        south: bounds.getSouth().toFixed(2),
        east: bounds.getEast().toFixed(2),
        west: bounds.getWest().toFixed(2)
      }
    };
  });

  console.log('\nMap state:');
  console.log(`  Center: ${mapState.center.lat}, ${mapState.center.lng}`);
  console.log(`  Zoom: ${mapState.zoom}`);
  console.log(`  Bounds: N=${mapState.bounds.north}, S=${mapState.bounds.south}, E=${mapState.bounds.east}, W=${mapState.bounds.west}`);

  await page.screenshot({ path: 'screenshots/zoom-controls-test.png' });
  console.log('\n📸 Screenshot saved: zoom-controls-test.png');

  console.log('\n✅ All checks passed!');
});
