import { Card, Empty } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { TYPE_LABEL } from '../lib/format.js';
import { EMPTY_FILTERS, TYPE_IDS } from '../lib/route.js';
import { matchAll, tokens } from '../lib/search.js';

export default function Catalog() {
  const { catalog: c, route: r, go } = useApp();
  const toks = tokens(r.q);
  const base = matchAll(c.artifacts, toks);
  const catOf = (a) => c.plugin(a.plugin).cat;
  const res = base
    .filter(([a]) => (!r.type.length || r.type.includes(a.type)) && (!r.cat || catOf(a) === r.cat) && (!r.plugin || a.plugin === r.plugin) && (!r.tag || a.tags.includes(r.tag)))
    .sort((x, y) => (toks.length ? y[1] - x[1] || x[0].days - y[0].days : x[0].days - y[0].days));

  const set = (patch) => go({ ...r, ...patch }, { replace: true });
  const count = (fn) => base.filter(([a]) => fn(a)).length;
  const types = TYPE_IDS.map((t) => [t, count((a) => a.type === t)]).filter(([, n]) => n);
  const cats = [...new Set(c.plugins.map((p) => p.cat))].map((x) => [x, count((a) => catOf(a) === x)]).filter(([, n]) => n);
  const plugins = c.plugins.map((p) => [p.name, count((a) => a.plugin === p.name)]).filter(([, n]) => n);
  const tags = [...new Set(c.artifacts.flatMap((a) => a.tags))].filter((t) => base.some(([a]) => a.tags.includes(t))).slice(0, 14);
  const anyFilter = r.type.length || r.cat || r.plugin || r.tag;
  const toggleType = (t) => set({ type: r.type.includes(t) ? r.type.filter((x) => x !== t) : [...r.type, t] });
  const pick = (key, v) => set({ [key]: r[key] === v ? null : v });
  const Opt = ({ on, onClick, label, n, dot }) => (
    <button type="button" className="fopt" aria-pressed={on} onClick={onClick}>
      {dot && <i className="dot" style={{ '--c': dot }} />}{label}<em>{n}</em>
    </button>
  );

  return (
    <>
      <div className="res-h">
        <div>
          <h1 style={{ fontSize: 28 }}>{r.q ? `Results: “${r.q}”` : 'Catalog'}</h1>
          {r.q && toks.length > 0 && <div className="dim mono" style={{ fontSize: 12, marginTop: 6 }}>keywords: {toks.join(' · ')}</div>}
        </div>
        <div className="mono muted" style={{ fontSize: 13 }}>Found {res.length}</div>
      </div>
      <div className="cat">
        <aside className="filters" aria-label="Filters">
          <div><div className="fg-t">Type</div>{types.map(([t, n]) => <Opt key={t} on={r.type.includes(t)} onClick={() => toggleType(t)} label={TYPE_LABEL[t]} n={n} dot={`var(--t-${t})`} />)}</div>
          <div><div className="fg-t">Category</div>{cats.map(([x, n]) => <Opt key={x} on={r.cat === x} onClick={() => pick('cat', x)} label={x} n={n} />)}</div>
          <div><div className="fg-t">Plugin</div>{plugins.map(([x, n]) => <Opt key={x} on={r.plugin === x} onClick={() => pick('plugin', x)} label={x} n={n} />)}</div>
          {tags.length > 0 && (
            <div><div className="fg-t">Tags</div>
              <div className="chips" style={{ margin: 0 }}>{tags.map((t) => <button type="button" key={t} className="chip" aria-pressed={r.tag === t} onClick={() => pick('tag', t)}>{t}</button>)}</div>
            </div>
          )}
          {anyFilter && <button type="button" className="btn ghost sm" onClick={() => set({ ...EMPTY_FILTERS, q: r.q })}>Reset filters</button>}
        </aside>
        <section>
          {res.length ? (
            <div className="grid">{res.map(([a]) => <Card key={a.id} a={a} toks={toks} />)}</div>
          ) : (
            <Empty title={c.artifacts.length ? 'Nothing found' : 'The catalog is empty'}>
              <p style={{ margin: 0 }}>{c.artifacts.length ? 'Try other words or remove the filters.' : 'No plugins have been published yet.'}</p>
            </Empty>
          )}
        </section>
      </div>
    </>
  );
}
