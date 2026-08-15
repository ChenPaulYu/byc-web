/**
 * Barrel for the audio subsystem. Exports behaviour only — never a node, never the engine
 * instance — so every caller outside this folder stays ignorant of what an `AudioNode` is.
 *
 * `loadPadSample` and `loadBed` take a filename rather than a buffer for the same reason: the
 * hook above knows that a pad key maps to a file, this folder knows how a file becomes sound,
 * and neither has to learn the other's half.
 */

import { engine } from './engine';

export const resume = (): Promise<void> => engine.resume();
export const triggerPad = (key: string): void => engine.triggerPad(key);
export const setParam = (index: number, value: number): void => engine.setParam(index, value);
export const setChannel = (index: number, value: number): void => engine.setChannel(index, value);
export const startBed = (): void => engine.startBed();
export const stopBed = (): void => engine.stopBed();
export const getLevel = (): number => engine.getLevel();
export const getSpectrum = (target: Uint8Array): number => engine.getSpectrum(target);
export const loadPadSample = (key: string, filename: string): Promise<void> =>
  engine.loadPadSample(key, filename);
export const loadBed = (filename: string): Promise<void> => engine.loadBed(filename);
