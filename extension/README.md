# Oblique Angles - Chrome Extension

Capture text from any webpage and add it to your reservoir of ideas.

## Installation

1. **Convert icons**: Chrome requires PNG icons. Convert the SVGs in `icons/` to PNG:
   - `icon16.svg` → `icon16.png` (16x16)
   - `icon48.svg` → `icon48.png` (48x48)
   - `icon128.svg` → `icon128.png` (128x128)

   You can use any tool like Inkscape, ImageMagick, or an online converter.

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right corner)
   - Click "Load unpacked"
   - Select this folder (`extension/`)

3. **Configure API URL** (if not using localhost):
   - Click the extension icon
   - Change the API URL in settings
   - Click "save"

## Usage

1. Select any text on a webpage
2. Right-click → "Add to reservoir"
3. The badge will show ✓ (success) or ! (error)

## Requirements

- Oblique Angles API running (default at `http://localhost:8000`)
- API must have CORS configured to allow requests from the extension
