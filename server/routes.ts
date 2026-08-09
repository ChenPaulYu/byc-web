/**
 * Composes the local admin HTTP API from focused content, asset, and settings registrars.
 * Reads: the configured storage adapter and public directory; writes: registered Express routes.
 */

import { Router } from 'express';
import type { StorageAdapter } from './storage/adapter.js';
import { registerAssetRoutes } from './routes/assets.js';
import { registerContentRoutes } from './routes/content.js';
import { registerSettingsRoutes } from './routes/settings.js';

export function createRoutes(storage: StorageAdapter, publicDir: string): Router {
  const router = Router();
  registerContentRoutes(router, storage);
  registerAssetRoutes(router, storage, publicDir);
  registerSettingsRoutes(router, publicDir);
  return router;
}
