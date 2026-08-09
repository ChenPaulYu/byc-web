/**
 * Registers CV and MPC JSON configuration routes for the local admin API.
 * Reads: JSON configuration files under the public directory; writes: updated JSON files.
 */

import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';

export function registerSettingsRoutes(router: Router, publicDir: string): void {
  // CV Config
  router.get('/cv-config', async (_req, res) => {
    try {
      const raw = await fs.readFile(path.join(publicDir, 'cv.config.json'), 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.status(500).json({ error: 'Failed to read CV config' });
    }
  });

  router.put('/cv-config', async (req, res) => {
    try {
      await fs.writeFile(
        path.join(publicDir, 'cv.config.json'),
        JSON.stringify(req.body, null, 2) + '\n',
        'utf-8'
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to update CV config' });
    }
  });

  // MPC Config
  router.get('/mpc-config', async (_req, res) => {
    try {
      const raw = await fs.readFile(path.join(publicDir, 'mpc.config.json'), 'utf-8');
      res.json(JSON.parse(raw));
    } catch {
      res.status(500).json({ error: 'Failed to read MPC config' });
    }
  });

  router.put('/mpc-config', async (req, res) => {
    try {
      await fs.writeFile(
        path.join(publicDir, 'mpc.config.json'),
        JSON.stringify(req.body, null, 2) + '\n',
        'utf-8'
      );
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to update MPC config' });
    }
  });
}
