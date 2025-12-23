---
title: "Three Years with Web Audio API: What I Wish I Knew"
date: "2024-11-20"
tags: ["Web Audio", "JavaScript", "Performance"]
category: "technical"
pinned: false
draft: false
---

I've shipped multiple Web Audio projects now (TMC-CL1, Taptap, and various prototypes). Here's what I learned the hard way.

## 1. AudioContext State Management Is Everything

Your `AudioContext` will suspend automatically on mobile Safari if you don't create it in response to a user gesture. This isn't a bug—it's by design.

**Wrong approach:**
```javascript
const audioContext = new AudioContext();
// Later, on button click...
oscillator.start();
```

**Right approach:**
```javascript
let audioContext = null;

button.addEventListener('click', () => {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  // Now safe to use
});
```

## 2. Tone.js vs. Raw Web Audio API

I used to think Tone.js was "training wheels." After building TMC-CL1, I realized it's more like a well-designed standard library.

**Use raw Web Audio API when:**
- You need precise control over node graphs
- Performance is critical (game audio, real-time synthesis)
- You're building a library/framework

**Use Tone.js when:**
- You need timing and scheduling (most music apps)
- You want transport controls (play, pause, loop)
- You're prototyping quickly

For TMC-CL1, we use Tone.js for sequencing and raw nodes for custom DSP chains. Best of both worlds.

## 3. Sample Loading Strategies

Loading 100+ audio samples on page load kills performance. Here's what works:

```javascript
// Bad: Load everything upfront
const samples = await Promise.all(urls.map(loadSample));

// Good: Lazy load on first use
const sampleCache = new Map();

async function getSample(url) {
  if (!sampleCache.has(url)) {
    sampleCache.set(url, loadSample(url));
  }
  return await sampleCache.get(url);
}
```

Even better: Use Web Workers to decode audio off the main thread.

## 4. Mobile Safari Quirks

- **No background audio by default** - Your context suspends when the user switches tabs
- **Sample rate constraints** - Locked to device hardware (usually 48kHz)
- **Buffer size limitations** - ScriptProcessorNode is deprecated but AudioWorklet has iOS version requirements
- **Autoplay policy** - More restrictive than Chrome

Test on real iOS devices. The iOS simulator lies.

## 5. Debugging Audio Graphs

Chrome DevTools has a hidden gem: **Web Audio Inspector** (`chrome://webaudio-internals`)

It shows:
- Active AudioContexts
- Node connections
- Buffer underruns
- CPU usage per node

This saved me countless hours debugging a feedback loop in a custom delay effect.

## What I'm Exploring Next

**AudioWorklet** is the future, but adoption is slow. I'm prototyping a polyfill that:
- Uses AudioWorklet on modern browsers
- Falls back to ScriptProcessorNode gracefully
- Shares the same API surface

The goal: write once, run everywhere—even on Safari from 2019.

---

**Resources:**
- [MDN Web Audio API docs](https://developer.mozilla.org)
- [Tone.js documentation](https://tonejs.github.io)
- [Web Audio Conference papers](https://webaudioconf.com)
