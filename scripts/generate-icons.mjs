import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');

async function generateIcon(size, outputPath) {
  // Create SVG with the "F" letter centered
  // Font size scales proportionally: 90px at 192 -> ~240px at 512
  const fontSize = Math.round((size / 192) * 90);
  const textY = Math.round((size / 192) * 118);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0F0F17"/>
  <text x="${size / 2}" y="${textY}" font-family="Arial Black, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="#EFEFEF" text-anchor="middle">F</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(outputPath);

  console.log(`Generated ${outputPath} (${size}x${size})`);
}

await generateIcon(192, path.join(iconsDir, 'icon-192.png'));
await generateIcon(512, path.join(iconsDir, 'icon-512.png'));
console.log('Done!');
