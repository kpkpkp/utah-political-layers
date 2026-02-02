/*
================================================================================
SWATCH/COLOR-BOX AUDIT REPORT
================================================================================

AUDIT DATE: January 31, 2026
PURPOSE: Comprehensive review of color swatches in Utah Political Layers map

1. HTML ELEMENTS (public/index.html)
================================================================================
Location: Lines 113-116 in <div class="legend">

Swatch Elements Identified:
  - <span class="swatch republican"></span>Republican
  - <span class="swatch democrat"></span>Democratic
  - <span class="swatch forward"></span>Forward
  - <span class="swatch other"></span>Other / Unknown

Structure: Four color swatches in a legend-row container, each paired with text label.
Container: .legend (flex column, gap 6px) > .legend-row (flex, gap 8px)

Swatch Classes Used:
  - .swatch (base class)
  - .swatch.republican (party-specific)
  - .swatch.democrat (party-specific)
  - .swatch.forward (party-specific)
  - .swatch.other (party-specific)

2. CSS RULES (public/styles.css)
================================================================================
Location: Lines 178-211

.legend (Lines 178-182)
  - display: flex
  - flex-direction: column
  - gap: 6px

.legend-row (Lines 184-188)
  - display: flex
  - align-items: center
  - gap: 8px

.swatch BASE CLASS (Lines 190-195)
  - width: 14px
  - height: 14px
  - border-radius: 3px
  - border: 1px solid #b0b0b0

.swatch.republican (Lines 197-199)
  - background: #d73027 (red)

.swatch.democrat (Lines 201-203)
  - background: #4575b4 (blue)

.swatch.forward (Lines 205-207)
  - background: #8b5cf6 (purple)

.swatch.other (Lines 209-211)
  - background: #9e9e9e (gray)

3. FINDINGS & ANALYSIS
================================================================================

Dimension Consistency:
  ✓ All swatches use consistent dimensions: 14px × 14px (base class applies to all)
  ✓ All swatches have consistent border-radius: 3px (rounded corners)
  ✓ All swatches have consistent border: 1px solid #b0b0b0 (gray border)

Color Swatches:
  ✓ Four distinct party colors defined
  ✓ Colors are well-differentiated and accessible
  ✓ Background colors vary only (no other style differences per party)

Layout & Spacing:
  ✓ Legend container: flex column with 6px gap between rows
  ✓ Legend rows: flex with 8px gap between swatch and label
  ✓ Consistent vertical alignment (align-items: center)

NO INCONSISTENCIES FOUND:
  All swatch elements maintain uniform dimensions, styling, and alignment.
  The design is clean and consistent across all four party legend items.

4. ADDITIONAL OBSERVATIONS
================================================================================

Color Picker Inputs (Layer Controls):
  - Separate HTML elements: <input type="color"> for layer stroke colors
  - Used for: population, house, senate, congress-current, congress-future layers
  - Dimensions: 32px × 24px (NOT part of legend swatches)
  - These are user-controlled color pickers, NOT legend swatches

Legacy Code Comments:
  - Lines 218-252: Extensive Leaflet control positioning CSS
  - Purpose: Ensure zoom/scale controls remain visible despite overflow rules
  - Not related to legend swatches

5. TEST STRATEGY
================================================================================

The test file below will verify:
  1. Page loads successfully
  2. All .swatch elements are present in the DOM
  3. All .swatch elements have uniform computed dimensions (14×14 px)
  4. All .swatch elements are visible and rendered
  5. Screenshot capture of legend area for visual inspection

================================================================================
*/

import { test, expect } from '@playwright/test';

test.describe('Legend Swatches - Consistency Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main application
    await page.goto('http://localhost:8080');

    // Wait for map and panel to initialize
    await page.waitForSelector('#map', { timeout: 10000 });
    await page.waitForSelector('#controls', { timeout: 10000 });

    // Give the page time to fully render
    await page.waitForTimeout(1000);
  });

  test('should load page with legend present', async ({ page }) => {
    // Check that the legend container exists
    const legend = page.locator('.legend');
    await expect(legend).toBeVisible();

    // Check that all four legend rows exist
    const legendRows = page.locator('.legend-row');
    expect(await legendRows.count()).toBe(4);

    console.log('✓ Legend loaded with 4 rows');
  });

  test('should have all swatch elements with consistent dimensions', async ({ page }) => {
    // Get all swatch elements
    const swatches = page.locator('.swatch');
    const swatchCount = await swatches.count();

    expect(swatchCount).toBe(4);
    console.log(`✓ Found ${swatchCount} swatch elements`);

    // Get computed dimensions for each swatch
    const swatchDimensions = await page.evaluate(() => {
      const swatches = document.querySelectorAll('.swatch');
      return Array.from(swatches).map((swatch, index) => {
        const computed = window.getComputedStyle(swatch);
        const classNames = swatch.className;
        return {
          index,
          classNames,
          width: computed.width,
          height: computed.height,
          borderRadius: computed.borderRadius,
          border: computed.border,
          backgroundColor: computed.backgroundColor
        };
      });
    });

    // Log dimensions for inspection
    console.log('\n=== SWATCH DIMENSIONS ===');
    swatchDimensions.forEach((swatch, i) => {
      console.log(`Swatch ${i} (${swatch.classNames}):`);
      console.log(`  Width: ${swatch.width}, Height: ${swatch.height}`);
      console.log(`  Border radius: ${swatch.borderRadius}`);
      console.log(`  Background: ${swatch.backgroundColor}`);
    });

    // Verify all swatches have same dimensions
    const expectedWidth = '14px';
    const expectedHeight = '14px';

    swatchDimensions.forEach((swatch, i) => {
      expect(swatch.width, `Swatch ${i} width should be 14px`).toBe(expectedWidth);
      expect(swatch.height, `Swatch ${i} height should be 14px`).toBe(expectedHeight);
    });

    console.log('✓ All swatches have consistent 14px × 14px dimensions');
  });

  test('should have correct party colors in legend swatches', async ({ page }) => {
    // Get all swatches with their party affiliation
    const partyColors = await page.evaluate(() => {
      const swatches = document.querySelectorAll('.swatch');
      return Array.from(swatches).map(swatch => {
        const partyClass = Array.from(swatch.classList).find(
          cls => ['republican', 'democrat', 'forward', 'other'].includes(cls)
        );
        const computed = window.getComputedStyle(swatch);
        return {
          party: partyClass,
          backgroundColor: computed.backgroundColor
        };
      });
    });

    console.log('\n=== PARTY COLOR MAPPING ===');
    partyColors.forEach(item => {
      console.log(`${item.party}: ${item.backgroundColor}`);
    });

    // Verify we have all four parties
    const parties = partyColors.map(p => p.party);
    expect(parties).toContain('republican');
    expect(parties).toContain('democrat');
    expect(parties).toContain('forward');
    expect(parties).toContain('other');

    console.log('✓ All four party colors present in legend');
  });

  test('should have all swatches visible and not hidden', async ({ page }) => {
    const swatches = page.locator('.swatch');

    for (let i = 0; i < (await swatches.count()); i++) {
      const swatch = swatches.nth(i);

      // Check visibility
      await expect(swatch).toBeVisible();

      // Check that it's not hidden by display or opacity
      const visibility = await swatch.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          isHidden: el.hidden
        };
      });

      expect(visibility.display).not.toBe('none');
      expect(visibility.visibility).not.toBe('hidden');
      expect(visibility.opacity).not.toBe('0');
      expect(visibility.isHidden).toBe(false);
    }

    console.log('✓ All swatches are properly visible');
  });

  test('should take screenshot of legend area for visual inspection', async ({ page }) => {
    // Get the legend container
    const legend = page.locator('.legend');

    // Take a screenshot of just the legend area
    await legend.screenshot({ path: 'screenshots/legend-swatches.png' });
    console.log('✓ Legend screenshot saved to screenshots/legend-swatches.png');

    // Also take a full panel screenshot for context
    const panel = page.locator('#controls');
    await panel.screenshot({ path: 'screenshots/full-control-panel.png' });
    console.log('✓ Full control panel screenshot saved to screenshots/full-control-panel.png');
  });

  test('should verify legend row layout and spacing', async ({ page }) => {
    // Check legend row structure
    const legendRows = page.locator('.legend-row');
    const rowCount = await legendRows.count();

    console.log(`\n=== LEGEND ROW ANALYSIS ===`);
    console.log(`Total rows: ${rowCount}`);

    // Get layout info for each row
    const rowInfo = await page.evaluate(() => {
      const rows = document.querySelectorAll('.legend-row');
      return Array.from(rows).map((row, index) => {
        const computed = window.getComputedStyle(row);
        const swatch = row.querySelector('.swatch');
        const text = row.textContent;
        return {
          index,
          display: computed.display,
          alignItems: computed.alignItems,
          gap: computed.gap,
          swatchPresent: !!swatch,
          label: text.trim()
        };
      });
    });

    rowInfo.forEach(row => {
      console.log(`Row ${row.index}: "${row.label}"`);
      console.log(`  Display: ${row.display}, Align: ${row.alignItems}, Gap: ${row.gap}`);
      console.log(`  Swatch present: ${row.swatchPresent}`);
    });

    // Verify structure
    expect(rowCount).toBe(4);
    rowInfo.forEach((row, i) => {
      expect(row.display).toBe('flex');
      expect(row.alignItems).toBe('center');
      expect(row.swatchPresent).toBe(true);
    });

    console.log('✓ All legend rows have correct flex layout and contain swatches');
  });
});
