/**
 * Barrel for the audio subsystem. Exports only the engine's behaviour — `resume`, `triggerPad`,
 * `setParam`, `startBed`, `stopBed`, `getLevel` — never a node or the engine instance itself, so
 * every caller outside this folder stays ignorant of what an `AudioNode` is. Nothing imports
 * this module yet; it lands wired to nothing until a later step points a component at it.
 */

import { engine } from './engine';

export const resume = (): Promise<void> => engine.resume();
export const triggerPad = (key: string): void => engine.triggerPad(key);
export const setParam = (index: number, value: number): void => engine.setParam(index, value);
export const startBed = (): void => engine.startBed();
export const stopBed = (): void => engine.stopBed();
export const getLevel = (): number => engine.getLevel();
