#!/usr/bin/env node
/**
 * Fetch Utah population census block data from ArcGIS
 * Save as static GeoJSON for serving without API calls
 * Run once, commit to repo, serve statically forever
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ARCGIS_URL = 'https://services1.arcgis.com/99lidPhWCzftIe9K/arcgis/rest/services/Blocks_PopDensity_5orMore_Albers_Equal_Area/FeatureServer/0/query';
const OUTPUT_FILE = path.join(__dirname, 'public/data/utah_population_blocks.geojson');

async function fetchAllPopulationData() {
  console.log('\n🌐 Fetching Utah Population Census Blocks');
  console.log('   (This is a one-time generation, takes 1-2 minutes)\n');

  const allFeatures = [];
  let offset = 0;
  const pageSize = 2000;
  let totalFetched = 0;

  try {
    while (true) {
      const params = new URLSearchParams({
        where: "STATEFP10='49'",  // Utah only
        outFields: '*',
        outSR: '4326',
        f: 'geojson',
        resultOffset: String(offset),
        resultRecordCount: String(pageSize)
      });

      console.log(`  Fetching records ${offset} to ${offset + pageSize}...`);

      const response = await fetch(`${ARCGIS_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.features || data.features.length === 0) {
        console.log(`  ✓ Reached end of data`);
        break;
      }

      allFeatures.push(...data.features);
      totalFetched += data.features.length;
      console.log(`  ✓ Fetched ${data.features.length} features (total: ${totalFetched})`);

      if (data.features.length < pageSize) {
        break;
      }

      offset += pageSize;

      // Be nice to the API - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n✓ Total features fetched: ${totalFetched}`);

    // Build the GeoJSON
    const geojson = {
      type: 'FeatureCollection',
      features: allFeatures
    };

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 2));
    console.log(`✓ Saved to: ${OUTPUT_FILE}`);

    // Calculate file size
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`✓ File size: ${sizeMB} MB\n`);

    console.log('📝 Next steps:');
    console.log('  1. git add public/data/utah_population_blocks.geojson');
    console.log('  2. git commit -m "Add cached population data"');
    console.log('  3. git push origin main');
    console.log('\n✅ Done! Population data is now served statically, no API calls needed.\n');

    return true;
  } catch (error) {
    console.error('❌ Error fetching data:', error.message);
    console.error('\nMake sure you have a network connection.');
    console.error('ArcGIS API might also have rate limiting - wait a few minutes and try again.\n');
    process.exit(1);
  }
}

// Run
fetchAllPopulationData();
