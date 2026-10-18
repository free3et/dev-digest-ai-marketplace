import { describe, expect, it } from 'vitest';
import { highlight, matchAll, score, tokens } from './search.js';

const skill = { name: 'code-review', desc: 'Systematic review of changes', plugin: 'code-quality', tags: ['review'], kw: ['pull request'], use: [], tools: 'Read' };
const hook = { name: 'format-on-write', desc: 'Formats a file after every edit', plugin: 'code-quality', tags: ['format'], kw: [] };

describe('tokens', () => {
  it('drops filler words and keeps the keywords', () => {
    expect(tokens('I need a skill for code review')).toEqual(['code', 'review']);
  });
  it('keeps apostrophes inside words', () => {
    expect(tokens("what's new")).toEqual(["what's", 'new']);
  });
});

describe('score', () => {
  it('returns 1 for an empty query so everything is listed', () => {
    expect(score(skill, [])).toBe(1);
  });
  it('requires every keyword to match', () => {
    expect(score(skill, ['code', 'review'])).toBeGreaterThan(0);
    expect(score(skill, ['code', 'database'])).toBe(0);
  });
  it('ranks a name match above a description match', () => {
    const byDesc = { ...hook, name: 'other', desc: 'does review' };
    expect(score(skill, ['review'])).toBeGreaterThan(score(byDesc, ['review']));
  });
  it('matches long words by their stem', () => {
    expect(score(skill, ['reviewing'])).toBeGreaterThan(0);
  });
});

describe('matchAll', () => {
  it('keeps only matching artifacts', () => {
    expect(matchAll([skill, hook], ['format']).map(([a]) => a.name)).toEqual(['format-on-write']);
  });
});

describe('highlight', () => {
  it('marks matches and keeps the original text', () => {
    const parts = highlight('Code review tool', ['review']);
    expect(parts.map((p) => p.text).join('')).toBe('Code review tool');
    expect(parts.filter((p) => p.hit).map((p) => p.text)).toEqual(['review']);
  });
  it('escapes regex characters in the query', () => {
    expect(() => highlight('a (b)', ['(b)'])).not.toThrow();
  });
});
