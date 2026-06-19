import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import mapshaper from "mapshaper";

const SRC = "public/ensemble_map_davao_City.json";
const raw = readFileSync(SRC, "utf-8");
const beforeHash = createHash("sha256").update(raw).digest("hex").slice(0, 8);

console.log("Input:  %s (%d MB, %d chars)", SRC, (Buffer.byteLength(raw) / 1024 / 1024).toFixed(1), raw.length);

console.time("pipeline");
const result = await mapshaper.applyCommands(
  "-i data.json -snap -clean -dissolve2 fields=DN -simplify dp 5% keep-shapes -o format=geojson",
  { "data.json": raw },
);
console.timeEnd("pipeline");

const output = result["data.json"];
const after = JSON.parse(output);
let coords = 0;
after.features.forEach((f) => { if (f.geometry?.coordinates) coords += JSON.stringify(f.geometry.coordinates).split(",").length; });
const afterHash = createHash("sha256").update(output).digest("hex").slice(0, 8);

console.log("Output: %s (%d features, %d coord-pairs, %d MB)", SRC, after.features.length, coords, (Buffer.byteLength(output) / 1024 / 1024).toFixed(1));
console.log("Hash:   %s → %s", beforeHash, afterHash);

writeFileSync(SRC, output, "utf-8");
console.log("Written back to %s", SRC);
