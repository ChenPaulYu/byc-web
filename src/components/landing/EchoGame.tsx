/**
 * EchoGame — a wordless call-and-response exchange through the physical MPC.
 * Demo cues reuse registered pad triggers. Success adds a hit, misses replay gently,
 * and every scheduled action cancels on exit/unmount. No tutorial or duplicate controls.
 * Reads: echoRules.ts; owns no audio nodes or scene geometry.
 */
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { INITIAL_ECHO, echoReducer, makeEchoSequence, type EchoKey } from './echoRules';

export interface PadCue { key: EchoKey; id: number }

export function useEchoGame() {
  const [state, dispatch] = useReducer(echoReducer, INITIAL_ECHO);
  const [cue, setCue] = useState<PadCue | null>(null);
  const nonce = useRef(0);
  const emit = useCallback((key: EchoKey) => setCue({ key, id: ++nonce.current }), []);
  const onPad = useCallback((key: string) => dispatch({ type: 'input', key }), []);
  const start = useCallback(() => dispatch({ type: 'start', sequence: makeEchoSequence() }), []);
  const exit = useCallback(() => { dispatch({ type: 'exit' }); setCue(null); }, []);

  useEffect(() => {
    if (state.phase !== 'listen') return;
    setCue(null);
    const count = state.round + 1;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < count; i++) {
      timers.push(setTimeout(() => emit(state.sequence[i]), 850 + i * 650));
      timers.push(setTimeout(() => setCue(null), 1200 + i * 650));
    }
    timers.push(setTimeout(() => dispatch({ type: 'ready' }), 850 + count * 650));
    return () => timers.forEach(clearTimeout);
  }, [state.phase, state.round, state.sequence, state.take, emit]);

  useEffect(() => {
    if (state.phase === 'success') {
      const timer = setTimeout(() => dispatch({ type: 'next' }), 1200);
      return () => clearTimeout(timer);
    }
    if (state.phase === 'miss') {
      const timer = setTimeout(() => dispatch({ type: 'replay' }), 1400);
      return () => clearTimeout(timer);
    }
    if (state.phase === 'complete') {
      const timer = setTimeout(exit, 2200);
      return () => clearTimeout(timer);
    }
  }, [state.phase, exit]);

  return { state, cue, onPad, start, exit };
}
