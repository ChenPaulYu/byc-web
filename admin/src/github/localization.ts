/**
 * Implements GitHub-backed Chinese content, about-page, and CV operations.
 * Reads: optional `.zh.md` and `.zh.json` files in the public content boundary.
 */

import type { ContentItem, ContentType } from '../api-types';
import { deleteFile, getFileContent, putFile } from './client';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';

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
