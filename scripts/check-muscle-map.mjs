/**
 * Static consistency check for the body map.
 *
 * The muscle taxonomy is spread over five structures in lib/muscles.ts that
 * have to agree with one another, and a mismatch fails silently at runtime —
 * a muscle declared visible on a view but missing its path simply never draws,
 * and a missing anchor means its name callout never appears. This catches that
 * without a browser.
 *
 * Run: npm run check:muscles
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const musclesSrc = fs.readFileSync(path.join(root, "src/lib/muscles.ts"), "utf8");
const librarySrc = fs.readFileSync(path.join(root, "src/lib/exerciseLibrary.ts"), "utf8");

/** Pull a top-level literal out of the TypeScript source and evaluate it. */
function literal(source, name, open) {
  const declared = source.indexOf(`export const ${name}`);
  if (declared === -1) throw new Error(`${name} not found`);
  const start = source.indexOf(open, source.indexOf("=", declared));
  let depth = 0;
  let end = start;
  for (; end < source.length; end++) {
    const c = source[end];
    if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) break;
    }
  }
  const body = source.slice(start, end + 1).replace(/\/\/[^\n]*/g, "");
  return eval(`(${body})`);
}

const front = literal(musclesSrc, "FRONT_REGIONS", "{");
const back = literal(musclesSrc, "BACK_REGIONS", "{");
const anchors = literal(musclesSrc, "LABEL_ANCHORS", "{");
const paintOrder = literal(musclesSrc, "PAINT_ORDER", "[");

const groups = [
  ...musclesSrc.matchAll(
    /\{ id: "([a-z-]+)", label: "([^"]+)", short: "[^"]+", views: \[([^\]]+)\]/g
  ),
].map((m) => ({
  id: m[1],
  label: m[2],
  views: m[3].replace(/["\s]/g, "").split(","),
}));

const problems = [];
const regionsFor = { front, back };

for (const group of groups) {
  for (const view of ["front", "back"]) {
    const declared = group.views.includes(view);
    const drawn = Boolean(regionsFor[view][group.id]);
    if (declared && !drawn) {
      problems.push(`${group.id}: declared visible on ${view} but has no path there`);
    }
    if (!declared && drawn) {
      problems.push(`${group.id}: has a ${view} path but is not declared visible on ${view}`);
    }
    if (drawn && !anchors[view][group.id]) {
      problems.push(`${group.id}: drawn on ${view} but has no label anchor`);
    }
  }
  if (!paintOrder.includes(group.id)) {
    problems.push(`${group.id}: missing from PAINT_ORDER, so it never draws`);
  }
}

for (const view of ["front", "back"]) {
  for (const id of Object.keys(anchors[view])) {
    if (!regionsFor[view][id]) {
      problems.push(`${id}: has a ${view} anchor but nothing is drawn there`);
    }
  }
}

const known = new Set(groups.map((g) => g.id));
for (const id of paintOrder) {
  if (!known.has(id)) problems.push(`PAINT_ORDER lists "${id}", which is not a muscle group`);
}

// Every muscle should have at least one exercise that trains it directly,
// otherwise the suggestion engine can recommend it with nothing to offer.
const tagged = new Set();
for (const m of librarySrc.matchAll(/primary: \[([^\]]*)\]/g)) {
  for (const t of m[1].matchAll(/"([a-z-]+)"/g)) tagged.add(t[1]);
}
for (const group of groups) {
  if (!tagged.has(group.id)) {
    problems.push(`${group.id}: no exercise lists it as a primary muscle`);
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} problem(s) in the body map:\n`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `✓ body map consistent: ${groups.length} muscle groups, ` +
    `${Object.keys(front).length} drawn on the front, ${Object.keys(back).length} on the back, ` +
    `every one with an anchor, a paint-order slot and at least one direct exercise`
);
