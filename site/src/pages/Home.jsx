import { useState } from 'react';
import { Card, CodeBlock, Empty, Link, Timeline } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { TYPE_LABEL_PL, addCmd, ago, installCmd } from '../lib/format.js';
import { EMPTY_FILTERS } from '../lib/route.js';

const EXAMPLES = ['code review skill', 'commit message', 'tests', 'database', 'documentation'];
const TYPES = ['skill', 'agent', 'command', 'hook', 'mcp'];

export default function Home() {
  const { catalog: c, go } = useApp();
  const [q, setQ] = useState('');
  const search = (text) => go({ name: 'catalog', ...EMPTY_FILTERS, q: text });
  const empty = c.plugins.length === 0;
  const count = (t) => c.artifacts.filter((a) => a.type === t).length;
  const valid = c.plugins.filter((p) => p.health === 'ok').length;
  const example = c.plugins[0]?.name || '<plugin>';

  return (
    <>
      <section className="hero">
        <div className="eyebrow">Catalog of the marketplace for Claude Code</div>
        <h1 style={{ marginTop: 10, maxWidth: '16ch' }}>Find a skill, agent or plugin by task</h1>
        <p className="lead">Describe what you need. The catalog searches plugins, skills, agents, commands, hooks and MCP servers.</p>
        <form className="hsearch" onSubmit={(e) => { e.preventDefault(); search(q); }}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="I need a skill for code review" autoComplete="off" aria-label="What do you need" />
          <button className="btn" type="submit">Search</button>
        </form>
        {!empty && (
          <div className="chips" aria-label="Example queries">
            {EXAMPLES.map((x) => <button type="button" key={x} className="chip" onClick={() => search(x)}>{x}</button>)}
          </div>
        )}
      </section>

      {empty ? (
        <section className="sec">
          <Empty title="No plugins published yet">
            <p style={{ margin: '0 0 14px' }}>This catalog lists exactly what is in the repository. When the first plugin is added to <span className="mono">plugins/</span> and to the marketplace file, it appears here after the next deploy.</p>
            <Link className="btn sm" to={{ name: 'contribute' }}>How to add a plugin</Link>
          </Empty>
        </section>
      ) : (
        <>
          <section className="sec">
            <div className="stats">
              <div className="stat"><b>{c.plugins.length}</b><span><i className="dot" style={{ '--c': 'var(--t-plugin)' }} />{TYPE_LABEL_PL.plugin}</span></div>
              {TYPES.map((t) => (
                <Link key={t} className="stat" to={{ name: 'catalog', ...EMPTY_FILTERS, type: [t] }}>
                  <b>{count(t)}</b><span><i className="dot" style={{ '--c': `var(--t-${t})` }} />{TYPE_LABEL_PL[t]}</span>
                </Link>
              ))}
            </div>
            <div className="meta-line">
              <span>Valid plugins: {valid} of {c.plugins.length}</span>
              <span>Updated: {ago(Math.min(...c.artifacts.map((a) => a.days)))}</span>
              <span>Total artifacts: {c.artifacts.length}</span>
            </div>
          </section>
          <div className="sec home-2">
            <section>
              <div className="sec-h"><h2>What's new</h2><Link className="link" to={{ name: 'new' }}>Full feed →</Link></div>
              <Timeline items={c.releases.slice(0, 3)} />
            </section>
            <section className="panel">
              <div className="eyebrow">Connect</div>
              <h2 style={{ margin: '6px 0 12px' }}>Add the marketplace in 30 seconds</h2>
              <CodeBlock text={addCmd(c)} /><div style={{ height: 8 }} /><CodeBlock text={installCmd(c, example)} />
              <p style={{ margin: '14px 0 0' }}><Link className="btn sm" to={{ name: 'start' }}>Step-by-step guide</Link></p>
            </section>
          </div>
          <section className="sec">
            <div className="sec-h"><h2>Recently updated</h2><Link className="link" to={{ name: 'catalog', ...EMPTY_FILTERS }}>Whole catalog →</Link></div>
            <div className="grid">
              {[...c.artifacts].filter((a) => a.type !== 'plugin').sort((a, b) => a.days - b.days).slice(0, 6).map((a) => <Card key={a.id} a={a} />)}
            </div>
          </section>
        </>
      )}
    </>
  );
}
