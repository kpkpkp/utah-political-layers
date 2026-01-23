import { test } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('Test standalone HTML file', async ({ page }) => {
  // Load the standalone HTML file directly
  const standalonePath = join(__dirname, '..', 'utah-political-layers-standalone.html');
  await page.goto(`file://${standalonePath}`);

  await page.waitForSelector('#map', { timeout: 10000 });
  console.log('✓ Standalone HTML loaded');

  // Wait a bit for map to initialize
  await page.waitForTimeout(2000);

  // Check zoom controls
  const controls = await page.evaluate(() => {
    const zoom = document.querySelector('.leaflet-control-zoom');
    const scale = document.querySelector('.leaflet-control-scale');

    return {
      hasZoomControl: !!zoom,
      hasScaleControl: !!scale,
      zoomPosition: zoom ? {
        bottom: window.innerHeight - zoom.getBoundingClientRect().bottom,
        left: zoom.getBoundingClientRect().left
      } : null
    };
  });

  console.log('Controls check:', controls);

  // Get map state
  const mapInfo = await page.evaluate(() => {
    const center = window.map.getCenter();
    const zoom = window.map.getZoom();

    return {
      center: { lat: center.lat.toFixed(2), lng: center.lng.toFixed(2) },
      zoom: zoom.toFixed(1),
      hasEmbeddedData: !!window.EMBEDDED_DATA,
      dataKeys: window.EMBEDDED_DATA ? Object.keys(window.EMBEDDED_DATA) : []
    };
  });

  console.log('\nMap info:');
  console.log(`  Center: ${mapInfo.center.lat}, ${mapInfo.center.lng}`);
  console.log(`  Zoom: ${mapInfo.zoom}`);
  console.log(`  Embedded data: ${mapInfo.hasEmbeddedData ? 'YES' : 'NO'}`);
  console.log(`  Data keys: ${mapInfo.dataKeys.join(', ')}`);

  await page.screenshot({ path: 'screenshots/standalone-test.png' });
  console.log('\n📸 Screenshot: standalone-test.png');

  console.log('\n✅ Standalone HTML working!');
});
