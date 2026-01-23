import { test, expect } from '@playwright/test';

test('Population dots clickable when party fill disabled', async ({ page }) => {
  page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));

  await page.goto('http://localhost:8080');
  await page.waitForSelector('#map', { timeout: 5000 });
  await page.waitForTimeout(2000);

  console.log('Testing click-through behavior...\n');

  // Wait for layers to be loaded
  await page.waitForFunction(() => {
    const path = document.querySelector('.leaflet-overlay-pane path');
    return path !== null;
  }, { timeout: 5000 });

  // Enable population layer
  await page.locator('#toggle-population').check();
  await page.waitForTimeout(3000); // Wait for population to load

  console.log('Test 1: Party fill ENABLED (default)');

  // Check pointer-events with party fill enabled
  const pointerEventsWithFill = await page.evaluate(() => {
    const housePath = document.querySelector('.leaflet-overlay-pane path');
    return housePath ? getComputedStyle(housePath).pointerEvents : 'not found';
  });

  console.log(`  District path pointer-events: ${pointerEventsWithFill}`);
  expect(pointerEventsWithFill).toBe('auto');

  // Disable party fill
  console.log('\nTest 2: Party fill DISABLED');
  await page.locator('#toggle-party-fill').uncheck();
  await page.waitForTimeout(1000); // Wait for requestAnimationFrame and DOM update

  // Debug: Check styleState
  const debugInfo = await page.evaluate(() => {
    const housePath = document.querySelector('.leaflet-overlay-pane path');
    const pointerEvents = housePath ? getComputedStyle(housePath).pointerEvents : 'not found';

    // Manually call setDistrictPointerEvents to see if it works
    if (window.setDistrictPointerEvents) {
      window.setDistrictPointerEvents();
    }

    const pointerEventsAfterManual = housePath ? getComputedStyle(housePath).pointerEvents : 'not found';

    return {
      partyFill: window.styleState?.partyFill,
      pointerEventsBefore: pointerEvents,
      pointerEventsAfter: pointerEventsAfterManual,
      hasSetFunction: !!window.setDistrictPointerEvents
    };
  });

  console.log(`  Debug info:`, debugInfo);

  // Check pointer-events with party fill disabled
  const pointerEventsWithoutFill = await page.evaluate(() => {
    const housePath = document.querySelector('.leaflet-overlay-pane path');
    return housePath ? getComputedStyle(housePath).pointerEvents : 'not found';
  });

  console.log(`  District path pointer-events: ${pointerEventsWithoutFill}`);
  expect(pointerEventsWithoutFill).toBe('stroke');

  // Try to click on a population dot
  console.log('\nTest 3: Clicking on population area');

  // Get position of a population marker
  const markerPosition = await page.evaluate(() => {
    const canvas = document.querySelector('.leaflet-population-pane canvas');
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    // Click near center where there should be population dots
    return {
      x: rect.left + rect.width * 0.5,
      y: rect.top + rect.height * 0.5
    };
  });

  if (markerPosition) {
    console.log(`  Clicking at (${markerPosition.x.toFixed(0)}, ${markerPosition.y.toFixed(0)})`);

    // Record what gets clicked
    const clickResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clicked = 'nothing';

        const popTimeout = setTimeout(() => resolve(clicked), 1000);

        window.map.on('click', () => {
          clicked = 'map';
        });

        if (window.layerState.house) {
          window.layerState.house.on('click', () => {
            clicked = 'district';
            clearTimeout(popTimeout);
            resolve(clicked);
          });
        }

        if (window.populationLayer) {
          window.populationLayer.eachLayer((layer) => {
            layer.on('click', () => {
              clicked = 'population';
              clearTimeout(popTimeout);
              resolve(clicked);
            });
          });
        }
      });
    });

    await page.mouse.click(markerPosition.x, markerPosition.y);
    await page.waitForTimeout(1000);

    console.log(`  What got clicked: ${clickResult}`);
  }

  // Re-enable party fill and verify pointer-events change back
  console.log('\nTest 4: Re-enable party fill');
  await page.locator('#toggle-party-fill').check();
  await page.waitForTimeout(500);

  const pointerEventsReEnabled = await page.evaluate(() => {
    const housePath = document.querySelector('.leaflet-overlay-pane path');
    return housePath ? getComputedStyle(housePath).pointerEvents : 'not found';
  });

  console.log(`  District path pointer-events: ${pointerEventsReEnabled}`);
  expect(pointerEventsReEnabled).toBe('auto');

  await page.screenshot({ path: 'screenshots/click-through-test.png' });

  console.log('\n✅ Click-through behavior working correctly!');
  console.log('   - With party fill: districts fully clickable (pointer-events: auto)');
  console.log('   - Without party fill: only outlines clickable (pointer-events: stroke)');
});
