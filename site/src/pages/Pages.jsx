import { useState } from 'react';
import { Card, CodeBlock, Empty, HealthPill, Link, Timeline } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { addCmd, installCmd, settingsSnippet } from '../lib/format.js';

export function WhatsNew() {
  const { catalog: c } = useApp();
  return (
    <>
      <div className="eyebrow">Release feed</div>
      <h1 style={{ marginTop: 8 }}>What's new</h1>
      <p className="lead">New plugin versions from their CHANGELOG files. No need to follow git.</p>
      <div style={{ marginTop: 28, maxWidth: 720 }}>
        {c.releases.length ? <Timeline items={c.releases} /> : <Empty title="No releases yet"><p style={{ margin: 0 }}>Releases appear here once a plugin has a version history.</p></Empty>}
      </div>
    </>
  );
}

const Tabs = ({ value, onChange, items }) => (
  <div className="tabs" role="tablist">
    {items.map(([id, label]) => <button type="button" role="tab" key={id} aria-selected={value === id} onClick={() => onChange(id)}>{label}</button>)}
  </div>
);

export function Start() {
  const { catalog: c } = useApp();
  const [tab, setTab] = useState('me');
  const example = c.plugins[0]?.name || '<plugin>';
  const steps = [
    ['Add the marketplace', 'Once per machine.', addCmd(c)],
    ['Install a plugin', 'Take the name from the catalog.', installCmd(c, example)],
    ['Reload plugins', 'Picks up the new components in the current session.', '/reload-plugins'],
    ['Check', 'The plugin should be in the list.', 'claude plugin list'],
  ];
  return (
    <>
      <div className="eyebrow">Onboarding</div>
      <h1 style={{ marginTop: 8 }}>Connect the marketplace</h1>
      <p className="lead">Four commands, about 30 seconds.</p>
      <div style={{ marginTop: 24 }}>
        <Tabs value={tab} onChange={setTab} items={[['me', 'For me'], ['team', 'For my team']]} />
        {tab === 'me' ? (
          <div className="steps" style={{ maxWidth: 720 }}>
            {steps.map(([title, hint, cmd], i) => (
              <div className="step" key={title}><i>{i + 1}</i><div style={{ minWidth: 0 }}><h3>{title}</h3><p className="muted" style={{ margin: '2px 0 8px' }}>{hint}</p><CodeBlock text={cmd} /></div></div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            <p className="muted" style={{ marginTop: 0 }}>Put this snippet into <span className="mono">.claude/settings.json</span> in your repository. Every member gets the marketplace after confirming trust for the folder.</p>
            <CodeBlock text={settingsSnippet(c, c.plugins.length ? [example] : [])} />
          </div>
        )}
      </div>
    </>
  );
}

export function Saved() {
  const { catalog: c, prefs } = useApp();
  const list = c.artifacts.filter((a) => prefs.saved.has(a.id));
  return (
    <>
      <h1>Saved</h1>
      <p className="lead">Bookmarks are stored in this browser only.</p>
      <div style={{ marginTop: 24 }}>
        {list.length ? <div className="grid">{list.map((a) => <Card key={a.id} a={a} />)}</div> : (
          <Empty title="Nothing here yet">
            <p style={{ margin: '0 0 14px' }}>Press ☆ on a card to save an artifact.</p>
            <Link className="btn sm" to={{ name: 'catalog' }}>To the catalog</Link>
          </Empty>
        )}
      </div>
    </>
  );
}

export function InstallKit() {
  const { catalog: c, prefs, toggleCart } = useApp();
  const [mode, setMode] = useState('sh');
  const sel = [...prefs.cart].filter((n) => c.plugin(n));
  const text = mode === 'sh' ? [addCmd(c), ...sel.map((n) => installCmd(c, n))].join('\n') : settingsSnippet(c, sel);
  return (
    <>
      <h1>Install kit</h1>
      <p className="lead">Pick plugins in the catalog and copy a ready script or a team settings snippet.</p>
      <div className="cols">
        <div className="stack">
          <section className="panel">
            <h3>Selected: {sel.length}</h3>
            {sel.length ? sel.map((n) => {
              const p = c.plugin(n);
              return (
                <div className="sel" key={n}>
                  <Link className="link mono" to={{ name: 'plugin', arg: n }}>{n}</Link>
                  <span className="dim mono" style={{ fontSize: 12 }}>v{p.ver}</span>
                  <HealthPill plugin={p} />
                  <span style={{ flex: 1 }} />
                  <button type="button" className="btn ghost sm" onClick={() => toggleCart(n)}>Remove</button>
                </div>
              );
            }) : (
              <Empty title="The kit is empty" style={{ border: 0, padding: '24px 0' }}>
                <p style={{ margin: '0 0 14px' }}>Press “+ Add to kit” on a plugin card.</p>
                <Link className="btn sm" to={{ name: 'catalog' }}>To the catalog</Link>
              </Empty>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="panel">
            <Tabs value={mode} onChange={setMode} items={[['sh', 'Script'], ['json', 'settings.json']]} />
            {sel.length ? <CodeBlock text={text} /> : <p className="muted" style={{ margin: 0 }}>Add at least one plugin.</p>}
          </section>
        </div>
      </div>
    </>
  );
}

const TEMPLATE = '---\nname: my-skill\ndescription: One sentence: when this skill is needed\nallowed-tools: Read, Grep\nkeywords: keyword, synonym\n---\n\nInstructions for Claude...';

export function Contribute() {
  const { catalog: c } = useApp();
  const issues = `https://github.com/${c.meta.repo}/issues/new`;
  return (
    <>
      <div className="eyebrow">Contributing</div>
      <h1 style={{ marginTop: 8 }}>Add your plugin</h1>
      <p className="lead">The catalog is built from the repository. Add the files and merge the PR, and the artifact appears in the catalog within minutes.</p>
      <div className="two" style={{ marginTop: 26 }}>
        <a className="panel" href={issues} target="_blank" rel="noopener noreferrer"><h3>Propose a plugin ↗</h3><p className="muted" style={{ margin: 0 }}>Opens an Issue. Describe the task and link the code.</p></a>
        <a className="panel" href={issues} target="_blank" rel="noopener noreferrer"><h3>Report a problem ↗</h3><p className="muted" style={{ margin: 0 }}>A bug in a plugin or in the catalog.</p></a>
      </div>
      <section className="sec" style={{ maxWidth: 720 }}>
        <h2>SKILL.md template</h2>
        <p className="muted">The keywords field is optional. Add synonyms so search finds the skill by the words your users type.</p>
        <CodeBlock text={TEMPLATE} />
      </section>
    </>
  );
}
