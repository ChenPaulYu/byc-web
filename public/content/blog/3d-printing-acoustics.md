---
title: "Notes on 3D Printing for Acoustic Instruments"
date: "2024-09-12"
tags: ["Digital Fabrication", "Acoustics", "FlueBricks"]
category: "research-note"
pinned: false
draft: false
---

Quick observations from six months of printing flute prototypes.

## Material Matters More Than I Expected

**PLA** (what everyone uses for prototypes):
- Pros: Easy to print, cheap, good dimensional accuracy
- Cons: Absorbs moisture → pitch drift over weeks
- Acoustic properties: Bright, slightly harsh timbre

**ABS**:
- Pros: More stable, slightly warmer sound
- Cons: Warping issues, needs enclosure, fumes
- We switched to this for "final" prototypes

**PETG**:
- Middle ground between PLA and ABS
- Easier to print than ABS, more stable than PLA
- Slightly muted high frequencies (not always bad)

## Print Orientation Affects Tone

**Vertical printing** (along the length of the tube):
- Fewer layer lines in airflow path
- Cleaner higher frequencies
- Longer print time, more support material

**Horizontal printing**:
- Layer lines perpendicular to airflow
- Slight turbulence → breathier tone
- Faster, less waste

For replicas of traditional instruments: print vertically.
For experimental designs: horizontal can be a feature, not a bug.

## The "Good Enough" Resolution

We tested layer heights from 0.1mm to 0.3mm.

**Finding:** 0.2mm is the sweet spot for wind instruments.
- 0.1mm: Marginal acoustic improvement, 2x print time
- 0.3mm: Visible/audible layer artifacts

Exception: Mouthpieces and tone holes need 0.1mm for smooth edges.

## Post-Processing Techniques

**Acetone vapor smoothing** (ABS only):
- Smooths layer lines dramatically
- Changes internal geometry slightly → pitch shifts up ~10 cents
- Unpredictable, hard to control

**Manual sanding:**
- Time-consuming but precise
- Use 400 → 800 → 1200 grit progression
- Only necessary for mouthpiece and edge tones

**Epoxy coating:**
- Seals moisture, improves durability
- Adds mass → lowers pitch ~5-15 cents
- We compensate in the CAD model now

## What Surprised Me

1. **Printer consistency varies** - The same STL file on two "identical" printers can yield instruments that are 20 cents apart in pitch. Calibration is critical.

2. **Annealing helps** - Heating printed PLA parts to 60°C for 30min improves dimensional stability. Pitch drift reduced by ~70%.

3. **Layer orientation and resonance** - Instruments printed with layers parallel to the resonant frequency direction sound... different. Not worse, just different. Still investigating why.

## Next Experiments

- **Multi-material printing** - Soft TPU for mouthpieces, rigid PLA for body
- **Variable infill** - Dense walls, sparse interior for weight reduction
- **Embedded sensors** - Print with pauses to insert pressure/temperature sensors

The goal: instruments that are not just replicas, but designs impossible with traditional manufacturing.
