import { test, expect } from '@playwright/test';

test('Capture all JavaScript errors and console output', async ({ page }) => {
  console.log('\n=== ERROR & CONSOLE DETECTION ===\n');

  const allMessages = [];
  const errors = [];
  const warnings = [];
  const logs = [];

  page.on('console', msg => {
    const entry = `[${msg.type()}] ${msg.text()}`;
    allMessages.push(entry);

    if (msg.type() === 'error') {
      errors.push(msg.text());
    } else if (msg.type() === 'warning') {
      warnings.push(msg.text());
    } else {
      logs.push(msg.text());
    }
  });

  // Capture uncaught exceptions
  page.on('pageerror', error => {
    console.error('UNCAUGHT ERROR:', error.message);
    errors.push(`UNCAUGHT: ${error.message}`);
    allMessages.push(`[uncaught error] ${error.message}`);
  });

  // Capture failed network requests
  page.on('requestfailed', request => {
    console.error(`REQUEST FAILED: ${request.url()}`);
    errors.push(`NETWORK FAILED: ${request.url()}`);
    allMessages.push(`[network error] ${request.url()}`);
  });

  await page.goto('http://localhost:8080');
  console.log('✓ Page loaded');

  // Wait for init to complete or fail
  await page.waitForTimeout(4000);

  console.log('\n=== ALL CONSOLE OUTPUT ===');
  allMessages.forEach(msg => console.log(`  ${msg}`));

  if (errors.length > 0) {
    console.log('\n❌ ERRORS DETECTED:');
    errors.forEach(err => console.log(`  - ${err}`));
  } else {
    console.log('\n✓ No errors detected in console');
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  console.log('\n=== VARIABLE STATE ===');

  // Check the state of critical variables
  const state = await page.evaluate(() => {
    return {
      mapExists: typeof window.map !== 'undefined',
      mapInitialized: window.map && window.map._size ? true : false,
      leafletLoaded: typeof L !== 'undefined',
      layerStateExists: typeof window.layerState !== 'undefined',
      layerStateContent: window.layerState ? Object.keys(window.layerState) : [],
      initFunctionExists: typeof init !== 'undefined',
      baseTilesExists: typeof baseTiles !== 'undefined',
      baseTilesValue: typeof baseTiles,
      uiStateExists: typeof uiState !== 'undefined',
      selectedTileStyle: typeof selectedTileStyle !== 'undefined' ? selectedTileStyle : 'undefined'
    };
  });

  console.log(JSON.stringify(state, null, 2));

  // Try to manually invoke init and catch errors
  console.log('\n=== ATTEMPTING MANUAL INIT ===');
  try {
    const result = await page.evaluate(async () => {
      try {
        console.log('Attempting to call init()...');
        await init();
        console.log('init() completed successfully');
        return 'success';
      } catch (err) {
        console.error('init() threw error:', err.message);
        throw err;
      }
    });
    console.log(`init() result: ${result}`);
  } catch (err) {
    console.error('init() failed with error:', err.message);
  }

  // Check if init was already called automatically
  const initWasCalled = await page.evaluate(() => {
    return window.layerState && Object.keys(window.layerState).length > 1;
  });
  console.log(`\ninit() was automatically called: ${initWasCalled}`);

  // Check the actual page content
  console.log('\n=== PAGE CONTENT ===');
  const pageTitle = await page.title();
  const headerText = await page.locator('h1').textContent();
  const mapExists = await page.locator('#map').count();
  const panelExists = await page.locator('#controls').count();

  console.log(`Page title: ${pageTitle}`);
  console.log(`Header: ${headerText}`);
  console.log(`Map element present: ${mapExists > 0}`);
  console.log(`Control panel present: ${panelExists > 0}`);
});
