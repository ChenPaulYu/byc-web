import createContentWithRetry from './lib/createContentFlow';
import deleteContentWithRetry from './lib/deleteContentFlow';

// Simple frontmatter parser (browser-compatible, no Node.js Buffer dependency)
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };

  const yamlStr = match[1];
  const content = match[2];

  // Simple YAML parser for flat and array values
  const data: Record<string, unknown> = {};
  const lines = yamlStr.split('\n');
  let currentKey = '';

  for (const line of lines) {
    const kvMatch = line.match(/^(\w[\w\s]*?):\s*(.*)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      let value: unknown = kvMatch[2].trim();

      // Remove surrounding quotes
      if (typeof value === 'string' && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
        value = (value as string).slice(1, -1);
      }
      // Parse booleans
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      // Parse numbers
      else if (typeof value === 'string' && /^\d+$/.test(value)) value = parseInt(value);
      // Parse inline arrays [a, b, c]
      else if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => {
          s = s.trim();
          if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) s = s.slice(1, -1);
          return s;
        }).filter(Boolean);
      }
      // Empty value starts a list or nested object
      else if (value === '') value = [];

      data[key] = value;
      currentKey = key;
    } else if (line.match(/^\s+-\s+(.*)$/)) {
      // Array item
      const itemMatch = line.match(/^\s+-\s+(.*)$/);
      if (itemMatch && currentKey) {
        if (!Array.isArray(data[currentKey])) data[currentKey] = [];
        let val: unknown = itemMatch[1].trim();
        if (typeof val === 'string' && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
          val = (val as string).slice(1, -1);
        }
        (data[currentKey] as unknown[]).push(val);
      }
    }
  }

  return { data, content };
}

function stringifyFrontmatter(content: string, metadata: Record<string, unknown>): string {
  let yaml = '---\n';
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      yaml += `${key}: [${value.map(v => `"${v}"`).join(', ')}]\n`;
    } else if (typeof value === 'string') {
      yaml += `${key}: "${value}"\n`;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      yaml += `${key}: ${value}\n`;
    }
  }
  yaml += '---\n';
  return yaml + content;
}

const GITHUB_API = 'https://api.github.com';
const OWNER = import.meta.env?.VITE_GITHUB_OWNER || 'ChenPaulYu';
const REPO = import.meta.env?.VITE_GITHUB_REPO || 'byc-web';
const BRANCH = import.meta.env?.VITE_GITHUB_BRANCH || 'main';
const TOKEN = import.meta.env?.VITE_GITHUB_TOKEN || '';

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

type ContentType = 'blog' | 'projects' | 'news';

// --- GitHub API helpers ---

async function ghRequest(url: string, options?: RequestInit) {
  const res = await fetch(`${GITHUB_API}${url}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || res.statusText);
  }
  return res.json();
}

async function getFileContent(path: string): Promise<{ content: string; sha: string }> {
  const data = await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
  const binary = atob(data.content.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  const decoded = new TextDecoder().decode(bytes);
  return { content: decoded, sha: data.sha };
}

async function putFile(path: string, content: string, message: string, sha?: string): Promise<void> {
  const body: Record<string, unknown> = {
    message,
    content: btoa(unescape(encodeURIComponent(content))),
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function deleteFile(path: string, message: string): Promise<void> {
  const { sha } = await getFileContent(path);
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: BRANCH }),
  });
}

async function listDir(path: string): Promise<string[]> {
  try {
    const data = await ghRequest(`/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`);
    if (!Array.isArray(data)) return [];
    return data.filter((f: any) => f.type === 'file').map((f: any) => f.name);
  } catch {
    return [];
  }
}

// --- Content CRUD ---

export const listContent = async (type: ContentType): Promise<ContentItem[]> => {
  const files = await listDir(`public/content/${type}`);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  const results = await Promise.allSettled(
    mdFiles.map(filename => {
      const slug = filename.replace('.md', '');
      return getContent(type, slug);
    })
  );
  return results
    .filter((r): r is PromiseFulfilledResult<ContentItem> => r.status === 'fulfilled')
    .map(r => r.value);
};

export const getContent = async (type: ContentType, slug: string): Promise<ContentItem> => {
  const { content } = await getFileContent(`public/content/${type}/${slug}.md`);
  const { data, content: body } = parseFrontmatter(content);
  return { slug, metadata: data, content: body };
};

export const createContent = async (
  type: ContentType,
  slug: string,
  metadata: Record<string, unknown>,
  content: string,
): Promise<{ slug: string }> => {
  const fileContent = stringifyFrontmatter(content, metadata);
  await createContentWithRetry(
    {
      writeRemoteFile: (path, body, message) => putFile(path, body, message),
      readConfigFile: getConfigFile,
      writeConfigFile: putConfigFile,
    },
    type,
    slug,
    fileContent,
  );
  return { slug };
};

export const updateContent = async (
  type: ContentType,
  slug: string,
  metadata: Record<string, unknown>,
  content: string,
): Promise<{ slug: string }> => {
  const { sha } = await getFileContent(`public/content/${type}/${slug}.md`);
  const fileContent = stringifyFrontmatter(content, metadata);
  await putFile(`public/content/${type}/${slug}.md`, fileContent, `update: ${type}/${slug}`, sha);
  return { slug };
};

export const deleteContent = async (type: ContentType, slug: string): Promise<{ deleted: string }> => {
  await deleteContentWithRetry(
    {
      deleteRemoteFile: deleteFile,
      readConfigFile: getConfigFile,
      writeConfigFile: putConfigFile,
    },
    type,
    slug,
  );
  return { deleted: slug };
};

// --- About ---

export const getAbout = async (): Promise<{ content: string }> => {
  const { content } = await getFileContent('public/content/about.md');
  return { content };
};

export const updateAbout = async (content: string): Promise<{ success: boolean }> => {
  const { sha } = await getFileContent('public/content/about.md');
  await putFile('public/content/about.md', content, 'update: about page', sha);
  return { success: true };
};

// --- Config ---

async function getConfigFile(): Promise<{ config: ContentConfig; sha: string }> {
  const { content, sha } = await getFileContent('public/content.config.json');
  return { config: JSON.parse(content), sha };
}

async function putConfigFile(config: ContentConfig, sha: string): Promise<void> {
  await putFile('public/content.config.json', JSON.stringify(config, null, 2) + '\n', 'update: content config', sha);
}

export const getConfig = async (): Promise<ContentConfig> => {
  const { config } = await getConfigFile();
  return config;
};

export const updateConfig = async (config: ContentConfig): Promise<{ success: boolean }> => {
  const { sha } = await getConfigFile();
  await putConfigFile(config, sha);
  return { success: true };
};

// --- Images ---

export const listImages = async (): Promise<string[]> => {
  return listDir('public/images');
};

export const uploadImage = async (file: File): Promise<{ filename: string; path: string }> => {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const filename = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/public/images/${filename}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `upload: image ${filename}`,
      content: base64,
      branch: BRANCH,
    }),
  });
  return { filename, path: `/images/${filename}` };
};

export const deleteImage = async (filename: string): Promise<{ deleted: string }> => {
  await deleteFile(`public/images/${filename}`, `delete: image ${filename}`);
  return { deleted: filename };
};

// --- MPC Assets ---

export const getMpcAssets = async (): Promise<MpcAssets> => {
  const [samples, modelResult, videoResult] = await Promise.allSettled([
    listDir('public/samples'),
    ghRequest(`/repos/${OWNER}/${REPO}/contents/public/model.glb?ref=${BRANCH}`),
    ghRequest(`/repos/${OWNER}/${REPO}/contents/public/animation.mp4?ref=${BRANCH}`),
  ]);
  return {
    samples: samples.status === 'fulfilled' ? samples.value : [],
    hasModel: modelResult.status === 'fulfilled',
    hasVideo: videoResult.status === 'fulfilled',
  };
};

export const uploadSample = async (file: File): Promise<{ filename: string }> => {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/public/samples/${file.name}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `upload: sample ${file.name}`,
      content: base64,
      branch: BRANCH,
    }),
  });
  return { filename: file.name };
};

export const deleteSample = async (filename: string): Promise<{ deleted: string }> => {
  await deleteFile(`public/samples/${filename}`, `delete: sample ${filename}`);
  return { deleted: filename };
};

export const uploadModel = async (file: File): Promise<{ filename: string }> => {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  let sha: string | undefined;
  try {
    const existing = await getFileContent('public/model.glb');
    sha = existing.sha;
  } catch { /* new file */ }
  const body: Record<string, unknown> = {
    message: 'upload: 3D avatar model',
    content: base64,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/public/model.glb`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return { filename: 'model.glb' };
};

export const uploadVideo = async (file: File): Promise<{ filename: string }> => {
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  let sha: string | undefined;
  try {
    const existing = await getFileContent('public/animation.mp4');
    sha = existing.sha;
  } catch { /* new file */ }
  const body: Record<string, unknown> = {
    message: 'upload: background video',
    content: base64,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  await ghRequest(`/repos/${OWNER}/${REPO}/contents/public/animation.mp4`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return { filename: 'animation.mp4' };
};

// --- Chinese content ---

export const hasZhContent = async (type: ContentType, slug: string): Promise<boolean> => {
  try {
    await getFileContent(`public/content/${type}/${slug}.zh.md`);
    return true;
  } catch {
    return false;
  }
};

export const getZhContent = async (type: ContentType, slug: string): Promise<ContentItem> => {
  const { content } = await getFileContent(`public/content/${type}/${slug}.zh.md`);
  const { data, content: body } = parseFrontmatter(content);
  return { slug, metadata: data, content: body };
};

export const saveZhContent = async (type: ContentType, slug: string, metadata: Record<string, unknown>, content: string): Promise<void> => {
  const filePath = `public/content/${type}/${slug}.zh.md`;
  const fileContent = stringifyFrontmatter(content, metadata);
  let sha: string | undefined;
  try { const existing = await getFileContent(filePath); sha = existing.sha; } catch { /* new file */ }
  await putFile(filePath, fileContent, `update: ${type}/${slug} (Chinese)`, sha);
};

export const deleteZhContent = async (type: ContentType, slug: string): Promise<void> => {
  await deleteFile(`public/content/${type}/${slug}.zh.md`, `delete: ${type}/${slug} (Chinese)`);
};

// Chinese about
export const hasZhAbout = async (): Promise<boolean> => {
  try { await getFileContent('public/content/about.zh.md'); return true; } catch { return false; }
};

export const getZhAbout = async (): Promise<{ content: string }> => {
  const { content } = await getFileContent('public/content/about.zh.md');
  return { content };
};

export const saveZhAbout = async (content: string): Promise<void> => {
  const filePath = 'public/content/about.zh.md';
  let sha: string | undefined;
  try { const existing = await getFileContent(filePath); sha = existing.sha; } catch { /* new file */ }
  await putFile(filePath, content, 'update: about page (Chinese)', sha);
};

// Chinese CV
export const hasZhCv = async (): Promise<boolean> => {
  try { await getFileContent('public/cv.config.zh.json'); return true; } catch { return false; }
};

export const getZhCvConfig = async (): Promise<Record<string, unknown>> => {
  const { content } = await getFileContent('public/cv.config.zh.json');
  return JSON.parse(content);
};

export const saveZhCvConfig = async (config: Record<string, unknown>): Promise<void> => {
  const filePath = 'public/cv.config.zh.json';
  let sha: string | undefined;
  try { const existing = await getFileContent(filePath); sha = existing.sha; } catch { /* new file */ }
  await putFile(filePath, JSON.stringify(config, null, 2) + '\n', 'update: CV config (Chinese)', sha);
};

// --- CV Config ---

export const getCvConfig = async (): Promise<Record<string, unknown>> => {
  const { content } = await getFileContent('public/cv.config.json');
  return JSON.parse(content);
};

export const updateCvConfig = async (config: Record<string, unknown>): Promise<{ success: boolean }> => {
  const { sha } = await getFileContent('public/cv.config.json');
  await putFile('public/cv.config.json', JSON.stringify(config, null, 2) + '\n', 'update: CV config', sha);
  return { success: true };
};

// --- MPC Config ---

export const getMpcConfig = async (): Promise<MpcConfig> => {
  const { content } = await getFileContent('public/mpc.config.json');
  return JSON.parse(content);
};

export const updateMpcConfig = async (config: MpcConfig): Promise<{ success: boolean }> => {
  const { sha } = await getFileContent('public/mpc.config.json');
  await putFile('public/mpc.config.json', JSON.stringify(config, null, 2) + '\n', 'update: MPC config', sha);
  return { success: true };
};

// --- Deploy ---

const DEPLOY_HOOK = import.meta.env?.VITE_VERCEL_DEPLOY_HOOK || '';

export const triggerDeploy = async (): Promise<{ success: boolean }> => {
  if (!DEPLOY_HOOK) throw new Error('No deploy hook configured. Set VITE_VERCEL_DEPLOY_HOOK.');
  const res = await fetch(DEPLOY_HOOK, { method: 'POST' });
  if (!res.ok) throw new Error('Deploy trigger failed');
  return { success: true };
};

export const hasDeployHook = (): boolean => !!DEPLOY_HOOK;

export const getGitHubHistoryUrl = (filePath: string): string => {
  return `https://github.com/${OWNER}/${REPO}/commits/${BRANCH}/${filePath}`;
};
