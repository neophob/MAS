# mdgen

Generate the real report:

```bash
npm run build:real
```

Generate the dummy report:

```bash
npm run build:dummy
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

The container run also fixes `TZ=UTC`, `LANG=C.UTF-8`, `LC_ALL=C.UTF-8`, and `SOURCE_DATE_EPOCH=315532800` by default. Override the timestamp only via `MDGEN_SOURCE_DATE_EPOCH` if you intentionally want a different deterministic report timestamp.

The pixel test first deletes `mdgen/output`, then rebuilds `mdgen/output/thesis-real.pdf` and `mdgen/output/thesis-dummy.pdf`, rasterizes the reference and generated PDFs, and fails if any checked page or component crop is below its required match ratio. It checks full pages plus dedicated crops for the Markdown table, the `2.1` heading size, and the cover `Datum:` to footer area. Component crops normalize font anti-aliasing where needed so layout, spacing, color, and grid regressions remain visible. Override the default threshold with `PIXEL_THRESHOLD`, for example:

```bash
PIXEL_THRESHOLD=0.97 npm run test:pixel
```

Raw container commands:

```bash
bash mdgen/scripts/build-pixel-image.sh
MDGEN_PIXEL_SKIP_BUILD=1 bash mdgen/scripts/test-pixel.sh
```

The test runner mounts the repo once at `/workspace`; the generator itself runs from `/opt/mdgen` inside the image so the bind mount does not hide the image's installed dependencies.

GitHub Actions uploads these artifacts after every run:

| Artifact | Contains |
| --- | --- |
| `mdgen-pdfs` | `thesis-real.pdf` and `thesis-dummy.pdf` |
| `mdgen-html` | Generated HTML files |
| `mdgen-pixel-report` | `pixel-report.md` and `pixel-report.json` |
| `mdgen-pixel-assets` | Rasterized pages, crop images, diff images, bbox debug HTML |
| `mdgen-output-all` | Complete `mdgen/output` directory |

Open the workflow run in GitHub Actions and download them from the run page's **Artifacts** section. The run summary also shows the pixel score table.
