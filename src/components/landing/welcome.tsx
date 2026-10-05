/**
 * The click browsers require before audio may start. Name and a way in — this is a personal
 * site, not a sampler running a self-test.
 *
 * Lives outside the Canvas on purpose: importing this file must not pull three.js. Home shows
 * this first, then keeps it in place while the instrument loads behind it. Only a rendered
 * room (or usable error fallback) starts the fade. Navigation is available before and during entry.
 */

import React from 'react';
import { SceneNavigation } from './fallback';

export const WelcomeScreen: React.FC<{ onEnter: () => void; onIntent?: () => void; fadeOut?: boolean; loading?: boolean }> = ({ onEnter, onIntent, fadeOut, loading }) => (
  <div
    data-entry-screen
    data-scene-loading={loading ? '' : undefined}
    inert={fadeOut}
    aria-hidden={fadeOut}
    className={`absolute inset-0 z-30 bg-[#f9fafb] flex flex-col items-center justify-center select-none transition-opacity duration-500 motion-reduce:transition-none ${loading ? '' : 'cursor-pointer'} ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    onClick={loading ? undefined : onEnter}
  >
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-3">
      Bo-Yu Chen
    </h1>
    <p className="text-neutral-500 font-mono text-sm sm:text-base tracking-wide mb-10">
      Researcher // Engineer // Builder
    </p>

    <button
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onPointerDown={onIntent}
      onClick={onEnter}
      disabled={loading}
      aria-label="Enter the interactive scene"
      className="group flex items-center gap-3 px-6 py-3 rounded-full border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9fafb] transition-all duration-300"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="group-hover:scale-110 transition-transform" aria-hidden="true">
        <polygon points="3,1 13,8 3,15" />
      </svg>
      <span role={loading ? 'status' : undefined} className="text-sm font-medium tracking-wide uppercase">{loading ? 'Loading studio…' : 'Power on'}</span>
    </button>
    <div className="absolute bottom-10 inset-x-6"><SceneNavigation /></div>
  </div>
);
