/**
 * Mobile App Icon Generator for Mindweave
 *
 * Generates app icons for Android and iOS from the Mindweave SVG icon.
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Usage:
 *   node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Android launcher icon sizes (dp -> px at each density)
const ANDROID_LAUNCHER_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Android adaptive icon foreground sizes (108dp at each density)
const ANDROID_FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// Android splash screen sizes (portrait)
const ANDROID_SPLASH_PORTRAIT = {
  'drawable-port-mdpi': { width: 320, height: 480 },
  'drawable-port-hdpi': { width: 480, height: 800 },
  'drawable-port-xhdpi': { width: 720, height: 1280 },
  'drawable-port-xxhdpi': { width: 960, height: 1600 },
  'drawable-port-xxxhdpi': { width: 1280, height: 1920 },
};

// Android splash screen sizes (landscape)
const ANDROID_SPLASH_LANDSCAPE = {
  'drawable-land-mdpi': { width: 480, height: 320 },
  'drawable-land-hdpi': { width: 800, height: 480 },
  'drawable-land-xhdpi': { width: 1280, height: 720 },
  'drawable-land-xxhdpi': { width: 1600, height: 960 },
  'drawable-land-xxxhdpi': { width: 1920, height: 1280 },
};

// Mindweave brand color
const BRAND_COLOR = { r: 99, g: 102, b: 241, alpha: 1 }; // #6366f1

async function generateIcons() {
  try {
    const sharp = require('sharp');

    // Path to the source SVG (from web app)
    const svgPath = path.join(__dirname, '../../web/public/icons/icon.svg');

    if (!fs.existsSync(svgPath)) {
      console.error('Error: Source SVG not found at', svgPath);
      process.exit(1);
    }

    const svgBuffer = fs.readFileSync(svgPath);

    console.log('Generating Mindweave mobile app icons...\n');

    // === ANDROID ICONS ===
    console.log('=== Android Icons ===\n');

    const androidResPath = path.join(__dirname, '../android/app/src/main/res');

    // Generate launcher icons
    console.log('Launcher icons (ic_launcher.png):');
    for (const [folder, size] of Object.entries(ANDROID_LAUNCHER_SIZES)) {
      const outputPath = path.join(androidResPath, folder, 'ic_launcher.png');
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`  ${folder}: ${size}x${size}`);
    }

    // Generate round launcher icons
    console.log('\nRound launcher icons (ic_launcher_round.png):');
    for (const [folder, size] of Object.entries(ANDROID_LAUNCHER_SIZES)) {
      const outputPath = path.join(androidResPath, folder, 'ic_launcher_round.png');
      // For round icons, we create a circular mask
      const circleBuffer = await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toBuffer();

      // Create circular mask
      const circleMask = Buffer.from(
        `<svg width="${size}" height="${size}">
          <circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/>
        </svg>`
      );

      await sharp(circleBuffer)
        .composite([{
          input: await sharp(circleMask).png().toBuffer(),
          blend: 'dest-in'
        }])
        .png()
        .toFile(outputPath);
      console.log(`  ${folder}: ${size}x${size}`);
    }

    // Generate adaptive icon foreground
    console.log('\nAdaptive icon foreground (ic_launcher_foreground.png):');
    for (const [folder, size] of Object.entries(ANDROID_FOREGROUND_SIZES)) {
      const outputPath = path.join(androidResPath, folder, 'ic_launcher_foreground.png');
      // The foreground should have the icon centered with padding for the safe zone
      // Safe zone is 66dp out of 108dp (about 61%), so icon should be ~66% of the size
      const iconSize = Math.floor(size * 0.66);
      const padding = Math.floor((size - iconSize) / 2);

      await sharp(svgBuffer)
        .resize(iconSize, iconSize)
        .extend({
          top: padding,
          bottom: size - iconSize - padding,
          left: padding,
          right: size - iconSize - padding,
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent
        })
        .png()
        .toFile(outputPath);
      console.log(`  ${folder}: ${size}x${size} (icon: ${iconSize}x${iconSize})`);
    }

    // Generate splash screens
    console.log('\nSplash screens (portrait):');
    for (const [folder, dims] of Object.entries(ANDROID_SPLASH_PORTRAIT)) {
      const outputPath = path.join(androidResPath, folder, 'splash.png');
      // Icon size: 25% of the smaller dimension
      const iconSize = Math.floor(Math.min(dims.width, dims.height) * 0.25);

      // Create splash with centered icon
      const iconBuffer = await sharp(svgBuffer)
        .resize(iconSize, iconSize)
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: dims.width,
          height: dims.height,
          channels: 4,
          background: BRAND_COLOR
        }
      })
        .composite([{
          input: iconBuffer,
          top: Math.floor((dims.height - iconSize) / 2),
          left: Math.floor((dims.width - iconSize) / 2)
        }])
        .png()
        .toFile(outputPath);
      console.log(`  ${folder}: ${dims.width}x${dims.height}`);
    }

    console.log('\nSplash screens (landscape):');
    for (const [folder, dims] of Object.entries(ANDROID_SPLASH_LANDSCAPE)) {
      const outputPath = path.join(androidResPath, folder, 'splash.png');
      const iconSize = Math.floor(Math.min(dims.width, dims.height) * 0.25);

      const iconBuffer = await sharp(svgBuffer)
        .resize(iconSize, iconSize)
        .png()
        .toBuffer();

      await sharp({
        create: {
          width: dims.width,
          height: dims.height,
          channels: 4,
          background: BRAND_COLOR
        }
      })
        .composite([{
          input: iconBuffer,
          top: Math.floor((dims.height - iconSize) / 2),
          left: Math.floor((dims.width - iconSize) / 2)
        }])
        .png()
        .toFile(outputPath);
      console.log(`  ${folder}: ${dims.width}x${dims.height}`);
    }

    // Generate drawable splash (default)
    const drawableSplashPath = path.join(androidResPath, 'drawable', 'splash.png');
    const defaultIconSize = 128;
    const defaultSplashSize = 512;

    const defaultIconBuffer = await sharp(svgBuffer)
      .resize(defaultIconSize, defaultIconSize)
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: defaultSplashSize,
        height: defaultSplashSize,
        channels: 4,
        background: BRAND_COLOR
      }
    })
      .composite([{
        input: defaultIconBuffer,
        top: Math.floor((defaultSplashSize - defaultIconSize) / 2),
        left: Math.floor((defaultSplashSize - defaultIconSize) / 2)
      }])
      .png()
      .toFile(drawableSplashPath);
    console.log(`\n  drawable/splash.png: ${defaultSplashSize}x${defaultSplashSize}`);

    // === iOS ICONS ===
    console.log('\n=== iOS Icons ===\n');

    const iosAssetsPath = path.join(__dirname, '../ios/App/App/Assets.xcassets');

    // Generate App Icon (1024x1024 for iOS)
    const iosIconPath = path.join(iosAssetsPath, 'AppIcon.appiconset', 'AppIcon-512@2x.png');
    await sharp(svgBuffer)
      .resize(1024, 1024)
      .png()
      .toFile(iosIconPath);
    console.log('App Icon: 1024x1024 (AppIcon-512@2x.png)');

    // Generate splash images for iOS (2732x2732 for iPad Pro)
    console.log('\nSplash screens:');
    const splashSize = 2732;
    const splashIconSize = Math.floor(splashSize * 0.15);

    const splashIconBuffer = await sharp(svgBuffer)
      .resize(splashIconSize, splashIconSize)
      .png()
      .toBuffer();

    const splashFiles = [
      'splash-2732x2732.png',
      'splash-2732x2732-1.png',
      'splash-2732x2732-2.png'
    ];

    for (const filename of splashFiles) {
      const splashPath = path.join(iosAssetsPath, 'Splash.imageset', filename);
      await sharp({
        create: {
          width: splashSize,
          height: splashSize,
          channels: 4,
          background: BRAND_COLOR
        }
      })
        .composite([{
          input: splashIconBuffer,
          top: Math.floor((splashSize - splashIconSize) / 2),
          left: Math.floor((splashSize - splashIconSize) / 2)
        }])
        .png()
        .toFile(splashPath);
      console.log(`  ${filename}: ${splashSize}x${splashSize}`);
    }

    console.log('\n✅ All icons generated successfully!\n');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('Error: sharp package not found.');
      console.error('Please install it first:');
      console.error('  cd apps/mobile && npm install sharp');
      process.exit(1);
    }
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
