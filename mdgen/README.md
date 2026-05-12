# mdgen

mdgen requires Node.js 24 or newer. The repository includes `.node-version` files and package engine checks; CI also installs Node 24 before running the Docker-based pixel test.

Generate the real report:

```bash
npm run build
```

Run lint checks for JavaScript syntax, shell syntax, and direct dependency consistency:

```bash
npm run lint
```

Run the pixel comparison against `template/Thesisvorlage mit Titelbild1.0.pdf`:

```bash
npm run test:pixel
```

Build only the reusable pixel-test image:

```bash
npm run pixel:image
```

`npm run test:pixel` builds and runs `mdgen/Dockerfile.pixel`. The host only needs Docker; Poppler, ImageMagick, Chromium, Node, and npm dependencies are provided by the container image. The default platform is `linux/amd64` so local runs match GitHub Actions rendering; override it with `MDGEN_PIXEL_PLATFORM` only if needed. GitHub Actions runs the same `npm run test:pixel` command from the `mdgen` directory.

The pixel-test image is rebuilt with `--pull --no-cache` by default so local runs do not accidentally reuse an older Chromium/Poppler layer than GitHub Actions. For faster local iteration you can set `MDGEN_PIXEL_USE_CACHE=1`, but then exact CI/local percentage parity is not guaranteed.

The container run also fixes `TZ=UTC`, `LANG=C.UTF-8`, `LC_ALL=C.UTF-8`, and `SOURCE_DATE_EPOCH=1747008000` by default, which is `2025-05-12T00:00:00Z`. Override the timestamp only via `MDGEN_SOURCE_DATE_EPOCH` if you intentionally want a different deterministic report timestamp. The running footer is not sourced from `SOURCE_DATE_EPOCH`; it uses the title from frontmatter, the current Git hash, and the actual UTC generation date.

The generator reads authored Markdown files from `doc/` in filename order. Filenames are not semantic: special handling is controlled only by frontmatter, for example `role: "title"` for the cover page and `role: "abstract"` for the abstract page. The title page structure lives in the `role: "title"` Markdown body and can use placeholders like `{{title}}`, `{{author}}`, and `{{date}}`. All authored images live under `doc/assets/`, including the title cover image and the title-page footer logo. Files without a role are normal numbered thesis body chapters. Backmatter roles `glossary`, `references`, `appendix`, and `declaration` render as unnumbered end sections and are included in the generated TOC without chapter numbers. The list of figures and list of tables are generated from body images and Markdown tables. Generated files are ignored as input; the generated TOC is identified by `role: "toc"` plus `generated: true` and rewritten during each build. If no generated TOC file exists yet, `doc/02-toc.md` is created.

The declaration template can use `{{declarationPlace}}`, `{{declarationDate}}`, and `{{signatureName}}`. `declarationDate` is the current UTC generation date formatted as `DD.MM.YYYY`; `signatureName` defaults to the thesis author.

The generator writes the real report as `mdgen/output/thesis-real-<git-hash>.pdf`, for example `thesis-real-a1b2c3d.pdf`, so local builds can keep multiple commit versions side by side.

The pixel test first deletes `mdgen/output`, then rebuilds `mdgen/output/thesis-real-<git-hash>.pdf`, rasterizes the reference and generated PDF, and fails if any checked page or component crop is below its required match ratio. It masks dynamic text on full-page cover/TOC comparisons, then checks layout, graphics, lines, spacing, and dedicated crops for the heading size and the cover `Datum:` to footer area. It also asserts the TOC backmatter marker, generated figure/table indexes, unnumbered backmatter sections, and footer build metadata via PDF text extraction. Component crops normalize font anti-aliasing where needed so layout, spacing, color, and grid regressions remain visible. Override the default threshold with `PIXEL_THRESHOLD`, for example:

```bash
PIXEL_THRESHOLD=0.97 npm run test:pixel
```

Raw container commands:

```bash
bash mdgen/scripts/build-pixel-image.sh
MDGEN_PIXEL_SKIP_BUILD=1 bash mdgen/scripts/test-pixel.sh
```

The test runner mounts the repo once at `/workspace`; the generator itself runs from `/opt/mdgen` inside the image so the bind mount does not hide the image's installed dependencies.

GitHub Actions writes the pixel score table directly into the workflow summary and uploads only the useful generated assets:

| Artifact | Contains |
| --- | --- |
| `generated-pdf` | `thesis-real-<git-hash>.pdf` |
| `mdgen-pixel-assets` | Rasterized pages, crop images, diff images, bbox debug HTML |

Open the workflow run in GitHub Actions and download the PDF from the run page's **Artifacts** section. GitHub Actions artifacts are packaged by GitHub; the workflow uploads only the single PDF with compression disabled.
