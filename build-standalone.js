#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';

console.log('Building standalone HTML file...\n');

// Read all necessary files
const indexHtml = readFileSync('public/index.html', 'utf-8');
const stylesCSS = readFileSync('public/styles.css', 'utf-8');
const appJs = readFileSync('public/app.js', 'utf-8');
const utahBoundary = readFileSync('public/data/utah_boundary.geojson', 'utf-8');
const utahHouse = readFileSync('public/data/utah_house_2022.geojson', 'utf-8');
const utahSenate = readFileSync('public/data/utah_senate_2022.geojson', 'utf-8');
const utahCongressCurrent = readFileSync('public/data/utah_congress_2022.geojson', 'utf-8');
const utahCongressFuture = readFileSync('public/data/utah_congress_2026.geojson', 'utf-8');
const utahParties = readFileSync('public/data/utah_parties.json', 'utf-8');
const utahCounties = readFileSync('public/data/utah_counties.geojson', 'utf-8');
const burrnClerkData = readFileSync('public/data/burrn_county_clerks.json', 'utf-8');

console.log('✓ Read all source files');
console.log(`  - utah_boundary.geojson: ${(utahBoundary.length / 1024).toFixed(1)} KB`);
console.log(`  - utah_house_2022.geojson: ${(utahHouse.length / 1024).toFixed(1)} KB`);
console.log(`  - utah_senate_2022.geojson: ${(utahSenate.length / 1024).toFixed(1)} KB`);
console.log(`  - utah_congress_2022.geojson: ${(utahCongressCurrent.length / 1024).toFixed(1)} KB`);
console.log(`  - utah_congress_2026.geojson: ${(utahCongressFuture.length / 1024).toFixed(1)} KB`);
console.log(`  - utah_parties.json: ${(utahParties.length / 1024).toFixed(1)} KB`);
console.log(`  - utah_counties.geojson: ${(utahCounties.length / 1024).toFixed(1)} KB`);
console.log(`  - burrn_county_clerks.json: ${(burrnClerkData.length / 1024).toFixed(1)} KB\n`);

// Modify app.js to use embedded data instead of fetch calls
let modifiedAppJs = appJs;

// Replace loadJson function to use embedded data
modifiedAppJs = modifiedAppJs.replace(
  /const loadJson = async \(url\) => \{[\s\S]*?\};/,
  `const loadJson = async (url) => {
  // Use embedded data instead of fetching
  const dataMap = {
    'data/utah_boundary.geojson': EMBEDDED_DATA.boundary,
    'data/utah_house_2022.geojson': EMBEDDED_DATA.house,
    'data/utah_senate_2022.geojson': EMBEDDED_DATA.senate,
    'data/utah_congress_2022.geojson': EMBEDDED_DATA.congressCurrent,
    'data/utah_congress_2026.geojson': EMBEDDED_DATA.congressFuture,
    'data/utah_parties.json': EMBEDDED_DATA.parties,
    'data/utah_counties.geojson': EMBEDDED_DATA.counties,
    'data/burrn_county_clerks.json': EMBEDDED_DATA.burrnClerkData
  };
  return dataMap[url] || null;
};`
);

console.log('✓ Modified app.js to use embedded data\n');

// Build the embedded data script
const embeddedDataScript = `
  <script>
// Embedded GeoJSON and JSON data
const EMBEDDED_DATA = {
  boundary: ${utahBoundary},
  house: ${utahHouse},
  senate: ${utahSenate},
  congressCurrent: ${utahCongressCurrent},
  congressFuture: ${utahCongressFuture},
  parties: ${utahParties},
  counties: ${utahCounties},
  burrnClerkData: ${burrnClerkData}
};
console.log('✓ Embedded data loaded');
  </script>`;

// Build the application code script
const applicationCodeScript = `
  <script>
${modifiedAppJs}
  </script>`;

// Build the final HTML by modifying index.html
let finalHtml = indexHtml;

// Replace external CSS with inline CSS
finalHtml = finalHtml.replace(
  /<link rel="stylesheet" href="styles\.css" \/>/,
  `<style>\n${stylesCSS}\n  </style>`
);

// Replace the app.js script tag with embedded data + application code
finalHtml = finalHtml.replace(
  /<script src="app\.js\?v=[^"]+"><\/script>/,
  `${embeddedDataScript}\n${applicationCodeScript}`
);

// Write the output file
writeFileSync('utah-political-layers-standalone.html', finalHtml, 'utf-8');

const finalSize = finalHtml.length;
console.log('✓ Built standalone HTML file\n');
console.log(`Output file: utah-political-layers-standalone.html`);
console.log(`File size: ${(finalSize / 1024 / 1024).toFixed(2)} MB\n`);
console.log('✅ Done! You can now share this single HTML file.');
console.log('   It works offline and has zero dependencies except CDN libraries.\n');
