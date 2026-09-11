import assert from 'node:assert/strict';
import test from 'node:test';
import { ECHO_ROUNDS, INITIAL_ECHO, echoReducer, makeEchoSequence, type EchoKey } from './echoRules';

const sequence: EchoKey[] = ['z', 'x', 'c', 'v', 'z', 'c'];
const start = () => echoReducer(INITIAL_ECHO, { type: 'start', sequence });

test('a demonstration cannot accidentally score its own cues', () => {
  const state = start();
  assert.equal(echoReducer(state, { type: 'input', key: 'z' }), state);
  assert.equal(state.phase, 'listen');
});

test('five increasingly long rounds lead to completion', () => {
  let state = start();
  for (let round = 1; round <= ECHO_ROUNDS; round++) {
    assert.equal(state.round, round);
    state = echoReducer(state, { type: 'ready' });
    for (const key of sequence.slice(0, round + 1)) state = echoReducer(state, { type: 'input', key });
    assert.equal(state.phase, round === ECHO_ROUNDS ? 'complete' : 'success');
    if (round !== ECHO_ROUNDS) state = echoReducer(state, { type: 'next' });
  }
  assert.equal(state.index, 6);
});

test('a mistake allows replay of the same round without losing the sequence', () => {
  let state = echoReducer(start(), { type: 'ready' });
  state = echoReducer(state, { type: 'input', key: 'v' });
  assert.equal(state.phase, 'miss');
  const replayed = echoReducer(state, { type: 'replay' });
  assert.equal(replayed.phase, 'listen');
  assert.equal(replayed.round, 1);
  assert.equal(replayed.index, 0);
  assert.equal(replayed.sequence, sequence);
  assert.ok(replayed.take > state.take);
});

test('unrelated pads do not penalize the game and exit clears its state', () => {
  const state = echoReducer(start(), { type: 'ready' });
  assert.equal(echoReducer(state, { type: 'input', key: 'q' }), state);
  assert.deepEqual(echoReducer(state, { type: 'exit' }), INITIAL_ECHO);
  assert.equal(echoReducer(INITIAL_ECHO, { type: 'ready' }), INITIAL_ECHO);
});

test('generated sequences contain six valid, visually distinct consecutive cues', () => {
  for (const random of [() => 0, () => 0.5, () => 0.9999]) {
    const generated = makeEchoSequence(random);
    assert.equal(generated.length, ECHO_ROUNDS + 1);
    generated.forEach((key, index) => {
      assert.ok(['z', 'x', 'c', 'v'].includes(key));
      assert.notEqual(key, generated[index - 1]);
    });
  }
});
