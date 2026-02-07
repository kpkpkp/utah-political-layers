import { test } from '@playwright/test';

test('Debug marker creation process', async ({ page }) => {
  // Intercept console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    if (!text.includes('Leaflet') && !text.includes('Download')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  // Inject debugging code into the app
  await page.evaluate(() => {
    // Wrap the buildPopulationMarker function to log results
    const originalBuild = window.buildPopulationMarker;

    let successCount = 0;
    let nullCenterCount = 0;
    let totalAttempts = 0;

    // We need to patch this BEFORE the population loads
    // So let's add debugging to the loadPopulationPointsViaRest function

    console.log('DEBUG: Attempting to patch marker building...');

    // Store reference to the build function for later
    window._debugMarkerCounts = {
      success: 0,
      nullCenter: 0,
      total: 0
    };
  });

  // Enable population layer
  const popToggle = page.locator('#toggle-population');
  await popToggle.check();

  console.log('\n=== Waiting for population to load ===\n');

  // Wait for completion
  let attempts = 0;
  while (attempts < 60) {
    await page.waitForTimeout(1000);

    const status = await page.evaluate(() => {
      const statusEl = document.getElementById('population-status');
      return statusEl?.textContent || '';
    });

    if (attempts % 5 === 0) {
      console.log(`Status: ${status}`);
    }

    if (status.includes('ready') || status.includes('blocks')) {
      console.log(`\nFinal status: ${status}`);
      break;
    }

    attempts++;
  }

  // Check what happened
  const debugInfo = await page.evaluate(() => {
    // Try to access the first loaded feature directly
    const testUrl = "https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query";

    const params = new URLSearchParams({
      where: "STATEFP10='49'",
      outFields: "*",
      f: "geojson",
      resultRecordCount: "1"
    });

    return fetch(`${testUrl}?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        const feat = data.features?.[0];
        if (!feat) return { error: 'No features' };

        // Try to compute the center
        const geometry = feat.geometry;
        const hasGeometry = !!geometry;
        const geometryType = geometry?.type;

        return {
          hasFeature: true,
          hasGeometry,
          geometryType,
          propertiesSample: feat.properties
        };
      });
  });

  console.log('\n=== FEATURE DEBUG ===');
  console.log(JSON.stringify(debugInfo, null, 2));

  await page.screenshot({ path: 'screenshots/marker-creation-debug.png' });
});
