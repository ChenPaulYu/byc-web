/**
 * Implements GitHub-backed image and MPC asset operations.
 * Reads: GitHub files under `public/images`, `public/samples`, and public media paths.
 */

import type { MpcAssets } from '../api-types';
import { BRANCH, OWNER, REPO, deleteFile, getFileContent, ghRequest, listDir } from './client';

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
