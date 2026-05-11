import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.env.MDGEN_WORKSPACE
  ? path.resolve(process.env.MDGEN_WORKSPACE)
  : path.resolve(import.meta.dirname, "..", "..");
const outputDir = path.resolve(rootDir, "mdgen", "output");

await fs.mkdir(outputDir, { recursive: true });
const entries = await fs.readdir(outputDir);

await Promise.all(
  entries.map((entry) => fs.rm(path.resolve(outputDir, entry), { recursive: true, force: true }))
);

console.log(`Cleaned ${outputDir}`);
