/**
 * Loads and caches the public content registry.
 * Reads: `/content.config.json` at runtime.
 */

import type { ContentConfig } from '../types/content';

let configCache: ContentConfig | null = null;

export const loadConfig = async (): Promise<ContentConfig> => {
  if (configCache) return configCache;

  try {
    const response = await fetch('/content.config.json');
    if (!response.ok) {
      throw new Error('Failed to load content configuration');
    }
    configCache = await response.json();
    return configCache!;
  } catch (error) {
    console.error('Error loading config:', error);
    // Return default empty config
    return {
      site: { title: '', description: '', author: '', url: '' },
      about: { source: 'about.md', social: {} },
      projects: [],
      blog: [],
      news: []
    };
  }
};
