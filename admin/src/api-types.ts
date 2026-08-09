/**
 * Shared contracts for the local and GitHub admin API implementations.
 * Reads: none.
 */

export type ContentType = 'blog' | 'projects' | 'news';

export interface ContentItem {
  slug: string;
  metadata: Record<string, unknown>;
  content: string;
}

export interface ContentConfig {
  site: { title: string; description: string; author: string; url: string };
  about: { source: string; social: Record<string, string | undefined> };
  projects: Array<{ slug: string; enabled: boolean }>;
  blog: Array<{ slug: string; enabled: boolean }>;
  news: Array<{ slug: string; enabled: boolean }>;
}

export interface MpcAssets {
  samples: string[];
  hasModel: boolean;
  hasVideo: boolean;
}

export interface MpcConfig {
  bpm: number;
  loop: string;
  pads: Record<string, string>;
}
