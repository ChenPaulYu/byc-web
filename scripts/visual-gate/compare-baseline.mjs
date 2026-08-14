/**
 * compare-baseline.mjs — pure perceptual image-diff module for the visual regression gate.
 *
 * Carried over from the archived full-3D room exploration (branch experiment/homepage-core),
 * where it was the one piece worth keeping: it made "it looks off but I cannot say why" show
 * up in review as an image diff. Nothing about it is 3D-specific.
 *
 * Takes a captured PNG buffer and a baseline PNG path and returns a pass/fail verdict using
 * pixelmatch's perceptual diff, tolerant of the small antialiasing/GPU-scheduling noise a 3D
 * canvas produces run to run. Also owns the "no baseline yet" and "update baseline" outcomes.
 * It knows nothing about Playwright, browsers, or the DOM — the caller captures the screenshot
 * and passes buffers/paths in. This module catches pixel *regression* only; it never judges
 * whether the room looks good, and it has no opinion on when a change is intentional.
 *
 * Reads: pixelmatch · pngjs · node:fs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

// Per-pixel perceptual sensitivity pixelmatch uses before a pixel counts as "different"
// (0-1, lower = stricter). This is not the pass/fail threshold — see maxDiffRatio below.
const DEFAULT_PIXEL_THRESHOLD = 0.1;

const ensureDir = (filePath) => mkdirSync(dirname(filePath), { recursive: true });

/**
 * Compare a freshly captured PNG buffer against a committed baseline.
 *
 * @param {object} options
 * @param {Buffer} options.actualPngBuffer - the just-captured screenshot, PNG-encoded.
 * @param {string} options.baselinePath - path to the committed baseline PNG.
 * @param {string} options.actualPath - where to write the actual capture on failure.
 * @param {string} options.diffPath - where to write the pixelmatch diff image on failure.
 * @param {number} options.maxDiffRatio - fraction of pixels (0-1) allowed to differ before this fails.
 * @param {number} [options.pixelThreshold] - pixelmatch's own per-pixel sensitivity.
 * @param {boolean} [options.updateBaseline] - when true, write actualPngBuffer as the new baseline instead of comparing.
 * @returns {{status: 'updated'|'missing-baseline'|'pass'|'fail', [key: string]: unknown}}
 */
export function compareAgainstBaseline({
  actualPngBuffer,
  baselinePath,
  actualPath,
  diffPath,
  maxDiffRatio,
  pixelThreshold = DEFAULT_PIXEL_THRESHOLD,
  updateBaseline = false,
}) {
  if (updateBaseline) {
    ensureDir(baselinePath);
    writeFileSync(baselinePath, actualPngBuffer);
    return {
      status: 'updated',
      baselinePath,
      message: `Baseline written to ${baselinePath}. Review the image diff in this change before committing.`,
    };
  }

  if (!existsSync(baselinePath)) {
    return {
      status: 'missing-baseline',
      baselinePath,
      message: `No baseline at ${baselinePath} yet. Re-run with BYC_UPDATE_BASELINE=1 to create it.`,
    };
  }

  const actualPng = PNG.sync.read(actualPngBuffer);
  const baselinePng = PNG.sync.read(readFileSync(baselinePath));

  if (baselinePng.width !== actualPng.width || baselinePng.height !== actualPng.height) {
    ensureDir(actualPath);
    writeFileSync(actualPath, actualPngBuffer);
    return {
      status: 'fail',
      baselinePath,
      actualPath,
      reason: `dimension mismatch: baseline ${baselinePng.width}x${baselinePng.height} vs actual ${actualPng.width}x${actualPng.height}`,
    };
  }

  const { width, height } = actualPng;
  const diffPng = new PNG({ width, height });
  const diffPixels = pixelmatch(baselinePng.data, actualPng.data, diffPng.data, width, height, {
    threshold: pixelThreshold,
  });
  const totalPixels = width * height;
  const diffRatio = diffPixels / totalPixels;
  const pass = diffRatio <= maxDiffRatio;

  if (!pass) {
    ensureDir(actualPath);
    writeFileSync(actualPath, actualPngBuffer);
    writeFileSync(diffPath, PNG.sync.write(diffPng));
  }

  return {
    status: pass ? 'pass' : 'fail',
    baselinePath,
    diffPixels,
    totalPixels,
    diffRatio: Number(diffRatio.toFixed(6)),
    maxDiffRatio,
    ...(pass ? {} : { actualPath, diffPath }),
  };
}
