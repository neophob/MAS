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

`npm run test:pixel` builds and runs `mdgen/Dockerfile.pixel`. The host only needs Docker; Poppler, ImageMagick, Chromium, Node, and npm dependencies are provided by the container image. The default platform is `linux/amd64` so local runs match GitHub Actions rendering; override it with `MDGEN_PIXEL_PLATFORM` only if needed. GitHub Actions builds the same image with `mdgen/scripts/build-pixel-image.sh` and then runs `mdgen/scripts/test-pixel.sh` against that image.

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
