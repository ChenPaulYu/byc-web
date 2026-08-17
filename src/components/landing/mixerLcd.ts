/**
 * mixerLcd.ts — the two LED columns on the mixer: pad punches, bed breathes.
 *
 * Peak ticks hang then fall. A silent left column is the honest "nobody is hitting" state,
 * not a blank screen. The caller owns the levels and the machine orange; this file only draws.
 *
 * Reads: nothing.
 */

import * as THREE from 'three';

const PX_W = 128;
const PX_H = 96;
const ROWS = 12;

export function createMixerLcd(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = PX_W;
  canvas.height = PX_H;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

export function drawMixerLcd(
  ctx: CanvasRenderingContext2D,
  pad: number,
  bed: number,
  peaks: [number, number],
  phosphor: string,
): void {
  const w = PX_W;
  const h = PX_H;
  ctx.fillStyle = '#0b0a09';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = phosphor;
  ctx.globalAlpha = 0.07;
  for (let x = 1; x < w; x += 2) ctx.fillRect(x, 0, 1, h);
  ctx.globalAlpha = 1;

  const levels = [pad, bed];
  const marginX = 10;
  const marginY = 8;
  const gap = 10;
  const colW = (w - marginX * 2 - gap) / 2;
  const rowGap = 1.5;
  const usableH = h - marginY * 2;
  const segH = (usableH - rowGap * (ROWS - 1)) / ROWS;

  for (let c = 0; c < 2; c += 1) {
    const x = marginX + c * (colW + gap);
    const lit = levels[c] * ROWS;
    const peakRow = Math.min(ROWS - 1, Math.max(0, Math.round(peaks[c] * (ROWS - 1))));
    for (let r = 0; r < ROWS; r += 1) {
      const y = h - marginY - (r + 1) * segH - r * rowGap;
      const amount = Math.min(1, Math.max(0, lit - r));
      const hot = r >= ROWS - 2;
      if (amount <= 0.04) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = hot ? '#24160f' : '#171412';
      } else {
        ctx.globalAlpha = 0.28 + amount * 0.72;
        ctx.fillStyle = hot ? '#ffd4a8' : phosphor;
      }
      ctx.fillRect(x, y, colW, Math.max(1, segH - 0.4));
    }
    if (peaks[c] > 0.05) {
      const y = h - marginY - (peakRow + 1) * segH - peakRow * rowGap;
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff3e4';
      ctx.fillRect(x, y, colW, 1.5);
    }
  }
  ctx.globalAlpha = 1;

  if (pad > 0.45) {
    ctx.strokeStyle = phosphor;
    ctx.globalAlpha = Math.min(1, (pad - 0.45) * 2.2);
    ctx.lineWidth = 1;
    ctx.strokeRect(marginX - 2.5, marginY - 2.5, colW + 5, h - marginY * 2 + 5);
    ctx.globalAlpha = 1;
  }
}
