/**
 * Registers image and MPC asset upload routes for the local admin API.
 * Reads: upload requests, local public files, and the storage adapter; writes: public assets.
 */

import { Router } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter } from '../storage/adapter.js';

export function registerAssetRoutes(router: Router, storage: StorageAdapter, publicDir: string): void {
  // Image upload multer config
  const imageUpload = multer({
    storage: multer.diskStorage({
      destination: async (_req, _file, cb) => {
        const dir = path.join(publicDir, 'images');
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext)
          .toLowerCase().replace(/[^a-z0-9]+/g, '-');
        cb(null, `${name}-${Date.now()}${ext}`);
      },
    }),
    fileFilter: (_req, file, cb) => {
      const allowed = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
      cb(null, allowed.test(file.originalname));
    },
    limits: { fileSize: 10 * 1024 * 1024 },
  });

  const assetUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => { cb(null, publicDir); },
      filename: (_req, file, cb) => { cb(null, file.originalname); },
    }),
    limits: { fileSize: 50 * 1024 * 1024 },
  });

  // Image routes
  router.get('/images', async (_req, res) => {
    try {
      const files = await storage.listAssets('images');
      res.json(files);
    } catch { res.status(500).json({ error: 'Failed to list images' }); }
  });

  router.post('/images', imageUpload.single('file'), (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
    res.status(201).json({ filename: req.file.filename, path: `/images/${req.file.filename}` });
  });

  router.delete('/images/:filename', async (req, res) => {
    try {
      await storage.deleteAsset(`images/${req.params.filename}`);
      res.json({ deleted: req.params.filename });
    } catch { res.status(500).json({ error: 'Failed to delete image' }); }
  });

  // MPC asset routes
  router.get('/assets/mpc', async (_req, res) => {
    try {
      const samples = await storage.listAssets('samples');
      const hasModel = await fs.access(path.join(publicDir, 'model.glb')).then(() => true).catch(() => false);
      const hasVideo = await fs.access(path.join(publicDir, 'animation.mp4')).then(() => true).catch(() => false);
      res.json({ samples, hasModel, hasVideo });
    } catch { res.status(500).json({ error: 'Failed to list MPC assets' }); }
  });

  router.post('/assets/sample', assetUpload.single('file'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file' }); return; }
    const dest = path.join(publicDir, 'samples', req.file.originalname);
    await fs.mkdir(path.join(publicDir, 'samples'), { recursive: true });
    await fs.rename(req.file.path, dest);
    res.status(201).json({ filename: req.file.originalname });
  });

  router.delete('/assets/sample/:filename', async (req, res) => {
    try {
      await storage.deleteAsset(`samples/${req.params.filename}`);
      res.json({ deleted: req.params.filename });
    } catch { res.status(500).json({ error: 'Failed to delete sample' }); }
  });

  router.post('/assets/model', assetUpload.single('file'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file' }); return; }
    const dest = path.join(publicDir, 'model.glb');
    await fs.rename(req.file.path, dest);
    res.status(201).json({ filename: 'model.glb' });
  });

  router.post('/assets/video', assetUpload.single('file'), async (req, res) => {
    if (!req.file) { res.status(400).json({ error: 'No file' }); return; }
    const dest = path.join(publicDir, 'animation.mp4');
    await fs.rename(req.file.path, dest);
    res.status(201).json({ filename: 'animation.mp4' });
  });
}
