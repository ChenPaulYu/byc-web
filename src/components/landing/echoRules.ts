/** Echo Desk's pure rules. UI, audio and timers send actions; none live in this module. */
export const ECHO_KEYS = ['z', 'x', 'c', 'v'] as const;
export const ECHO_ROUNDS = 5;
export type EchoKey = typeof ECHO_KEYS[number];
export type EchoPhase = 'idle' | 'listen' | 'answer' | 'success' | 'miss' | 'complete';
export interface EchoState {
  phase: EchoPhase;
  sequence: EchoKey[];
  round: number;
  index: number;
  take: number;
}
export const INITIAL_ECHO: EchoState = { phase: 'idle', sequence: [], round: 1, index: 0, take: 0 };
export type EchoAction =
  | { type: 'start'; sequence: EchoKey[] }
  | { type: 'ready' }
  | { type: 'input'; key: string }
  | { type: 'next' }
  | { type: 'replay' }
  | { type: 'exit' };

/** Avoid adjacent repeats so even a muted visitor can distinguish each visual cue. */
export function makeEchoSequence(random: () => number = Math.random): EchoKey[] {
  const result: EchoKey[] = [];
  for (let i = 0; i < ECHO_ROUNDS + 1; i++) {
    const choices = ECHO_KEYS.filter(key => key !== result[i - 1]);
    result.push(choices[Math.min(choices.length - 1, Math.floor(Math.max(0, random()) * choices.length))]);
  }
  return result;
}

export function echoReducer(state: EchoState, action: EchoAction): EchoState {
  switch (action.type) {
    case 'start': return { phase: 'listen', sequence: action.sequence, round: 1, index: 0, take: state.take + 1 };
    case 'exit': return { ...INITIAL_ECHO };
    case 'ready': return state.phase === 'listen' ? { ...state, phase: 'answer' } : state;
    case 'replay': return state.phase !== 'idle' && state.phase !== 'complete'
      ? { ...state, phase: 'listen', index: 0, take: state.take + 1 } : state;
    case 'next': return state.phase === 'success'
      ? { ...state, phase: 'listen', round: state.round + 1, index: 0, take: state.take + 1 } : state;
    case 'input': {
      if (state.phase !== 'answer' || !ECHO_KEYS.includes(action.key as EchoKey)) return state;
      if (action.key !== state.sequence[state.index]) return { ...state, phase: 'miss' };
      const index = state.index + 1;
      const finished = index === state.round + 1;
      return { ...state, index, phase: finished ? state.round === ECHO_ROUNDS ? 'complete' : 'success' : 'answer' };
    }
  }
}
