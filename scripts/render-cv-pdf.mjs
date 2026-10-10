import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';

import { chromium } from 'playwright';

const HOST = '127.0.0.1';
async function availablePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, HOST, resolve); });
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForServer(url, child, timeoutMs = 20000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (child.exitCode !== null) throw new Error('CV preview server exited before becoming ready.');
    try {
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(2000) });
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(200);
  }

  throw new Error(`Timed out waiting for preview server: ${url}`);
}

function spawnPreview(port) {
  return spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', HOST, '--port', String(port), '--strictPort'], { stdio: 'inherit' });
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

  const sourceConfig = fs.readFileSync('public/cv.config.json', 'utf8');
  if (fs.readFileSync('dist/cv.config.json', 'utf8') !== sourceConfig) {
    throw new Error('Built CV content is stale. Run `npm run build` first.');
  }
  const port = await availablePort();
  const previewUrl = `http://${HOST}:${port}/cv`;
  const outPublicPath = path.resolve('public', 'cv.pdf');
  fs.mkdirSync(path.dirname(outPublicPath), { recursive: true });

  let preview;
  let browser;

  try {
    preview = spawnPreview(port);
    await waitForServer(previewUrl, preview);

    try {
      browser = await chromium.launch();
    } catch (err) {
      const message = String(err?.message ?? err);
      if (!message.includes("Executable doesn't exist")) throw err;

      try {
        // Prefer an already installed Chrome before downloading a second browser.
        browser = await chromium.launch({ channel: 'chrome' });
      } catch (chromeError) {
        if (!/not found|doesn't exist/i.test(String(chromeError?.message ?? chromeError))) throw chromeError;
        console.log('No local Chromium found. Installing Playwright Chromium...');
        const installer = spawnPlaywrightInstall();
        await waitForExit(installer);
        browser = await chromium.launch();
      }
    }
    const page = await browser.newPage();

    await page.goto(previewUrl, { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-cv-ready="true"]');
    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => document.fonts.ready);

    await page.pdf({
      path: outPublicPath,
      format: 'Letter',
      preferCSSPageSize: true,
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: '8mm',
        right: '12mm',
        bottom: '8mm',
        left: '12mm'
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
