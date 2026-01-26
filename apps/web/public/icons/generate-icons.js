/**
 * PWA Icon Generator for Mindweave
 *
 * This script generates PNG icons from the icon.svg source file.
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Usage:
 *   node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    // Try to use sharp for SVG to PNG conversion
    const sharp = require('sharp');
    const svgPath = path.join(__dirname, 'icon.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    console.log('Generating PWA icons...');

    for (const size of sizes) {
      const outputPath = path.join(__dirname, `icon-${size}.png`);
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  Created: icon-${size}.png`);
    }

    // Generate maskable icons (with extra padding)
    for (const size of [192, 512]) {
      const outputPath = path.join(__dirname, `maskable-${size}.png`);
      // Maskable icons need safe zone (80% of icon size)
      const safeSize = Math.floor(size * 0.8);
      const padding = Math.floor((size - safeSize) / 2);

      await sharp(svgBuffer)
        .resize(safeSize, safeSize)
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: { r: 99, g: 102, b: 241, alpha: 1 } // #6366f1
        })
        .png()
        .toFile(outputPath);
      console.log(`  Created: maskable-${size}.png`);
    }

    // Generate apple-touch-icon (180x180)
    const appleTouchIconPath = path.join(__dirname, 'apple-touch-icon.png');
    await sharp(svgBuffer)
      .resize(180, 180)
      .png()
      .toFile(appleTouchIconPath);
    console.log('  Created: apple-touch-icon.png');

    console.log('\\nAll icons generated successfully!');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: sharp package not found.');
      console.error('Please install it first:');
      console.error('  npm install sharp');
      console.error('\\nAlternatively, use an online SVG to PNG converter with icon.svg');
      process.exit(1);
    }
    throw error;
  }
}

generateIcons();
