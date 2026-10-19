import { describe, expect, it } from 'vitest';
import { buildCatalog, frontmatter } from '../../../scripts/catalog.mjs';

describe('frontmatter', () => {
  it('reads flat and quoted values', () => {
    expect(frontmatter('---\nname: a\ndescription: "Does x"\n---\nbody')).toEqual({ name: 'a', description: 'Does x' });
  });

  it('folds a > block scalar into one line', () => {
    const fm = frontmatter('---\nname: a\ndescription: >-\n  First line\n  second line.\nmodel: sonnet\n---\n');
    expect(fm.description).toBe('First line second line.');
    expect(fm.model).toBe('sonnet');
  });

  it('keeps line breaks for a | block scalar', () => {
    expect(frontmatter('---\nnote: |\n  one\n  two\n---\n').note).toBe('one\ntwo');
  });
});

describe('buildCatalog', () => {
  const catalog = buildCatalog();

  it('gives every artifact a real description', () => {
    const bad = catalog.artifacts.filter((a) => !a.desc || /^[>|][+-]?$/.test(a.desc));
    expect(bad.map((a) => a.id)).toEqual([]);
  });

  it('indexes plugin dependencies', () => {
    const sdd = catalog.plugins.find((p) => p.name === 'sdd-engineering');
    expect(sdd.deps.map((d) => d.name).sort()).toEqual(['architecture-review', 'engineering-paved-path', 'research-tools']);
    expect(sdd.deps.every((d) => d.range === '^1.0.0')).toBe(true);
  });
});
