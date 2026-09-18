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

import crypto from "crypto";
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

/**
 * Stamp a digest of what we just wrote into the service worker's cache key.
 *
 * STATIC_CACHE holds the icons, and its name is built from that key, so an
 * unchanged key means an installed PWA keeps serving the icons it already has.
 * Doing this by hand failed twice, quietly, because nothing fails when you
 * forget — the build is green and the old icon simply persists on the phone.
 */
const swPath = path.join(__dirname, "..", "public", "sw.js");
const digest = crypto.createHash("sha256");
for (const file of fs.readdirSync(iconsDir).sort()) {
  digest.update(file);
  digest.update(fs.readFileSync(path.join(iconsDir, file)));
}
const iconsVersion = digest.digest("hex").slice(0, 16);

const sw = fs.readFileSync(swPath, "utf8");
const stamped = sw.replace(
  /const ICONS_VERSION = "[0-9a-f]*";/,
  `const ICONS_VERSION = "${iconsVersion}";`
);
if (stamped === sw && !sw.includes(`"${iconsVersion}"`)) {
  throw new Error("Could not stamp ICONS_VERSION into public/sw.js — has the constant been renamed?");
}
fs.writeFileSync(swPath, stamped);
console.log(`  sw.js ICONS_VERSION          ${iconsVersion}`);

/**
 * Publish the same digest as a module the app can import, and hang it off the
 * icon URLs.
 *
 * Our own service worker is only one of the caches in the way. iOS keys its
 * home screen icons by URL and will not re-fetch one it has already taken,
 * even after the app is deleted and re-added; Safari and any CDN in front of
 * the site hold their own copies. A digest in the query string makes every
 * one of them see a URL they have never fetched, which is the only lever that
 * reaches all three.
 */
const versionModule = `// Generated by scripts/generate-icons.mjs — do not edit.
//
// A digest of public/icons, hung off the icon URLs as a query string. iOS keys
// home screen icons by URL and will not re-fetch one it already holds, so a
// redrawn icon needs a URL that has never been requested before.
export const ICON_VERSION = "${iconsVersion}";
`;
const versionPath = path.join(__dirname, "..", "src", "lib", "icon-version.ts");
fs.writeFileSync(versionPath, versionModule);
console.log(`  src/lib/icon-version.ts      ${iconsVersion}`);

// The manifest is served as a static file, so its icon URLs are stamped here
// rather than at render time.
const manifestPath = path.join(__dirname, "..", "public", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.icons = manifest.icons.map((icon) => ({
  ...icon,
  src: `${icon.src.split("?")[0]}?v=${iconsVersion}`,
}));
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`  manifest.json icon urls      ?v=${iconsVersion}`);

console.log("Done.");
