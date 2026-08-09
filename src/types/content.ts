/**
 * Content-domain contracts shared by the public site and its content loader.
 * Reads: none.
 */

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
  venue?: string;
  venueLogo?: string;
  authors?: string;
  affiliations?: string;
  authorList?: Array<{
    name: string;
    sup?: string;
    bold?: boolean;
    url?: string;
  }>;
  affiliationList?: Array<{
    sup: string;
    name: string;
    logo?: string;
  }>;
  coverCaption?: string;
  abstract?: string;
  videos?: Array<{
    label: string;
    url: string;
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
