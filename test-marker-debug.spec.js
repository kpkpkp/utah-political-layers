import { test } from '@playwright/test';

test('Debug marker creation', async ({ page }) => {
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(3000);

  // Inject debugging into buildPopulationMarker
  await page.evaluate(() => {
    const original = window.buildPopulationMarker || (() => null);
    let callCount = 0;
    let nullCount = 0;
    let reasons = {
      noFeature: 0,
      noCenterLonLat: 0,
      success: 0
    };

    window.buildPopulationMarkerDebug = (feature, baseColor, cache) => {
      callCount++;

      if (!feature) {
        reasons.noFeature++;
        nullCount++;
        if (callCount <= 5) console.log(`Call ${callCount}: No feature`);
        return null;
      }

      const density = Number(feature.properties?.PopDensity || 0);
      const population = Number(feature.properties?.POP10 || 0);
      const objectId = String(feature.properties?.FID || "");

      let centerLonLat = cache[objectId];
      if (
        centerLonLat &&
        (centerLonLat.length !== 2 ||
          centerLonLat[0] < -130 ||
          centerLonLat[0] > -100 ||
          centerLonLat[1] < 30 ||
          centerLonLat[1] < 50)
      ) {
        centerLonLat = null;
      }

      if (!centerLonLat) {
        // This is where pointInsideGeometry would be called
        // For now, let's see if we have geometry
        const hasGeometry = !!feature.geometry;
        const geometryType = feature.geometry?.type;

        if (callCount <= 5) {
          console.log(`Call ${callCount}: FID=${objectId}, Pop=${population}, HasGeom=${hasGeometry}, GeomType=${geometryType}`);
        }

        if (!hasGeometry) {
          reasons.noCenterLonLat++;
          nullCount++;
          return null;
        }
      }

      reasons.success++;
      return { callCount, feature }; // Return something
    };

    window.markerDebugStats = () => ({
      callCount,
      nullCount,
      successCount: reasons.success,
      reasons
    });
  });

  // Enable population layer
  await page.locator('#toggle-population').check();
  console.log('Population layer enabled, waiting for load...');

  await page.waitForTimeout(10000);

  const stats = await page.evaluate(() => {
    if (window.markerDebugStats) {
      return window.markerDebugStats();
    }
    return { error: 'Debug function not found' };
  });

  console.log('\n=== MARKER CREATION DEBUG ===');
  console.log('Stats:', JSON.stringify(stats, null, 2));
});
