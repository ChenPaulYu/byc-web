import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentConfig } from '../local-api';
import {
  CreateContentError,
  createContentWithRetry,
  addContentSlug,
} from './createContentFlow';

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
  ],
  blog: [
    { slug: 'post-a', enabled: true },
  ],
  news: [
    { slug: 'news-a', enabled: true },
  ],
};

test('addContentSlug returns a new config without mutating input', () => {
  const original = structuredClone(baseConfig);

  const next = addContentSlug(original, 'blog', 'post-b');

  assert.notStrictEqual(next, original);
  assert.deepEqual(next.blog, [
    { slug: 'post-a', enabled: true },
    { slug: 'post-b', enabled: true },
  ]);
  assert.deepEqual(original, baseConfig);
});

test('createContentWithRetry retries config write once after a stale sha error', async () => {
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'fresh-sha',
  }));
  const writeConfigFile = test.mock.fn(async (_config: ContentConfig, sha: string) => {
    if (sha === 'stale-sha') {
      throw new Error('public/content.config.json does not match stale-sha');
    }
  });
  const writeRemoteFile = test.mock.fn(async () => {});

  readConfigFile.mock.mockImplementationOnce(async () => ({
    config: structuredClone(baseConfig),
    sha: 'stale-sha',
  }));

  await createContentWithRetry(
    { writeRemoteFile, readConfigFile, writeConfigFile },
    'blog',
    'post-b',
    '---\ntitle: "Post B"\n---\nContent',
  );

  assert.equal(writeRemoteFile.mock.calls.length, 1);
  assert.equal(readConfigFile.mock.calls.length, 2);
  assert.equal(writeConfigFile.mock.calls.length, 2);
  assert.equal(writeConfigFile.mock.calls[0].arguments[1], 'stale-sha');
  assert.equal(writeConfigFile.mock.calls[1].arguments[1], 'fresh-sha');
  assert.deepEqual(writeConfigFile.mock.calls[1].arguments[0].blog, [
    { slug: 'post-a', enabled: true },
    { slug: 'post-b', enabled: true },
  ]);
});

test('createContentWithRetry throws a partial-create error when retry still fails', async () => {
  const writeRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'stale-sha',
  }));
  const writeConfigFile = test.mock.fn(async () => {
    throw new Error('public/content.config.json does not match stale-sha');
  });

  await assert.rejects(
    () => createContentWithRetry(
      { writeRemoteFile, readConfigFile, writeConfigFile },
      'blog',
      'post-b',
      '---\ntitle: "Post B"\n---\nContent',
    ),
    (error: unknown) => {
      assert.ok(error instanceof CreateContentError);
      assert.equal(error.kind, 'partial-create');
      assert.match(error.message, /content index changed/i);
      return true;
    },
  );
});

test('createContentWithRetry classifies non-stale config write failures as partial create', async () => {
  const writeRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'fresh-sha',
  }));
  const writeConfigFile = test.mock.fn(async () => {
    throw new Error('network issue while updating config');
  });

  await assert.rejects(
    () => createContentWithRetry(
      { writeRemoteFile, readConfigFile, writeConfigFile },
      'blog',
      'post-b',
      '---\ntitle: "Post B"\n---\nContent',
    ),
    (error: unknown) => {
      assert.ok(error instanceof CreateContentError);
      assert.equal(error.kind, 'partial-create');
      assert.equal(error.message, "We couldn't finish creating this item.");
      return true;
    },
  );
});

test('createContentWithRetry throws create-failed when file write fails', async () => {
  const writeRemoteFile = test.mock.fn(async () => {
    throw new Error('permission denied');
  });
  const readConfigFile = test.mock.fn(async () => ({
    config: structuredClone(baseConfig),
    sha: 'sha',
  }));
  const writeConfigFile = test.mock.fn(async () => {});

  await assert.rejects(
    () => createContentWithRetry(
      { writeRemoteFile, readConfigFile, writeConfigFile },
      'blog',
      'post-b',
      '---\ntitle: "Post B"\n---\nContent',
    ),
    (error: unknown) => {
      assert.ok(error instanceof CreateContentError);
      assert.equal(error.kind, 'create-failed');
      assert.equal(error.detail, 'permission denied');
      return true;
    },
  );

  assert.equal(readConfigFile.mock.calls.length, 0);
  assert.equal(writeConfigFile.mock.calls.length, 0);
});

test('createContentWithRetry classifies readConfigFile failures as partial create', async () => {
  const writeRemoteFile = test.mock.fn(async () => {});
  const readConfigFile = test.mock.fn(async () => {
    throw new Error('read failed after create');
  });
  const writeConfigFile = test.mock.fn(async () => {});

  await assert.rejects(
    () => createContentWithRetry(
      { writeRemoteFile, readConfigFile, writeConfigFile },
      'blog',
      'post-b',
      '---\ntitle: "Post B"\n---\nContent',
    ),
    (error: unknown) => {
      assert.ok(error instanceof CreateContentError);
      assert.equal(error.kind, 'partial-create');
      assert.equal(error.detail, 'read failed after create');
      return true;
    },
  );
});
