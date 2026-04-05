#!/usr/bin/env node
/**
 * Fetch Utah district boundaries from SGID ArcGIS FeatureServices
 * and generate GeoJSON files for the map application
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SGID_BASE = 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services';
const OUTPUT_DIR = path.join(__dirname, 'public/data');

// District layer configurations
const layers = {
  utah_boundary: {
    name: 'Utah State Boundary',
    url: `${SGID_BASE}/Boundaries_State/FeatureServer/0`,
    where: "1=1",
    outfile: 'utah_boundary.geojson'
  },
  utah_house_2022: {
    name: 'Utah State House Districts 2022-2032',
    url: `${SGID_BASE}/Political_StateHouse2022/FeatureServer/0`,
    where: "1=1",
    outfile: 'utah_house_2022.geojson'
  },
  utah_senate_2022: {
    name: 'Utah State Senate Districts 2022-2032',
    url: `${SGID_BASE}/Political_StateSenate2022/FeatureServer/0`,
    where: "1=1",
    outfile: 'utah_senate_2022.geojson'
  },
  utah_congress_2022: {
    name: 'US Congressional Districts 2022',
    url: `${SGID_BASE}/Political_USHouse2022/FeatureServer/0`,
    where: "STATE='UT'",
    outfile: 'utah_congress_2022.geojson'
  },
  utah_congress_2026: {
    name: 'US Congressional Districts 2026-2032',
    url: `${SGID_BASE}/Political_USHouse2026/FeatureServer/0`,
    where: "STATE='UT'",
    outfile: 'utah_congress_2026.geojson'
  },
  utah_counties: {
    name: 'Utah County Boundaries',
    url: `${SGID_BASE}/CensusCounties2020/FeatureServer/0`,
    where: "STATEFP20='49'",
    outfile: 'utah_counties.geojson'
  }
};

async function fetchFeatures(serviceUrl, where) {
  console.log(`  Fetching from ${serviceUrl}...`);

  const features = [];
  let offset = 0;
  const pageSize = 2000;

  while (true) {
    const params = new URLSearchParams({
      where,
      outFields: '*',
      outSR: '4326',
      f: 'geojson',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize)
    });

    try {
      const response = await fetch(`${serviceUrl}/query?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        break;
      }

      features.push(...data.features);
      console.log(`    ...fetched ${offset + data.features.length} features`);

      if (data.features.length < pageSize) {
        break;
      }

      offset += pageSize;
    } catch (error) {
      console.error(`  ✗ Error fetching from ${serviceUrl}:`, error.message);
      throw error;
    }
  }

  return features;
}

async function downloadLayer(layerKey, config) {
  console.log(`\n📍 Downloading: ${config.name}`);

  try {
    const features = await fetchFeatures(config.url, config.where);
    console.log(`  ✓ Retrieved ${features.length} features`);

    const geojson = {
      type: 'FeatureCollection',
      features: features
    };

    const outputPath = path.join(OUTPUT_DIR, config.outfile);
    fs.writeFileSync(outputPath, JSON.stringify(geojson, null, 2));
    console.log(`  ✓ Saved to ${config.outfile}`);

    // Validate bounds
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    let coordCount = 0;

    const extractCoords = (coords) => {
      if (typeof coords[0] === 'number') {
        const [lng, lat] = coords;
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        coordCount++;
      } else {
        coords.forEach(extractCoords);
      }
    };

    features.forEach(f => {
      if (f.geometry && f.geometry.coordinates) {
        extractCoords(f.geometry.coordinates);
      }
    });

    console.log(`  Bounds: Lat ${minLat.toFixed(2)}–${maxLat.toFixed(2)}, Lng ${minLng.toFixed(2)}–${maxLng.toFixed(2)}`);

    // Check if coordinates are roughly in Utah/USA bounds
    if (minLat < -60 || maxLat > 85 || minLng < -180 || maxLng > 180) {
      console.warn(`  ⚠️  WARNING: Coordinates seem out of normal bounds`);
    }

    if (minLat > 25 && maxLat < 50 && minLng > -130 && maxLng < -95) {
      console.log(`  ✓ Coordinates appear to be in North America`);
    }

    return true;
  } catch (error) {
    console.error(`  ✗ Failed to download ${layerKey}:`, error.message);
    return false;
  }
}

async function main() {
  console.log(`\n🌐 Utah Political Layers - District Data Downloader`);
  console.log(`================================================\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created output directory: ${OUTPUT_DIR}\n`);
  }

  let successCount = 0;
  let failCount = 0;

  console.log(`Source: Utah SGID ArcGIS FeatureServices`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  for (const [key, config] of Object.entries(layers)) {
    const success = await downloadLayer(key, config);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }

  console.log(`\n================================================`);
  console.log(`Summary: ${successCount} successful, ${failCount} failed`);

  if (failCount === 0) {
    console.log(`✅ All district data downloaded successfully!`);
    console.log(`\nYou can now run:`);
    console.log(`  cd public && python3 -m http.server 8080`);
    console.log(`  Then open http://localhost:8080 in your browser\n`);
  } else {
    console.log(`⚠️  Some downloads failed. Check the errors above.\n`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
