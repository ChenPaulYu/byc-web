/**
 * Implements GitHub-backed content, about-page, and content-registry operations.
 * Reads: GitHub files under `public/content/` and the content registry.
 */

import createContentWithRetry from '../lib/createContentFlow';
import deleteContentWithRetry from '../lib/deleteContentFlow';
import type { ContentConfig, ContentItem, ContentType } from '../api-types';
import { parseFrontmatter, stringifyFrontmatter } from './frontmatter';
import { deleteFile, getFileContent, listDir, putFile } from './client';

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

export const getAbout = async (): Promise<{ content: string }> => {
  const { content } = await getFileContent('public/content/about.md');
  return { content };
};

export const updateAbout = async (content: string): Promise<{ success: boolean }> => {
  const { sha } = await getFileContent('public/content/about.md');
  await putFile('public/content/about.md', content, 'update: about page', sha);
  return { success: true };
};

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
