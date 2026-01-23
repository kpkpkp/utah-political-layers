import { test, expect } from '@playwright/test';

test('Pointer-events changes when party fill toggled', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });

  // Wait for init to complete
  await page.waitForFunction(() => {
    return window.layerState && window.layerState.house;
  }, { timeout: 10000 });

  await page.waitForTimeout(1000);

  console.log('Testing pointer-events changes...\n');

  // Test 1: Check initial state (party fill enabled)
  const initialState = await page.evaluate(() => {
    const paths = document.querySelectorAll('.leaflet-overlay-pane path');
    if (paths.length === 0) return { found: false };

    const firstPath = paths[0];
    return {
      found: true,
      partyFill: window.styleState?.partyFill,
      pointerEvents: getComputedStyle(firstPath).pointerEvents,
      pathCount: paths.length
    };
  });

  console.log('Initial state:');
  console.log(`  Paths found: ${initialState.pathCount || 0}`);
  console.log(`  Party fill: ${initialState.partyFill}`);
  console.log(`  Pointer-events: ${initialState.pointerEvents}`);

  if (!initialState.found) {
    throw new Error('No district paths found!');
  }

  // Test 2: Disable party fill
  console.log('\nDisabling party fill...');
  await page.locator('#toggle-party-fill').uncheck();
  await page.waitForTimeout(1000);

  const afterDisable = await page.evaluate(() => {
    const path = document.querySelector('.leaflet-overlay-pane path');
    return {
      partyFill: window.styleState?.partyFill,
      pointerEvents: path ? getComputedStyle(path).pointerEvents : 'no path'
    };
  });

  console.log('After disabling party fill:');
  console.log(`  Party fill: ${afterDisable.partyFill}`);
  console.log(`  Pointer-events: ${afterDisable.pointerEvents}`);

  // Test 3: Re-enable party fill
  console.log('\nRe-enabling party fill...');
  await page.locator('#toggle-party-fill').check();
  await page.waitForTimeout(1000);

  const afterEnable = await page.evaluate(() => {
    const path = document.querySelector('.leaflet-overlay-pane path');
    return {
      partyFill: window.styleState?.partyFill,
      pointerEvents: path ? getComputedStyle(path).pointerEvents : 'no path'
    };
  });

  console.log('After re-enabling party fill:');
  console.log(`  Party fill: ${afterEnable.partyFill}`);
  console.log(`  Pointer-events: ${afterEnable.pointerEvents}`);

  await page.screenshot({ path: 'screenshots/pointer-events-test.png' });

  // Verify the behavior
  expect(afterDisable.partyFill).toBe(false);
  expect(afterDisable.pointerEvents).toBe('stroke');
  expect(afterEnable.partyFill).toBe(true);
  expect(afterEnable.pointerEvents).toBe('auto');

  console.log('\n✅ Pointer-events correctly switches between "auto" and "stroke"!');
});
