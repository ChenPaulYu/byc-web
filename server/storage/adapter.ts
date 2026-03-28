export interface ContentConfig {
  site: {
    title: string;
    description: string;
    author: string;
    url: string;
  };
  about: {
    source: string;
    social: {
      email?: string;
      github?: string;
      linkedin?: string;
      twitter?: string;
      [key: string]: string | undefined;
    };
  };
  projects: Array<{ slug: string; enabled: boolean }>;
  blog: Array<{ slug: string; enabled: boolean }>;
  news: Array<{ slug: string; enabled: boolean }>;
}

export interface ContentItem {
  slug: string;
  metadata: Record<string, unknown>;
  content: string;
}

export type ContentType = 'blog' | 'projects' | 'news';

export interface StorageAdapter {
  listFiles(type: ContentType): Promise<ContentItem[]>;
  readFile(type: ContentType, slug: string): Promise<ContentItem>;
  writeFile(type: ContentType, slug: string, metadata: Record<string, unknown>, content: string): Promise<void>;
  deleteFile(type: ContentType, slug: string): Promise<void>;
  readAbout(): Promise<string>;
  writeAbout(content: string): Promise<void>;
  readConfig(): Promise<ContentConfig>;
  writeConfig(config: ContentConfig): Promise<void>;
  listAssets(directory: string): Promise<string[]>;
  deleteAsset(filePath: string): Promise<void>;
}
