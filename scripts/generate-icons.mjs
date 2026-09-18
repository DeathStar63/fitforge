/**
 * Generates every app icon from the logo geometry in src/lib/logo.ts, so the
 * icons and the in-app lockup can never drift apart.
 *
 * Run: npm run icons   (needs Node >= 22.18 — it imports the .ts module
 *                       directly and relies on Node's type stripping)
 *
 * What gets produced and why:
 *   apple-touch-icon-{180,167,152,120}.png  iOS home screen. Full-bleed and
 *       fully opaque — iOS ignores transparency and composites onto black, and
 *       it applies its own squircle mask, so the artwork runs to the edges.
 *   icon-{192,512}.png                  PWA / Android, purpose "any".
 *   icon-maskable-{192,512}.png         purpose "maskable". Android crops to
 *       arbitrary shapes, so these use the pulled-back framing that keeps the
 *       whole box inside the central safe circle.
 *   favicon-{32,16}.png + icon.svg      browser tabs.
 */

import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  ICON_MASKABLE_VIEWBOX,
  ICON_STROKE,
  ICON_VIEWBOX,
  markMarkup,
} from "../src/lib/logo.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(iconsDir, { recursive: true });

const INK = "#0B0B10";
const LIME_LIGHT = "#E9FF72";
const LIME = "#DCF64F";
const LIME_DEEP = "#BFE22C";

/**
 * A near-black mark on a lime field rather than the inverse: a dark icon
 * disappears against a dark wallpaper, and the lime field is the same
 * gradient the in-app logo tile carries.
 *
 * `maskable` swaps in the wider framing. `stroke` is in mark units; the
 * smallest icons take a heavier line so the box still reads at 16px.
 */
function iconSvg(size, { maskable = false, stroke = ICON_STROKE } = {}) {
  const viewBox = maskable ? ICON_MASKABLE_VIEWBOX : ICON_VIEWBOX;
  const [vx, vy, vw] = viewBox.split(" ").map(Number);
  const s = size / vw;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="lime" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0%" stop-color="${LIME_LIGHT}"/>
      <stop offset="50%" stop-color="${LIME}"/>
      <stop offset="100%" stop-color="${LIME_DEEP}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="1" r="0.9">
      <stop offset="0%" stop-color="${LIME_DEEP}" stop-opacity="0.5"/>
      <stop offset="60%" stop-color="${LIME_DEEP}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${LIME_DEEP}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#lime)"/>
  <circle cx="${size / 2}" cy="${size * 1.02}" r="${size * 0.75}" fill="url(#glow)"/>
  <g transform="translate(${(-vx * s).toFixed(2)} ${(-vy * s).toFixed(2)}) scale(${s.toFixed(5)})">
    ${markMarkup({ stroke, ink: INK })}
  </g>
</svg>`;
}

async function png(size, opts, file) {
  await sharp(Buffer.from(iconSvg(size, opts)))
    .resize(size, size)
    .flatten({ background: LIME }) // opaque: iOS will not honour alpha
    .png({ compressionLevel: 9 })
    .toFile(path.join(iconsDir, file));
  console.log(`  ${file.padEnd(28)} ${size}x${size}`);
}

console.log("Generating icons…");

// iOS home screen — full bleed, iOS masks its own corners
for (const s of [180, 167, 152, 120]) {
  await png(s, {}, `apple-touch-icon-${s}.png`);
}

// PWA / Android
await png(192, {}, "icon-192.png");
await png(512, {}, "icon-512.png");

// Maskable: pulled back so a circular crop keeps the whole box
await png(512, { maskable: true }, "icon-maskable-512.png");
await png(192, { maskable: true }, "icon-maskable-192.png");

// Browser tabs — a couple of dozen pixels, so the heaviest line
await png(32, { stroke: 44 }, "favicon-32.png");
await png(16, { stroke: 56 }, "favicon-16.png");

fs.writeFileSync(path.join(iconsDir, "icon.svg"), iconSvg(512));
console.log("  icon.svg                     vector master");
console.log("Done.");
