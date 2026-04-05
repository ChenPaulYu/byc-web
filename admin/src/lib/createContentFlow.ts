import type { ContentConfig } from '../local-api';

export type ContentType = 'blog' | 'projects' | 'news';

export type CreateContentErrorKind = 'create-failed' | 'partial-create';

export class CreateContentError extends Error {
  kind: CreateContentErrorKind;
  detail?: string;

  constructor(kind: CreateContentErrorKind, message: string, detail?: string) {
    super(message);
    this.name = 'CreateContentError';
    this.kind = kind;
    this.detail = detail;
  }
}

export interface CreateContentDeps {
  writeRemoteFile: (path: string, content: string, message: string) => Promise<void>;
  readConfigFile: () => Promise<{ config: ContentConfig; sha: string }>;
  writeConfigFile: (config: ContentConfig, sha: string) => Promise<void>;
}

function getErrorDetail(error: unknown): string | undefined {
  return error instanceof Error ? error.message : undefined;
}

function isStaleConfigShaError(error: unknown): boolean {
  const detail = getErrorDetail(error);
  return typeof detail === 'string' && detail.includes('public/content.config.json does not match');
}

export function addContentSlug(config: ContentConfig, type: ContentType, slug: string): ContentConfig {
  return {
    ...config,
    [type]: [...config[type], { slug, enabled: true }],
  };
}

export const createContentWithRetry = async (
  deps: CreateContentDeps,
  type: ContentType,
  slug: string,
  fileContent: string,
): Promise<void> => {
  try {
    await deps.writeRemoteFile(`public/content/${type}/${slug}.md`, fileContent, `feat: create ${type}/${slug}`);
  } catch (error) {
    throw new CreateContentError('create-failed', "We couldn't create this item.", getErrorDetail(error));
  }

  let sawStaleConfigError = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { config, sha } = await deps.readConfigFile();
      await deps.writeConfigFile(addContentSlug(config, type, slug), sha);
      return;
    } catch (error) {
      const detail = getErrorDetail(error);
      const isStaleConfigError = isStaleConfigShaError(error);

      if (!sawStaleConfigError && isStaleConfigError) {
        sawStaleConfigError = true;
        continue;
      }

      if (sawStaleConfigError && isStaleConfigError) {
        throw new CreateContentError(
          'partial-create',
          'The content index changed while this item was being created. We refreshed it and retried once, but the update still failed.',
          detail,
        );
      }

      throw new CreateContentError('partial-create', "We couldn't finish creating this item.", detail);
    }
  }

  throw new CreateContentError(
    'partial-create',
    "We couldn't finish creating this item.",
  );
};

export default createContentWithRetry;
