import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentConfig } from '../local-api';
import {
  DeleteContentError,
  deleteContentWithRetry,
  removeContentSlug,
} from './deleteContentFlow';

const baseConfig: ContentConfig = {
  site: {
    title: 'Site',
    description: 'Desc',
    author: 'Author',
    url: 'https://example.com',
  },
  about: {
    source: 'about.md',
    social: {},
  },
  projects: [
    { slug: 'project-a', enabled: true },
    { slug: 'project-b', enabled: false },
  ],
  blog: [
    { slug: 'post-a', enabled: true },
    { slug: 'post-b', enabled: false },
  ],
  news: [
    { slug: 'news-a', enabled: true },
    { slug: 'news-b', enabled: false },
  ],
};

test('removeContentSlug returns a new config without mutating input', () => {
  const original = structuredClone(baseConfig);

  const next = removeContentSlug(original, 'blog', 'post-a');

  assert.notStrictEqual(next, original);
  assert.deepEqual(next.blog, [{ slug: 'post-b', enabled: false }]);
  assert.deepEqual(original, baseConfig);
});

test('deleteContentWithRetry retries config write once after a stale sha error', async () => {
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'fresh-sha',
  }));
  const writeConfigFile = test.mock.fn(async (_config: ContentConfig, sha: string) => {
    if (sha === 'stale-sha') {
      throw new Error('public/content.config.json does not match stale-sha');
    }
  });
  const deleteRemoteFile = test.mock.fn(async () => {});

  readConfigFile.mock.mockImplementationOnce(async () => ({
    config: structuredClone(baseConfig),
    sha: 'stale-sha',
  }));

  await deleteContentWithRetry({ deleteRemoteFile, readConfigFile, writeConfigFile }, 'blog', 'post-a');

  assert.equal(deleteRemoteFile.mock.calls.length, 1);
  assert.equal(readConfigFile.mock.calls.length, 2);
  assert.equal(writeConfigFile.mock.calls.length, 2);
  assert.equal(writeConfigFile.mock.calls[0].arguments[1], 'stale-sha');
  assert.equal(writeConfigFile.mock.calls[1].arguments[1], 'fresh-sha');
  assert.deepEqual(writeConfigFile.mock.calls[1].arguments[0].blog, [{ slug: 'post-b', enabled: false }]);
});

test('deleteContentWithRetry throws a partial-delete error when retry still fails', async () => {
  const deleteRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'stale-sha',
  }));
  const writeConfigFile = test.mock.fn(async () => {
    throw new Error('public/content.config.json does not match stale-sha');
  });

  await assert.rejects(
    () => deleteContentWithRetry({ deleteRemoteFile, readConfigFile, writeConfigFile }, 'blog', 'post-a'),
    (error: unknown) => {
      assert.ok(error instanceof DeleteContentError);
      assert.equal(error.kind, 'partial-delete');
      assert.match(error.message, /content index changed/i);
      return true;
    },
  );
});

test('deleteContentWithRetry classifies non-stale config write failures as partial delete', async () => {
  const deleteRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'fresh-sha',
  }));
  const writeConfigFile = test.mock.fn(async () => {
    throw new Error('network issue while updating config');
  });

  await assert.rejects(
    () => deleteContentWithRetry({ deleteRemoteFile, readConfigFile, writeConfigFile }, 'blog', 'post-a'),
    (error: unknown) => {
      assert.ok(error instanceof DeleteContentError);
      assert.equal(error.kind, 'partial-delete');
      assert.equal(error.message, "We couldn't finish deleting this item.");
      return true;
    },
  );
});

test('deleteContentWithRetry classifies readConfigFile failures after delete as partial delete', async () => {
  const deleteRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => {
    throw new Error('read failed after delete');
  });
  const writeConfigFile = test.mock.fn(async () => {});

  await assert.rejects(
    () => deleteContentWithRetry({ deleteRemoteFile, readConfigFile, writeConfigFile }, 'blog', 'post-a'),
    (error: unknown) => {
      assert.ok(error instanceof DeleteContentError);
      assert.equal(error.kind, 'partial-delete');
      assert.equal(error.message, "We couldn't finish deleting this item.");
      assert.equal(error.detail, 'read failed after delete');
      return true;
    },
  );
});

test('deleteContentWithRetry keeps generic partial-delete message when stale retry fails differently', async () => {
  const deleteRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'fresh-sha',
  }));
  const writeConfigFile = test.mock.fn(async (_config: ContentConfig, sha: string) => {
    if (sha === 'stale-sha') {
      throw new Error('public/content.config.json does not match stale-sha');
    }

    throw new Error('permission denied during retry');
  });

  readConfigFile.mock.mockImplementationOnce(async () => ({
    config: structuredClone(baseConfig),
    sha: 'stale-sha',
  }));

  await assert.rejects(
    () => deleteContentWithRetry({ deleteRemoteFile, readConfigFile, writeConfigFile }, 'blog', 'post-a'),
    (error: unknown) => {
      assert.ok(error instanceof DeleteContentError);
      assert.equal(error.kind, 'partial-delete');
      assert.equal(error.message, "We couldn't finish deleting this item.");
      assert.equal(error.detail, 'permission denied during retry');
      return true;
    },
  );
});
