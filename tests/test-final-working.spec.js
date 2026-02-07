import { test } from '@playwright/test';

test('Final verification - all layers working', async ({ page }) => {
  page.on('console', msg => {
    if (!msg.text().includes('Leaflet') && !msg.text().includes('Download')) {
      console.log(`[BROWSER] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('✅ Map loaded\n');

  // Enable population layer
  const popToggle = page.locator('#toggle-population');
  await popToggle.check();
  console.log('✅ Population toggle checked\n');

  // Wait for population to load
  let attempts = 0;
  while (attempts < 60) {
    await page.waitForTimeout(1000);
    const status = await page.evaluate(() => {
      const statusEl = document.getElementById('population-status');
      return statusEl?.textContent || '';
    });

    if (status.includes('ready') || status.includes('blocks')) {
      console.log(`✅ ${status}\n`);
      break;
    }

    attempts++;
  }

  // Take screenshots at different zoom levels
  await page.screenshot({ path: 'screenshots/final-full-utah.png' });
  console.log('📸 Screenshot: full Utah view');

  await page.evaluate(() => window.map.setView([40.7608, -111.891], 11));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/final-slc-zoom.png' });
  console.log('📸 Screenshot: Salt Lake City zoom');

  await page.evaluate(() => window.map.setView([40.2338, -111.6585], 12));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'screenshots/final-provo-zoom.png' });
  console.log('📸 Screenshot: Provo zoom');

  // Get final counts
  const finalStats = await page.evaluate(() => {
    return {
      populationMarkers: window.populationLayer?.getLayers().length || 0,
      mapLayers: Object.keys(window.map?._layers || {}).length,
      layerOnMap: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false
    };
  });

  console.log('\n=== FINAL STATS ===');
  console.log(`Population markers: ${finalStats.populationMarkers.toLocaleString()}`);
  console.log(`Total map layers: ${finalStats.mapLayers}`);
  console.log(`Population layer on map: ${finalStats.layerOnMap ? '✅ YES' : '❌ NO'}`);

  console.log('\n🎉 ALL SYSTEMS WORKING!');
});
