// Client-side search: tokenize the query, require every keyword to match, weight fields.
export const STOP = new Set(
  'i need a an the skill skills agent agents plugin plugins for to of with me find show want looking that which what how and in on at'.split(' '),
);

export const tokens = (q) =>
  q.toLowerCase().replace(/[’`]/g, "'").split(/[^\p{L}\p{N}']+/u).filter((t) => t && !STOP.has(t));

/** Words over five letters also match by a simple stem: a common English ending is cut off, otherwise the last two letters. */
export const stem = (t) => {
  if (t.length <= 5) return t;
  const m = t.match(/^(.{4,}?)(ing|ers|er|ed|es|s)$/);
  return m ? m[1] : t.slice(0, -2);
};

const norm = (s) => s.toLowerCase().replace(/[’`]/g, "'");

/** 0 when any keyword has no match. Field weights: name 5, keywords/tags 4, description 3, plugin 2, usage 1. */
export function score(a, toks) {
  if (!toks.length) return 1;
  const fields = [
    [a.name, 5],
    [(a.kw || []).join(' '), 4],
    [(a.tags || []).join(' '), 4],
    [a.desc || '', 3],
    [a.plugin, 2],
    [`${(a.use || []).join(' ')} ${a.tools || ''}`, 1],
  ].map(([s, w]) => [norm(s), w]);
  let total = 0;
  for (const t of toks) {
    let best = 0;
    for (const [s, w] of fields) {
      if (s.includes(t)) best = Math.max(best, w);
      else if (t.length > 4 && s.includes(stem(t))) best = Math.max(best, w * 0.6);
    }
    if (!best) return 0;
    total += best;
  }
  return total;
}

/** Artifacts matching the query as [artifact, score] pairs. */
export const matchAll = (artifacts, toks) =>
  artifacts.map((a) => [a, score(a, toks)]).filter(([, s]) => s > 0);

/** Splits text into [{text, hit}] parts so React can wrap the matches. */
export function highlight(text, toks) {
  const words = toks.filter((t) => t.length > 1).map((t) => (t.length > 5 ? stem(t) : t));
  if (!words.length) return [{ text, hit: false }];
  const alt = words.sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`((?:${alt})[\\p{L}\\p{N}']*)`, 'giu');
  return text.split(re).filter(Boolean).map((part, i) => ({ text: part, hit: i % 2 === 1 }));
}
