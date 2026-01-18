# How to See the Population Layer

## Step 1: Hard Refresh Your Browser

The code has been updated, but your browser is caching the old version.

**Do a hard refresh:**
- **Chrome/Edge:** Press `Ctrl + Shift + R` or `Ctrl + F5`
- **Firefox:** Press `Ctrl + Shift + R`

This will force your browser to reload the JavaScript file with the fixes.

## Step 2: Enable Required Layers

For the population dots to be visible, you need:

1. ✅ **Map tiles** - Check this box (so you can see the map background)
2. ✅ **Population** - Check this box

## Step 3: Wait for Loading

After enabling Population:
- Look for a new section that appears: **"Population: loading..."**
- Wait ~30-60 seconds for it to say **"Population: ready (44,069)"**
- The status text should appear below the layer checkboxes

## Step 4: Zoom In

The population dots are small at the full Utah view. For best results:
- Zoom in to Salt Lake City, Provo, or Ogden
- You'll see thousands of red dots representing population density

## If You Still Don't See Anything

1. Open browser console (F12)
2. Look for any errors
3. Check the Network tab - you should see requests to `arcgis.com`
4. Take a screenshot of the console and share it

---

## What Was Fixed

Two bugs were fixed in `public/app.js`:

1. **Line 177 & 654:** Changed `where: "1=1"` to `where: "STATEFP10='49'"`
   - This filters to only Utah data (state code 49)
   - Without this, the API was returning Arizona data!

2. **Line 574 & 655:** Changed `OBJECTID` to `FID`
   - Fixed the field name to match the API's actual field

The population layer now loads 44,069 Utah census blocks with population density data.
