/** Browser regression for CV reading companion returns, idle/reduced motion, reload and native history.
 * CV_URL selects a dev/preview/deployed CV. CHROME_PATH selects an installed browser.
 */
import assert from 'node:assert/strict';
import { launchBrowser } from './browser.mjs';

const url = process.env.CV_URL ?? 'http://localhost:3000/cv';
const browser = await launchBrowser();
const settle = page => page.evaluate(() => new Promise(resolve => {
  let last = scrollY, stable = 0;
  function tick() {
    stable = Math.abs(scrollY - last) < 0.5 ? stable + 1 : 0;
    last = scrollY;
    if (stable >= 5) resolve(); else requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}));
const visibleBack = async (page, button = page.getByRole('button', {name:'Back to reading',exact:true})) => {
  assert.equal(await button.count(), 1, 'Reference navigation must offer a return control');
  const box = await button.boundingBox();
  const size = page.viewportSize();
  assert(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= size.width && box.y + box.height <= size.height,
    'Back must be inside the viewport without scrolling to find it');
  const touch = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  assert(box.height >= (touch ? 44 : 32), 'The compact return control must remain readable and usable on touch screens');
  const navigation = await page.locator('.cv-reading-card').boundingBox();
  const layoutWidth = await page.evaluate(() => document.documentElement.clientWidth);
  assert(Math.abs(layoutWidth - navigation.x - navigation.width - 16) < 1,
    'The companion must stay at the viewport right edge on desktop and mobile');
  assert(navigation.width < Math.min(280, size.width), 'Return navigation must stay compact instead of spanning the viewport');
  if (size.width >= 1200) {
    const sheet = await page.locator('.cv-sheet').boundingBox();
    assert(navigation.x >= sheet.x + sheet.width + 8, 'Desktop controls must stay outside the CV column');
  } else {
    const dock = page.locator('.cv-reading-actions');
    assert.equal(await dock.evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(255, 255, 255)',
      'Narrow screens must separate controls from the reading area');
  }
  return box;
};
try {
  for (const width of [1545, 320]) {
    const context = await browser.newContext({viewport:{width,height:1180},hasTouch:width===320,isMobile:width===320,reducedMotion:'no-preference'});
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    page.on('pageerror', error => console.error(error.message));
    for (const hash of ['#cv-ref-C1', '#cv-award-taichi-thesis-2026']) {
      await page.goto(`${url}${hash}`, {waitUntil:'domcontentloaded'});
      await page.locator('.cv-interests').waitFor();
      const overview = page.getByRole('link', {name:'Back to CV',exact:true});
      await overview.waitFor();
      await visibleBack(page, overview);
      await page.mouse.move(0, 0);
      const body = page.locator('.cv-companion-body');
      const motion = await body.evaluate(element => getComputedStyle(element).transform);
      await page.waitForFunction(previous => {
        const body = document.querySelector('.cv-companion-body');
        return getComputedStyle(body).transform !== previous;
      }, motion);
      const hitArea = await overview.boundingBox();
      await page.emulateMedia({reducedMotion:'reduce'});
      for (const selector of ['.cv-companion-body', '.cv-companion-eyes']) {
        assert.equal(await page.locator(selector).evaluate(element => getComputedStyle(element).animationName), 'none',
          'Reduced motion must stop the companion breathing and blinking');
      }
      assert.deepEqual(await overview.boundingBox(), hitArea, 'Idle motion must not move the clickable hit area');
      await overview.focus();
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.cv-companion-hint')).opacity === '1');
      const hint = await page.locator('.cv-companion-hint').boundingBox();
      assert(hint && hint.x >= 0 && hint.x + hint.width <= width, 'The return hint must fit even on narrow screens');
      await page.emulateMedia({reducedMotion:'no-preference'});
      await overview.click();
      await page.locator('.cv-interests').waitFor();
      await page.waitForFunction(() => location.hash === '' && scrollY === 0);
      assert.equal(await page.locator('.cv-reading-actions').count(), 0);
    }
    console.log(`PASS ${width}px: direct paper and award URLs offer Back to CV`);
    const source = page.locator('a.cv-award-ref[href="#cv-award-taichi-thesis-2026"]').nth(1);
    await page.locator('.cv-interests').waitFor();
    await source.waitFor();
    await source.evaluate(a => a.scrollIntoView({behavior:'instant',block:'center'}));
    await settle(page);
    const origin = await page.evaluate(() => ({y:scrollY,hash:location.hash}));
    await source.click();
    await page.waitForFunction(() => location.hash === '#cv-award-taichi-thesis-2026');
    await settle(page);
    // Page-entry motion creates a containing block for fixed descendants, even at translateY(0).
    await page.locator('.page-transition').evaluate(element => { element.style.transform = 'translateY(0)'; });
    await visibleBack(page);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#cv-award-taichi-thesis-2026').waitFor();
    await settle(page);
    const target = await page.locator('#cv-award-taichi-thesis-2026').boundingBox();
    assert(target && target.y >= 0 && target.y < 1180, 'Reload must retain the referenced award in view');
    const box = await visibleBack(page);
    await page.emulateMedia({media:'print'});
    assert.equal(await page.locator('.cv-reading-actions').evaluate(element => getComputedStyle(element).display), 'none');
    await page.emulateMedia({media:'screen'});
    await page.emulateMedia({reducedMotion:'reduce'});
    // A physical click avoids Playwright scrolling an off-screen return control into view.
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForFunction(({y,hash}) => location.hash === hash && Math.abs(scrollY-y) < 2, origin).catch(async error => {
      console.error({width,origin,current:await page.evaluate(() => ({y:scrollY,hash:location.hash,trail:history.state?.cvReading}))});
      throw error;
    });
    await settle(page);
    assert(await source.evaluate(a => document.activeElement === a), 'Return must focus the exact source, not another citation');
    assert.equal(await page.locator('.cv-reference-popover[data-open="true"]').count(), 0, 'Return must not reopen the preview');
    assert.equal(await page.locator('.cv-reading-return').count(), 0);
    await page.goForward({waitUntil:'domcontentloaded'});
    await settle(page);
    await visibleBack(page);
    await page.getByRole('button',{name:'Back to reading',exact:true}).click();
    await page.waitForFunction(({y,hash}) => location.hash === hash && Math.abs(scrollY-y) < 2, origin).catch(async error => {
      console.error({width,origin,current:await page.evaluate(() => ({y:scrollY,hash:location.hash,trail:history.state?.cvReading}))});
      throw error;
    });
    console.log(`PASS ${width}px: award reload, exact reading position/focus, native Forward and return`);
    // Dismissal keeps the destination and native history, rather than acting as another Back.
    await source.click();
    await page.waitForFunction(() => location.hash === '#cv-award-taichi-thesis-2026');
    await settle(page);
    const destination = await page.evaluate(() => ({url:location.href,y:scrollY}));
    await page.getByRole('button',{name:'Dismiss reading navigation',exact:true}).click();
    assert.equal(await page.locator('.cv-reading-actions').count(), 0);
    assert.deepEqual(await page.evaluate(() => ({url:location.href,y:scrollY})), destination,
      'Dismissal must not navigate or move the current reading position');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.cv-interests').waitFor();
    assert.equal(await page.locator('.cv-reading-actions').count(), 0, 'The current history entry must remain dismissed after reload');
    const another = page.locator('a.cv-ref[href="#cv-ref-C1"]').first();
    await another.evaluate(element => element.scrollIntoView({behavior:'instant',block:'center'}));
    await another.click();
    await page.waitForFunction(() => location.hash === '#cv-ref-C1');
    await visibleBack(page);
    await page.goBack({waitUntil:'domcontentloaded'});
    await page.waitForFunction(() => location.hash === '#cv-award-taichi-thesis-2026');
    assert.equal(await page.locator('.cv-reading-actions').count(), 0, 'Browser Back must retain the dismissed state');
    console.log(`PASS ${width}px: dismiss in place, persist across reload, reopen on new jump and retain native history`);
    await context.close();
  }
} finally { await browser.close(); }
