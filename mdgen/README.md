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
nix-shell -p poppler-utils imagemagick --run 'npm run test:pixel'
```

The pixel test rebuilds `mdgen/output/thesis-real.pdf`, rasterizes the reference and generated PDFs, and fails if any checked page is below `95%` matching pixels. Override the threshold with `PIXEL_THRESHOLD`, for example:

```bash
PIXEL_THRESHOLD=0.97 nix-shell -p poppler-utils imagemagick --run 'npm run test:pixel'
```
