import { CodeBlock, Crumbs, FileLabel, FreshPill, HealthPill, InstallPanel, Link, SecurityPanel, Timeline, TypeBadge } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { HEALTH_CODE, ago, fileOf, ghUrl } from '../lib/format.js';
import NotFound from './NotFound.jsx';

/** Synthesized preview for artifacts whose file text is not in the catalog. */
function preview(a) {
  if (a.content) return a.content;
  if (a.type === 'skill') return `---\nname: ${a.name}\ndescription: ${a.desc}\nallowed-tools: ${a.tools}\n---`;
  if (a.type === 'agent') return `---\nname: ${a.name}\ndescription: ${a.desc}\ntools: ${a.tools}\nmodel: ${a.model}\n---`;
  return a.run || a.desc;
}

function Actions({ a }) {
  const { catalog, prefs, toggleSaved } = useApp();
  const plugin = catalog.plugin(a.plugin);
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {a.type !== 'plugin' && (
        <button type="button" className="btn ghost sm" aria-pressed={prefs.saved.has(a.id)} onClick={() => toggleSaved(a.id)}>{prefs.saved.has(a.id) ? '★ Saved' : '☆ Save'}</button>
      )}
      {!plugin.external && <a className="btn ghost sm" href={ghUrl(catalog, a)} target="_blank" rel="noopener noreferrer">Open on GitHub ↗</a>}
    </div>
  );
}

export function Artifact() {
  const { catalog: c, route } = useApp();
  const a = c.byId[route.arg];
  if (!a) return <NotFound />;
  if (a.type === 'plugin') return <PluginPage name={a.plugin} />;
  const p = c.plugin(a.plugin);
  const sibs = c.ofPlugin(a.plugin).filter((x) => x.id !== a.id);
  return (
    <>
      <Crumbs items={[[a.plugin, { name: 'plugin', arg: a.plugin }], [a.name]]} />
      <div className="dh">
        <div style={{ minWidth: 0 }}>
          <TypeBadge type={a.type} />
          <h1 style={{ marginTop: 8 }}>{a.name}</h1>
          {a.desc && <p className="lead" style={{ marginTop: 8 }}>{a.desc}</p>}
          <div className="pl" style={{ marginTop: 12 }}><span>{a.plugin} v{p.ver}</span><HealthPill plugin={p} /><FreshPill days={a.days} /><span>· {ago(a.days)}</span></div>
        </div>
        <Actions a={a} />
      </div>
      <div className="cols">
        <div className="stack">
          {a.use && <section className="panel prose"><h3>When to use</h3><ul>{a.use.map((u) => <li key={u}>{u}</li>)}</ul></section>}
          <section className="panel"><h3>Content <FileLabel a={a} /></h3><CodeBlock text={preview(a)} /></section>
          {sibs.length > 0 && (
            <section className="panel">
              <h3>More in {a.plugin}</h3>
              <div className="list">{sibs.map((s) => <Link key={s.id} className="li" to={{ name: 'artifact', arg: s.id }}><TypeBadge type={s.type} /><span className="ln">{s.name}</span><span className="sp" /><span className="dim" style={{ fontSize: 13 }}>→</span></Link>)}</div>
            </section>
          )}
        </div>
        <div className="stack"><InstallPanel plugin={a.plugin} /><SecurityPanel list={[a]} /></div>
      </div>
    </>
  );
}

export function PluginPage({ name }) {
  const { catalog: c, route } = useApp();
  const p = c.plugin(name || route.arg);
  if (!p) return <NotFound />;
  const list = c.ofPlugin(p.name);
  const order = ['skill', 'agent', 'command', 'hook', 'mcp'];
  const files = order.flatMap((t) => list.filter((a) => a.type === t)).map(fileOf);
  const root = p.path || `plugins/${p.name}`;
  const tree = [`${root}/`, '├─ .claude-plugin/plugin.json', ...files.map((f, i) => `${i === files.length - 1 ? '└─' : '├─'} ${f}`)].join('\n');
  return (
    <>
      <Crumbs items={[[p.name]]} />
      <div className="dh">
        <div style={{ minWidth: 0 }}>
          <TypeBadge type="plugin" />
          <h1 style={{ marginTop: 8 }}>{p.name}</h1>
          {p.desc && <p className="lead" style={{ marginTop: 8 }}>{p.desc}</p>}
        </div>
        <Actions a={{ id: `${p.name}/plugin/${p.name}`, type: 'plugin', plugin: p.name }} />
      </div>
      <div className="cols">
        <div className="stack">
          <section className="panel">
            <h3>Plugin contents · {list.length}</h3>
            {list.length ? (
              <div className="list">{list.map((s) => <Link key={s.id} className="li" to={{ name: 'artifact', arg: s.id }}><TypeBadge type={s.type} /><span className="ln">{s.name}</span><span className="sp" /><span className="dim" style={{ fontSize: 13, maxWidth: '30ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</span></Link>)}</div>
            ) : <p className="muted" style={{ margin: 0 }}>No components are indexed for this plugin.</p>}
          </section>
          {!p.external && <section className="panel"><h3>File structure</h3><div className="tree">{tree}</div></section>}
          {p.log.length > 0 && <section className="panel"><h3>Change history</h3><Timeline compact items={p.log.map((l) => ({ plugin: p.name, ver: l.ver, days: l.days, notes: l.notes }))} /></section>}
        </div>
        <div className="stack">
          <InstallPanel plugin={p.name} />
          <section className="panel">
            <h3>Status</h3>
            <dl className="kv">
              <dt>Version</dt><dd className="mono">{p.ver || '—'}</dd>
              <dt>Category</dt><dd>{p.cat}</dd>
              <dt>Updated</dt><dd>{ago(p.days)}</dd>
              <dt>Validation</dt><dd><HealthPill plugin={p} /></dd>
            </dl>
            {p.healthCodes.length
              ? <p className="note" style={{ color: `var(--${p.health === 'err' ? 'err' : 'warn'})` }}>{p.healthCodes.map((x) => HEALTH_CODE[x] || x).join(' ')}</p>
              : <p className="note">No issues found by the catalog checks.</p>}
          </section>
          {p.deps.length > 0 && (
            <section className="panel">
              <h3>Dependencies · {p.deps.length}</h3>
              <div className="list">{p.deps.map((d) => <Link key={d.name} className="li" to={{ name: 'plugin', arg: d.name }}><span className="ln">{d.name}</span><span className="sp" /><span className="dim mono">{d.range || 'any version'}</span></Link>)}</div>
              <p className="note">Installed automatically with this plugin.</p>
            </section>
          )}
          <SecurityPanel list={list} />
        </div>
      </div>
    </>
  );
}
