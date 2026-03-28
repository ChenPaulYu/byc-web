import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4173;
const PREVIEW_URL = `http://${HOST}:${PORT}/cv`;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(200);
  }

  throw new Error(`Timed out waiting for preview server: ${url}`);
}

function spawnPreview() {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npm.cmd' : 'npm';

  return spawn(
    cmd,
    ['run', 'preview', '--', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { stdio: 'inherit' }
  );
}

function spawnPlaywrightInstall() {
  const isWindows = process.platform === 'win32';
  const cmd = isWindows ? 'npx.cmd' : 'npx';

  return spawn(cmd, ['playwright', 'install', 'chromium'], { stdio: 'inherit' });
}

async function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Process exited with code ${code}`));
    });
  });
}

async function main() {
  const distIndex = path.resolve('dist', 'index.html');
  if (!fs.existsSync(distIndex)) {
    throw new Error('Missing dist/. Run `npm run build` first.');
  }

  const outPublicPath = path.resolve('public', 'cv.pdf');
  fs.mkdirSync(path.dirname(outPublicPath), { recursive: true });

  let preview;
  let browser;

  try {
    preview = spawnPreview();
    await waitForServer(PREVIEW_URL);

    try {
      browser = await chromium.launch();
    } catch (err) {
      const message = String(err?.message ?? err);
      if (!message.includes("Executable doesn't exist")) throw err;

      console.log('Playwright Chromium not installed. Installing...');
      const installer = spawnPlaywrightInstall();
      await waitForExit(installer);
      browser = await chromium.launch();
    }
    const page = await browser.newPage();

    await page.goto(PREVIEW_URL, { waitUntil: 'networkidle' });
    await page.emulateMedia({ media: 'print' });

    await page.pdf({
      path: outPublicPath,
      format: 'Letter',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    const outDistPath = path.resolve('dist', 'cv.pdf');
    try {
      fs.copyFileSync(outPublicPath, outDistPath);
    } catch {
      // Ignore if dist/ is not writable for some reason.
    }

    console.log(`Wrote ${outPublicPath}`);
  } finally {
    if (browser) await browser.close();
    if (preview && !preview.killed) preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
