/**
 * Owns development-only dat.gui controls for the MPC layout. Physical size is viewport-invariant;
 * shot.ts owns responsive framing for the whole scene.
 * Reads: Vite development flags and the canonical layout defaults.
 * Writes: layout state and a temporary dat.gui panel in development.
 */

import { useEffect, useState } from 'react';
import * as dat from 'dat.gui';
import {
  COL_KNOBS_X,
  COL_KNOBS_WIDTH,
  COL_PADS_WIDTH,
  COL_PADS_X,
  COL_SCREEN_WIDTH,
  COL_SCREEN_X,
  CONTAINER_DEPTH,
  CONTAINER_WIDTH,
  DEFAULT_MPC_POSITIONS,
  ROW_LOGO_Z,
  ROW_MAIN_Z,
  type MpcPositions,
} from './layout';

const DEV_CONTROLS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_CONTROLS === 'true';

if (import.meta.env.DEV) {
  console.log('🔧 Dev Controls Status:', {
    isDev: import.meta.env.DEV,
    envVar: import.meta.env.VITE_ENABLE_DEV_CONTROLS,
    enabled: DEV_CONTROLS_ENABLED
  });
}

export interface LayoutControls {
  positions: MpcPositions;
  stride: number;
}

export function useLayoutControls(): LayoutControls {
  const [positions, setPositions] = useState<MpcPositions>(DEFAULT_MPC_POSITIONS);
  const stride = positions.padSize + positions.padSpacing;

  useEffect(() => {
    // Only create dat.gui in development mode with dev controls enabled
    if (!DEV_CONTROLS_ENABLED) return;

    const gui = new dat.GUI();

    // Create a proxy object to prevent direct mutation
    const guiProxy = { ...positions };

    const containerFolder = gui.addFolder('Container');
    containerFolder.add(guiProxy, 'containerX', -3, 3).step(0.01).name('Container X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, containerX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Container X: ${value}`);
    });
    containerFolder.add(guiProxy, 'containerZ', -3, 3).step(0.01).name('Container Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, containerZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Container Z: ${value}`);
    });
    containerFolder.open();

    const padFolder = gui.addFolder('Pads Section');
    padFolder.add(guiProxy, 'padsSectionX', -3, 3).step(0.01).name('Section X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padsSectionX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pads Section X: ${value}`);
    });
    padFolder.add(guiProxy, 'padsSectionZ', -3, 3).step(0.01).name('Section Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padsSectionZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pads Section Z: ${value}`);
    });
    padFolder.add(guiProxy, 'padSize', 0.3, 2).step(0.01).name('Pad Size').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padSize: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pad Size: ${value}`);
    });
    padFolder.add(guiProxy, 'padSpacing', 0.05, 0.5).step(0.01).name('Pad Spacing').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padSpacing: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pad Spacing: ${value}`);
    });
    padFolder.add(guiProxy, 'padHeight', 0.1, 0.5).step(0.01).name('Pad Height').onChange((value: number) => {
      setPositions(prev => ({ ...prev, padHeight: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Pad Height: ${value}`);
    });
    padFolder.open();

    const logoFolder = gui.addFolder('Logo');
    logoFolder.add(guiProxy, 'logoMainSize', 0.1, 0.5).step(0.001).name('Main Text Size').onChange((value: number) => {
      setPositions(prev => ({ ...prev, logoMainSize: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Logo Main Size: ${value}`);
    });
    logoFolder.add(guiProxy, 'logoSubSize', 0.05, 0.2).step(0.001).name('Logo Sub Size').onChange((value: number) => {
      setPositions(prev => ({ ...prev, logoSubSize: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Logo Sub Size: ${value}`);
    });
    logoFolder.open();

    const screenFolder = gui.addFolder('Screen Section');
    screenFolder.add(guiProxy, 'screenSectionX', -3, 3).step(0.01).name('Section X').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenSectionX: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Section X: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenSectionZ', -3, 3).step(0.01).name('Section Z').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenSectionZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Section Z: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenWidth', 0.5, 5).step(0.1).name('Screen Width').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenWidth: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Width: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenDepth', 0.5, 4).step(0.1).name('Screen Depth').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenDepth: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Depth: ${value}`);
    });
    screenFolder.add(guiProxy, 'screenHeight', 0.05, 0.5).step(0.01).name('Screen Height').onChange((value: number) => {
      setPositions(prev => ({ ...prev, screenHeight: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Screen Height: ${value}`);
    });
    // Bezel controls removed per user request
    screenFolder.add(guiProxy, 'avatarScale', 0.1, 2).step(0.01).name('Avatar Scale').onChange((value: number) => {
      setPositions(prev => ({ ...prev, avatarScale: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Avatar Scale: ${value}`);
    });



    screenFolder.open();

    const buttonsFolder = gui.addFolder('Transport Buttons');
    buttonsFolder.add(guiProxy, 'buttonsOffsetZ', 0, 2).step(0.01).name('Z Offset').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonsOffsetZ: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Buttons Z Offset: ${value}`);
    });
    buttonsFolder.add(guiProxy, 'buttonSpacing', 0.2, 1).step(0.01).name('Button Spacing').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonSpacing: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Button Spacing: ${value}`);
    });
    buttonsFolder.add(guiProxy, 'buttonWidth', 0.3, 1).step(0.01).name('Button Width').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonWidth: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Button Width: ${value}`);
    });
    buttonsFolder.add(guiProxy, 'buttonHeight', 0.2, 0.6).step(0.01).name('Button Height').onChange((value: number) => {
      setPositions(prev => ({ ...prev, buttonHeight: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Button Height: ${value}`);
    });
    buttonsFolder.open();

    const knobsFolder = gui.addFolder('Knobs');
    knobsFolder.add(guiProxy, 'knobSpacing', 0.2, 1).step(0.01).name('Knob Spacing').onChange((value: number) => {
      setPositions(prev => ({ ...prev, knobSpacing: value }));
      if (DEV_CONTROLS_ENABLED) console.log(`Knob Spacing: ${value}`);
    });
    knobsFolder.open();

    const logButton = {
      logCurrentValues: () => {
        if (DEV_CONTROLS_ENABLED) {
          console.log('=== CURRENT MPC LAYOUT VALUES ===');
          console.log('Container:', { x: positions.containerX, z: positions.containerZ });
          console.log('Grid System:', {
            containerWidth: CONTAINER_WIDTH,
            containerDepth: CONTAINER_DEPTH,
            columnWidths: { pads: COL_PADS_WIDTH, screen: COL_SCREEN_WIDTH, knobs: COL_KNOBS_WIDTH },
            columnPositions: { pads: COL_PADS_X, screen: COL_SCREEN_X, knobs: COL_KNOBS_X },
            rowPositions: { logo: ROW_LOGO_Z, main: ROW_MAIN_Z }
          });
          console.log('Pads Section:', { x: positions.padsSectionX, z: positions.padsSectionZ, size: positions.padSize, spacing: positions.padSpacing, height: positions.padHeight });
          console.log('Screen Section:', { x: positions.screenSectionX, z: positions.screenSectionZ, width: positions.screenWidth, depth: positions.screenDepth, height: positions.screenHeight });
          console.log('Logo Size:', { mainSize: positions.logoMainSize, subSize: positions.logoSubSize });
          console.log('Avatar Scale:', positions.avatarScale);
          console.log('Transport Buttons:', { zOffset: positions.buttonsOffsetZ });
          console.log('=== END VALUES ===');
        }
      }
    };
    gui.add(logButton, 'logCurrentValues').name('📋 Log All Values');

    return () => gui.destroy();
  }, []);

  useEffect(() => {
    if (DEV_CONTROLS_ENABLED) {
      console.log('🔄 Layout Update - Current State:', {
        padSize: positions.padSize,
        padSpacing: positions.padSpacing,
        screenWidth: positions.screenWidth,
        screenDepth: positions.screenDepth,
        avatarScale: positions.avatarScale
      });
    }
  }, [positions]);

  return { positions, stride };
}
