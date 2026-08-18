/**
 * The click browsers require before audio may start. Name and a way in — this is a personal
 * site, not a sampler running a self-test.
 *
 * Lives outside the Canvas on purpose: importing this file must not pull three.js. Home shows
 * this first, then lazy-loads the instrument.
 */

import React from 'react';

export const WelcomeScreen: React.FC<{ onEnter: () => void; fadeOut?: boolean }> = ({ onEnter, fadeOut }) => (
  <div
    className={`absolute inset-0 z-30 bg-[#f9fafb] flex flex-col items-center justify-center cursor-pointer select-none transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    onClick={onEnter}
  >
    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 mb-3">
      Bo-Yu Chen
    </h1>
    <p className="text-neutral-500 font-mono text-sm sm:text-base tracking-wide mb-10">
      Researcher // Engineer // Creator
    </p>

    <button
      onClick={onEnter}
      aria-label="Enter the interactive scene"
      className="group flex items-center gap-3 px-6 py-3 rounded-full border border-neutral-300 text-neutral-600 hover:border-neutral-900 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f9fafb] transition-all duration-300"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="group-hover:scale-110 transition-transform" aria-hidden="true">
        <polygon points="3,1 13,8 3,15" />
      </svg>
      <span className="text-sm font-medium tracking-wide uppercase">Power on</span>
    </button>
  </div>
);
