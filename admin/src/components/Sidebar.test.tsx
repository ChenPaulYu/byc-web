import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';

import Sidebar from './Sidebar';

test('Sidebar renders without window during server rendering', () => {
  assert.equal('window' in globalThis, false);

  assert.doesNotThrow(() => {
    const html = renderToString(
      <MemoryRouter>
        <Sidebar isOpen={false} onClose={() => {}} />
      </MemoryRouter>,
    );

    assert.match(html, /View site/);
  });
});
