import { useState } from 'react';
import { Card, CodeBlock, Empty, Link, Timeline } from '../components/ui.jsx';
import { useApp } from '../lib/context.jsx';
import { addCmd, ago, installCmd } from '../lib/format.js';
import { list, rich, t, typeLabelPlural } from '../lib/i18n.jsx';
import { EMPTY_FILTERS } from '../lib/route.js';

const TYPES = ['skill', 'agent', 'command', 'hook', 'mcp'];

export default function Home() {
  const { catalog: c, go } = useApp();
  const [q, setQ] = useState('');
  const search = (text) => go({ name: 'catalog', ...EMPTY_FILTERS, q: text });
  const empty = c.plugins.length === 0;
  const count = (ty) => c.artifacts.filter((a) => a.type === ty).length;
  const valid = c.plugins.filter((p) => p.health === 'ok').length;
  const example = c.plugins[0]?.name || t('common.pluginPlaceholder');

  return (
    <>
      <section className="hero">
        <div className="eyebrow">{t('home.eyebrow')}</div>
        <h1 style={{ marginTop: 10, maxWidth: '16ch' }}>{t('home.title')}</h1>
        <p className="lead">{t('home.lead')}</p>
        <form className="hsearch" onSubmit={(e) => { e.preventDefault(); search(q); }}>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('home.searchPlaceholder')} autoComplete="off" aria-label={t('home.searchLabel')} />
          <button className="btn" type="submit">{t('home.search')}</button>
        </form>
        {!empty && (
          <div className="chips" aria-label={t('home.examplesLabel')}>
            {list('home.examples').map((x) => <button type="button" key={x} className="chip" onClick={() => search(x)}>{x}</button>)}
          </div>
        )}
      </section>

      {empty ? (
        <section className="sec">
          <Empty title={t('home.emptyTitle')}>
            <p style={{ margin: '0 0 14px' }}>{rich('home.emptyBody')}</p>
            <Link className="btn sm" to={{ name: 'contribute' }}>{t('home.howToAdd')}</Link>
          </Empty>
        </section>
      ) : (
        <>
          <section className="sec">
            <div className="stats">
              <div className="stat"><b>{c.plugins.length}</b><span><i className="dot" style={{ '--c': 'var(--t-plugin)' }} />{typeLabelPlural('plugin')}</span></div>
              {TYPES.map((ty) => (
                <Link key={ty} className="stat" to={{ name: 'catalog', ...EMPTY_FILTERS, type: [ty] }}>
                  <b>{count(ty)}</b><span><i className="dot" style={{ '--c': `var(--t-${ty})` }} />{typeLabelPlural(ty)}</span>
                </Link>
              ))}
            </div>
            <div className="meta-line">
              <span>{t('home.validPlugins', { valid, total: c.plugins.length })}</span>
              <span>{t('home.updated', { when: ago(Math.min(...c.artifacts.map((a) => a.days))) })}</span>
              <span>{t('home.totalArtifacts', { n: c.artifacts.length })}</span>
            </div>
          </section>
          <div className="sec home-2">
            <section>
              <div className="sec-h"><h2>{t('home.newTitle')}</h2><Link className="link" to={{ name: 'new' }}>{t('home.fullFeed')}</Link></div>
              <Timeline items={c.releases.slice(0, 3)} />
            </section>
            <section className="panel">
              <div className="eyebrow">{t('home.connectEyebrow')}</div>
              <h2 style={{ margin: '6px 0 12px' }}>{t('home.connectTitle')}</h2>
              <CodeBlock text={addCmd(c)} /><div style={{ height: 8 }} /><CodeBlock text={installCmd(c, example)} />
              <p style={{ margin: '14px 0 0' }}><Link className="btn sm" to={{ name: 'start' }}>{t('home.guide')}</Link></p>
            </section>
          </div>
          <section className="sec">
            <div className="sec-h"><h2>{t('home.recentTitle')}</h2><Link className="link" to={{ name: 'catalog', ...EMPTY_FILTERS }}>{t('home.wholeCatalog')}</Link></div>
            <div className="grid">
              {[...c.artifacts].filter((a) => a.type !== 'plugin').sort((a, b) => a.days - b.days).slice(0, 6).map((a) => <Card key={a.id} a={a} />)}
            </div>
          </section>
        </>
      )}
    </>
  );
}
