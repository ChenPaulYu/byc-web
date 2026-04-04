import assert from 'node:assert/strict';
import test from 'node:test';

import { getViewSiteUrl } from './siteUrl';

test("getViewSiteUrl maps admin localhost to the local public site", () => {
  assert.equal(getViewSiteUrl('http://localhost:3001'), 'http://localhost:3000');
});

test("getViewSiteUrl maps admin 127.0.0.1 to the local public site", () => {
  assert.equal(getViewSiteUrl('http://127.0.0.1:3001'), 'http://localhost:3000');
});

test('getViewSiteUrl maps admin IPv6 loopback to the local public site', () => {
  assert.equal(getViewSiteUrl('http://[::1]:3001'), 'http://localhost:3000');
});

test('getViewSiteUrl preserves deployed origins', () => {
  assert.equal(getViewSiteUrl('https://boyuchen.dev'), 'https://boyuchen.dev');
});
