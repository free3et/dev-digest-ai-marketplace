import { useState } from 'react';
import { copyText } from '../lib/copy.js';
import { useApp } from '../lib/context.jsx';
import { HEALTH_CODE, HEALTH_LABEL, TYPE_LABEL, addCmd, ago, fileOf, installCmd } from '../lib/format.js';
import { buildHash } from '../lib/route.js';
import { highlight } from '../lib/search.js';

export const Link = ({ to, children, ...rest }) => <a href={buildHash(to)} {...rest}>{children}</a>;

export const TypeBadge = ({ type }) => <span className="tb" style={{ '--c': `var(--t-${type})` }}>{TYPE_LABEL[type]}</span>;
export const HealthPill = ({ plugin }) => <span className={`pill ${plugin.health}`}>{HEALTH_LABEL[plugin.health]}</span>;
export const FreshPill = ({ days }) => (days <= 7 ? <span className="pill new">new</span> : days <= 14 ? <span className="pill new">updated</span> : null);

export function Highlight({ text, toks = [] }) {
  return highlight(text, toks).map((p, i) => (p.hit ? <mark key={i}>{p.text}</mark> : p.text));
}

export function CopyButton({ text, className = 'cp', label = 'Copy', children }) {
  const { showToast } = useApp();
  const [done, setDone] = useState(false);
  const click = async (e) => {
    e.stopPropagation();
    if (await copyText(text)) {
      showToast('Copied');
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    } else showToast('Select the text and copy it manually');
  };
  return <button type="button" className={`${className}${done ? ' done' : ''}`} onClick={click}>{done ? 'Done' : children || label}</button>;
}

export const CodeBlock = ({ text }) => <div className="code">{text}<CopyButton text={text} /></div>;

export function Empty({ title, children, style }) {
  return <div className="empty" style={style}><h3>{title}</h3><div>{children}</div></div>;
}

export function Crumbs({ items }) {
  return (
    <div className="crumbs">
      <Link to={{ name: 'catalog' }}>Catalog</Link>
      {items.map(([label, to]) => (
        <span key={label} style={{ display: 'contents' }}>
          <span>/</span>
          {to ? <Link to={to}>{label}</Link> : <span>{label}</span>}
        </span>
      ))}
    </div>
  );
}

export function Timeline({ items, compact }) {
  return (
    <div className="tl">
      {items.map((r) => (
        <div className="ti" key={`${r.plugin}-${r.ver}`}>
          <div className="ti-h">
            {!compact && <Link className="link mono" to={{ name: 'plugin', arg: r.plugin }}>{r.plugin}</Link>}
            <b className="mono">v{r.ver}</b>
            <span className="dim" style={{ fontSize: 13 }}>{ago(r.days)}</span>
            <FreshPill days={r.days} />
          </div>
          {r.notes.length > 0 && <ul>{r.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
        </div>
      ))}
    </div>
  );
}

export function SecurityPanel({ list }) {
  const risky = list.some((a) => a.type === 'hook' || a.type === 'mcp');
  const runs = list.filter((a) => a.run);
  const tools = list.filter((a) => a.tools);
  return (
    <section className="panel">
      <h3>What runs</h3>
      <p style={{ margin: '0 0 8px' }}>
        {risky ? <span className="pill warn">runs commands on your machine</span> : <span className="pill ok">text instructions only</span>}
      </p>
      {runs.map((a) => (
        <div className="sec-row" key={a.id}>
          <TypeBadge type={a.type} />
          <div><div className="ln">{a.name}</div><code>{a.event ? `${a.event} · ${a.matcher} → ` : ''}{a.run}</code></div>
        </div>
      ))}
      {tools.length > 0 && <div className="fg-t" style={{ marginTop: 12 }}>Allowed tools</div>}
      {tools.map((a) => (
        <div className="sec-row" key={a.id}>
          <TypeBadge type={a.type} />
          <div><div className="ln">{a.name}</div><code>{a.tools}</code></div>
        </div>
      ))}
      {!runs.length && !tools.length && <p className="muted" style={{ margin: 0 }}>No hooks, MCP servers or commands.</p>}
      <p className="note">Automatic static analysis. This is not a full security audit.</p>
    </section>
  );
}

export function InstallPanel({ plugin }) {
  const { catalog, prefs, toggleCart } = useApp();
  const inKit = prefs.cart.has(plugin);
  return (
    <section className="panel">
      <h3>Install</h3>
      <div className="codes"><CodeBlock text={addCmd(catalog)} /><CodeBlock text={installCmd(catalog, plugin)} /></div>
      <p style={{ margin: '12px 0 0' }}>
        <button type="button" className="btn sm" aria-pressed={inKit} onClick={() => toggleCart(plugin)}>{inKit ? 'In kit ✓' : '+ Add to kit'}</button>
      </p>
    </section>
  );
}

export function Card({ a, toks = [] }) {
  const { catalog, go, prefs, toggleCart, toggleSaved } = useApp();
  const p = catalog.plugin(a.plugin);
  const open = () => go({ name: 'artifact', arg: a.id });
  const inKit = prefs.cart.has(a.plugin);
  const saved = prefs.saved.has(a.id);
  return (
    <article className="card" tabIndex={0} role="link" onClick={open} onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) open(); }}>
      <div className="card-h">
        <TypeBadge type={a.type} />
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><FreshPill days={a.days} /><HealthPill plugin={p} /></span>
      </div>
      <h3><Highlight text={a.name} toks={toks} /></h3>
      <p><Highlight text={a.desc || ''} toks={toks} /></p>
      <div className="pl"><span>{a.plugin}</span><span>v{p.ver}</span><span>· {ago(a.days)}</span></div>
      <div className="tags">{a.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
      <div className="card-f">
        <CopyButton className="btn ghost sm" text={installCmd(catalog, a.plugin)}>Copy install command</CopyButton>
        <button type="button" className="btn ghost sm" aria-pressed={inKit} onClick={(e) => { e.stopPropagation(); toggleCart(a.plugin); }}>{inKit ? 'In kit ✓' : '+ Add to kit'}</button>
        <span className="sp" />
        <button type="button" className="star" aria-pressed={saved} aria-label="Save" onClick={(e) => { e.stopPropagation(); toggleSaved(a.id); }}>{saved ? '★' : '☆'}</button>
      </div>
    </article>
  );
}

export const FileLabel = ({ a }) => <span className="dim mono" style={{ fontWeight: 400, fontSize: 12 }}>{fileOf(a)}</span>;
