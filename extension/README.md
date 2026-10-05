# Oblique Angles — Chrome Extension

Capture text from any webpage into your epoche reservoir. No account: captures
wait in the extension until an epoche tab is open, then a small content script
(`bridge.js`) hands them to the page, which stores them in its localStorage.

## Installation

1. Open `chrome://extensions/`, enable **Developer mode**, click **Load unpacked**
   and select this folder.
2. For a deployed site, add its URL to `content_scripts.matches` in
   `manifest.json` and set `APP_URL` in `background.js`.

## Usage

1. Select text on any page → right-click → **Add to reservoir**
2. Open epoche (or click **open epoche** in the popup); waiting fragments arrive
   automatically and show up under *reservoir*.
