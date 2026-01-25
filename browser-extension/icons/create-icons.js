const fs = require('fs');

// Try to use canvas, fallback to placeholder
try {
  const { createCanvas } = require('canvas');

  function createIcon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
    ctx.fill();

    // Letter "M"
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', size/2, size/2 + size * 0.05);

    // Save
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`Created ${filename}`);
  }

  createIcon(16, 'icon16.png');
  createIcon(48, 'icon48.png');
  createIcon(128, 'icon128.png');
  console.log('Icons created successfully!');
} catch (error) {
  console.log('Canvas not available, creating minimal PNG placeholders...');

  // Minimal valid PNG (1x1 purple pixel, will be scaled by browser)
  // This is a minimal valid PNG file
  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xD8, 0xD0, 0xF2, 0x00,
    0x00, 0x01, 0x2D, 0x00, 0xA9, 0xD5, 0xC9, 0x15,
    0x22, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  fs.writeFileSync('icon16.png', minimalPNG);
  fs.writeFileSync('icon48.png', minimalPNG);
  fs.writeFileSync('icon128.png', minimalPNG);
  console.log('Placeholder icons created. Replace with proper icons for production.');
}
