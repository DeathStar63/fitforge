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
  ICON_STROKE,
  ICON_VIEWBOX,
  LOGO_BOX,
  lockupMarkup,
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
 * A near-black logo on a lime field rather than the inverse: a dark icon
 * disappears against a dark wallpaper, and the lime field is the same
 * gradient the in-app logo tile carries.
 *
 * Everything above a favicon carries the full lockup, lettering included. At a
 * 180px asset the "FORGE" caps land around 12.7pt on screen — ordinary text
 * size — so it reads on the home screen. `pad` is the fraction of the tile
 * left empty around it.
 *
 * `crop` swaps in the mark alone, framed so the corner fills the tile and the
 * arm bleeds off the right edge. That is for the 16 and 32px favicons, which
 * are drawn at their stated size and where the lettering is only texture.
 */
function iconSvg(size, { crop = false, pad = 0.06, stroke = 26 } = {}) {
  let inner;
  if (crop) {
    const [vx, vy, vw] = ICON_VIEWBOX.split(" ").map(Number);
    const k = size / vw;
    inner = `<g transform="translate(${(-vx * k).toFixed(2)} ${(-vy * k).toFixed(2)}) scale(${k.toFixed(5)})">`
      + markMarkup({ stroke: ICON_STROKE, ink: INK })
      + `</g>`;
  } else {
    const k = (size * (1 - pad * 2)) / LOGO_BOX.w;
    const ox = (size - LOGO_BOX.w * k) / 2;
    const oy = (size - LOGO_BOX.h * k) / 2;
    inner = `<g transform="translate(${ox.toFixed(2)} ${oy.toFixed(2)}) scale(${k.toFixed(5)})">`
      + lockupMarkup({ stroke, ink: INK })
      + `</g>`;
  }

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
  ${inner}
</svg>`;
}

/**
 * Render everything to memory first. Filenames carry a digest of the artwork,
 * so nothing can be written until every byte is known.
 */
async function render(size, opts) {
  return sharp(Buffer.from(iconSvg(size, opts)))
    .resize(size, size)
    .flatten({ background: LIME }) // opaque: iOS will not honour alpha
    .png({ compressionLevel: 9 })
    .toBuffer();
}

console.log("Generating icons…");

/** Logical name -> bytes. The digest goes between the stem and the extension. */
const assets = new Map();

// iOS home screen — full bleed, iOS masks its own corners
for (const s of [180, 167, 152, 120]) {
  assets.set(`apple-touch-icon-${s}.png`, await render(s, {}));
}

// PWA / Android
assets.set("icon-192.png", await render(192, {}));
assets.set("icon-512.png", await render(512, {}));

// Maskable: a wider margin, so the whole lockup sits inside the central safe
// circle that Android may crop a maskable icon down to
assets.set("icon-maskable-512.png", await render(512, { pad: 0.19 }));
assets.set("icon-maskable-192.png", await render(192, { pad: 0.19 }));

// Browser tabs are drawn at their stated size, where the lettering is only
// texture — so these carry the mark alone
assets.set("favicon-32.png", await render(32, { crop: true }));
assets.set("favicon-16.png", await render(16, { crop: true }));

assets.set("icon.svg", Buffer.from(iconSvg(512)));

/**
 * The digest of the artwork, and the reason it is in the filename rather than
 * a query string.
 *
 * Three caches sit between this directory and a phone's home screen: our own
 * service worker, Safari, and iOS's home screen icon store — and iOS keys that
 * store by URL, so it will not re-fetch an icon it already holds even after
 * the app is deleted and re-added. A query string is not reliably enough,
 * because a query string is not part of the resource's identity everywhere it
 * is handled. A distinct path is: nothing can collapse
 * `apple-touch-icon-180.<digest>.png` back onto the file it replaced.
 */
const digest = crypto.createHash("sha256");
for (const name of [...assets.keys()].sort()) {
  digest.update(name);
  digest.update(assets.get(name));
}
const iconsVersion = digest.digest("hex").slice(0, 16);

/** `icon-192.png` -> `icon-192.<digest>.png` */
const stamp = (name) => {
  const ext = path.extname(name);
  return `${name.slice(0, -ext.length)}.${iconsVersion}${ext}`;
};

// Anything left from a previous digest is dead weight that a cache could still
// be holding a reference to, so clear the directory before writing.
for (const stale of fs.readdirSync(iconsDir)) {
  fs.unlinkSync(path.join(iconsDir, stale));
}
for (const [name, bytes] of assets) {
  fs.writeFileSync(path.join(iconsDir, stamp(name)), bytes);
  console.log(`  ${stamp(name)}`);
}

/**
 * Stamp the digest into the service worker's cache key.
 *
 * STATIC_CACHE holds the icons, and its name is built from that key, so an
 * unchanged key means an installed PWA keeps serving the icons it already has.
 * Doing this by hand failed twice, quietly, because nothing fails when you
 * forget — the build is green and the old icon simply persists on the phone.
 */
const swPath = path.join(__dirname, "..", "public", "sw.js");
const sw = fs.readFileSync(swPath, "utf8");
const stamped = sw.replace(
  /const ICONS_VERSION = "[0-9a-f]*";/,
  `const ICONS_VERSION = "${iconsVersion}";`
);
if (stamped === sw && !sw.includes(`"${iconsVersion}"`)) {
  throw new Error("Could not stamp ICONS_VERSION into public/sw.js — has the constant been renamed?");
}
fs.writeFileSync(swPath, stamped);
console.log(`\n  sw.js ICONS_VERSION          ${iconsVersion}`);

// Publish the digest as a module, so the metadata in layout.tsx builds the
// same filenames without repeating the scheme.
const versionPath = path.join(__dirname, "..", "src", "lib", "icon-version.ts");
fs.writeFileSync(
  versionPath,
  `// Generated by scripts/generate-icons.mjs — do not edit.
//
// A digest of the icon artwork. It is part of every icon's filename, because
// iOS keys home screen icons by URL and will not re-fetch one it already
// holds — so redrawn artwork has to arrive at a path nobody has requested.
export const ICON_VERSION = "${iconsVersion}";
`
);
console.log(`  src/lib/icon-version.ts      ${iconsVersion}`);

// The manifest is a static file, so its icon URLs are stamped here rather than
// at render time.
const manifestPath = path.join(__dirname, "..", "public", "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
manifest.icons = manifest.icons.map((icon) => {
  const bare = path.basename(icon.src.split("?")[0]).replace(/\.[0-9a-f]{16}\./, ".");
  return { ...icon, src: `/icons/${stamp(bare)}` };
});
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`  manifest.json icon urls      stamped`);

console.log("Done.");
