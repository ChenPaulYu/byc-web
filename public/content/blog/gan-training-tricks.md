---
title: "Practical GAN Training for Audio: Lessons from DJTransGAN"
date: "2024-07-02"
tags: ["GANs", "Machine Learning", "Audio Processing"]
category: "technical"
pinned: false
draft: false
---

Training GANs on audio is harder than images. Here's what worked for DJTransGAN after months of failed experiments.

## Problem: Spectral Instability

Audio GANs collapse in weird ways. Instead of mode collapse (all outputs identical), you get **spectral collapse**—outputs that *look* different but sound like filtered noise.

### What Didn't Work
- Standard WGAN-GP → collapsed after ~20k iterations
- Progressive growing (like ProGAN) → phase alignment issues
- Simple MSE loss → blurry frequency content

### What Worked
**Multi-scale STFT loss** combined with adversarial loss:

```python
def multi_scale_stft_loss(real, fake):
    losses = []
    for fft_size in [2048, 1024, 512, 256]:
        real_spec = stft(real, fft_size)
        fake_spec = stft(fake, fft_size)
        losses.append(l1_loss(real_spec, fake_spec))
    return sum(losses)

total_loss = adversarial_loss + 10.0 * multi_scale_stft_loss(real, fake)
```

The key: **10.0 weight** on STFT loss. GANs are unstable; guide them with perceptual losses.

## Problem: Transition Artifacts

DJTransGAN generates 4-second transitions. Without careful design, you hear clicks at splice points.

### Solution: Overlap-Add with Learned Windows

Instead of hard splicing, the generator outputs:
1. Audio segment
2. Fade-in/fade-out curves (learned, not fixed)

```python
fade_in = sigmoid(generator.fade_network(context))
fade_out = 1.0 - fade_in
mixed = audio_a * fade_out + audio_b * fade_in
```

The network learns context-dependent crossfades. For bass-heavy mixes, it fades slower. For high-energy breaks, faster.

## Problem: Dataset Mismatch

DJ mixes are long (60+ minutes). Transitions happen rarely. If you sample randomly:
- 95% of training data is "not a transition"
- Model learns to output stable audio (boring)

### Solution: Transition-Centric Sampling

1. Pre-process mixes to detect transition regions (beat tracking + spectral change)
2. Oversample transition segments 5:1 vs. stable segments
3. Add data augmentation: time-stretch, pitch-shift, EQ

This biases the model toward interesting transitions rather than safe stability.

## Problem: Evaluation Metrics

How do you measure "good DJ transition"?
- FID score (image metrics) → meaningless for audio
- MSE on waveforms → meaningless for phase-shifted audio
- Spectral distance → doesn't capture rhythmic coherence

### Solution: Human Evaluation + Proxy Metrics

We ran blind A/B tests (human DJs vs. model) but also tracked:
- **Beat alignment error**: How far off-beat are transitions?
- **Spectral smoothness**: Rate of change in frequency content
- **Energy consistency**: RMS level stability across transition

These correlate ~70% with human preference. Good enough for development iteration.

## The One Trick That Actually Mattered

**Differentiable audio effects** in the generator.

Instead of learning to generate audio directly, the generator outputs:
- Short pre-transition segment
- Effect parameters (EQ curves, reverb decay, crossfade shape)
- Short post-transition segment

A differentiable DSP layer applies effects. This:
- Reduces search space (easier to learn)
- Guarantees physical plausibility
- Allows human override (tweak effect params manually)

Think of the GAN as learning to **control a DJ mixer**, not synthesize from scratch.

## Compute Budget Reality Check

Training DJTransGAN:
- **Dataset**: 200 hours of DJ mixes
- **Hardware**: 4x NVIDIA V100 GPUs
- **Training time**: 5 days
- **Total iterations**: ~100k
- **Failed experiments before success**: 12+

Audio GANs are expensive. Budget accordingly.

---

**Code:** [github.com/chenpaulyu/djtransgan](https://github.com) (hypothetical link)
**Paper:** ICASSP 2022
