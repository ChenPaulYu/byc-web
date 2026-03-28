import matter from 'gray-matter';

// Types for content metadata
export interface ProjectMetadata {
  title: string;
  date: string;
  year: string;
  category: 'Research' | 'Engineering' | 'Creative';
  role: string;
  tags: string[];
  cover: string;
  pinned?: boolean;
  importance?: number;
  links?: Array<{
    label: string;
    url: string;
    icon?: 'video' | 'paper' | 'code' | 'demo';
  }>;
}

export interface BlogMetadata {
  title: string;
  date: string;
  updated?: string;
  tags: string[];
  category: string;
  pinned?: boolean;
  draft?: boolean;
}

export interface NewsMetadata {
  title: string;
  date: string;
  updated?: string;
  type: 'update' | 'release' | 'announcement' | 'event';
  url?: string;
}

export interface ProjectContent {
  slug: string;
  metadata: ProjectMetadata;
  content: string;
  excerpt?: string;
}

export interface BlogContent {
  slug: string;
  metadata: BlogMetadata;
  content: string;
  excerpt?: string;
}

export interface NewsContent {
  slug: string;
  metadata: NewsMetadata;
  content: string;
}

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

// Cache for config to avoid repeated fetches
let configCache: ContentConfig | null = null;

// Load content configuration
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

// Dynamic imports for markdown files
const loadProjectMarkdown = async (slug: string): Promise<{ metadata: ProjectMetadata; content: string }> => {
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

const loadBlogMarkdown = async (slug: string): Promise<{ metadata: BlogMetadata; content: string }> => {
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

const loadNewsMarkdown = async (slug: string): Promise<{ metadata: NewsMetadata; content: string }> => {
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

// Extract excerpt from markdown content (first paragraph)
const extractExcerpt = (content: string, maxLength: number = 150): string => {
  const firstParagraph = content
    .split('\n\n')[0]
    .replace(/^#+\s+/, '') // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/[*_`]/g, '') // Remove formatting
    .trim();

  if (firstParagraph.length <= maxLength) return firstParagraph;
  return firstParagraph.substring(0, maxLength).trim() + '...';
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
