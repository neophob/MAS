#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MDGEN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_MD="$MDGEN_DIR/output/pixel-report.md"

write_summary() {
  echo "## mdgen pixel output"
  echo
  echo "The pixel report is printed below; no separate report artifact is uploaded."
  echo
  echo "| Artifact | Contains |"
  echo "| --- | --- |"
  echo "| generated-pdf | Generated thesis PDF |"
  echo "| mdgen-pixel-assets | Rasterized pages, crop images, diff images, bbox debug HTML |"
  echo

  if [[ -f "$REPORT_MD" ]]; then
    cat "$REPORT_MD"
  else
    echo "Pixel report was not generated. Check the failed test step logs."
  fi
}

if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  write_summary >> "$GITHUB_STEP_SUMMARY"
else
  write_summary
fi
