/**
 * captions.ts — the one line you get when the camera arrives, and the one door that is a work.
 *
 * 50 Lan cup, preprint, flute, football and the monitor pair speak. The two instruments do not — playing
 * them is the intro. Only FlueBricks (paper and flute) has an href.
 *
 * Reads: nothing. The href matches App.tsx `/projects/:slug`.
 */

export type CaptionSubject = 'mug' | 'paper' | 'flute' | 'football' | 'monitors';

export interface Caption {
  line: string;
  href?: string;
}

export const CAPTIONS: Record<CaptionSubject, Caption> = {
  mug: { line: '50 Lan, shaken.' },
  paper: { line: "FlueBricks, CHI '26.", href: '/projects/fluebricks' },
  flute: { line: 'The kit that paper is about.', href: '/projects/fluebricks' },
  football: { line: 'I love football.' },
  monitors: { line: 'Tannoy Gold 5.' },
};
