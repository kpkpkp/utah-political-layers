import { test, expect } from '@playwright/test';

test('Diagnose map rendering issues - check tiles and layers', async ({ page }) => {
  console.log('\n=== MAP RENDERING DIAGNOSTICS ===\n');

  // Capture console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:8080');
  console.log('✓ Page loaded');

  // Check if map object exists
  const mapExists = await page.evaluate(() => typeof window.map !== 'undefined');
  console.log(`Map object exists: ${mapExists}`);

  // Check Leaflet version
  const leafletVersion = await page.evaluate(() => L?.version || 'undefined');
  console.log(`Leaflet version: ${leafletVersion}`);

  // Wait for init to complete
  await page.waitForTimeout(3000);

  // Check if layers were actually created
  const layersCreated = await page.evaluate(() => {
    if (!window.layerState) return 'layerState undefined';
    const status = {};
    status.boundary = window.layerState.boundary ? 'created' : 'missing';
    status.house = window.layerState.house ? 'created' : 'missing';
    status.senate = window.layerState.senate ? 'created' : 'missing';
    status.congressCurrent = window.layerState.congressCurrent ? 'created' : 'missing';
    status.congressFuture = window.layerState.congressFuture ? 'created' : 'missing';
    return status;
  });
  console.log('Layer creation status:', JSON.stringify(layersCreated, null, 2));

  // Check if base tiles layer was created
  const baseTilesInfo = await page.evaluate(() => {
    if (!window.baseTiles) return 'baseTiles is null/undefined';
    return {
      exists: true,
      isAdded: window.baseTiles._map ? true : false,
      tileUrl: window.baseTiles._url || 'unknown'
    };
  });
  console.log('Base tiles info:', JSON.stringify(baseTilesInfo, null, 2));

  // Check if SVG layer panes exist
  const svgPanesInfo = await page.evaluate(() => {
    const panes = document.querySelectorAll('.leaflet-pane');
    const svgs = document.querySelectorAll('.leaflet-pane svg');
    return {
      totalPanes: panes.length,
      totalSvgs: svgs.length,
      panesList: Array.from(panes).map(p => p.className)
    };
  });
  console.log('SVG panes info:', JSON.stringify(svgPanesInfo, null, 2));

  // Check actual rendered SVG paths
  const svgPathsInfo = await page.evaluate(() => {
    const paths = document.querySelectorAll('.leaflet-pane path');
    return {
      count: paths.length,
      samplePaths: Array.from(paths).slice(0, 3).map(p => ({
        tagName: p.tagName,
        className: p.className.baseVal,
        fillColor: window.getComputedStyle(p).fill,
        strokeColor: window.getComputedStyle(p).stroke
      }))
    };
  });
  console.log('SVG paths info:', JSON.stringify(svgPathsInfo, null, 2));

  // Check if data files were loaded
  const dataLoadStatus = await page.evaluate(() => {
    return {
      partyDataLoaded: typeof window.partyData !== 'undefined',
      boundaryGeojsonLoaded: typeof window.boundaryGeojson !== 'undefined',
      houseGeojsonLoaded: typeof window.houseGeojson !== 'undefined',
    };
  });
  console.log('Data files loaded:', JSON.stringify(dataLoadStatus, null, 2));

  // Check for errors in init
  console.log('\nConsole output during load:');
  consoleLogs.forEach(log => console.log(`  ${log}`));

  // Check network - try to fetch the data files directly
  console.log('\nChecking if data files are accessible:');
  for (const file of ['data/utah_boundary.geojson', 'data/utah_house_2022.geojson']) {
    try {
      const response = await page.goto(`http://localhost:8080/${file}`);
      console.log(`  ✓ ${file}: HTTP ${response.status()}`);
      await page.goto('http://localhost:8080');
    } catch (e) {
      console.log(`  ✗ ${file}: ${e.message}`);
    }
  }

  // Take a screenshot for visual inspection
  await page.screenshot({ path: 'screenshots/diagnostics-map.png', fullPage: true });
  console.log('\n✓ Screenshot saved: screenshots/diagnostics-map.png');

  // Check the actual HTML structure of the map container
  const mapHtml = await page.locator('#map').evaluate(el => ({
    width: el.style.width || el.offsetWidth,
    height: el.style.height || el.offsetHeight,
    display: window.getComputedStyle(el).display,
    position: window.getComputedStyle(el).position,
    backgroundColor: window.getComputedStyle(el).backgroundColor
  }));
  console.log('\nMap container styles:', JSON.stringify(mapHtml, null, 2));

  // Try to manually check a GeoJSON layer
  const houseLayerInfo = await page.evaluate(() => {
    if (!window.layerState || !window.layerState.house) return 'house layer not found';
    const layer = window.layerState.house;
    return {
      type: layer.constructor.name,
      featureCount: layer.getLayers ? layer.getLayers().length : 'unknown',
      isVisible: layer._map ? 'yes' : 'no',
      bounds: layer.getBounds ? layer.getBounds() : 'no bounds'
    };
  });
  console.log('House layer info:', JSON.stringify(houseLayerInfo, null, 2));
});

test('Check if data files are being fetched successfully', async ({ page }) => {
  console.log('\n=== DATA FETCH DIAGNOSTICS ===\n');

  // Monitor all fetch requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('data/') || request.url().includes('arcgis')) {
      requests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Monitor responses
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('data/') || response.url().includes('arcgis')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        ok: response.ok(),
        timestamp: new Date().toISOString()
      });
    }
  });

  await page.goto('http://localhost:8080');

  // Wait for all requests to settle
  await page.waitForTimeout(4000);

  console.log('Data file requests:');
  requests.forEach(req => {
    console.log(`  ${req.method} ${req.url}`);
  });

  console.log('\nData file responses:');
  responses.forEach(res => {
    console.log(`  ${res.status} ${res.url} ${res.ok ? '✓' : '✗'}`);
  });

  if (responses.length === 0) {
    console.log('  ⚠ No data file requests detected!');
  }

  if (responses.some(r => !r.ok)) {
    console.log('  ✗ Some requests failed!');
  } else if (responses.length > 0) {
    console.log('  ✓ All data files fetched successfully');
  }
});
