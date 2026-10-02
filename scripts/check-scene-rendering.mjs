/** Measure actual scene draws and compare cached shadows with a fresh render after mutations.
 * Requires npm run dev. CHROME_PATH selects an installed browser.
 */
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFileSync } from 'node:fs';
import { launchBrowser } from './browser.mjs';

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const frames = count => page.evaluate(count => new Promise(resolve => {
  const tick = () => --count ? requestAnimationFrame(tick) : resolve();
  requestAnimationFrame(tick);
}), count);

try {
  await page.goto(process.env.SCENE_URL ?? 'http://127.0.0.1:3000', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Enter the interactive scene' }).click();
  await page.waitForFunction(() => document.querySelector('canvas') && !document.querySelector('[data-scene-loading]'));
  await page.evaluate(async () => {
    const url = performance.getEntriesByType('resource').find(r => r.name.includes('/@react-three_fiber.js')).name;
    const { _roots } = await import(url);
    window.sceneState = [..._roots.values()][0].store.getState();
  });
  await page.waitForFunction(() => window.sceneState.scene.getObjectByName('avaturn_body'));
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Freeze only animated decorations in this visual probe; production behavior is untouched.
    const { scene, gl } = window.sceneState;
    scene.getObjectByName('echo-avatar').visible = false;
    scene.traverse(object => {
      const map = object.material?.map;
      if (map?.isVideoTexture || (map?.image?.width === 128 && map?.image?.height === 96)) object.visible = false;
    });
    let insideShadow = false;
    window.draws = { shadow: 0, main: 0 };
    const shadow = gl.shadowMap.render, draw = gl.renderBufferDirect;
    gl.shadowMap.render = function (...args) {
      insideShadow = true;
      try { return shadow.apply(this, args); } finally { insideShadow = false; }
    };
    gl.renderBufferDirect = function (...args) {
      window.draws[insideShadow ? 'shadow' : 'main']++;
      return draw.apply(this, args);
    };
  });
  await frames(4);
  await page.evaluate(() => { window.draws = { shadow: 0, main: 0 }; });
  await frames(30);
  const idle = await page.evaluate(() => ({ ...window.draws, mainPerFrame: window.sceneState.gl.info.render.calls }));
  console.log('30 idle frames:', idle);
  assert.equal(idle.shadow, 0, 'Unchanged opaque geometry must reuse its existing shadow map');
  assert.ok(idle.mainPerFrame <= 190, 'Static detail must stay batched (baseline before tick batching: 219)');
  if (process.env.SAVE_SCENE_PATH) await page.screenshot({ path: process.env.SAVE_SCENE_PATH });
  if (process.env.SCENE_REFERENCE) {
    const before = PNG.sync.read(readFileSync(process.env.SCENE_REFERENCE));
    const after = PNG.sync.read(await page.screenshot());
    const different = pixelmatch(before.data, after.data, null, before.width, before.height, { threshold: 0.05 });
    assert.ok(different < before.width * before.height * 0.0001, `${different} changed reference pixels`);
    console.log(`PASS unchanged scene appearance (${different} reference pixels differ)`);
  }

  for (const mutation of ['move', 'hide', 'show', 'light', 'camera']) {
    await page.evaluate(mutation => {
      const { scene, camera } = window.sceneState;
      const desk = scene.children.flatMap(group => group.children).find(object => object.castShadow);
      window.testCaster ??= desk;
      if (mutation === 'move') window.testCaster.position.x += 2;
      if (mutation === 'hide') window.testCaster.visible = false;
      if (mutation === 'show') window.testCaster.visible = true;
      if (mutation === 'light') scene.children.find(object => object.isDirectionalLight && object.castShadow).position.x += 5;
      if (mutation === 'camera') { camera.position.x += 2; camera.updateMatrixWorld(); }
      window.draws = { shadow: 0, main: 0 };
    }, mutation);
    await frames(3);
    const changed = await page.evaluate(() => window.draws.shadow);
    if (mutation === 'camera') assert.equal(changed, 0, 'Looking around does not change a directional shadow');
    else assert.ok(changed > 0, `${mutation} must update shadows`);
    const cached = PNG.sync.read(await page.screenshot());
    await page.evaluate(() => { window.sceneState.gl.shadowMap.needsUpdate = true; });
    await frames(2);
    const fresh = PNG.sync.read(await page.screenshot());
    const different = pixelmatch(cached.data, fresh.data, null, cached.width, cached.height, { threshold: 0.05 });
    assert.ok(different < cached.width * cached.height * 0.0001, `${mutation}: ${different} stale-shadow pixels`);
    console.log(`PASS ${mutation}: cached and freshly drawn shadows match (${different} pixels differ)`);
  }

  await page.evaluate(() => {
    const state = window.sceneState;
    state.setFrameloop('never');
    window.transportButton = state.scene.getObjectByName('transport-PLAY').children[0];
    window.transportButton.__r3f.handlers.onPointerDown({ stopPropagation() {} });
  });
  await frames(2); // Let the actual component commit its pressed state.
  const slowFrames = () => page.evaluate(() => {
    const state = window.sceneState, positions = [];
    for (let frame = 0; frame < 12; frame++) {
      state.advance(state.clock.elapsedTime + 0.2);
      positions.push(window.transportButton.position.y);
    }
    return positions;
  });
  const pressed = await slowFrames();
  assert.ok(pressed.every(y => y >= -0.02001 && y <= 0), `Slow frames must not throw buttons off the desk: ${pressed}`);
  await page.evaluate(() => window.transportButton.__r3f.handlers.onPointerUp());
  await frames(2);
  const released = await slowFrames();
  assert.ok(released.every(y => y >= -0.02001 && y <= 0));
  assert.ok(Math.abs(released.at(-1)) < 0.0002);
  console.log('PASS transport press/release remains bounded at 5 fps');
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
