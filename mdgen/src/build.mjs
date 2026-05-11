import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import puppeteer from "puppeteer";

const execFileAsync = promisify(execFile);

const rootDir = path.resolve(import.meta.dirname, "..", "..");
const mdgenDir = path.resolve(rootDir, "mdgen");
const defaultDocDir = path.resolve(rootDir, "doc");
const templateDocx = path.resolve(rootDir, "template", "Thesisvorlage mit Titelbild1.0.docx");
const outputDir = path.resolve(mdgenDir, "output");
const cacheDir = path.resolve(mdgenDir, ".cache");
const templateAssetDir = path.resolve(cacheDir, "template-assets");

const defaultMeta = {
  title: "Titel der Thesis",
  subtitle: "Hier steht ein Untertitel",
  thesisType: "Master Thesis",
  degreeProgram: "[Studiengang einfügen]",
  author: "[Autor/en einfügen]",
  advisor: "[Betreuer einfügen]",
  client: "[Auftraggeber einfügen]",
  expert: "[Experte/n einfügen]",
  date: new Date().toISOString().slice(0, 10),
  abstractTitle: "Abstract",
  abstract: "",
  thesisLabel: "[Titel der Arbeit, Version, Datum (max. 1 Zeile)]"
};

async function main() {
  const options = parseArgs(process.argv.slice(2));

  await ensureDirectories();
  const templateAssets = await ensureTemplateAssets();

  const markdownFiles = await getMarkdownFiles(options.sourceDir);
  if (markdownFiles.length === 0) {
    throw new Error(`No markdown files found in ${options.sourceDir}`);
  }

  const allFiles = await Promise.all(markdownFiles.map(loadMarkdownFile));
  const files = filterFilesForTarget(allFiles, options.target);

  if (files.length === 0) {
    throw new Error(`No markdown files matched target "${options.target}" in ${options.sourceDir}`);
  }

  const meta = buildMetadata(files);
  const headings = [];
  const md = createMarkdownRenderer(headings);
  const contentHtml = files
    .map((file) => `<section class="chapter-block">${md.render(file.body, { sourcePath: file.path })}</section>`)
    .join("\n");

  const html = renderDocument({
    meta,
    headings,
    contentHtml,
    coverImageUrl: templateAssets.coverImage,
    footerLogoUrl: templateAssets.footerLogo
  });

  const htmlPath = path.resolve(outputDir, `thesis-${options.target}.html`);
  const pdfPath = path.resolve(outputDir, `thesis-${options.target}.pdf`);

  await fs.writeFile(htmlPath, html, "utf8");
  await renderPdf({ html, meta, pdfPath });

  console.log(`Generated ${pdfPath}`);
}

function parseArgs(argv) {
  let target = "real";
  let sourceDir = defaultDocDir;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--target" && argv[index + 1]) {
      target = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith("--target=")) {
      target = arg.split("=")[1];
      continue;
    }

    if (arg === "--source" && argv[index + 1]) {
      sourceDir = path.resolve(rootDir, argv[index + 1]);
      index += 1;
      continue;
    }

    if (arg.startsWith("--source=")) {
      sourceDir = path.resolve(rootDir, arg.split("=")[1]);
    }
  }

  return { target, sourceDir };
}

async function ensureDirectories() {
  await fs.mkdir(outputDir, { recursive: true });
  await fs.mkdir(templateAssetDir, { recursive: true });
}

async function ensureTemplateAssets() {
  const required = [
    { archivePath: "word/media/image1.png", filename: "image1.png" },
    { archivePath: "word/media/image3.jpg", filename: "image3.jpg" },
    { archivePath: "word/media/image4.jpeg", filename: "image4.jpeg" }
  ];

  for (const asset of required) {
    const targetPath = path.resolve(templateAssetDir, asset.filename);
    try {
      await fs.access(targetPath);
    } catch {
      await execFileAsync("unzip", ["-oj", templateDocx, asset.archivePath, "-d", templateAssetDir]);
    }
  }

  return {
    coverImage: await fileToDataUrl(path.resolve(templateAssetDir, "image1.png"), "image/png"),
    footerLogo: await fileToDataUrl(path.resolve(templateAssetDir, "image3.jpg"), "image/jpeg"),
    sampleImage: await fileToDataUrl(path.resolve(templateAssetDir, "image4.jpeg"), "image/jpeg")
  };
}

async function getMarkdownFiles(startDir) {
  const results = [];
  await walkDirectory(startDir, results);
  return results.sort((a, b) => a.localeCompare(b));
}

async function walkDirectory(currentDir, results) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.resolve(currentDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) {
        continue;
      }
      await walkDirectory(fullPath, results);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      results.push(fullPath);
    }
  }
}

async function loadMarkdownFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = matter(raw);
  return {
    path: filePath,
    meta: parsed.data ?? {},
    body: parsed.content.trim()
  };
}

function filterFilesForTarget(files, target) {
  if (target === "all") {
    return files;
  }

  return files.filter((file) => (file.meta.set ?? "real") === target);
}

function buildMetadata(files) {
  const merged = { ...defaultMeta };

  for (const file of files) {
    Object.assign(merged, file.meta);
  }

  return merged;
}

function createMarkdownRenderer(headings) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  });

  const originalImageRule = md.renderer.rules.image ?? ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
  const numberingState = [0, 0, 0, 0, 0, 0];

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = token.attrGet("src");
    if (src) {
      token.attrSet("src", resolveAssetUrl(src, env.sourcePath));
    }
    token.attrJoin("class", "figure-image");
    return originalImageRule(tokens, idx, options, env, self);
  };

  md.core.ruler.push("collect_headings", (state) => {
    for (let i = 0; i < state.tokens.length; i += 1) {
      const token = state.tokens[i];
      if (token.type !== "heading_open") {
        continue;
      }

      const inline = state.tokens[i + 1];
      if (!inline || inline.type !== "inline") {
        continue;
      }

      const level = Number.parseInt(token.tag.replace("h", ""), 10);
      if (level < 1 || level > 4) {
        continue;
      }

      numberingState[level - 1] += 1;
      for (let j = level; j < numberingState.length; j += 1) {
        numberingState[j] = 0;
      }

      const headingNumber = numberingState.slice(0, level).filter(Boolean).join(".");
      const text = inline.content.trim();
      const id = slugify(`${headingNumber}-${text}`);

      token.attrSet("id", id);
      token.attrSet("data-number", headingNumber);
      token.attrJoin("class", `heading-level-${level}`);

      headings.push({
        level,
        text,
        id,
        number: headingNumber
      });
    }
  });

  return md;
}

function renderDocument({ meta, headings, contentHtml, coverImageUrl, footerLogoUrl }) {
  const tocHtml = headings
    .filter((item) => item.level <= 3)
    .map((item) => {
      const tocClass = `toc-level-${item.level}`;
      return `<li class="${tocClass}"><a href="#${escapeHtml(item.id)}"><span class="toc-number">${escapeHtml(item.number)}</span><span class="toc-text">${escapeHtml(item.text)}</span><span class="toc-page-number">${escapeHtml(item.page ?? "4")}</span></a></li>`;
    })
    .join("\n");

  const abstractHtml = meta.abstract
    ? `<p>${escapeHtml(meta.abstract)}</p>`
    : `<p>Ersetze diesen Platzhalter mit der Zusammenfassung deiner Thesis.</p>`;

  return `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8">
    <title>${escapeHtml(meta.title)}</title>
    <style>
      :root {
        --brand-yellow: #fac300;
        --brand-yellow-border: #ffc000;
        --brand-blue: #64849b;
        --body-text: #111111;
        --gray-rule: #d0d0d0;
        --light-gray: #e6e6e6;
        --mid-gray: #a6a6a6;
      }

      @page {
        size: A4;
        margin: 36.8mm 17.7mm 20mm 25.3mm;
      }

      @page cover {
        margin: 0;
      }

      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
      }

      body {
        color: var(--body-text);
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9.5pt;
        line-height: 1.32;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      p, ul, ol, table, blockquote, pre {
        margin: 0 0 4.2mm;
      }

      .page-break {
        break-after: page;
      }

      .cover {
        page: cover;
        height: 297mm;
        overflow: hidden;
        position: relative;
      }

      .cover-band {
        height: 100.1mm;
        background: var(--brand-yellow);
        border-bottom: 2.5mm solid var(--brand-yellow-border);
        overflow: hidden;
      }

      .cover-band img {
        display: block;
        width: 100%;
        height: 100.1mm;
        object-fit: fill;
      }

      .cover-panel {
        margin-left: 25.3mm;
        width: 166.8mm;
        padding-top: 8.3mm;
      }

      .cover-title {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 24pt;
        line-height: 1.18;
        letter-spacing: 0;
        margin-bottom: 8.4mm;
      }

      .cover-subtitle {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14pt;
        line-height: 1.1;
        margin-bottom: 9mm;
      }

      .cover-type {
        color: var(--body-text);
        font-weight: 700;
        margin-bottom: 70.7mm;
      }

      .cover-meta {
        width: 143mm;
        border-collapse: collapse;
      }

      .cover-meta td {
        background: transparent;
        border: 0;
        padding: 1.15mm 0;
        vertical-align: top;
      }

      .cover-meta td:first-child {
        width: 81.5mm;
      }

      .frontmatter,
      .toc-page,
      .thesis-body {
        page: auto;
      }

      .frontmatter-title {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 16pt;
        font-weight: 400;
        line-height: 1.1;
        margin: 0 0 6.5mm;
      }

      .frontmatter-title::before {
        content: none;
        display: none;
      }

      .toc {
        margin-top: 0;
      }

      .toc ol {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      .toc li {
        border-bottom: 0.25mm solid var(--gray-rule);
        margin-bottom: 0;
      }

      .toc li + li {
        margin-top: 0;
      }

      .toc a {
        display: grid;
        grid-template-columns: 6mm 1fr 8mm;
        align-items: baseline;
        height: 4.57mm;
        line-height: 4.57mm;
        padding: 0;
        text-decoration: none;
        color: inherit;
      }

      .toc-number {
        min-width: 0;
      }

      .toc-level-2 .toc-number {
        min-width: 0;
      }

      .toc-level-3 .toc-number {
        min-width: 0;
      }

      .toc-page-number {
        text-align: right;
      }

      .toc-level-2 {
        padding-left: 6mm;
      }

      .toc-level-3 {
        padding-left: 10mm;
      }

      .chapter-block + .chapter-block {
        margin-top: 0;
      }

      h1, h2, h3, h4 {
        margin: 0 0 4mm;
        break-after: avoid;
      }

      h1 {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14pt;
        font-weight: 400;
        line-height: 1.2;
        margin-top: 1mm;
      }

      h2 {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 13pt;
        font-weight: 700;
        line-height: 1.2;
        margin-top: 8mm;
      }

      h3 {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 13pt;
        font-weight: 700;
        line-height: 1.2;
        margin-top: 8mm;
      }

      h4 {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 14pt;
        font-weight: 700;
        line-height: 1.2;
        margin-top: 8mm;
      }

      h1::before,
      h2::before,
      h3::before,
      h4::before {
        content: attr(data-number) " ";
      }

      h1::before {
        content: attr(data-number);
        display: inline-block;
        width: 6mm;
      }

      ul {
        padding-left: 7mm;
      }

      ol {
        padding-left: 6mm;
      }

      li {
        margin-bottom: 1.5mm;
      }

      .thesis-body table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .thesis-body th,
      .thesis-body td {
        border-right: 0.25mm solid #ffffff;
        border-bottom: 0.25mm solid #ffffff;
        padding: 1.8mm 2.6mm;
        text-align: left;
        vertical-align: top;
        background: var(--light-gray);
      }

      .thesis-body th {
        background: var(--mid-gray);
        font-weight: 700;
      }

      figure {
        margin: 6mm 0;
      }

      img {
        max-width: 100%;
        height: auto;
        display: block;
      }

      figcaption {
        margin-top: 2mm;
        font-size: 8pt;
      }

      blockquote {
        padding-left: 5mm;
        border-left: 0.8mm solid #c8c8c8;
        font-style: italic;
      }

      pre, code {
        font-family: Menlo, Consolas, monospace;
      }

      pre {
        white-space: pre-wrap;
        border: 0.25mm solid #d8d8d8;
        padding: 3mm;
      }

      a {
        color: inherit;
      }

      .cover-footer {
        position: absolute;
        left: 25.3mm;
        right: 17.7mm;
        bottom: 9.5mm;
        display: flex;
        align-items: flex-end;
        gap: 46.6mm;
      }

      .cover-footer img {
        width: 36.1mm;
        height: 20.65mm;
      }

      .cover-footer-department {
        color: #808080;
        font-size: 9.5pt;
        line-height: 1.1;
      }
    </style>
  </head>
  <body>
    <section class="cover page-break">
      <div class="cover-band">
        <img src="${coverImageUrl}" alt="">
      </div>
      <div class="cover-panel">
        <div class="cover-title">${escapeHtml(meta.title)}</div>
        <div class="cover-subtitle">${escapeHtml(meta.subtitle)}</div>
        <div class="cover-type">${escapeHtml(meta.thesisType)}</div>
        <table class="cover-meta">
          <tr><td>Studiengang:</td><td>${escapeHtml(meta.degreeProgram)}</td></tr>
          <tr><td>Autor*in:</td><td>${escapeHtml(meta.author)}</td></tr>
          <tr><td>Betreuer*in:</td><td>${escapeHtml(meta.advisor)}</td></tr>
          <tr><td>Auftraggeber*in:</td><td>${escapeHtml(meta.client)}</td></tr>
          <tr><td>Expert*in:</td><td>${escapeHtml(meta.expert)}</td></tr>
          <tr><td>Datum:</td><td>${escapeHtml(meta.date)}</td></tr>
        </table>
      </div>
      <div class="cover-footer">
        <img src="${footerLogoUrl}" alt="">
        <div class="cover-footer-department">Departement<br>Abteilung</div>
      </div>
    </section>

    <section class="frontmatter page-break">
      <h1 class="frontmatter-title">${escapeHtml(meta.abstractTitle)}</h1>
      ${abstractHtml}
    </section>

    <section class="toc-page page-break">
      <div class="toc">
        <h1 class="frontmatter-title">Inhalt</h1>
        <ol>${tocHtml}</ol>
      </div>
    </section>

    <main class="thesis-body">
      ${contentHtml}
    </main>
  </body>
</html>`;
}

async function renderPdf({ html, meta, pdfPath }) {
  const browser = await puppeteer.launch({
    headless: "shell",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.pdf({
      path: pdfPath,
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: {
        top: "0mm",
        right: "0mm",
        bottom: "0mm",
        left: "0mm"
      }
    });
  } finally {
    await browser.close();
  }

  await stampRunningFooter({ pdfPath, thesisLabel: meta.thesisLabel });
}

async function stampRunningFooter({ pdfPath, thesisLabel }) {
  const pdfBytes = await fs.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const footerColor = rgb(0x64 / 255, 0x84 / 255, 0x9b / 255);

  for (let index = 1; index < pages.length; index += 1) {
    const page = pages[index];
    const { width } = page.getSize();
    page.drawText(thesisLabel, {
      x: 72,
      y: 28,
      size: 8,
      font,
      color: footerColor
    });
    page.drawText(String(index + 1), {
      x: width - 55,
      y: 28,
      size: 8,
      font,
      color: rgb(0, 0, 0)
    });
  }

  await fs.writeFile(pdfPath, await pdfDoc.save());
}

function resolveAssetUrl(src, sourcePath) {
  if (/^(https?:|data:|file:)/i.test(src)) {
    return src;
  }

  return `file://${path.resolve(path.dirname(sourcePath), src)}`;
}

async function fileToDataUrl(filePath, mimeType) {
  const buffer = await fs.readFile(filePath);
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
