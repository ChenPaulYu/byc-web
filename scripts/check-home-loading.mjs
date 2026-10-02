/** Browser regression checks for production homepage loading and recovery.
 * Run after build:main with a preview server: npm run check:home.
 * CHROME_PATH selects an installed browser instead of Playwright's bundled Chromium.
 */
import assert from 'node:assert/strict';
import { launchBrowser } from './browser.mjs';

const url = process.env.HOME_URL ?? 'http://127.0.0.1:4300';
const browser = await launchBrowser();

async function check(name, setup, verify, expectedReports = []) {
  if (process.env.CASE && !name.includes(process.env.CASE)) return;
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.setDefaultTimeout(15_000);
  try {
    await setup(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Enter the interactive scene' }).click();
    await verify(page);
    assert.deepEqual(errors, expectedReports, `${name}: unexpected browser error reports`);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}

const navigation = async page => {
  await page.getByRole('button', { name: 'About', exact: true }).click();
  await page.waitForURL('**/about', { waitUntil: 'domcontentloaded' });
};

const watchAudioDecodes = (page, rejectFlac = false) => page.addInitScript(rejectFlac => {
  const decode = AudioContext.prototype.decodeAudioData;
  window.decodedSamples = 0;
  AudioContext.prototype.decodeAudioData = async function (bytes, ...args) {
    if (rejectFlac && String.fromCharCode(...new Uint8Array(bytes, 0, 4)) === 'fLaC') {
      throw new Error('Simulated unsupported FLAC decoder');
    }
    const buffer = await decode.call(this, bytes, ...args);
    window.decodedSamples++;
    return buffer;
  };
}, rejectFlac);

try {
  let releaseScene;
  await check('entry stays in place until the downloaded room renders', async page => {
    const pending = new Promise(resolve => { releaseScene = resolve; });
    await page.route('**/LandingScene-*.js', async route => {
      await pending;
      await route.continue();
    });
    await page.addInitScript(() => document.addEventListener('click', event => {
      const button = event.target.closest('button[aria-label="Enter the interactive scene"]');
      if (button) window.originalEntry = button.parentElement;
    }, { capture: true }));
  }, async page => {
    try {
      // The old 500 ms timer faded to an empty background and replaced the entry screen.
      await page.waitForTimeout(750);
      assert.deepEqual(await page.evaluate(() => ({
        sameScreen: window.originalEntry.isConnected,
        opacity: getComputedStyle(window.originalEntry).opacity,
      })), { sameScreen: true, opacity: '1' });
      await page.getByRole('button', { name: 'About', exact: true }).waitFor();
      await page.setViewportSize({ width: 320, height: 568 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      assert.equal(await page.evaluate(() => getComputedStyle(window.originalEntry).transitionProperty), 'none');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      releaseScene();
      await page.waitForFunction(() => !window.originalEntry.isConnected && document.querySelector('canvas'));
      await navigation(page);
    } finally { releaseScene(); }
  });

  await check('unreachable font host does not block entry',
    page => page.route('https://fonts.googleapis.com/**', () => {}), navigation);

  await check('mobile entry remains usable with slow CPU and network', async page => {
    // This is an availability probe under throttling, not a timing budget on a shared host.
    page.setDefaultTimeout(30_000);
    await page.setViewportSize({ width: 390, height: 844 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false, latency: 80, downloadThroughput: 200 * 1024, uploadThroughput: 100 * 1024,
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.addInitScript(() => document.addEventListener('click', event => {
      if (event.target.closest('button[aria-label="Enter the interactive scene"]')) window.entryAt = performance.now();
    }));
  }, async page => {
    await page.waitForFunction(() => document.querySelector('canvas') && !document.querySelector('[data-scene-loading]'));
    console.log(`Throttled entry to rendered room: ${await page.evaluate(() => Math.round(performance.now() - window.entryAt))} ms`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await navigation(page);
  });

  await check('failed scene download retains navigation',
    page => page.route('**/LandingScene-*.js', route => route.abort()), navigation);

  await check('pending audio permission does not block entry',
    page => page.addInitScript(() => {
      Object.defineProperty(AudioContext.prototype, 'state', { get: () => 'suspended' });
      AudioContext.prototype.resume = () => new Promise(() => {});
    }), navigation);

  await check('unavailable audio hardware does not remove the room',
    page => page.addInitScript(() => {
      window.AudioContext = class { constructor() { throw new Error('Audio hardware unavailable'); } };
    }), async page => {
      await page.waitForFunction(() => document.querySelector('canvas') && !document.querySelector('[data-scene-loading]'));
      await navigation(page);
    });

  await check('rejected audio resume remains a silent usable scene',
    async page => {
      await watchAudioDecodes(page);
      await page.addInitScript(() => {
        Object.defineProperty(AudioContext.prototype, 'state', { get: () => 'suspended' });
        AudioContext.prototype.resume = () => Promise.reject(new Error('Audio permission denied'));
      });
    }, async page => {
      await page.waitForFunction(() => window.decodedSamples >= 5);
      await page.evaluate(() => new Promise(requestAnimationFrame));
      await navigation(page);
    });

  for (const rejectFlac of [false, true]) {
    await check(rejectFlac ? 'unsupported FLAC decodes original WAV backups' : 'lossless audio stays below 3 MiB',
      page => watchAudioDecodes(page, rejectFlac), async page => {
        await page.waitForFunction(() => window.decodedSamples >= 5);
        const media = await page.evaluate(() => performance.getEntriesByType('resource')
          .filter(resource => /\.(flac|wav)$/.test(resource.name))
          .map(resource => ({ name: resource.name, bytes: resource.decodedBodySize })));
        assert.equal(media.filter(resource => resource.name.endsWith('.flac')).length, 5);
        assert.equal(media.filter(resource => resource.name.endsWith('.wav')).length, rejectFlac ? 5 : 0);
        if (!rejectFlac) assert.ok(media.reduce((sum, resource) => sum + resource.bytes, 0) < 3 * 1024 * 1024);
        await navigation(page);
      });
  }

  let avatarError;
  const modelFailure = 'Could not load /model.glb: Failed to fetch';
  await check('failed avatar retains the room and navigation', async page => {
    avatarError = page.waitForEvent('pageerror', error => error.message === modelFailure);
    // Keep an earlier navigation failure as the reported cause if cleanup closes this page
    // before verify() can await the expected model error.
    void avatarError.catch(() => {});
    await page.route('**/model.glb', route => route.abort());
  }, async page => {
    await avatarError;
    await page.waitForFunction(() => document.querySelector('canvas') && !document.querySelector('[data-scene-loading]'));
    await navigation(page);
    // R3F reports caught render errors through window.reportError as well. Verify the room
    // after that exact injected failure, rather than suppressing or ignoring other errors.
  }, [modelFailure]);

  await check('slow model and video do not cover the rendered room', async page => {
    await page.route('**/model.glb', () => {});
    await page.route('**/animation.mp4', () => {});
  }, async page => {
    await page.locator('canvas').waitFor();
    await page.waitForFunction(() => {
      const cover = document.querySelector('[data-scene-loading]');
      const oldLabel = [...document.querySelectorAll('div')].find(el => el.textContent === 'Loading samples');
      return !cover && !oldLabel;
    });
    await navigation(page);
  });

  await check('lost WebGL context switches to usable fallback', async () => {}, async page => {
    await page.locator('canvas').waitFor();
    await page.evaluate(() => {
      document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
    });
    await page.waitForFunction(() => document.querySelector('canvas') === null);
    await navigation(page);
  });

  await check('paused video does not upload duplicate frames', page => page.addInitScript(() => {
    window.videoUploads = 0;
    window.sceneVideos = [];
    const create = document.createElement.bind(document);
    document.createElement = function (...args) {
      const element = create(...args);
      if (args[0] === 'video') window.sceneVideos.push(element);
      return element;
    };
    for (const method of ['texImage2D', 'texSubImage2D']) {
      const original = WebGL2RenderingContext.prototype[method];
      WebGL2RenderingContext.prototype[method] = function (...args) {
        if (args.some(arg => arg instanceof HTMLVideoElement)) window.videoUploads++;
        return original.apply(this, args);
      };
    }
  }), async page => {
    await page.waitForFunction(() => window.videoUploads > 3);
    await page.evaluate(() => window.sceneVideos.forEach(video => video.pause()));
    // Allow the final decoded frame to upload before measuring a stationary video.
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => window.videoUploads);
    await page.waitForTimeout(700);
    assert.equal(await page.evaluate(() => window.videoUploads), before);
    await navigation(page);
  });

  await check('repeated entry releases graphics and video resources', page => page.addInitScript(() => {
    window.graphicsContexts = [];
    window.sceneVideos = [];
    window.audioContexts = [];
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      const context = getContext.apply(this, args);
      if (args[0] === 'webgl2' && context && !window.graphicsContexts.includes(context)) window.graphicsContexts.push(context);
      return context;
    };
    const create = document.createElement.bind(document);
    document.createElement = function (...args) {
      const element = create(...args);
      if (args[0] === 'video') window.sceneVideos.push(element);
      return element;
    };
    window.AudioContext = new Proxy(window.AudioContext, {
      construct(Target, args) {
        const context = new Target(...args);
        window.audioContexts.push(context);
        return context;
      },
    });
  }), async page => {
    for (let visit = 0; visit < 3; visit++) {
      await page.waitForFunction(() => document.querySelector('canvas') && !document.querySelector('[data-scene-loading]'));
      await page.waitForFunction(() => window.sceneVideos.some(video => video.readyState >= 2 && !video.paused));
      await navigation(page);
      await page.waitForFunction(() => window.graphicsContexts.every(context => context.isContextLost())
        && window.sceneVideos.every(video => video.paused && video.getAttribute('src') === null)
        && window.audioContexts.every(context => context.state === 'suspended'));
      assert.equal(await page.evaluate(() => window.audioContexts.length), 1, 'Reuse one audio context across visits');
      assert.equal(await page.evaluate(() => window.graphicsContexts.length), visit + 1);
      if (visit < 2) {
        await page.goBack();
        await page.getByRole('button', { name: 'Enter the interactive scene' }).click();
      }
    }
  });
} finally {
  await browser.close();
}
