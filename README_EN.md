# Drop Image Saver

<div align="center">
 <a href="README.md">中文</a> | <a href="README_EN.md">English</a>
</div>

A user-friendly Chrome browser extension for quickly saving images from web pages.

## Features

- 🖱️ **Drag & Drop**: Save images by directly dragging them to the floating window
- 📦 **Batch Download**: Support selecting and downloading multiple images at once
- 🔍 **Smart Filtering**:
  - Filter by image type (jpg, png, gif, webp, etc.)
  - Filter by image dimension range
- ✨ **Convenient Operations**:
  - Support select all/deselect all
  - Support downloading selected images only
  - Automatically pack multiple images into zip for download

## Installation

1. Download all files from this project
2. Open Chrome browser and go to the extensions page (chrome://extensions/)
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked extension"
5. Select the project folder

## Usage Guide

### Single Image Save

1. Find the image you want to save on the webpage
2. Drag the image directly
3. Drop it into the semi-transparent prompt box to download

### Batch Download Images

1. Click the extension icon in the browser toolbar
2. You'll see all images from the current page in the popup window
3. Filter images using these methods:
   - Click image type tags (e.g., jpg, png, etc.)
   - Drag width/height range sliders
4. Select images to download:
   - Click the checkbox in front of each image for individual selection
   - Use the "Select All" button to select all images in current filtered results
5. Click "Download Selected" or "Download All" button to proceed
   - Single image will be downloaded directly
   - Multiple images will be automatically packed into a zip file

## Technical Implementation

- Using Chrome Extension Manifest V3
- Core features:
  - Implemented drag and drop operations with native JavaScript
  - Using JSZip for multi-file packaging
  - Using Chrome Downloads API for file download handling

## Development Notes

### Project Structure

```
- manifest.json     // Extension configuration file
- content.js        // Main functionality code injected into pages
- background.js     // Background service for handling downloads
- jszip.min.js      // ZIP packaging library
- icon48.png        // Extension icon
- icon128.png       // Extension icon
```

### Permission Details

- `downloads`: For handling file downloads
- `activeTab`: For accessing current tab
- `scripting`: For executing content scripts

## Notes

- Some websites may restrict image drag operations
- Dynamically loaded images may need to finish loading before appearing in the list
- It's recommended to use batch download for multiple images to avoid frequent single downloads

## Screenshots

![screenshots](screenshots/screenshot-20250223-150955.jpeg)

## License

MIT License