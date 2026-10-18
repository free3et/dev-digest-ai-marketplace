export const TYPE_LABEL = { plugin: 'Plugin', skill: 'Skill', agent: 'Agent', command: 'Command', hook: 'Hook', mcp: 'MCP' };
export const TYPE_LABEL_PL = { plugin: 'Plugins', skill: 'Skills', agent: 'Agents', command: 'Commands', hook: 'Hooks', mcp: 'MCP servers' };

export const HEALTH_LABEL = { ok: 'valid', warn: 'warning', err: 'error' };
export const HEALTH_CODE = {
  noManifest: 'plugin.json is missing or is not valid JSON.',
  nameMismatch: 'name in marketplace.json does not match plugin.json.',
  noDescription: 'plugin.json has no description.',
  versionDup: 'Version is set in both plugin.json and marketplace.json. The plugin.json value wins.',
  noLicense: 'plugin.json has no license.',
  noChangelog: 'CHANGELOG.md is missing.',
  badHooks: 'hooks/hooks.json is not valid JSON.',
  badMcp: '.mcp.json is not valid JSON.',
  external: 'The plugin lives in another repository. Its contents are not indexed.',
};

export function ago(d) {
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} d ago`;
  if (d < 30) return `${Math.round(d / 7)} wk ago`;
  return `${Math.round(d / 30)} mo ago`;
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
