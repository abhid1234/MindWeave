/**
 * Play Store Feature Graphic Generator for Mindweave
 *
 * Creates a 1024x500 feature graphic with an indigo gradient background,
 * Mindweave icon, and text overlay for the Google Play Store listing.
 *
 * Prerequisites:
 *   npm install sharp (already in devDependencies)
 *
 * Usage:
 *   node scripts/generate-feature-graphic.js
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../store-assets');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'feature-graphic.png');

const WIDTH = 1024;
const HEIGHT = 500;

async function generateFeatureGraphic() {
  try {
    const sharp = require('sharp');

    // Read the Mindweave SVG icon
    const svgPath = path.join(__dirname, '../../web/public/icons/icon.svg');

    if (!fs.existsSync(svgPath)) {
      console.error('Error: Source SVG not found at', svgPath);
      process.exit(1);
    }

    const iconSvg = fs.readFileSync(svgPath);

    // Ensure output directory exists
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    console.log('Generating Play Store feature graphic...');
    console.log(`  Size: ${WIDTH}x${HEIGHT}`);
    console.log(`  Output: ${OUTPUT_PATH}`);

    // Resize the icon to fit nicely in the graphic
    const iconSize = 160;
    const iconBuffer = await sharp(iconSvg)
      .resize(iconSize, iconSize)
      .png()
      .toBuffer();

    // Create SVG overlay with gradient background and text
    const overlaySvg = Buffer.from(`
      <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4338ca"/>
            <stop offset="50%" style="stop-color:#6366f1"/>
            <stop offset="100%" style="stop-color:#818cf8"/>
          </linearGradient>
        </defs>
        <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
        <text x="${WIDTH / 2 + 100}" y="${HEIGHT / 2 - 20}"
              font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="bold"
              fill="white" text-anchor="middle" dominant-baseline="middle">
          Mindweave
        </text>
        <text x="${WIDTH / 2 + 100}" y="${HEIGHT / 2 + 40}"
              font-family="Arial, Helvetica, sans-serif" font-size="24"
              fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">
          Your AI-Powered Knowledge Hub
        </text>
      </svg>
    `);

    // Compose: gradient background (from SVG) + icon + text
    await sharp(overlaySvg)
      .resize(WIDTH, HEIGHT)
      .composite([
        {
          input: iconBuffer,
          top: Math.floor((HEIGHT - iconSize) / 2),
          left: Math.floor(WIDTH / 2 - 280),
        },
      ])
      .png()
      .toFile(OUTPUT_PATH);

    console.log('');
    console.log('Feature graphic generated successfully!');
    console.log('Upload to Google Play Console → Store listing → Feature graphic');
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: sharp package not found.');
      console.error('Install it: cd apps/mobile && npm install');
      process.exit(1);
    }
    console.error('Error generating feature graphic:', error);
    process.exit(1);
  }
}

generateFeatureGraphic();
