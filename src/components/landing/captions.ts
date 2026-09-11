/**
 * captions.ts — personal object introductions and the grounded FlueBricks project door.
 *
 * 50 Lan cup, preprint, flute, football, Taiwan flag and the monitor pair speak. The two instruments do not — playing
 * them is the intro. Only FlueBricks (paper and flute) has an href.
 *
 * Reads: nothing. The href matches App.tsx `/projects/:slug`.
 */

export type CaptionSubject = 'mug' | 'paper' | 'flute' | 'football' | 'monitors' | 'taiwan';

export interface Caption {
  line: string;
  eyebrow?: string;
  description?: string;
  href?: string;
}

export const CAPTIONS: Record<CaptionSubject, Caption> = {
  taiwan: { line: 'Taiwan No. 1!', description: 'I’m from Taiwan.' },
  mug: { eyebrow: 'OFF THE CLOCK', line: '50 Lan, shaken.', description: 'A little something between making things.' },
  paper: { eyebrow: 'RESEARCH / CHI 2026', line: 'What if you could build a sound?', description: 'FlueBricks turns instrument-making into a way of thinking: build, listen, and revise. A study with 12 participants explores that loop.', href: '/projects/fluebricks' },
  flute: { eyebrow: 'FLUEBRICKS / RESEARCH', line: 'A sound you can take apart.', description: 'Generators, resonators, connectors. A modular flute-like instrument for exploring how structure shapes sound.', href: '/projects/fluebricks' },
  football: { eyebrow: 'AWAY FROM THE DESK', line: 'I love football.' },
  monitors: { eyebrow: 'LISTENING / TANNOY GOLD 5', line: 'The other half of making.' },
};
