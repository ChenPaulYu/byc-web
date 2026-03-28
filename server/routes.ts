import { Router, Request, Response } from 'express';
import type { StorageAdapter, ContentType } from './storage/adapter.js';

export function createRoutes(storage: StorageAdapter): Router {
  const router = Router();

  // List all items of a type
  router.get('/content/:type', async (req: Request, res: Response) => {
    const type = req.params.type as ContentType;
    if (type !== 'blog' && type !== 'projects') {
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
    if (type !== 'blog' && type !== 'projects') {
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
    if (type !== 'blog' && type !== 'projects') {
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
    if (type !== 'blog' && type !== 'projects') {
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
    if (type !== 'blog' && type !== 'projects') {
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

  return router;
}
