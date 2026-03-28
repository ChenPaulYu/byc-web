import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import type { StorageAdapter, ContentConfig, ContentItem, ContentType } from './adapter.js';

export class LocalStorageAdapter implements StorageAdapter {
  private contentDir: string;
  private configPath: string;

  constructor(publicDir: string) {
    this.contentDir = path.join(publicDir, 'content');
    this.configPath = path.join(publicDir, 'content.config.json');
  }

  async listFiles(type: ContentType): Promise<ContentItem[]> {
    const dir = path.join(this.contentDir, type);
    let filenames: string[];
    try {
      filenames = await fs.readdir(dir);
    } catch {
      return [];
    }

    const items: ContentItem[] = [];
    for (const filename of filenames) {
      if (!filename.endsWith('.md')) continue;
      const slug = filename.replace('.md', '');
      try {
        const item = await this.readFile(type, slug);
        items.push(item);
      } catch {
        // Skip files that fail to parse
      }
    }
    return items;
  }

  async readFile(type: ContentType, slug: string): Promise<ContentItem> {
    const filePath = path.join(this.contentDir, type, `${slug}.md`);
    const raw = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(raw);
    return { slug, metadata: data, content };
  }

  async writeFile(type: ContentType, slug: string, metadata: Record<string, unknown>, content: string): Promise<void> {
    const dir = path.join(this.contentDir, type);
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${slug}.md`);
    const fileContent = matter.stringify(content, metadata);
    await fs.writeFile(filePath, fileContent, 'utf-8');
  }

  async deleteFile(type: ContentType, slug: string): Promise<void> {
    const filePath = path.join(this.contentDir, type, `${slug}.md`);
    await fs.unlink(filePath);
  }

  async readAbout(): Promise<string> {
    const config = await this.readConfig();
    const filePath = path.join(this.contentDir, config.about.source);
    return fs.readFile(filePath, 'utf-8');
  }

  async writeAbout(content: string): Promise<void> {
    const config = await this.readConfig();
    const filePath = path.join(this.contentDir, config.about.source);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async readConfig(): Promise<ContentConfig> {
    const raw = await fs.readFile(this.configPath, 'utf-8');
    return JSON.parse(raw);
  }

  async writeConfig(config: ContentConfig): Promise<void> {
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  }
}
