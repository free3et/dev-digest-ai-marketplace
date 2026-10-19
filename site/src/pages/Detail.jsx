import { CodeBlock, Crumbs, FileLabel, FreshPill, HealthPill, InstallPanel, Link, SecurityPanel, Timeline, TypeBadge } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { ago, fileOf, ghUrl } from '../lib/format.js';
import { healthCode, t } from '../lib/i18n.jsx';
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
        <button type="button" className="btn ghost sm" aria-pressed={prefs.saved.has(a.id)} onClick={() => toggleSaved(a.id)}>{prefs.saved.has(a.id) ? t('detail.saved') : t('detail.save')}</button>
      )}
      {!plugin.external && <a className="btn ghost sm" href={ghUrl(catalog, a)} target="_blank" rel="noopener noreferrer">{t('detail.openGithub')}</a>}
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
          {a.use && <section className="panel prose"><h3>{t('detail.whenToUse')}</h3><ul>{a.use.map((u) => <li key={u}>{u}</li>)}</ul></section>}
          <section className="panel"><h3>{t('detail.content')} <FileLabel a={a} /></h3><CodeBlock text={preview(a)} /></section>
          {sibs.length > 0 && (
            <section className="panel">
              <h3>{t('detail.moreIn', { plugin: a.plugin })}</h3>
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
            <h3>{t('detail.contents', { n: list.length })}</h3>
            {list.length ? (
              <div className="list">{list.map((s) => <Link key={s.id} className="li" to={{ name: 'artifact', arg: s.id }}><TypeBadge type={s.type} /><span className="ln">{s.name}</span><span className="sp" /><span className="dim" style={{ fontSize: 13, maxWidth: '30ch', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.desc}</span></Link>)}</div>
            ) : <p className="muted" style={{ margin: 0 }}>{t('detail.noComponents')}</p>}
          </section>
          {!p.external && <section className="panel"><h3>{t('detail.fileStructure')}</h3><div className="tree">{tree}</div></section>}
          {p.log.length > 0 && <section className="panel"><h3>{t('detail.changeHistory')}</h3><Timeline compact items={p.log.map((l) => ({ plugin: p.name, ver: l.ver, days: l.days, notes: l.notes }))} /></section>}
        </div>
        <div className="stack">
          <InstallPanel plugin={p.name} />
          <section className="panel">
            <h3>{t('detail.status')}</h3>
            <dl className="kv">
              <dt>{t('detail.version')}</dt><dd className="mono">{p.ver || t('common.none')}</dd>
              <dt>{t('detail.category')}</dt><dd>{p.cat}</dd>
              <dt>{t('detail.updated')}</dt><dd>{ago(p.days)}</dd>
              <dt>{t('detail.validation')}</dt><dd><HealthPill plugin={p} /></dd>
            </dl>
            {p.healthCodes.length
              ? <p className="note" style={{ color: `var(--${p.health === 'err' ? 'err' : 'warn'})` }}>{p.healthCodes.map((x) => healthCode(x)).join(' ')}</p>
              : <p className="note">{t('detail.noIssues')}</p>}
          </section>
          {p.deps.length > 0 && (
            <section className="panel">
              <h3>{t('detail.deps', { n: p.deps.length })}</h3>
              <div className="list">{p.deps.map((d) => <Link key={d.name} className="li" to={{ name: 'plugin', arg: d.name }}><span className="ln">{d.name}</span><span className="sp" /><span className="dim mono">{d.range || t('detail.anyVersion')}</span></Link>)}</div>
              <p className="note">{t('detail.depsNote')}</p>
            </section>
          )}
          <SecurityPanel list={list} />
        </div>
      </div>
    </>
  );
}
