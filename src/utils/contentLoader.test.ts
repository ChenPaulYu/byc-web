/** Public project publication checks, including direct URLs and draft translations. */
import assert from 'node:assert/strict';
import { afterEach, mock, test } from 'node:test';
import { hasChineseVersion, loadAllProjects, loadProject, loadProjectZh, searchContent } from './contentLoader';

const config = {
  projects: [
    { slug: 'published', enabled: true },
    { slug: 'draft', enabled: true },
    { slug: 'disabled', enabled: false },
  ],
  blog: [],
  news: [],
};

const markdown = (title: string, draft = false) => `---
title: ${title}
year: "2026"
category: Research
tags: []
draft: ${draft}
---
${title} body.
`;

function serveProjects(translationDraft = false) {
  const files = new Map([
    ['/content.config.json', JSON.stringify(config)],
    ['/content/projects/published.md', markdown('Published')],
    ['/content/projects/draft.md', markdown('Draft', true)],
    ['/content/projects/disabled.md', markdown('Disabled')],
    ['/content/projects/published.zh.md', markdown('Translation', translationDraft)],
    ['/content/projects/draft.zh.md', markdown('Draft translation')],
    ['/content/projects/disabled.zh.md', markdown('Disabled translation')],
  ]);
  return mock.method(globalThis, 'fetch', async (input: string | URL | Request) => {
    const path = String(input);
    const body = files.get(path);
    return new Response(body ?? '', {
      status: body === undefined ? 404 : 200,
      headers: { 'content-type': path.endsWith('.json') ? 'application/json' : 'text/plain' },
    });
  });
}

afterEach(() => mock.restoreAll());

test('project lists and search omit enabled drafts and disabled projects', async () => {
  serveProjects();
  assert.deepEqual((await loadAllProjects()).map(project => project.slug), ['published']);
  assert.deepEqual(await searchContent('Draft', 'projects'), []);
});

test('direct project loads reject drafts, disabled projects, and unknown slugs', async () => {
  const fetchMock = serveProjects();
  assert.equal((await loadProject('published')).metadata.title, 'Published');
  for (const slug of ['draft', 'disabled', 'unknown']) {
    await assert.rejects(loadProject(slug), /Project not found/);
  }
  assert.equal(fetchMock.mock.calls.some(call => String(call.arguments[0]).includes('disabled.md')), false);
});

test('translations cannot publish a hidden base project', async () => {
  serveProjects();
  assert.equal((await loadProjectZh('published')).metadata.title, 'Translation');
  for (const slug of ['draft', 'disabled']) {
    await assert.rejects(loadProjectZh(slug), /Project not found/);
  }
});

test('draft translations stay hidden and fall back to the published base', async () => {
  serveProjects(true);
  assert.equal(await hasChineseVersion('projects', 'published'), false);
  assert.equal((await loadProjectZh('published')).metadata.title, 'Published');
});
