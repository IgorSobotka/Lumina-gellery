# ✦ Lumina Gallery

A beautiful photo gallery for Windows and macOS. Built with Electron + React.

## Requirements

- [Node.js](https://nodejs.org/) — version 18 or higher

## Installation & Running

```bash
# 1. Clone the project
git clone https://github.com/IgorSobotka/Lumina-gellery.git
cd Lumina-gellery

# 2. Install dependencies
npm install

# 3. Run the app
npm run dev
```

## Building

### Windows (.exe)
```bash
npm run package:win
```
Output: `release/windows/Lumina Gallery Setup 0.1.0.exe`

### macOS (.dmg)
```bash
npm run package:mac
```
Output: `release/macos/Lumina Gallery-0.1.0.dmg`

> Building for macOS requires a Mac or GitHub Actions (Actions → Build macOS → Run workflow)

## Features

- Browse folders with photos and videos
- Lightbox with editor (crop, brightness, contrast, saturation)
- Favorite folders and albums
- Trash bin with file restore
- Search and sorting
- Grid and list view
- Languages: Polish, English, Deutsch
