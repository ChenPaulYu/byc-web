import * as localApi from './local-api';
import * as githubApi from './github-api';

const useGitHub = !!import.meta.env.VITE_GITHUB_TOKEN;

const api = useGitHub ? githubApi : localApi;

if (useGitHub) {
  console.log('Admin: Using GitHub API backend');
} else {
  console.log('Admin: Using local Express API backend');
}

export const listContent = api.listContent;
export const getContent = api.getContent;
export const createContent = api.createContent;
export const updateContent = api.updateContent;
export const deleteContent = api.deleteContent;
export const getAbout = api.getAbout;
export const updateAbout = api.updateAbout;
export const getConfig = api.getConfig;
export const updateConfig = api.updateConfig;
export const listImages = api.listImages;
export const uploadImage = api.uploadImage;
export const deleteImage = api.deleteImage;
export const getMpcAssets = api.getMpcAssets;
export const uploadSample = api.uploadSample;
export const deleteSample = api.deleteSample;
export const uploadModel = api.uploadModel;
export const uploadVideo = api.uploadVideo;
export const getCvConfig = api.getCvConfig;
export const updateCvConfig = api.updateCvConfig;
export const getMpcConfig = api.getMpcConfig;
export const updateMpcConfig = api.updateMpcConfig;

export type { ContentItem, ContentConfig, MpcAssets, MpcConfig } from './local-api';
