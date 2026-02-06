import { test, expect } from '@playwright/test';

test.describe('Color Configuration Feature - E2E Tests', () => {
  const COLOR_CONFIG_KEY = 'utah-color-config';

  // Default color values from app.js
  const DEFAULT_COLORS = {
    party: {
      republican: '#d73027',
      democratic: '#4575b4',
      forward: '#8b5cf6',
      other: '#9e9e9e'
    },
    outline: {
      house: '#ff6f00',
      senate: '#00b0ff',
      congressCurrent: '#8e24aa',
      congressFuture: '#43a047'
    }
  };

  // Helper to convert RGB to hex
  const rgbToHex = (rgb) => {
    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test for clean state
    await page.goto('http://localhost:8080');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Reload page after clearing storage
    await page.reload();

    // Wait for map and controls to initialize
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForSelector('#controls', { timeout: 10000 });
    await page.waitForTimeout(1000);
  });

  test('should load color pickers with default values', async ({ page }) => {
    console.log('\n=== TEST: Color pickers load with defaults ===');

    // Check party color pickers
    const partyPickers = [
      { id: 'party-color-republican', key: 'republican', expectedColor: DEFAULT_COLORS.party.republican },
      { id: 'party-color-democratic', key: 'democratic', expectedColor: DEFAULT_COLORS.party.democratic },
      { id: 'party-color-forward', key: 'forward', expectedColor: DEFAULT_COLORS.party.forward },
      { id: 'party-color-other', key: 'other', expectedColor: DEFAULT_COLORS.party.other }
    ];

    for (const picker of partyPickers) {
      const input = page.locator(`#${picker.id}`);
      await expect(input).toBeVisible();

      const value = await input.inputValue();
      console.log(`${picker.key}: expected ${picker.expectedColor}, got ${value}`);
      expect(value).toBe(picker.expectedColor);
    }

    // Check outline color pickers
    const outlinePickers = [
      { id: 'outline-color-house', key: 'house', expectedColor: DEFAULT_COLORS.outline.house },
      { id: 'outline-color-senate', key: 'senate', expectedColor: DEFAULT_COLORS.outline.senate },
      { id: 'outline-color-congress-current', key: 'congressCurrent', expectedColor: DEFAULT_COLORS.outline.congressCurrent },
      { id: 'outline-color-congress-future', key: 'congressFuture', expectedColor: DEFAULT_COLORS.outline.congressFuture }
    ];

    for (const picker of outlinePickers) {
      const input = page.locator(`#${picker.id}`);
      await expect(input).toBeVisible();

      const value = await input.inputValue();
      console.log(`${picker.key}: expected ${picker.expectedColor}, got ${value}`);
      expect(value).toBe(picker.expectedColor);
    }

    console.log('✓ All color pickers loaded with default values');
  });

  test('should update and persist party color changes', async ({ page }) => {
    console.log('\n=== TEST: Change party color and persist ===');

    const newRepublicanColor = '#ff0000'; // Bright red
    const pickerSelector = '#party-color-republican';

    // Change the color
    const picker = page.locator(pickerSelector);
    await picker.fill(newRepublicanColor);
    await page.waitForTimeout(500);

    // Verify the color picker reflects the change
    const pickerValue = await picker.inputValue();
    console.log(`Picker value after change: ${pickerValue}`);
    expect(pickerValue).toBe(newRepublicanColor);

    // Verify localStorage was updated
    const storedConfig = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    console.log('Stored config:', JSON.stringify(storedConfig, null, 2));
    expect(storedConfig).not.toBeNull();
    expect(storedConfig.party.republican).toBe(newRepublicanColor);

    // Verify window.getColorConfig() returns updated value
    const configFromAPI = await page.evaluate(() => {
      return window.getColorConfig();
    });

    console.log('Config from API:', JSON.stringify(configFromAPI, null, 2));
    expect(configFromAPI.party.republican).toBe(newRepublicanColor);

    console.log('✓ Party color updated and persisted successfully');
  });

  test('should update and persist outline color changes', async ({ page }) => {
    console.log('\n=== TEST: Change outline color and persist ===');

    const newHouseColor = '#00ff00'; // Bright green
    const pickerSelector = '#outline-color-house';

    // Change the color
    const picker = page.locator(pickerSelector);
    await picker.fill(newHouseColor);
    await page.waitForTimeout(500);

    // Verify the color picker reflects the change
    const pickerValue = await picker.inputValue();
    console.log(`Picker value after change: ${pickerValue}`);
    expect(pickerValue).toBe(newHouseColor);

    // Verify localStorage was updated
    const storedConfig = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    console.log('Stored config:', JSON.stringify(storedConfig, null, 2));
    expect(storedConfig).not.toBeNull();
    expect(storedConfig.outline.house).toBe(newHouseColor);

    // Verify window.getColorConfig() returns updated value
    const configFromAPI = await page.evaluate(() => {
      return window.getColorConfig();
    });

    console.log('Config from API:', JSON.stringify(configFromAPI, null, 2));
    expect(configFromAPI.outline.house).toBe(newHouseColor);

    console.log('✓ Outline color updated and persisted successfully');
  });

  test('should reset all colors to defaults when reset button is clicked', async ({ page }) => {
    console.log('\n=== TEST: Reset button restores defaults ===');

    // First, change multiple colors
    await page.locator('#party-color-republican').fill('#ff0000');
    await page.locator('#party-color-democratic').fill('#0000ff');
    await page.locator('#outline-color-house').fill('#00ff00');
    await page.locator('#outline-color-senate').fill('#ff00ff');
    await page.waitForTimeout(500);

    // Verify colors were changed
    let storedConfig = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    console.log('Config after changes:', JSON.stringify(storedConfig, null, 2));
    expect(storedConfig.party.republican).toBe('#ff0000');
    expect(storedConfig.party.democratic).toBe('#0000ff');
    expect(storedConfig.outline.house).toBe('#00ff00');
    expect(storedConfig.outline.senate).toBe('#ff00ff');

    // Click reset button
    const resetBtn = page.locator('#recenter-map-btn');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
    await page.waitForTimeout(500);

    console.log('Reset button clicked');

    // Verify localStorage was cleared
    const configAfterReset = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw;
    }, COLOR_CONFIG_KEY);

    console.log('localStorage after reset:', configAfterReset);
    expect(configAfterReset).toBeNull();

    // Verify all party color pickers show default values
    expect(await page.locator('#party-color-republican').inputValue()).toBe(DEFAULT_COLORS.party.republican);
    expect(await page.locator('#party-color-democratic').inputValue()).toBe(DEFAULT_COLORS.party.democratic);
    expect(await page.locator('#party-color-forward').inputValue()).toBe(DEFAULT_COLORS.party.forward);
    expect(await page.locator('#party-color-other').inputValue()).toBe(DEFAULT_COLORS.party.other);

    // Verify all outline color pickers show default values
    expect(await page.locator('#outline-color-house').inputValue()).toBe(DEFAULT_COLORS.outline.house);
    expect(await page.locator('#outline-color-senate').inputValue()).toBe(DEFAULT_COLORS.outline.senate);
    expect(await page.locator('#outline-color-congress-current').inputValue()).toBe(DEFAULT_COLORS.outline.congressCurrent);
    expect(await page.locator('#outline-color-congress-future').inputValue()).toBe(DEFAULT_COLORS.outline.congressFuture);

    // Verify window.getColorConfig() returns defaults
    const configFromAPI = await page.evaluate(() => {
      return window.getColorConfig();
    });

    console.log('Config from API after reset:', JSON.stringify(configFromAPI, null, 2));
    expect(configFromAPI.party.republican).toBe(DEFAULT_COLORS.party.republican);
    expect(configFromAPI.party.democratic).toBe(DEFAULT_COLORS.party.democratic);
    expect(configFromAPI.outline.house).toBe(DEFAULT_COLORS.outline.house);
    expect(configFromAPI.outline.senate).toBe(DEFAULT_COLORS.outline.senate);

    console.log('✓ All colors reset to defaults successfully');
  });

  test('should persist colors across page reload', async ({ page }) => {
    console.log('\n=== TEST: Colors persist across reload ===');

    const customColors = {
      partyRepublican: '#ff1111',
      partyDemocratic: '#1111ff',
      partyForward: '#ff11ff',
      partyOther: '#11ff11',
      outlineHouse: '#ffaa00',
      outlineSenate: '#00aaff',
      outlineCongressCurrent: '#aa00ff',
      outlineCongressFuture: '#00ffaa'
    };

    // Set all custom colors
    await page.locator('#party-color-republican').fill(customColors.partyRepublican);
    await page.locator('#party-color-democratic').fill(customColors.partyDemocratic);
    await page.locator('#party-color-forward').fill(customColors.partyForward);
    await page.locator('#party-color-other').fill(customColors.partyOther);
    await page.locator('#outline-color-house').fill(customColors.outlineHouse);
    await page.locator('#outline-color-senate').fill(customColors.outlineSenate);
    await page.locator('#outline-color-congress-current').fill(customColors.outlineCongressCurrent);
    await page.locator('#outline-color-congress-future').fill(customColors.outlineCongressFuture);
    await page.waitForTimeout(1000);

    console.log('Set all custom colors');

    // Verify localStorage has the custom colors
    const storedBeforeReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    console.log('Stored config before reload:', JSON.stringify(storedBeforeReload, null, 2));
    expect(storedBeforeReload.party.republican).toBe(customColors.partyRepublican);
    expect(storedBeforeReload.outline.house).toBe(customColors.outlineHouse);

    // Reload the page
    await page.reload();
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForSelector('#controls', { timeout: 10000 });
    await page.waitForTimeout(1000);

    console.log('Page reloaded');

    // Verify localStorage still has the custom colors
    const storedAfterReload = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    console.log('Stored config after reload:', JSON.stringify(storedAfterReload, null, 2));
    expect(storedAfterReload).not.toBeNull();
    expect(storedAfterReload.party.republican).toBe(customColors.partyRepublican);
    expect(storedAfterReload.party.democratic).toBe(customColors.partyDemocratic);
    expect(storedAfterReload.party.forward).toBe(customColors.partyForward);
    expect(storedAfterReload.party.other).toBe(customColors.partyOther);
    expect(storedAfterReload.outline.house).toBe(customColors.outlineHouse);
    expect(storedAfterReload.outline.senate).toBe(customColors.outlineSenate);
    expect(storedAfterReload.outline.congressCurrent).toBe(customColors.outlineCongressCurrent);
    expect(storedAfterReload.outline.congressFuture).toBe(customColors.outlineCongressFuture);

    // Verify all color pickers reflect the custom values after reload
    expect(await page.locator('#party-color-republican').inputValue()).toBe(customColors.partyRepublican);
    expect(await page.locator('#party-color-democratic').inputValue()).toBe(customColors.partyDemocratic);
    expect(await page.locator('#party-color-forward').inputValue()).toBe(customColors.partyForward);
    expect(await page.locator('#party-color-other').inputValue()).toBe(customColors.partyOther);
    expect(await page.locator('#outline-color-house').inputValue()).toBe(customColors.outlineHouse);
    expect(await page.locator('#outline-color-senate').inputValue()).toBe(customColors.outlineSenate);
    expect(await page.locator('#outline-color-congress-current').inputValue()).toBe(customColors.outlineCongressCurrent);
    expect(await page.locator('#outline-color-congress-future').inputValue()).toBe(customColors.outlineCongressFuture);

    console.log('✓ All custom colors persisted across page reload');
  });

  test('should expose getColorConfig and updateColorConfig API', async ({ page }) => {
    console.log('\n=== TEST: Verify exposed API functions ===');

    // Verify window.getColorConfig exists and returns config
    const getColorConfigExists = await page.evaluate(() => {
      return typeof window.getColorConfig === 'function';
    });
    expect(getColorConfigExists).toBe(true);
    console.log('✓ window.getColorConfig is exposed');

    const config = await page.evaluate(() => {
      return window.getColorConfig();
    });
    expect(config).toHaveProperty('party');
    expect(config).toHaveProperty('outline');
    console.log('✓ window.getColorConfig returns valid config');

    // Verify window.updateColorConfig exists
    const updateColorConfigExists = await page.evaluate(() => {
      return typeof window.updateColorConfig === 'function';
    });
    expect(updateColorConfigExists).toBe(true);
    console.log('✓ window.updateColorConfig is exposed');

    // Test updating via API
    const updatedConfig = await page.evaluate(() => {
      return window.updateColorConfig({
        party: { republican: '#aabbcc' }
      });
    });

    expect(updatedConfig.party.republican).toBe('#aabbcc');
    console.log('✓ window.updateColorConfig updates config correctly');

    // Verify it persisted
    const storedConfig = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    expect(storedConfig.party.republican).toBe('#aabbcc');
    console.log('✓ API update persisted to localStorage');
  });

  test('should handle multiple rapid color changes', async ({ page }) => {
    console.log('\n=== TEST: Handle rapid color changes ===');

    const picker = page.locator('#party-color-republican');

    // Make rapid changes
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ff00ff', '#ffff00'];

    for (const color of colors) {
      await picker.fill(color);
      await page.waitForTimeout(100); // Small delay between changes
    }

    // Wait a bit for all changes to settle
    await page.waitForTimeout(500);

    // Verify final color is persisted
    const finalColor = colors[colors.length - 1];
    expect(await picker.inputValue()).toBe(finalColor);

    const storedConfig = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, COLOR_CONFIG_KEY);

    expect(storedConfig.party.republican).toBe(finalColor);
    console.log(`✓ Final color ${finalColor} persisted after rapid changes`);
  });

  test('should maintain other colors when changing one color', async ({ page }) => {
    console.log('\n=== TEST: Changing one color preserves others ===');

    // Get initial config
    const initialConfig = await page.evaluate(() => {
      return window.getColorConfig();
    });

    console.log('Initial config:', JSON.stringify(initialConfig, null, 2));

    // Change only republican color
    await page.locator('#party-color-republican').fill('#aaaaaa');
    await page.waitForTimeout(500);

    // Get updated config
    const updatedConfig = await page.evaluate(() => {
      return window.getColorConfig();
    });

    console.log('Updated config:', JSON.stringify(updatedConfig, null, 2));

    // Verify only republican changed
    expect(updatedConfig.party.republican).toBe('#aaaaaa');
    expect(updatedConfig.party.democratic).toBe(initialConfig.party.democratic);
    expect(updatedConfig.party.forward).toBe(initialConfig.party.forward);
    expect(updatedConfig.party.other).toBe(initialConfig.party.other);
    expect(updatedConfig.outline.house).toBe(initialConfig.outline.house);
    expect(updatedConfig.outline.senate).toBe(initialConfig.outline.senate);
    expect(updatedConfig.outline.congressCurrent).toBe(initialConfig.outline.congressCurrent);
    expect(updatedConfig.outline.congressFuture).toBe(initialConfig.outline.congressFuture);

    console.log('✓ All other colors preserved when changing one');
  });

  test('should take screenshots of color picker UI', async ({ page }) => {
    console.log('\n=== TEST: Capture color picker screenshots ===');

    // Screenshot with default colors
    const controlsPanel = page.locator('#controls');
    await controlsPanel.screenshot({ path: 'screenshots/color-pickers-default.png' });
    console.log('✓ Screenshot saved: color-pickers-default.png');

    // Change some colors
    await page.locator('#party-color-republican').fill('#ff0000');
    await page.locator('#party-color-democratic').fill('#0000ff');
    await page.locator('#outline-color-house').fill('#00ff00');
    await page.waitForTimeout(500);

    // Screenshot with custom colors
    await controlsPanel.screenshot({ path: 'screenshots/color-pickers-custom.png' });
    console.log('✓ Screenshot saved: color-pickers-custom.png');

    // Reset and screenshot
    await page.locator('#recenter-map-btn').click();
    await page.waitForTimeout(500);
    await controlsPanel.screenshot({ path: 'screenshots/color-pickers-reset.png' });
    console.log('✓ Screenshot saved: color-pickers-reset.png');
  });
});
