import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import en from '../locales/en.js';
import { healthCode, healthLabel, t, typeLabel, typeLabelPlural } from './i18n.jsx';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = (dir = SRC) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'locales' ? [] : sources(p);
    return /\.jsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
const files = sources().map((p) => [p.slice(SRC.length + 1), readFileSync(p, 'utf8')]);

const flatten = (node, prefix = '') =>
  Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flatten(v, `${prefix}${k}.`) : [`${prefix}${k}`]));
const allKeys = flatten(en);

// Keys that are built from data (artifact type, health state, health code) rather than written out.
const DYNAMIC = ['type.one.', 'type.many.', 'health.label.', 'health.code.'];

describe('locale file', () => {
  const used = new Set(files.flatMap(([, src]) => [...src.matchAll(/\b(?:t|rich|list|tOr)\(\s*'([\w.]+)'/g)].map((m) => m[1])));

  it('defines every key the components use', () => {
    expect([...used].filter((k) => !allKeys.includes(k))).toEqual([]);
  });

  it('has no unused strings', () => {
    expect(allKeys.filter((k) => !used.has(k) && !DYNAMIC.some((p) => k.startsWith(p)) && k !== 'meta.dateLocale')).toEqual([]);
  });

  it('covers every artifact type, health state and health code', () => {
    for (const type of ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp']) {
      expect(typeLabel(type)).not.toBe(type);
      expect(typeLabelPlural(type)).not.toBe(type);
    }
    for (const h of ['ok', 'warn', 'err']) expect(healthLabel(h)).not.toBe(h);
    for (const c of ['noManifest', 'nameMismatch', 'noDescription', 'versionDup', 'noLicense', 'noChangelog', 'badHooks', 'badMcp', 'external']) {
      expect(healthCode(c)).not.toBe(c);
    }
  });
});

describe('t()', () => {
  it('fills placeholders', () => {
    expect(t('catalog.found', { n: 3 })).toBe('Found 3');
  });
});

describe('components', () => {
  const jsx = files.filter(([name]) => name.endsWith('.jsx') && name !== join('lib', 'i18n.jsx'));

  it('contain no literal UI text between tags', () => {
    const found = [];
    for (const [name, src] of jsx) {
      for (const m of src.matchAll(/(?<![=-])>([^<>{}\n]*[A-Za-z]{2,}[^<>{}\n]*)<(?=[A-Za-z/])/g)) found.push(`${name}: ${m[1].trim()}`);
    }
    expect(found).toEqual([]);
  });

  it('contain no literal text in UI attributes', () => {
    const found = [];
    for (const [name, src] of jsx) {
      for (const m of src.matchAll(/\b(?:aria-label|placeholder|title|alt)="([^"]*[A-Za-z]{2,}[^"]*)"/g)) found.push(`${name}: ${m[1]}`);
    }
    expect(found).toEqual([]);
  });
});
