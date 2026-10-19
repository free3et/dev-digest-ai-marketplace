import { t } from './i18n.jsx';

export function ago(d) {
  if (d === 0) return t('time.today');
  if (d === 1) return t('time.yesterday');
  if (d < 7) return t('time.days', { n: d });
  if (d < 30) return t('time.weeks', { n: Math.round(d / 7) });
  return t('time.months', { n: Math.round(d / 30) });
}

export const daysSince = (d) => Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 864e5));

export const addCmd = (c) => `claude plugin marketplace add ${c.meta.repo}`;
export const installCmd = (c, plugin) => `claude plugin install ${plugin}@${c.meta.marketplace}`;

const FILES = {
  skill: (a) => `skills/${a.name}/SKILL.md`,
  agent: (a) => `agents/${a.name}.md`,
  command: (a) => `commands/${a.name.replace('/', '')}.md`,
  hook: () => 'hooks/hooks.json',
  mcp: () => '.mcp.json',
};
export const fileOf = (a) => a.file || FILES[a.type]?.(a) || '';

export function ghUrl(c, a) {
  const p = c.plugins.find((x) => x.name === a.plugin);
  const path = a.path || p?.path || `plugins/${a.plugin}`;
  return `https://github.com/${c.meta.repo}/${a.path ? 'blob' : 'tree'}/main/${path}`;
}

export function settingsSnippet(c, plugins) {
  const enabled = plugins.map((p) => `    "${p}@${c.meta.marketplace}": true`).join(',\n');
  return `{\n  "extraKnownMarketplaces": {\n    "${c.meta.marketplace}": { "source": { "source": "github", "repo": "${c.meta.repo}" } }\n  },\n  "enabledPlugins": {\n${enabled}\n  }\n}`;
}
