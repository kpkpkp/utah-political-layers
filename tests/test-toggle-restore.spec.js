import { test, expect } from '@playwright/test';

/**
 * Tests for layer toggle state restoration from localStorage.
 *
 * Bug: congressFuture (and any layer created without .addTo(map)) would not
 * render on the map even when the checkbox was checked after restore. The fix
 * uses map.hasLayer() to add any checked-but-missing layer.
 */

const STORAGE_KEY = 'utah-view-settings';

const TOGGLE_CONFIG = [
  { id: 'toggle-boundary', key: 'boundary' },
  { id: 'toggle-tiles', key: 'tiles' },
  { id: 'toggle-population', key: 'population' },
  { id: 'toggle-house', key: 'house' },
  { id: 'toggle-senate', key: 'senate' },
  { id: 'toggle-congress-current', key: 'congressCurrent' },
  { id: 'toggle-congress-future', key: 'congressFuture' },
];

/**
 * Navigate to the app, set localStorage toggles, then reload so the app
 * reads the stored state during initialization.
 */
async function loadWithToggles(page, toggles) {
  // First visit to establish the origin
  await page.goto('http://localhost:8080');
  // Set localStorage while on the correct origin
  await page.evaluate(({ key, toggleObj }) => {
    const stored = JSON.parse(localStorage.getItem(key) || '{}');
    stored.toggles = toggleObj;
    localStorage.setItem(key, JSON.stringify(stored));
  }, { key: STORAGE_KEY, toggleObj: toggles });
  // Reload so the app reads the stored state
  await page.reload();
  await waitForLayers(page);
}

/** Wait for layerState to be populated on the window */
async function waitForLayers(page) {
  await page.waitForFunction(() => {
    return window.layerState
      && window.map
      && window.layerState.boundary
      && window.layerState.tiles
      && window.layerState.congressFuture;
  }, { timeout: 15000 });
}

/** Get sync status: for each toggle, return { checked, onMap } */
async function getSyncStatus(page) {
  return page.evaluate((config) => {
    return config.map(({ id, key }) => {
      const checkbox = document.getElementById(id);
      const layer = window.layerState[key];
      return {
        id,
        key,
        checked: checkbox ? checkbox.checked : null,
        onMap: window.map && layer ? window.map.hasLayer(layer) : false,
      };
    });
  }, TOGGLE_CONFIG);
}

test.describe('Toggle restore from localStorage', () => {

  test('congressFuture checked in localStorage is rendered on map', async ({ page }) => {
    await loadWithToggles(page, {
      'toggle-boundary': true,
      'toggle-tiles': true,
      'toggle-population': false,
      'toggle-house': false,
      'toggle-senate': false,
      'toggle-congress-current': true,
      'toggle-congress-future': true, // the bug case
    });

    const status = await getSyncStatus(page);
    const cf = status.find(s => s.key === 'congressFuture');
    expect(cf.checked).toBe(true);
    expect(cf.onMap).toBe(true);
  });

  test('all toggles unchecked results in no layers on map', async ({ page }) => {
    const toggles = {};
    TOGGLE_CONFIG.forEach(({ id }) => { toggles[id] = false; });
    await loadWithToggles(page, toggles);

    const status = await getSyncStatus(page);
    for (const s of status) {
      expect(s.checked, `${s.key} checkbox should be unchecked`).toBe(false);
      expect(s.onMap, `${s.key} should not be on map`).toBe(false);
    }
  });

  test('all toggles checked results in all layers on map', async ({ page }) => {
    const toggles = {};
    TOGGLE_CONFIG.forEach(({ id }) => { toggles[id] = true; });
    await loadWithToggles(page, toggles);

    const status = await getSyncStatus(page);
    for (const s of status) {
      expect(s.checked, `${s.key} checkbox should be checked`).toBe(true);
      expect(s.onMap, `${s.key} should be on map`).toBe(true);
    }
  });

  test('mixed toggle states are faithfully restored', async ({ page }) => {
    await loadWithToggles(page, {
      'toggle-boundary': false,
      'toggle-tiles': true,
      'toggle-population': false,
      'toggle-house': true,
      'toggle-senate': true,
      'toggle-congress-current': false,
      'toggle-congress-future': false,
    });

    const status = await getSyncStatus(page);
    const expected = {
      boundary: false,
      tiles: true,
      population: false,
      house: true,
      senate: true,
      congressCurrent: false,
      congressFuture: false,
    };

    for (const s of status) {
      const exp = expected[s.key];
      expect(s.checked, `${s.key} checked`).toBe(exp);
      expect(s.onMap, `${s.key} onMap`).toBe(exp);
    }
  });

  test('no saved state uses HTML defaults', async ({ page }) => {
    // Navigate and clear localStorage, then reload
    await page.goto('http://localhost:8080');
    await page.evaluate((key) => {
      localStorage.removeItem(key);
    }, STORAGE_KEY);
    await page.reload();
    await waitForLayers(page);

    const status = await getSyncStatus(page);

    // HTML defaults: boundary=checked, tiles=checked, congress-current=checked
    // population=unchecked, house=unchecked, senate=unchecked, congress-future=unchecked
    const defaults = {
      boundary: true,
      tiles: true,
      population: false,
      house: false,
      senate: false,
      congressCurrent: true,
      congressFuture: false,
    };

    for (const s of status) {
      const exp = defaults[s.key];
      expect(s.checked, `${s.key} checked`).toBe(exp);
      expect(s.onMap, `${s.key} onMap`).toBe(exp);
    }
  });
});
