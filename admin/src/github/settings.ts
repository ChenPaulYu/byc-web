/**
 * Implements GitHub-backed CV, MPC configuration, deployment, and history operations.
 * Reads: configuration files and deployment settings from the admin runtime.
 */

import type { MpcConfig } from '../api-types';
import { BRANCH, OWNER, REPO, getFileContent, putFile } from './client';

// CV Config
export const getCvConfig = async (): Promise<Record<string, unknown>> => {
  const { content } = await getFileContent('public/cv.config.json');
  return JSON.parse(content);
};

export const updateCvConfig = async (config: Record<string, unknown>): Promise<{ success: boolean }> => {
  const { sha } = await getFileContent('public/cv.config.json');
  await putFile('public/cv.config.json', JSON.stringify(config, null, 2) + '\n', 'update: CV config', sha);
  return { success: true };
};

// MPC Config
export const getMpcConfig = async (): Promise<MpcConfig> => {
  const { content } = await getFileContent('public/mpc.config.json');
  return JSON.parse(content);
};

export const updateMpcConfig = async (config: MpcConfig): Promise<{ success: boolean }> => {
  const { sha } = await getFileContent('public/mpc.config.json');
  await putFile('public/mpc.config.json', JSON.stringify(config, null, 2) + '\n', 'update: MPC config', sha);
  return { success: true };
};

// Deploy
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
