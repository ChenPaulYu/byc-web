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

type ContentType = 'blog' | 'projects' | 'news';

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

// Images
export const listImages = () => request<string[]>('/images');

export const uploadImage = async (file: File): Promise<{ filename: string; path: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/images`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const deleteImage = (filename: string) =>
  request<{ deleted: string }>(`/images/${filename}`, { method: 'DELETE' });

// MPC Assets
export interface MpcAssets {
  samples: string[];
  hasModel: boolean;
  hasVideo: boolean;
}

export const getMpcAssets = () => request<MpcAssets>('/assets/mpc');

export const uploadSample = async (file: File): Promise<{ filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/assets/sample`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const deleteSample = (filename: string) =>
  request<{ deleted: string }>(`/assets/sample/${filename}`, { method: 'DELETE' });

export const uploadModel = async (file: File): Promise<{ filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/assets/model`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};

export const uploadVideo = async (file: File): Promise<{ filename: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}/assets/video`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
};
