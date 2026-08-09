/**
 * Preserves the GitHub admin API entrypoint while its domain operations live in focused modules.
 * Reads: GitHub API modules under `admin/src/github/`.
 */

export * from './github/assets';
export * from './github/content';
export * from './github/localization';
export * from './github/settings';
export type { ContentConfig, ContentItem, ContentType, MpcAssets, MpcConfig } from './api-types';
