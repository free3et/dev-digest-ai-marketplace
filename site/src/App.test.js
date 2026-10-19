import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildCatalog } from '../../scripts/catalog.mjs';
import { Shell } from './App.jsx';
import { normalize } from './lib/catalog.js';
import { AppProvider } from './lib/context.jsx';

const catalog = normalize(buildCatalog());
const firstSkill = catalog.artifacts.find((a) => a.type === 'skill');
const ROUTES = ['#/', '#/catalog', '#/catalog?q=review', `#/a/${firstSkill.id}`, `#/p/${catalog.plugins[0].name}`, '#/new', '#/start', '#/saved', '#/install', '#/contribute', '#/nope'];

afterEach(() => { delete globalThis.location; vi.restoreAllMocks(); });

describe('every route renders with the real catalog', () => {
  for (const hash of ROUTES) {
    it(hash, () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      globalThis.location = { hash };
      const html = renderToString(createElement(AppProvider, { catalog }, createElement(Shell)));
      expect(html).toContain('class="bar"');
      expect(warn).not.toHaveBeenCalled(); // t() warns when a string is missing
    });
  }
});
