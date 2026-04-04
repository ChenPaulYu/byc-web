import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';

import DeleteDialog from './DeleteDialog';
import { DeleteContentError } from '../lib/deleteContentFlow';

test('closed state renders nothing', () => {
  const html = renderToString(
    <DeleteDialog
      isOpen={false}
      type="blog"
      itemName="AI Music Notes"
      isDeleting={false}
      error={null}
      onConfirm={() => {}}
      onClose={() => {}}
    />,
  );

  assert.equal(html, '');
});

test('confirm state renders quiet-editorial content for blog deletes', () => {
  const html = renderToString(
    <DeleteDialog
      isOpen
      type="blog"
      itemName="AI Music Notes"
      isDeleting={false}
      error={null}
      onConfirm={() => {}}
      onClose={() => {}}
    />,
  );

  assert.match(html, /Delete Post/);
  assert.match(html, /AI Music Notes/);
  assert.match(html, /This action cannot be undone/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /aria-labelledby=/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /tabindex="-1"/);
});

test('deleting state disables both actions and updates the confirm label', () => {
  const html = renderToString(
    <DeleteDialog
      isOpen
      type="news"
      itemName="Studio Update"
      isDeleting
      error={null}
      onConfirm={() => {}}
      onClose={() => {}}
    />,
  );

  assert.match(html, /Cancel/);
  assert.match(html, /Deleting\.\.\./);
  assert.equal(html.match(/disabled=""/g)?.length, 2);
});

test('failure state renders partial-delete guidance for projects', () => {
  const html = renderToString(
    <DeleteDialog
      isOpen
      type="projects"
      itemName="MPC Controller"
      isDeleting={false}
      error={new DeleteContentError(
        'partial-delete',
        'The content index changed while this item was being deleted. We refreshed it and retried once, but the update still failed.',
        'public/content.config.json does not match latest-sha',
      )}
      onConfirm={() => {}}
      onClose={() => {}}
    />,
  );

  assert.match(html, /The content file may already be deleted/);
  assert.match(html, /does not match latest-sha/);
  assert.match(html, /Close/);
  assert.doesNotMatch(html, /<button[^>]*>Delete Project<\/button>/);
});

test('generic error path shows readable detail text', () => {
  const html = renderToString(
    <DeleteDialog
      isOpen
      type="blog"
      itemName="AI Music Notes"
      isDeleting={false}
      error={new Error('Network request failed')}
      onConfirm={() => {}}
      onClose={() => {}}
    />,
  );

  assert.match(html, /Network request failed/);
  assert.match(html, /Close/);
  assert.doesNotMatch(html, /<button[^>]*>Delete Post<\/button>/);
});
