# Archive

This directory contains archived platform builds that are no longer actively developed.
The primary deployment target is now the **web application**.

## Archived

### `desktop/`
The Electron desktop app (Windows/Mac) has been archived in favor of the web-first approach.
It remains here for reference and can be restored if desktop distribution is needed in the future.

**To restore:**
```bash
mv archive/desktop desktop
cd desktop && npm install
npm run dev:desktop
```

**Build artifacts (if needed):**
- Windows: `npm run build:win`
- Mac: `npm run build:mac`
