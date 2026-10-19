import { useState } from 'react';
import { Card, CodeBlock, Empty, HealthPill, Link, Timeline } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { addCmd, installCmd, settingsSnippet } from '../lib/format.js';
import { rich, t } from '../lib/i18n.jsx';

export function WhatsNew() {
  const { catalog: c } = useApp();
  return (
    <>
      <div className="eyebrow">{t('whatsNew.eyebrow')}</div>
      <h1 style={{ marginTop: 8 }}>{t('whatsNew.title')}</h1>
      <p className="lead">{t('whatsNew.lead')}</p>
      <div style={{ marginTop: 28, maxWidth: 720 }}>
        {c.releases.length ? <Timeline items={c.releases} /> : <Empty title={t('whatsNew.emptyTitle')}><p style={{ margin: 0 }}>{t('whatsNew.emptyBody')}</p></Empty>}
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
  const example = c.plugins[0]?.name || t('common.pluginPlaceholder');
  const steps = [
    [t('start.step1Title'), t('start.step1Hint'), addCmd(c)],
    [t('start.step2Title'), t('start.step2Hint'), installCmd(c, example)],
    [t('start.step3Title'), t('start.step3Hint'), '/reload-plugins'],
    [t('start.step4Title'), t('start.step4Hint'), 'claude plugin list'],
  ];
  return (
    <>
      <div className="eyebrow">{t('start.eyebrow')}</div>
      <h1 style={{ marginTop: 8 }}>{t('start.title')}</h1>
      <p className="lead">{t('start.lead')}</p>
      <div style={{ marginTop: 24 }}>
        <Tabs value={tab} onChange={setTab} items={[['me', t('start.tabMe')], ['team', t('start.tabTeam')]]} />
        {tab === 'me' ? (
          <div className="steps" style={{ maxWidth: 720 }}>
            {steps.map(([title, hint, cmd], i) => (
              <div className="step" key={title}><i>{i + 1}</i><div style={{ minWidth: 0 }}><h3>{title}</h3><p className="muted" style={{ margin: '2px 0 8px' }}>{hint}</p><CodeBlock text={cmd} /></div></div>
            ))}
          </div>
        ) : (
          <div style={{ maxWidth: 720 }}>
            <p className="muted" style={{ marginTop: 0 }}>{rich('start.teamBody')}</p>
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
      <h1>{t('saved.title')}</h1>
      <p className="lead">{t('saved.lead')}</p>
      <div style={{ marginTop: 24 }}>
        {list.length ? <div className="grid">{list.map((a) => <Card key={a.id} a={a} />)}</div> : (
          <Empty title={t('saved.emptyTitle')}>
            <p style={{ margin: '0 0 14px' }}>{t('saved.emptyBody')}</p>
            <Link className="btn sm" to={{ name: 'catalog' }}>{t('common.toCatalog')}</Link>
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
      <h1>{t('kit.title')}</h1>
      <p className="lead">{t('kit.lead')}</p>
      <div className="cols">
        <div className="stack">
          <section className="panel">
            <h3>{t('kit.selected', { n: sel.length })}</h3>
            {sel.length ? sel.map((n) => {
              const p = c.plugin(n);
              return (
                <div className="sel" key={n}>
                  <Link className="link mono" to={{ name: 'plugin', arg: n }}>{n}</Link>
                  <span className="dim mono" style={{ fontSize: 12 }}>v{p.ver}</span>
                  <HealthPill plugin={p} />
                  <span style={{ flex: 1 }} />
                  <button type="button" className="btn ghost sm" onClick={() => toggleCart(n)}>{t('common.remove')}</button>
                </div>
              );
            }) : (
              <Empty title={t('kit.emptyTitle')} style={{ border: 0, padding: '24px 0' }}>
                <p style={{ margin: '0 0 14px' }}>{t('kit.emptyBody')}</p>
                <Link className="btn sm" to={{ name: 'catalog' }}>{t('common.toCatalog')}</Link>
              </Empty>
            )}
          </section>
        </div>
        <div className="stack">
          <section className="panel">
            <Tabs value={mode} onChange={setMode} items={[['sh', t('kit.tabScript')], ['json', t('kit.tabSettings')]]} />
            {sel.length ? <CodeBlock text={text} /> : <p className="muted" style={{ margin: 0 }}>{t('kit.addOne')}</p>}
          </section>
        </div>
      </div>
    </>
  );
}

export function Contribute() {
  const { catalog: c } = useApp();
  const issues = `https://github.com/${c.meta.repo}/issues/new`;
  return (
    <>
      <div className="eyebrow">{t('contribute.eyebrow')}</div>
      <h1 style={{ marginTop: 8 }}>{t('contribute.title')}</h1>
      <p className="lead">{t('contribute.lead')}</p>
      <div className="two" style={{ marginTop: 26 }}>
        <a className="panel" href={issues} target="_blank" rel="noopener noreferrer"><h3>{t('contribute.proposeTitle')}</h3><p className="muted" style={{ margin: 0 }}>{t('contribute.proposeBody')}</p></a>
        <a className="panel" href={issues} target="_blank" rel="noopener noreferrer"><h3>{t('contribute.reportTitle')}</h3><p className="muted" style={{ margin: 0 }}>{t('contribute.reportBody')}</p></a>
      </div>
      <section className="sec" style={{ maxWidth: 720 }}>
        <h2>{t('contribute.templateTitle')}</h2>
        <p className="muted">{t('contribute.templateHint')}</p>
        <CodeBlock text={t('contribute.template')} />
      </section>
    </>
  );
}
