const API_BASE = '/api';

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

type ContentType = 'blog' | 'projects';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

// Content CRUD
export const listContent = (type: ContentType) =>
  request<ContentItem[]>(`/content/${type}`);

export const getContent = (type: ContentType, slug: string) =>
  request<ContentItem>(`/content/${type}/${slug}`);

export const createContent = (type: ContentType, slug: string, metadata: Record<string, unknown>, content: string) =>
  request<{ slug: string }>(`/content/${type}`, {
    method: 'POST',
    body: JSON.stringify({ slug, metadata, content }),
  });

export const updateContent = (type: ContentType, slug: string, metadata: Record<string, unknown>, content: string) =>
  request<{ slug: string }>(`/content/${type}/${slug}`, {
    method: 'PUT',
    body: JSON.stringify({ metadata, content }),
  });

export const deleteContent = (type: ContentType, slug: string) =>
  request<{ deleted: string }>(`/content/${type}/${slug}`, {
    method: 'DELETE',
  });

// About
export const getAbout = () => request<{ content: string }>('/about');

export const updateAbout = (content: string) =>
  request<{ success: boolean }>('/about', {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });

// Config
export const getConfig = () => request<ContentConfig>('/config');

export const updateConfig = (config: ContentConfig) =>
  request<{ success: boolean }>('/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
