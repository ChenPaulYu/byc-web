/** Regression probe against the real Vite/R3F scene. Requires agent-browser and npm run dev.
 * Browser output is always muted; this does not mute or change the application's audio graph.
 * Run: node scripts/visual-gate/check-landing.mjs
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const session = `byc-regression-${process.pid}`;
let launched = false;
function browser(...args) {
  const launch = !launched ? ['--args', '--mute-audio'] : [];
  launched = true;
  return execFileSync('agent-browser', ['--session', session, ...launch, ...args], {
    encoding: 'utf8', timeout: 60_000,
  }).trim();
}
function evaluate(code) {
  const response = JSON.parse(browser('eval', '--json', code));
  assert.equal(response.success, true, JSON.stringify(response.error));
  return response.data.result;
}
const inspect = `(async () => {
  const url = performance.getEntriesByType('resource').find(r => r.name.includes('/@react-three_fiber.js'))?.name;
  if (!url) return null;
  const { _roots } = await import(url);
  const state = [..._roots.values()][0]?.store.getState();
  const mpc = state?.scene.children.find(o => o.type === 'Group' && o.position.y === -1);
  if (!mpc || state.gl.info.render.frame < 3) return null;
  return { scale: mpc.scale.toArray(), canvasWidth: state.size.width, frame: state.gl.info.render.frame };
})()`;
function scene() {
  browser('wait', '--fn', `(async () => Boolean(await ${inspect}))()`);
  return evaluate(inspect);
}

try {
  browser('open', 'http://localhost:3000');
  browser('click', 'button[aria-label="Enter the interactive scene"]');
  browser('wait', '--fn', `(async () => Boolean(await ${inspect}))()`);
  for (const [width, height] of [[1440, 900], [390, 844], [320, 568], [844, 390]]) {
    browser('set', 'viewport', String(width), String(height));
    const result = scene();
    assert.deepEqual(result.scale, [1, 1, 1], `MPC must keep its relative size at ${width}×${height}`);
    assert.equal(evaluate('document.documentElement.scrollWidth > innerWidth'), false, 'No horizontal overflow');
    console.log(`PASS ${width}×${height}: MPC scale ${result.scale.join(', ')}`);
  }
  browser('set', 'viewport', '390', '844');
  browser('reload');
  browser('click', 'button[aria-label="Enter the interactive scene"]');
  scene();
  browser('wait', '--fn', 'document.querySelectorAll("h1").length === 1');
  assert.equal(evaluate("document.querySelectorAll('h1').length"), 1, 'One identity after entry');
  browser('press', 'z');
  browser('click', 'nav button');
  assert.equal(evaluate('location.pathname'), '/about', 'About navigation updates the route');
  console.log('PASS entry, pad keyboard event and About navigation (browser muted)');
} finally {
  browser('close');
}
