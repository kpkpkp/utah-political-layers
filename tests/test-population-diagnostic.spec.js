import { test } from '@playwright/test';

test('Diagnose population layer', async ({ page }) => {
  // Listen to console logs from the browser
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Leaflet') && !text.includes('Download')) {
      console.log(`[BROWSER] ${text}`);
    }
  });

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  console.log('\n=== INITIAL STATE ===');

  const initialState = await page.evaluate(() => {
    return {
      layerStateKeys: Object.keys(window.layerState || {}),
      popLayerExists: !!window.populationLayer,
      mapHasPopLayer: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false
    };
  });

  console.log(JSON.stringify(initialState, null, 2));

  // Check toggle
  const popToggle = page.locator('#toggle-population');
  await popToggle.check();
  console.log('\n=== POPULATION TOGGLE CHECKED ===');

  await page.waitForTimeout(3000);

  const midState = await page.evaluate(() => {
    return {
      loading: window.populationState?.loading,
      loaded: window.populationState?.loaded,
      totalCount: window.populationState?.totalCount,
      maxDensity: window.populationState?.maxDensity
    };
  });

  console.log('Population state:', JSON.stringify(midState, null, 2));

  // Wait for load to complete
  let attempts = 0;
  while (attempts < 60) {
    await page.waitForTimeout(1000);

    const status = await page.evaluate(() => {
      const statusEl = document.getElementById('population-status');
      const text = statusEl?.textContent || '';
      const layerCount = window.populationLayer?.getLayers ? window.populationLayer.getLayers().length : 0;

      return {
        statusText: text,
        layerCount,
        mapHasLayer: window.map && window.populationLayer ? window.map.hasLayer(window.populationLayer) : false,
        loaded: window.populationState?.loaded
      };
    });

    console.log(`[${attempts}] ${status.statusText} | Layers in group: ${status.layerCount} | On map: ${status.mapHasLayer}`);

    if (status.loaded || status.statusText.includes('ready')) {
      console.log('\n✅ Loading complete!');
      break;
    }

    attempts++;
  }

  // Final state
  const finalState = await page.evaluate(() => {
    const popLayer = window.populationLayer;
    const layers = popLayer?.getLayers ? popLayer.getLayers() : [];

    return {
      populationLayerExists: !!popLayer,
      layersInGroup: layers.length,
      mapHasPopulationLayer: window.map && popLayer ? window.map.hasLayer(popLayer) : false,
      sampleLayer: layers[0] ? {
        type: layers[0].constructor.name,
        hasOptions: !!layers[0].options,
        hasDensity: layers[0].options ? typeof layers[0].options.density : 'no-options'
      } : null,
      allMapLayers: Object.keys(window.map?._layers || {}).length
    };
  });

  console.log('\n=== FINAL STATE ===');
  console.log(JSON.stringify(finalState, null, 2));

  await page.screenshot({ path: 'screenshots/population-diagnostic.png' });
});
