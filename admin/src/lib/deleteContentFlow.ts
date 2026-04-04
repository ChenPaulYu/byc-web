import type { ContentConfig } from '../local-api';

export type ContentType = 'blog' | 'projects' | 'news';

export type DeleteContentErrorKind = 'delete-failed' | 'partial-delete';

export class DeleteContentError extends Error {
  kind: DeleteContentErrorKind;
  detail?: string;

  constructor(kind: DeleteContentErrorKind, message: string, detail?: string) {
    super(message);
    this.name = 'DeleteContentError';
    this.kind = kind;
    this.detail = detail;
  }
}

export interface DeleteContentDeps {
  deleteRemoteFile: (path: string, message: string) => Promise<void>;
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

export function removeContentSlug(config: ContentConfig, type: ContentType, slug: string): ContentConfig {
  return {
    ...config,
    [type]: config[type].filter(item => item.slug !== slug),
  };
}

export const deleteContentWithRetry = async (
  deps: DeleteContentDeps,
  type: ContentType,
  slug: string,
): Promise<void> => {
  try {
    await deps.deleteRemoteFile(`public/content/${type}/${slug}.md`, `delete: ${type}/${slug}`);
  } catch (error) {
    throw new DeleteContentError('delete-failed', "We couldn't finish deleting this item.", getErrorDetail(error));
  }

  let sawStaleConfigError = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { config, sha } = await deps.readConfigFile();
      await deps.writeConfigFile(removeContentSlug(config, type, slug), sha);
      return;
    } catch (error) {
      const detail = getErrorDetail(error);
      const isStaleConfigError = isStaleConfigShaError(error);

      if (!sawStaleConfigError && isStaleConfigError) {
        sawStaleConfigError = true;
        continue;
      }

      if (sawStaleConfigError && isStaleConfigError) {
        throw new DeleteContentError(
          'partial-delete',
          'The content index changed while this item was being deleted. We refreshed it and retried once, but the update still failed.',
          detail,
        );
      }

      throw new DeleteContentError('partial-delete', "We couldn't finish deleting this item.", detail);
    }
  }

  throw new DeleteContentError(
    'partial-delete',
    "We couldn't finish deleting this item.",
  );
};

export default deleteContentWithRetry;
