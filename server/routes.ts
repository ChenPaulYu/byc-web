import { Router, Request, Response } from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import type { StorageAdapter, ContentType } from './storage/adapter.js';

export function createRoutes(storage: StorageAdapter, publicDir: string): Router {
  const router = Router();

  // List all items of a type
  router.get('/content/:type', async (req: Request, res: Response) => {
    const type = req.params.type as ContentType;
    if (type !== 'blog' && type !== 'projects' && type !== 'news') {
      res.status(400).json({ error: 'Invalid content type. Use "blog" or "projects".' });
      return;
    }
    try {
      const items = await storage.listFiles(type);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: `Failed to list ${type}` });
    }
  });

  // Read single item
  router.get('/content/:type/:slug', async (req: Request, res: Response) => {
    const { type, slug } = req.params;
    if (type !== 'blog' && type !== 'projects' && type !== 'news') {
      res.status(400).json({ error: 'Invalid content type.' });
      return;
    }
    try {
      const item = await storage.readFile(type as ContentType, slug);
      res.json(item);
    } catch {
      res.status(404).json({ error: `${type}/${slug} not found` });
    }
  });

  // Create new item
  router.post('/content/:type', async (req: Request, res: Response) => {
    const type = req.params.type as ContentType;
    if (type !== 'blog' && type !== 'projects' && type !== 'news') {
      res.status(400).json({ error: 'Invalid content type.' });
      return;
    }
    const { slug, metadata, content } = req.body;
    if (!slug || !metadata || content === undefined) {
      res.status(400).json({ error: 'Missing slug, metadata, or content' });
      return;
    }

    // Check if file already exists
    try {
      await storage.readFile(type, slug);
      res.status(409).json({ error: `${type}/${slug} already exists` });
      return;
    } catch {
      // File doesn't exist — good
    }

    try {
      await storage.writeFile(type, slug, metadata, content);
      // Add to config
      const config = await storage.readConfig();
      config[type].push({ slug, enabled: true });
      await storage.writeConfig(config);
      res.status(201).json({ slug });
    } catch (err) {
      res.status(500).json({ error: `Failed to create ${type}/${slug}` });
    }
  });

  // Update existing item
  router.put('/content/:type/:slug', async (req: Request, res: Response) => {
    const { type, slug } = req.params;
    if (type !== 'blog' && type !== 'projects' && type !== 'news') {
      res.status(400).json({ error: 'Invalid content type.' });
      return;
    }
    const { metadata, content } = req.body;
    if (!metadata || content === undefined) {
      res.status(400).json({ error: 'Missing metadata or content' });
      return;
    }
    try {
      await storage.writeFile(type as ContentType, slug, metadata, content);
      res.json({ slug });
    } catch {
      res.status(500).json({ error: `Failed to update ${type}/${slug}` });
    }
  });

  // Delete item
  router.delete('/content/:type/:slug', async (req: Request, res: Response) => {
    const { type, slug } = req.params;
    if (type !== 'blog' && type !== 'projects' && type !== 'news') {
      res.status(400).json({ error: 'Invalid content type.' });
      return;
    }
    try {
      await storage.deleteFile(type as ContentType, slug);
      // Remove from config
      const config = await storage.readConfig();
      config[type as ContentType] = config[type as ContentType].filter(
        (item: { slug: string }) => item.slug !== slug
      );
      await storage.writeConfig(config);
      res.json({ deleted: slug });
    } catch {
      res.status(500).json({ error: `Failed to delete ${type}/${slug}` });
    }
  });

  // About page
  router.get('/about', async (_req: Request, res: Response) => {
    try {
      const content = await storage.readAbout();
      res.json({ content });
    } catch {
      res.status(500).json({ error: 'Failed to read about page' });
    }
  });

  router.put('/about', async (req: Request, res: Response) => {
    const { content } = req.body;
    if (content === undefined) {
      res.status(400).json({ error: 'Missing content' });
      return;
    }
    try {
      await storage.writeAbout(content);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to update about page' });
    }
  });

  // Config
  router.get('/config', async (_req: Request, res: Response) => {
    try {
      const config = await storage.readConfig();
      res.json(config);
    } catch {
      res.status(500).json({ error: 'Failed to read config' });
    }
  });

  router.put('/config', async (req: Request, res: Response) => {
    try {
      await storage.writeConfig(req.body);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to update config' });
    }
  });

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

  return router;
}
