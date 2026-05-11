import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const rootDir = path.resolve(import.meta.dirname, "..", "..");
const mdgenDir = path.resolve(rootDir, "mdgen");
const compareDir = path.resolve(mdgenDir, "output", "compare");
const templatePdf = path.resolve(rootDir, "template", "Thesisvorlage mit Titelbild1.0.pdf");
const generatedPdf = path.resolve(mdgenDir, "output", "thesis-real.pdf");
const threshold = Number.parseFloat(process.env.PIXEL_THRESHOLD ?? "0.95");

const pageChecks = [
  { name: "cover", template: "page-01.png", generated: "page-1.png" },
  { name: "toc", template: "page-03.png", generated: "page-3.png" },
  { name: "chapter", template: "page-04.png", generated: "page-4.png" }
];

async function main() {
  await assertTool("pdftoppm");
  await assertTool("compare");
  await assertTool("identify");
  await fs.mkdir(compareDir, { recursive: true });

  const templateDir = path.resolve(compareDir, "template");
  const generatedDir = path.resolve(compareDir, "real");

  await fs.rm(templateDir, { recursive: true, force: true });
  await fs.rm(generatedDir, { recursive: true, force: true });
  await fs.mkdir(templateDir, { recursive: true });
  await fs.mkdir(generatedDir, { recursive: true });

  await execFileAsync("pdftoppm", ["-png", "-r", "144", templatePdf, path.resolve(templateDir, "page")]);
  await execFileAsync("pdftoppm", ["-png", "-r", "144", generatedPdf, path.resolve(generatedDir, "page")]);

  const results = [];

  for (const page of pageChecks) {
    const templateImage = path.resolve(templateDir, page.template);
    const generatedImage = path.resolve(generatedDir, page.generated);
    const diffImage = path.resolve(compareDir, `pixel-${page.name}-diff.png`);
    const result = await compareImages({ templateImage, generatedImage, diffImage });
    results.push({ ...page, ...result, diffImage });
  }

  let failed = false;

  for (const result of results) {
    const percent = (result.matchRatio * 100).toFixed(2);
    console.log(`${result.name}: ${percent}% match (${result.differentPixels}/${result.totalPixels} different)`);
    console.log(`diff: ${path.relative(rootDir, result.diffImage)}`);

    if (result.matchRatio < threshold) {
      failed = true;
    }
  }

  if (failed) {
    throw new Error(`Pixel test failed. Required ${(threshold * 100).toFixed(2)}% match.`);
  }
}

async function assertTool(command) {
  const args = command === "pdftoppm" ? ["-v"] : ["-version"];

  try {
    await execFileAsync(command, args);
  } catch {
    throw new Error(`Missing required tool "${command}". Run via: nix-shell -p poppler-utils imagemagick --run 'npm run test:pixel'`);
  }
}

async function compareImages({ templateImage, generatedImage, diffImage }) {
  const { width, height } = await imageSize(templateImage);
  const generatedSize = await imageSize(generatedImage);

  if (width !== generatedSize.width || height !== generatedSize.height) {
    throw new Error(`Image size mismatch: ${templateImage} is ${width}x${height}, ${generatedImage} is ${generatedSize.width}x${generatedSize.height}`);
  }

  let stderr = "";

  try {
    await execFileAsync("compare", ["-metric", "AE", templateImage, generatedImage, diffImage]);
  } catch (error) {
    stderr = error.stderr ?? "";
  }

  const differentPixels = Number.parseInt(stderr.trim().split(/\s+/)[0] ?? "0", 10);

  if (Number.isNaN(differentPixels)) {
    throw new Error(`Could not parse ImageMagick compare output: ${stderr}`);
  }

  const totalPixels = width * height;
  return {
    differentPixels,
    totalPixels,
    matchRatio: 1 - differentPixels / totalPixels
  };
}

async function imageSize(imagePath) {
  const { stdout } = await execFileAsync("identify", ["-format", "%w %h", imagePath]);
  const [width, height] = stdout.trim().split(/\s+/).map((value) => Number.parseInt(value, 10));
  return { width, height };
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
