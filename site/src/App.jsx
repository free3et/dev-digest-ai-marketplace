import { useEffect, useState } from 'react';
import { Link } from './components/ui.jsx';
import { fetchCatalog } from './lib/catalog.js';
import { AppProvider, useApp } from './lib/context.jsx';
import { EMPTY_FILTERS } from './lib/route.js';
import Catalog from './pages/Catalog.jsx';
import { Artifact, PluginPage } from './pages/Detail.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import { Contribute, InstallKit, Saved, Start, WhatsNew } from './pages/Pages.jsx';

function Header() {
  const { route, go, prefs, theme, toggleTheme } = useApp();
  const [q, setQ] = useState('');
  useEffect(() => { if (route.name === 'catalog') setQ(route.q); }, [route]);
  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    const onCatalog = route.name === 'catalog';
    go({ ...(onCatalog ? route : { name: 'catalog', ...EMPTY_FILTERS }), q: v }, { replace: onCatalog });
  };
  const nav = (name, label) => <Link className="nl" to={{ name }} aria-current={route.name === name ? 'page' : undefined}>{label}</Link>;
  return (
    <header className="bar">
      <div className="wrap">
        <Link className="logo" to={{ name: 'home' }} aria-label="Go home"><i>dd</i><span>dev-digest</span></Link>
        <div className="sbox">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="m10.5 10.5 3.5 3.5" /></svg>
          <input type="search" value={q} onChange={onChange} placeholder="Search: a code review skill, a test agent…" autoComplete="off" aria-label="Search the catalog" />
        </div>
        <nav aria-label="Main navigation">
          {nav('new', "What's new")}
          {nav('start', 'Connect')}
          {nav('saved', 'Saved')}
          <Link className="ib" to={{ name: 'install' }} aria-label="Install kit">Kit <span className="cnt">{prefs.cart.size}</span></Link>
          <button type="button" className="ib" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? 'Dark' : 'Light'}</button>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  const { catalog } = useApp();
  const built = new Date(catalog.meta.generatedAt).toLocaleDateString('en-GB');
  return (
    <footer className="foot">
      <span>Catalog built from the repository {built}.</span>
      <span><a href={`https://github.com/${catalog.meta.repo}`} target="_blank" rel="noopener noreferrer">GitHub</a> · <Link className="link" to={{ name: 'contribute' }}>Contributing</Link></span>
    </footer>
  );
}

function Routes() {
  const { route } = useApp();
  switch (route.name) {
    case 'home': return <Home />;
    case 'catalog': return <Catalog />;
    case 'artifact': return <Artifact />;
    case 'plugin': return <PluginPage />;
    case 'new': return <WhatsNew />;
    case 'start': return <Start />;
    case 'saved': return <Saved />;
    case 'install': return <InstallKit />;
    case 'contribute': return <Contribute />;
    default: return <NotFound />;
  }
}

function Shell() {
  const { toast } = useApp();
  return (
    <>
      <Header />
      <div className="wrap">
        <main><Routes /></main>
        <Footer />
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

export default function App() {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    fetchCatalog().then((catalog) => setState({ status: 'ready', catalog }), (error) => setState({ status: 'error', error }));
  }, []);
  if (state.status === 'ready') return <AppProvider catalog={state.catalog}><Shell /></AppProvider>;
  return (
    <div className="wrap" style={{ padding: '60px 0' }}>
      {state.status === 'loading'
        ? <p className="muted">Loading…</p>
        : <div className="empty"><h3>Could not load the catalog</h3><p style={{ margin: 0 }}>{String(state.error.message)}. Run <span className="mono">npm run dev</span> or open the deployed site.</p></div>}
    </div>
  );
}
