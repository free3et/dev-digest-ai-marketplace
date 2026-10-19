import { daysSince } from './format.js';

/** Loads catalog.json (served by Vite in dev, emitted next to index.html in the build). */
export async function fetchCatalog() {
  const res = await fetch(new URL('catalog.json', document.baseURI), { cache: 'no-store' });
  if (!res.ok) throw new Error(`catalog.json: HTTP ${res.status}`);
  return normalize(await res.json());
}

const toDays = (x) => (typeof x === 'number' ? x : daysSince(x));

export function normalize(raw) {
  const plugins = (raw.plugins || []).map((p) => ({
    tags: [], kw: [], deps: [], cat: 'Other', health: 'ok', healthCodes: [], ...p,
    days: toDays(p.updated ?? 0),
    log: (p.log || []).map((l) => ({ ...l, notes: l.notes || [], days: toDays(l.date ?? 0) })),
  }));
  const parts = (raw.artifacts || []).map((a) => ({ tags: [], kw: [], ...a, days: toDays(a.updated ?? 0) }));
  const entries = plugins.map((p) => ({
    id: `${p.name}/plugin/${p.name}`, type: 'plugin', plugin: p.name, name: p.name, desc: p.desc, tags: p.tags, kw: p.kw, days: p.days,
  }));
  const artifacts = [...entries, ...parts];
  return {
    meta: raw.meta,
    plugins,
    artifacts,
    byId: Object.fromEntries(artifacts.map((a) => [a.id, a])),
    plugin: (name) => plugins.find((p) => p.name === name),
    ofPlugin: (name) => parts.filter((a) => a.plugin === name),
    releases: plugins
      .flatMap((p) => p.log.map((l) => ({ plugin: p.name, ver: l.ver, days: l.days, notes: l.notes })))
      .sort((x, y) => x.days - y.days),
  };
}
