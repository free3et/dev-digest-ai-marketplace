import { describe, expect, it } from 'vitest';
import { buildHash, parseHash } from './route.js';

describe('hash routes', () => {
  it('round-trips a catalog search with filters', () => {
    const r = { name: 'catalog', q: "code review's", type: ['skill', 'hook'], cat: 'Code quality', plugin: null, tag: 'review' };
    expect(parseHash(buildHash(r))).toEqual(r);
  });
  it('round-trips artifact ids that contain slashes', () => {
    const r = { name: 'artifact', arg: 'code-quality/command//review' };
    expect(parseHash(buildHash(r))).toEqual(r);
  });
  it('treats an empty hash as home and unknown ones as not found', () => {
    expect(parseHash('')).toEqual({ name: 'home' });
    expect(parseHash('#/nope')).toEqual({ name: 'notfound' });
  });
  it('ignores unknown artifact types in the type filter', () => {
    expect(parseHash('#/catalog?type=skill,bogus').type).toEqual(['skill']);
  });
});
