#!/usr/bin/env node
/**
 * Rebuilds content/photos.json from the pictures in public/photos/.
 *
 *   npm run photos
 *
 * - Photos already in the list keep their caption, position and order.
 * - Photos that were deleted from the folder disappear from the list.
 * - New photos are added at the end (sorted by name) with a caption made from the file name:
 *     "03 Na motorce přes Alpy.jpg"  ->  "Na motorce přes Alpy"
 * - Order on the page = order in photos.json; reorder it by hand if you like.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, parse } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const folder = join(root, "public", "photos");
const listFile = join(root, "content", "photos.json");
const extensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"]);

function captionFrom(fileName) {
  return parse(fileName)
    .name.replace(/^[\d\s._-]+/, "")
    .replace(/_+/g, " ")
    .trim();
}

const files = readdirSync(folder, { withFileTypes: true })
  .filter((entry) => entry.isFile() && extensions.has(extname(entry.name).toLowerCase()))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

let previous = [];
if (existsSync(listFile)) {
  try {
    previous = JSON.parse(readFileSync(listFile, "utf8").replace(/^﻿/, ""));
  } catch (error) {
    console.warn(`! ${listFile} could not be read (${error.message}) – starting fresh`);
  }
}

const kept = previous.filter((entry) => entry && files.includes(entry.file));
const known = new Set(kept.map((entry) => entry.file));
const added = files
  .filter((file) => !known.has(file))
  .map((file) => ({
    file,
    caption: captionFrom(file),
  }));
const result = [...kept, ...added];

writeFileSync(listFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`photos.json: ${result.length} photos (${added.length} new, ${previous.length - kept.length} removed)`);
for (const entry of added) {
  console.log(`  + ${entry.file}  ->  "${entry.caption}"`);
}
