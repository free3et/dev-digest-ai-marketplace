// Hash routes, so deep links work on GitHub Pages: #/catalog?q=…&type=skill,hook&cat=…&plugin=…&tag=…
export const TYPE_IDS = ['plugin', 'skill', 'agent', 'command', 'hook', 'mcp'];
export const EMPTY_FILTERS = { q: '', type: [], cat: null, plugin: null, tag: null };
const PAGES = ['catalog', 'new', 'start', 'saved', 'install', 'contribute'];

export function buildHash(r) {
  switch (r.name) {
    case 'home': return '#/';
    case 'catalog': {
      const p = new URLSearchParams();
      if (r.q) p.set('q', r.q);
      if (r.type?.length) p.set('type', r.type.join(','));
      for (const k of ['cat', 'plugin', 'tag']) if (r[k]) p.set(k, r[k]);
      const s = p.toString();
      return `#/catalog${s ? `?${s}` : ''}`;
    }
    case 'artifact': return `#/a/${encodeURIComponent(r.arg)}`;
    case 'plugin': return `#/p/${encodeURIComponent(r.arg)}`;
    default: return `#/${r.name}`;
  }
}

export function parseHash(hash) {
  const h = hash.replace(/^#\/?/, '');
  const [path, qs = ''] = h.split('?');
  const i = path.indexOf('/');
  const head = i < 0 ? path : path.slice(0, i);
  const rest = i < 0 ? '' : decodeURIComponent(path.slice(i + 1));
  if (!head) return { name: 'home' };
  if (head === 'a' && rest) return { name: 'artifact', arg: rest };
  if (head === 'p' && rest) return { name: 'plugin', arg: rest };
  if (head === 'catalog') {
    const p = new URLSearchParams(qs);
    return {
      name: 'catalog',
      q: p.get('q') || '',
      type: (p.get('type') || '').split(',').filter((x) => TYPE_IDS.includes(x)),
      cat: p.get('cat'),
      plugin: p.get('plugin'),
      tag: p.get('tag'),
    };
  }
  if (PAGES.includes(head)) return { name: head };
  return { name: 'notfound' };
}
