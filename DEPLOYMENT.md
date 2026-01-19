# Deployment Options

You have two ways to share your Utah Political Layers map:

## Option 1: Standalone HTML File (No Hosting Required) ✅

**File:** `utah-political-layers-standalone.html` (15 MB)

### Features:
- ✅ **Works completely offline**
- ✅ **Single file** - share via email, Dropbox, Google Drive, etc.
- ✅ **Zero setup** - just open in a browser
- ✅ **All data embedded** - no external dependencies (except Leaflet/esri-leaflet CDN)

### How to Use:
1. **Share the file:** Send `utah-political-layers-standalone.html` to anyone
2. **Open it:** Double-click to open in any modern browser
3. **That's it!** The map works immediately with all features

### Rebuilding:
If you update the data or code, rebuild the standalone file:
```bash
node build-standalone.js
```

---

## Option 2: GitHub Pages (Free Hosted Version) 🌐

### Setup Instructions:

#### Step 1: Enable GitHub Pages
1. Go to your repository: https://github.com/kpkpkp/utah-political-layers
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Build and deployment":
   - **Source:** Deploy from a branch
   - **Branch:** `main`
   - **Folder:** `/` (root)
4. Click **Save**

Note: GitHub will serve your site from the root, and you'll access it at the `/public` path.

#### Step 2: Wait for Deployment
- GitHub will automatically build and deploy your site
- This takes 1-2 minutes
- You'll see a green checkmark when ready

#### Step 3: Access Your Site
Your map will be live at:
```
https://kpkpkp.github.io/utah-political-layers/
```

### Automatic Updates:
- Every time you `git push` to main, GitHub Pages automatically updates
- Changes appear within 1-2 minutes
- No manual deployment needed!

### Custom Domain (Optional):
You can use a custom domain (e.g., `utah-map.yourdomain.com`):
1. Go to Settings → Pages
2. Enter your custom domain
3. Follow GitHub's instructions to configure DNS

---

## Comparison

| Feature | Standalone HTML | GitHub Pages |
|---------|----------------|--------------|
| **Hosting** | None needed | Free GitHub hosting |
| **Sharing** | Send file directly | Share URL |
| **File Size** | 15 MB | N/A (hosted) |
| **Updates** | Rebuild + reshare | Automatic on push |
| **Offline** | ✅ Yes | ❌ No |
| **Easy sharing** | ⚠️ Large file | ✅ Just a link |
| **Setup** | None | 2 minutes |

---

## Recommendations

### Use Standalone HTML if:
- ✅ You want to share with people who need offline access
- ✅ You're presenting on a computer without internet
- ✅ You want to email/attach the map directly
- ✅ You want maximum portability

### Use GitHub Pages if:
- ✅ You want a permanent hosted link
- ✅ You'll be updating the map frequently
- ✅ You want to share with many people easily
- ✅ You want automatic deployments
- ✅ You want to embed the map in other websites

### Use Both! (Recommended)
- Host on GitHub Pages for easy sharing
- Keep standalone file for offline presentations and backups

---

## Testing

### Test Standalone File:
```bash
# Just open it in your browser
open utah-political-layers-standalone.html
# or on Windows:
start utah-political-layers-standalone.html
```

### Test GitHub Pages:
Once deployed, visit:
```
https://kpkpkp.github.io/utah-political-layers/
```

---

## Troubleshooting

### Standalone File

**Problem:** File won't open or shows errors
**Solution:**
- Use a modern browser (Chrome, Firefox, Safari, Edge)
- Clear browser cache with Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Check that the file downloaded completely (should be ~15 MB)

**Problem:** File is too large to email
**Solution:**
- Use Google Drive, Dropbox, or WeTransfer
- Or compress it to ZIP (reduces to ~8-10 MB)
- Or use GitHub Pages instead

### GitHub Pages

**Problem:** 404 error
**Solution:**
- Verify you selected `/public` folder in settings
- Make sure `.nojekyll` file exists in public folder
- Wait 2 minutes after enabling Pages
- Check deployment status in Actions tab

**Problem:** Map not loading
**Solution:**
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Check browser console for errors (F12)
- Verify all files are pushed to GitHub

---

## Files Included

```
utah-political-layers/
├── public/                          # GitHub Pages serves from here
│   ├── index.html                   # Main map page
│   ├── app.js                       # Application code
│   ├── styles.css                   # Styles
│   ├── .nojekyll                    # Prevents Jekyll processing
│   └── data/                        # GeoJSON data files
│       ├── utah_boundary.geojson
│       ├── utah_house_2022.geojson
│       ├── utah_senate_2022.geojson
│       ├── utah_congress_2022.geojson
│       ├── utah_congress_2026.geojson
│       └── utah_parties.json
├── utah-political-layers-standalone.html  # Standalone version
└── build-standalone.js              # Build script for standalone
```
