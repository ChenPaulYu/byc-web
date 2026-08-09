/**
 * Coordinates public content loading, localization fallback, collection ordering, and search.
 * Reads: the content registry and Markdown files through the focused content boundary modules.
 */

import matter from 'gray-matter';
import type {
  BlogContent,
  BlogMetadata,
  NewsContent,
  NewsMetadata,
  ProjectContent,
  ProjectMetadata,
} from '../types/content';
import { loadConfig } from './contentConfig';
import { extractExcerpt } from './contentExcerpt';
import { isRealFile, loadBlogMarkdown, loadNewsMarkdown, loadProjectMarkdown } from './contentSource';

export { loadConfig } from './contentConfig';

export type {
  BlogContent,
  BlogMetadata,
  ContentConfig,
  NewsContent,
  NewsMetadata,
  ProjectContent,
  ProjectMetadata,
} from '../types/content';

// Load About page content
export const loadAboutContent = async (): Promise<string> => {
  try {
    const config = await loadConfig();
    const response = await fetch(`/content/${config.about.source}`);
    if (!response.ok) {
      throw new Error('Failed to load about content');
    }
    const raw = await response.text();
    const { content } = matter(raw);
    return content;
  } catch (error) {
    console.error('Error loading about content:', error);
    return '';
  }
};

// Load single project by slug
export const loadProject = async (slug: string): Promise<ProjectContent> => {
  const { metadata, content } = await loadProjectMarkdown(slug);
  return {
    slug,
    metadata,
    content,
    excerpt: extractExcerpt(content)
  };
};

// Load single blog post by slug
export const loadBlogPost = async (slug: string): Promise<BlogContent> => {
  const { metadata, content } = await loadBlogMarkdown(slug);
  return {
    slug,
    metadata,
    content,
    excerpt: extractExcerpt(content)
  };
};

// Load single news item by slug
export const loadNews = async (slug: string): Promise<NewsContent> => {
  const { metadata, content } = await loadNewsMarkdown(slug);
  return {
    slug,
    metadata,
    content
  };
};

// Load all projects with sorting
export const loadAllProjects = async (): Promise<ProjectContent[]> => {
  const config = await loadConfig();
  const enabledSlugs = config.projects
    .filter(p => p.enabled)
    .map(p => p.slug);

  const projects = await Promise.all(
    enabledSlugs.map(slug => loadProject(slug).catch(err => {
      console.error(`Failed to load project ${slug}:`, err);
      return null;
    }))
  );

  // Filter out failed loads
  const validProjects = projects.filter((p): p is ProjectContent => p !== null);

  // Sort: pinned → importance → title
  return validProjects.sort((a, b) => {
    // Pinned first
    const aPinned = a.metadata.pinned ?? false;
    const bPinned = b.metadata.pinned ?? false;
    if (aPinned !== bPinned) return bPinned ? 1 : -1;

    // Then by importance (higher first)
    const aImportance = a.metadata.importance ?? 0;
    const bImportance = b.metadata.importance ?? 0;
    if (aImportance !== bImportance) return bImportance - aImportance;

    // Finally by title alphabetically
    return a.metadata.title.localeCompare(b.metadata.title);
  });
};

// Load all blog posts with sorting
export const loadAllBlogPosts = async (): Promise<BlogContent[]> => {
  const config = await loadConfig();
  const enabledSlugs = config.blog
    .filter(p => p.enabled)
    .map(p => p.slug);

  const posts = await Promise.all(
    enabledSlugs.map(slug => loadBlogPost(slug).catch(err => {
      console.error(`Failed to load blog post ${slug}:`, err);
      return null;
    }))
  );

  // Filter out failed loads and drafts
  const validPosts = posts.filter((p): p is BlogContent => p !== null && !p.metadata.draft);

  // Sort: pinned → date (descending) → title
  return validPosts.sort((a, b) => {
    // Pinned first
    const aPinned = a.metadata.pinned ?? false;
    const bPinned = b.metadata.pinned ?? false;
    if (aPinned !== bPinned) return bPinned ? 1 : -1;

    // Then by date (newest first)
    const aDate = new Date(a.metadata.date);
    const bDate = new Date(b.metadata.date);
    if (aDate.getTime() !== bDate.getTime()) return bDate.getTime() - aDate.getTime();

    // Finally by title alphabetically
    return a.metadata.title.localeCompare(b.metadata.title);
  });
};

// Load all news items with sorting
export const loadAllNews = async (): Promise<NewsContent[]> => {
  const config = await loadConfig();
  const enabledSlugs = config.news
    .filter(n => n.enabled)
    .map(n => n.slug);

  const newsItems = await Promise.all(
    enabledSlugs.map(slug => loadNews(slug).catch(err => {
      console.error(`Failed to load news ${slug}:`, err);
      return null;
    }))
  );

  // Filter out failed loads
  const validNews = newsItems.filter((n): n is NewsContent => n !== null);

  // Sort by date (newest first)
  return validNews.sort((a, b) => {
    const aDate = new Date(a.metadata.date);
    const bDate = new Date(b.metadata.date);
    return bDate.getTime() - aDate.getTime();
  });
};

// Check if a Chinese version of content exists
export const hasChineseVersion = async (type: 'blog' | 'projects', slug: string): Promise<boolean> => {
  try {
    const response = await fetch(`/content/${type}/${slug}.zh.md`);
    return isRealFile(response);
  } catch {
    return false;
  }
};

// Load Chinese version of a blog post
export const loadBlogPostZh = async (slug: string): Promise<BlogContent> => {
  try {
    const response = await fetch(`/content/blog/${slug}.zh.md`);
    if (!await isRealFile(response)) throw new Error('No Chinese version');
    const raw = await response.text();
    const { data, content } = matter(raw);
    return { slug, metadata: data as BlogMetadata, content, excerpt: extractExcerpt(content) };
  } catch {
    return loadBlogPost(slug); // Fallback to English
  }
};

// Load Chinese version of a project
export const loadProjectZh = async (slug: string): Promise<ProjectContent> => {
  try {
    const response = await fetch(`/content/projects/${slug}.zh.md`);
    if (!await isRealFile(response)) throw new Error('No Chinese version');
    const raw = await response.text();
    const { data, content } = matter(raw);
    return { slug, metadata: data as ProjectMetadata, content, excerpt: extractExcerpt(content) };
  } catch {
    return loadProject(slug); // Fallback to English
  }
};

// Check if Chinese about page exists
export const hasChineseAbout = async (): Promise<boolean> => {
  try {
    const response = await fetch('/content/about.zh.md');
    return isRealFile(response);
  } catch {
    return false;
  }
};

// Load Chinese about page
export const loadAboutContentZh = async (): Promise<string> => {
  try {
    const response = await fetch('/content/about.zh.md');
    if (!await isRealFile(response)) throw new Error('No Chinese version');
    const raw = await response.text();
    const { content } = matter(raw);
    return content;
  } catch {
    return loadAboutContent(); // Fallback to English
  }
};

// Check if Chinese CV config exists
export const hasChineseCv = async (): Promise<boolean> => {
  try {
    const response = await fetch('/cv.config.zh.json');
    return isRealFile(response);
  } catch {
    return false;
  }
};

// Search functionality (simple implementation)
export const searchContent = async (query: string, type: 'projects' | 'blog' | 'all' = 'all') => {
  const lowerQuery = query.toLowerCase();
  const results: Array<ProjectContent | BlogContent> = [];

  if (type === 'projects' || type === 'all') {
    const projects = await loadAllProjects();
    results.push(...projects.filter(p =>
      p.metadata.title.toLowerCase().includes(lowerQuery) ||
      p.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      p.content.toLowerCase().includes(lowerQuery)
    ));
  }

  if (type === 'blog' || type === 'all') {
    const posts = await loadAllBlogPosts();
    results.push(...posts.filter(p =>
      p.metadata.title.toLowerCase().includes(lowerQuery) ||
      p.metadata.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      p.content.toLowerCase().includes(lowerQuery)
    ));
  }

  return results;
};
