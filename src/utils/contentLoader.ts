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
  tags: string[];
  category: string;
  pinned?: boolean;
  draft?: boolean;
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

// Load all projects with sorting
export const loadAllProjects = async (): Promise<ProjectContent[]> => {
  // Hardcoded list of project slugs (in production, you'd use a build-time plugin to auto-discover)
  const slugs = ['fluebricks', 'djtransgan', 'tmc-cl1', 'taptap'];

  const projects = await Promise.all(
    slugs.map(slug => loadProject(slug))
  );

  // Sort: pinned → importance → title
  return projects.sort((a, b) => {
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
  // Hardcoded list of blog post slugs
  const slugs = [
    'on-instrument-design',
    'ai-music-reflections',
    'web-audio-api-learnings',
    'ddsp-breakthrough',
    '3d-printing-acoustics',
    'creative-constraints',
    'gan-training-tricks',
    'tokyo-remote-work',
    'loop-based-composition'
  ];

  const posts = await Promise.all(
    slugs.map(slug => loadBlogPost(slug))
  );

  // Filter out drafts
  const published = posts.filter(post => !post.metadata.draft);

  // Sort: pinned → date (descending) → title
  return published.sort((a, b) => {
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
