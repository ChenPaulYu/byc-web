/**
 * Fetches and parses Markdown content from the public content boundary.
 * Reads: `public/content/` at runtime.
 */

import matter from 'gray-matter';
import type {
  BlogMetadata,
  NewsMetadata,
  ProjectMetadata,
} from '../types/content';

export const loadProjectMarkdown = async (slug: string): Promise<{ metadata: ProjectMetadata; content: string }> => {
  try {
    const response = await fetch(`/content/projects/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to load project: ${slug}`);
    const raw = await response.text();
    const { data, content } = matter(raw);
    return {
      metadata: data as ProjectMetadata,
      content
    };
  } catch (error) {
    console.error(`Error loading project ${slug}:`, error);
    throw error;
  }
};

export const loadBlogMarkdown = async (slug: string): Promise<{ metadata: BlogMetadata; content: string }> => {
  try {
    const response = await fetch(`/content/blog/${slug}.md`);
    if (!response.ok) {
      throw new Error(`Failed to load blog post: ${slug} (${response.status})`);
    }
    const raw = await response.text();
    const { data, content } = matter(raw);
    return {
      metadata: data as BlogMetadata,
      content
    };
  } catch (error) {
    console.error(`Error loading blog post ${slug}:`, error);
    throw error;
  }
};

export const loadNewsMarkdown = async (slug: string): Promise<{ metadata: NewsMetadata; content: string }> => {
  try {
    const response = await fetch(`/content/news/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to load news: ${slug}`);
    const raw = await response.text();
    const { data, content } = matter(raw);
    return {
      metadata: data as NewsMetadata,
      content
    };
  } catch (error) {
    console.error(`Error loading news ${slug}:`, error);
    throw error;
  }
};

// Verify a fetch response is actually a file, not the SPA HTML fallback
export const isRealFile = async (response: Response): Promise<boolean> => {
  if (!response.ok) return false;
  const contentType = response.headers.get('content-type') || '';
  // If server returns text/html, it's the SPA fallback, not the actual file
  if (contentType.includes('text/html')) return false;
  return true;
};
