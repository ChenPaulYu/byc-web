---
title: "DJTransGAN"
date: "2022-05-01"
year: "2022"
category: "Research"
role: "AI Researcher"
tags: ["AI Music", "GANs", "Python", "Audio Processing"]
cover: "https://picsum.photos/600/401?grayscale"
pinned: false
importance: 4
links:
  - label: "Paper"
    url: "#"
    icon: "paper"
  - label: "Code"
    url: "#"
    icon: "code"
---

The first AI model for generating smooth DJ-like transitions between audio tracks. Published at ICASSP 2022.

## Motivation

Professional DJs craft seamless transitions using beatmatching, EQ adjustments, and creative effects. Can we teach a neural network to do the same?

## Method

DJTransGAN uses a Generative Adversarial Network architecture with:
- Audio feature encoders trained on DJ mix datasets
- Differentiable audio effects (EQ, crossfading, reverb)
- A discriminator that learned to distinguish human vs. AI transitions

## Results

The model generates transitions that:
- Maintain rhythmic coherence across tempo changes
- Apply appropriate frequency masking
- Introduce creative effects at transition points

## Impact

Open-sourced on GitHub with **90+ stars**. Developed during my research internship at Sony Group Corporation's Creative AI Lab (remote from Tokyo, 2020-2021).
