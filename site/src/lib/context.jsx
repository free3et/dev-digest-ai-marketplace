import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { buildHash, parseHash } from './route.js';

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key, value) => { try { localStorage.setItem(key, value); } catch { /* storage may be blocked */ } };

function loadPrefs() {
  try {
    const s = JSON.parse(read('dd-state') || '{}');
    return { saved: new Set(s.saved || []), cart: new Set(s.cart || []) };
  } catch {
    return { saved: new Set(), cart: new Set() };
  }
}

export function AppProvider({ catalog, children }) {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  const [prefs, setPrefs] = useState(() => {
    // Forget bookmarks and kit entries that no longer exist in the catalog.
    const p = loadPrefs();
    return {
      saved: new Set([...p.saved].filter((id) => catalog.byId[id])),
      cart: new Set([...p.cart].filter((n) => catalog.plugin(n))),
    };
  });
  const [theme, setTheme] = useState(() => (read('dd-theme') === 'light' ? 'light' : 'dark'));
  const [toast, setToast] = useState('');
  const timer = useRef();

  useEffect(() => {
    const onHash = () => { setRoute(parseHash(location.hash)); window.scrollTo(0, 0); };
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    write('dd-state', JSON.stringify({ saved: [...prefs.saved], cart: [...prefs.cart] }));
  }, [prefs]);

  useEffect(() => {
    if (theme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');
    write('dd-theme', theme);
  }, [theme]);

  const go = useCallback((next, { replace = false } = {}) => {
    const h = buildHash(next);
    if (replace) { history.replaceState(null, '', h); setRoute(next); }
    else if (location.hash === h) { setRoute(next); window.scrollTo(0, 0); }
    else location.hash = h;
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), 1600);
  }, []);

  const toggle = useCallback((kind, id, labels) => {
    const on = !prefs[kind].has(id);
    setPrefs((p) => {
      const next = new Set(p[kind]);
      on ? next.add(id) : next.delete(id);
      return { ...p, [kind]: next };
    });
    if (labels) showToast(on ? labels[0] : labels[1]);
  }, [prefs, showToast]);

  const value = useMemo(() => ({
    catalog, route, go, prefs, theme, toast, showToast,
    toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')),
    toggleSaved: (id) => toggle('saved', id),
    toggleCart: (name) => toggle('cart', name, ['Added to kit', 'Removed from kit']),
  }), [catalog, route, go, prefs, theme, toast, showToast, toggle]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
