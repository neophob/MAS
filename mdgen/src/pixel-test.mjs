import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const rootDir = process.env.MDGEN_WORKSPACE
  ? path.resolve(process.env.MDGEN_WORKSPACE)
  : path.resolve(import.meta.dirname, "..", "..");
const mdgenDir = path.resolve(rootDir, "mdgen");
const outputDir = path.resolve(mdgenDir, "output");
const compareDir = path.resolve(mdgenDir, "output", "compare");
const reportJsonPath = path.resolve(outputDir, "pixel-report.json");
const reportMarkdownPath = path.resolve(outputDir, "pixel-report.md");
const templatePdf = path.resolve(rootDir, "template", "Thesisvorlage mit Titelbild1.0.pdf");
const generatedPdfs = {
  real: path.resolve(mdgenDir, "output", "thesis-real.pdf")
};
const threshold = Number.parseFloat(process.env.PIXEL_THRESHOLD ?? "0.95");
const rasterDpi = 144;
const pointsToPixels = rasterDpi / 72;

const pageChecks = [
  { name: "cover", generatedSet: "real", templatePage: 1, generatedPage: 1, threshold: 0.93 },
  { name: "toc", generatedSet: "real", templatePage: 3, generatedPage: 3 }
];

const cropChecks = [
  {
    name: "table",
    generatedSet: "real",
    anchorText: "Tabellenkopf",
    crop: {
      leftPadPt: 8,
      topPadPt: 5,
      widthPx: 960,
      heightPx: 196
    },
    normalize: "posterize-3",
    threshold: 0.94
  },
  {
    name: "heading-2-1",
    generatedSet: "real",
    anchorText: "2.1",
    templatePageNumber: 5,
    generatedPageNumber: 4,
    crop: {
      leftPadPt: 2,
      topPadPt: 4,
      widthPx: 180,
      heightPx: 34
    },
    normalize: "binary-dilate-2"
  },
  {
    name: "cover-date-footer",
    generatedSet: "real",
    anchorText: "Datum:",
    templatePageNumber: 1,
    generatedPageNumber: 1,
    crop: {
      leftPadPt: 4,
      topPadPt: 4,
      widthPx: 760,
      heightPx: 244
    },
    normalize: "posterize-3"
  },
  {
    name: "figures-index-format",
    generatedSet: "real",
    anchorText: "Abbildungsverzeichnis",
    templatePageNumber: 9,
    generatedPageNumber: 5,
    crop: {
      leftPadPt: 4,
      topPadPt: 9,
      widthPx: 1050,
      heightPx: 150
    },
    normalize: "posterize-3",
    threshold: 0.93
  },
  {
    name: "tables-index-format",
    generatedSet: "real",
    anchorText: "Tabellenverzeichnis",
    templatePageNumber: 9,
    generatedPageNumber: 5,
    crop: {
      leftPadPt: 4,
      topPadPt: 9,
      widthPx: 1050,
      heightPx: 150
    },
    normalize: "posterize-3",
    threshold: 0.93
  }
];

const baseTextChecks = [
  {
    name: "toc-backmatter-entries",
    pattern: /Inhalt[\s\S]*^Abbildungsverzeichnis\s+\d+[\s\S]*^Tabellenverzeichnis\s+\d+[\s\S]*^Glossar\s+\d+[\s\S]*^Literaturverzeichnis\s+\d+[\s\S]*^Anhang\s+\d+[\s\S]*^Selbständigkeitserklärung\s+\d+/m
  },
  {
    name: "cover-advisor-single-line",
    pattern: /^Betreuer\*in:\s+Daniel Dini, Head of Security Architecture & Engineer$/m
  },
  {
    name: "generated-figures-list",
    pattern: /(?:^|\f)Abbildungsverzeichnis[\s\S]*(?:^|\f|\n)Abbildung 1: Et ut aut isti repuditis qui ium\s+\d+/m
  },
  {
    name: "generated-tables-list",
    pattern: /^Tabellenverzeichnis[\s\S]*^Tabelle 1: Et ut aut isti repuditis qui ium\s+\d+/m
  },
  {
    name: "backmatter-sections",
    pattern: /(?:^|\f)Glossar[\s\S]*(?:^|\f)Literaturverzeichnis[\s\S]*(?:^|\f)Anhang/m
  },
  {
    name: "self-declaration-section",
    pattern: /(?:^|\f)Selbständigkeitserklärung[\s\S]*Ich bestätige/m
  }
];

async function main() {
  await assertTool("pdftoppm");
  await assertTool("pdftotext");
  await assertTool("pdffonts");
  await assertTool("compare");
  await assertTool("identify");
  await assertTool("magick");
  await fs.mkdir(compareDir, { recursive: true });

  await assertGeneratedFonts(generatedPdfs.real);

  const pdfSets = {
    template: { pdf: templatePdf, dir: path.resolve(compareDir, "template") },
    real: { pdf: generatedPdfs.real, dir: path.resolve(compareDir, "real") }
  };

  for (const set of Object.values(pdfSets)) {
    await fs.rm(set.dir, { recursive: true, force: true });
    await fs.mkdir(set.dir, { recursive: true });
    await execFileAsync("pdftoppm", ["-png", "-r", String(rasterDpi), set.pdf, path.resolve(set.dir, "page")]);
    set.pages = await rasterPages(set.dir);
  }

  const results = [];

  for (const page of pageChecks) {
    const templateImage = imageForPage(pdfSets.template, page.templatePage);
    const generatedImage = imageForPage(pdfSets[page.generatedSet], page.generatedPage);
    const diffImage = path.resolve(compareDir, `pixel-${page.name}-diff.png`);
    const result = await compareImages({ templateImage, generatedImage, diffImage });
    results.push({ ...page, ...result, diffImage });
  }

  for (const crop of cropChecks) {
    const result = await compareAnchoredCrop({
      check: crop,
      templateSet: pdfSets.template,
      generatedSet: pdfSets[crop.generatedSet]
    });
    results.push(result);
  }

  const textChecks = await createTextChecks();
  const textResults = await compareTextChecks(generatedPdfs.real, textChecks);
  let failed = false;

  for (const result of results) {
    const requiredThreshold = result.threshold ?? threshold;
    result.requiredThreshold = requiredThreshold;
    result.passed = result.matchRatio >= requiredThreshold;
    const percent = (result.matchRatio * 100).toFixed(2);
    console.log(`${result.name}: ${percent}% match (${result.differentPixels}/${result.totalPixels} different)`);
    console.log(`diff: ${path.relative(rootDir, result.diffImage)}`);

    if (!result.passed) {
      failed = true;
    }
  }

  for (const result of textResults) {
    console.log(`${result.name}: ${result.passed ? "PASS" : "FAIL"} text check`);

    if (!result.passed) {
      failed = true;
    }
  }

  await writePixelReport({ results, textResults, failed });

  if (failed) {
    throw new Error(`Pixel test failed. Required ${(threshold * 100).toFixed(2)}% match.`);
  }
}

async function writePixelReport({ results, textResults, failed }) {
  const generatedAt = reportTimestamp();
  const environment = await collectEnvironment();
  const report = {
    status: failed ? "failed" : "passed",
    generatedAt,
    environment,
    threshold,
    results: results.map((result) => ({
      name: result.name,
      matchRatio: result.matchRatio,
      requiredThreshold: result.requiredThreshold,
      passed: result.passed,
      differentPixels: result.differentPixels,
      totalPixels: result.totalPixels,
      diffPath: path.relative(outputDir, result.diffImage)
    })),
    textResults
  };

  const lines = [
    "# mdgen Pixel Report",
    "",
    `Status: **${report.status.toUpperCase()}**`,
    `Generated: \`${generatedAt}\``,
    "",
    "Environment:",
    "",
    `- Platform: \`${environment.platform}\``,
    `- Node: \`${environment.node}\``,
    `- Chromium: \`${environment.chromium}\``,
    `- Poppler: \`${environment.poppler}\``,
    `- ImageMagick: \`${environment.imagemagick}\``,
    "",
    "| Check | Match | Required | Different pixels | Diff |",
    "| --- | ---: | ---: | ---: | --- |",
    ...report.results.map((result) => {
      const match = `${(result.matchRatio * 100).toFixed(2)}%`;
      const required = `${(result.requiredThreshold * 100).toFixed(2)}%`;
      const diff = `[${result.diffPath}](${result.diffPath})`;
      const status = result.passed ? "PASS" : "FAIL";
      return `| ${result.name} (${status}) | ${match} | ${required} | ${result.differentPixels}/${result.totalPixels} | ${diff} |`;
    }),
    "",
    "Text checks:",
    "",
    "| Check | Status |",
    "| --- | --- |",
    ...report.textResults.map((result) => `| ${result.name} | ${result.passed ? "PASS" : "FAIL"} |`),
    "",
    "Generated PDFs:",
    "",
    "- `thesis-real.pdf`"
  ];

  await fs.writeFile(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  await fs.writeFile(reportMarkdownPath, `${lines.join("\n")}\n`, "utf8");
}

async function compareTextChecks(pdfPath, checks) {
  const { stdout } = await execFileAsync("pdftotext", ["-layout", pdfPath, "-"]);
  return checks.map((check) => ({
    name: check.name,
    passed: check.pattern.test(stdout)
  }));
}

async function createTextChecks() {
  const gitHash = await readCurrentGitHash();
  const generatedDate = formatIsoDate(new Date());
  return [
    ...baseTextChecks,
    {
      name: "footer-build-metadata",
      pattern: new RegExp(`Minimierung von Software-Supply-Chain-Risiken[\\s\\S]*${escapeRegExp(gitHash)}[\\s\\S]*${escapeRegExp(generatedDate)}`)
    }
  ];
}

function reportTimestamp() {
  const epoch = Number.parseInt(process.env.SOURCE_DATE_EPOCH ?? "", 10);

  if (Number.isFinite(epoch)) {
    return new Date(epoch * 1000).toISOString();
  }

  return new Date().toISOString();
}

async function readCurrentGitHash() {
  try {
    const gitDir = await resolveGitDir(rootDir);
    if (!gitDir) {
      return "unknown";
    }

    const head = (await fs.readFile(path.resolve(gitDir, "HEAD"), "utf8")).trim();
    if (/^[a-f0-9]{7,40}$/i.test(head)) {
      return head.slice(0, 7);
    }

    const ref = head.match(/^ref:\s+(.+)$/)?.[1];
    if (!ref) {
      return "unknown";
    }

    const refPath = path.resolve(gitDir, ref);
    try {
      return (await fs.readFile(refPath, "utf8")).trim().slice(0, 7);
    } catch {
      return await readPackedGitRef(gitDir, ref);
    }
  } catch {
    return "unknown";
  }
}

async function resolveGitDir(repoDir) {
  const dotGit = path.resolve(repoDir, ".git");
  const stat = await fs.stat(dotGit).catch(() => undefined);
  if (!stat) {
    return undefined;
  }

  if (stat.isDirectory()) {
    return dotGit;
  }

  const content = await fs.readFile(dotGit, "utf8");
  const gitDir = content.match(/^gitdir:\s*(.+)$/m)?.[1]?.trim();
  if (!gitDir) {
    return undefined;
  }

  return path.resolve(repoDir, gitDir);
}

async function readPackedGitRef(gitDir, ref) {
  const packedRefs = await fs.readFile(path.resolve(gitDir, "packed-refs"), "utf8");
  const line = packedRefs
    .split(/\r?\n/)
    .find((entry) => entry.endsWith(` ${ref}`));
  return line?.split(" ")[0]?.slice(0, 7) ?? "unknown";
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function collectEnvironment() {
  const [platform, node, chromium, poppler, imagemagick] = await Promise.all([
    commandOutput("uname", ["-m"]),
    commandOutput("node", ["--version"]),
    commandOutput("chromium", ["--version"]),
    commandVersionStderr("pdftoppm", ["-v"]),
    commandOutput("magick", ["-version"])
  ]);

  return {
    platform,
    node,
    chromium,
    poppler: poppler.split(/\r?\n/)[0],
    imagemagick: imagemagick.split(/\r?\n/)[0]
  };
}

async function commandOutput(command, args) {
  const { stdout } = await execFileAsync(command, args);
  return stdout.trim();
}

async function commandVersionStderr(command, args) {
  const { stderr, stdout } = await execFileAsync(command, args);
  return (stderr || stdout).trim();
}

async function assertTool(command) {
  const args = command.startsWith("pdf") ? ["-v"] : ["-version"];

  try {
    await execFileAsync(command, args);
  } catch {
    throw new Error(`Missing required tool "${command}". Run "npm run test:pixel" to execute the test inside the mdgen pixel-test container.`);
  }
}

async function assertGeneratedFonts(pdfPath) {
  const { stdout } = await execFileAsync("pdffonts", [pdfPath]);

  for (const fontName of ["LucidaSans", "LucidaSans-Demi"]) {
    if (!stdout.includes(fontName)) {
      throw new Error(`Missing generated font "${fontName}" in ${path.relative(rootDir, pdfPath)}`);
    }
  }

  if (/\bHelvetica\b/.test(stdout)) {
    throw new Error(`Unexpected Helvetica fallback in ${path.relative(rootDir, pdfPath)}`);
  }
}

async function rasterPages(dir) {
  const entries = await fs.readdir(dir);
  const pages = new Map();

  for (const entry of entries) {
    const match = entry.match(/^page-(\d+)\.png$/);
    if (!match) {
      continue;
    }

    pages.set(Number.parseInt(match[1], 10), path.resolve(dir, entry));
  }

  return pages;
}

function imageForPage(set, pageNumber) {
  const image = set.pages.get(pageNumber);

  if (!image) {
    throw new Error(`Missing rasterized page ${pageNumber} for ${set.pdf}`);
  }

  return image;
}

async function compareAnchoredCrop({ check, templateSet, generatedSet }) {
  const templateAnchor = await locateWord(templateSet.pdf, check.templateAnchorText ?? check.anchorText, `template-${check.name}`, check.templatePageNumber);
  const generatedAnchor = await locateWord(generatedSet.pdf, check.generatedAnchorText ?? check.anchorText, `${check.generatedSet}-${check.name}`, check.generatedPageNumber);
  const templateImage = imageForPage(templateSet, templateAnchor.pageNumber);
  const generatedImage = imageForPage(generatedSet, generatedAnchor.pageNumber);
  const templateCrop = path.resolve(compareDir, `pixel-${check.name}-template-crop.png`);
  const generatedCrop = path.resolve(compareDir, `pixel-${check.name}-generated-crop.png`);
  const templateCompare = check.normalize ? path.resolve(compareDir, `pixel-${check.name}-template-normalized.png`) : templateCrop;
  const generatedCompare = check.normalize ? path.resolve(compareDir, `pixel-${check.name}-generated-normalized.png`) : generatedCrop;
  const diffImage = path.resolve(compareDir, `pixel-${check.name}-diff.png`);

  await cropImageAroundAnchor({ image: templateImage, anchor: templateAnchor, crop: check.crop, output: templateCrop });
  await cropImageAroundAnchor({ image: generatedImage, anchor: generatedAnchor, crop: check.crop, output: generatedCrop });

  if (check.normalize) {
    await normalizeImage({ input: templateCrop, output: templateCompare, mode: check.normalize });
    await normalizeImage({ input: generatedCrop, output: generatedCompare, mode: check.normalize });
  }

  const result = await compareImages({ templateImage: templateCompare, generatedImage: generatedCompare, diffImage });
  return { ...check, ...result, diffImage };
}

async function locateWord(pdfPath, text, label, targetPageNumber) {
  const bboxPath = path.resolve(compareDir, `${label}-bbox.html`);
  await execFileAsync("pdftotext", ["-bbox-layout", pdfPath, bboxPath]);
  const html = await fs.readFile(bboxPath, "utf8");
  let pageNumber = 0;

  for (const line of html.split(/\r?\n/)) {
    if (line.includes("<page ")) {
      pageNumber += 1;
      continue;
    }

    if (!line.includes("<word ")) {
      continue;
    }

    if (targetPageNumber && pageNumber !== targetPageNumber) {
      continue;
    }

    const word = textContent(line);
    if (word !== text) {
      continue;
    }

    return {
      pageNumber,
      xMin: numberAttribute(line, "xMin"),
      yMin: numberAttribute(line, "yMin"),
      xMax: numberAttribute(line, "xMax"),
      yMax: numberAttribute(line, "yMax")
    };
  }

  throw new Error(`Could not locate "${text}" in ${pdfPath}`);
}

function textContent(line) {
  return line.replace(/^.*?>/, "").replace(/<\/word>.*$/, "").replaceAll("&amp;", "&");
}

function numberAttribute(line, name) {
  const match = line.match(new RegExp(`${name}="([^"]+)"`));

  if (!match) {
    throw new Error(`Missing ${name} in bbox line: ${line}`);
  }

  return Number.parseFloat(match[1]);
}

async function cropImageAroundAnchor({ image, anchor, crop, output }) {
  const x = Math.max(0, Math.round((anchor.xMin - crop.leftPadPt) * pointsToPixels));
  const y = Math.max(0, Math.round((anchor.yMin - crop.topPadPt) * pointsToPixels));
  const cropArg = `${crop.widthPx}x${crop.heightPx}+${x}+${y}`;
  await execFileAsync("magick", [image, "-crop", cropArg, "+repage", output]);
}

async function normalizeImage({ input, output, mode }) {
  if (mode === "posterize-3") {
    await execFileAsync("magick", [input, "-colorspace", "Gray", "-posterize", "3", output]);
    return;
  }

  if (mode === "binary-dilate-2") {
    await execFileAsync("magick", [input, "-colorspace", "Gray", "-threshold", "80%", "-morphology", "Dilate", "Disk:2", output]);
    return;
  }

  throw new Error(`Unknown normalization mode: ${mode}`);
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
