import assert from 'node:assert/strict';
import test from 'node:test';
import { CAPTIONS } from './captions';

test('Taiwan flag introduces the owner without a tutorial or project link', () => {
  assert.equal(CAPTIONS.taiwan.line, 'Taiwan No. 1!');
  assert.equal(CAPTIONS.taiwan.description, 'I’m from Taiwan.');
  assert.equal(CAPTIONS.taiwan.href, undefined);
});
