---
title: "What I Learned Building AI Music Tools"
date: "2024-12-10"
tags: ["AI Music", "DDSP", "LLM"]
category: "technical"
pinned: true
draft: false
---

After years working on AI music generation (DJTransGAN, loop synthesis, now AI TrackMate), I've noticed a pattern: **the more impressive the AI output, the less useful it is to musicians**.

## The "Too Good" Problem

DJTransGAN could generate smooth transitions between any two tracks. Technically impressive. But professional DJs told me: "I don't want perfect transitions—I want control over imperfection."

The AI made decisions they wanted to make themselves.

## Where AI Actually Helps

The best reception came from **analysis tools**, not generative ones:
- Suggesting compatible loops based on timbre and rhythm
- Identifying which frequencies clash in a mix
- Predicting how a track will "feel" in a club vs. headphones

Musicians want **augmentation**, not automation.

## DDSP: A Different Paradigm

Differentiable Digital Signal Processing excites me because it bridges symbolic and audio domains. You can:
- Train models that respect physics (harmonic relationships, resonance)
- Interpret learned parameters as DSP knobs
- Give musicians meaningful control over AI-generated sound

It's less "black box magic," more "intelligent assistant with a physics degree."

## Open Questions

Can LLMs understand music the way they understand text? Early experiments are promising—GPT-4 can discuss harmonic function and suggest chord progressions. But it hallucinates MIDI files that don't make musical sense.

The next breakthrough might come from **multimodal models** trained on both audio and symbolic representations simultaneously.
