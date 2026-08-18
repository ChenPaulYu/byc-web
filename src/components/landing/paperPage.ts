/**
 * paperPage.ts — the first page of the paper sitting on the desk.
 *
 * It has to read as FlueBricks from the homepage camera, not as a blank A4 stack. Title, authors
 * and a schematic teaser are the three things that survive at this size; body copy is ruled lines.
 *
 * Reads: fluebricks.ts for the brick colours, so the schematic cannot drift off the 3D flute.
 * The title string lives here because the 3D scene does not load Markdown.
 */

import * as THREE from 'three';
import { FLUEBRICKS_SCHEMATIC } from './fluebricks';

const W = 512;
const H = 724;

export function createFluebricksPage(): THREE.CanvasTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#f6f3ec';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = '#6b7280';
  ctx.font = '600 13px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('CHI ’26, April 13–17, 2026, Barcelona, Spain', 36, 32);

  ctx.fillStyle = '#171717';
  ctx.font = '800 26px Inter, Helvetica, Arial, sans-serif';
  const title = [
    'FlueBricks: A Construction Kit of',
    'Flute-like Instruments for',
    'Acoustic Reasoning',
  ];
  title.forEach((line, i) => ctx.fillText(line, 36, 78 + i * 32));

  ctx.font = '600 14px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('Bo-Yu Chen    Chiao-Wei Huang    Lung-Pan Cheng', 36, 188);
  ctx.fillStyle = '#6b7280';
  ctx.font = '500 12px Inter, Helvetica, Arial, sans-serif';
  ctx.fillText('National Taiwan University', 36, 210);

  // Schematic teaser: the assembled kit — green elbow, grey generator, red, orange, yellow.
  const ty = 232;
  ctx.fillStyle = '#e7e2d8';
  ctx.fillRect(36, ty, W - 72, 168);
  FLUEBRICKS_SCHEMATIC.forEach((color, i) => {
    ctx.fillStyle = color;
    const x = 64 + i * 72;
    const h = i === 1 ? 58 : 32;
    ctx.fillRect(x, ty + 84 - h / 2, 58, h);
  });

  ctx.fillStyle = '#d6d1c7';
  const colW = (W - 84) / 2;
  for (let col = 0; col < 2; col++) {
    const x = 36 + col * (colW + 12);
    for (let row = 0; row < 22; row++) {
      const width = row % 7 === 0 ? colW * 0.72 : colW;
      ctx.fillRect(x, 420 + row * 12, width, 5);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
