// Indexes the marketplace for the catalog UI (site/). Used by the Vite plugin in site/ and by `npm run catalog`.
// Reads .claude-plugin/marketplace.json and every plugin that lives in this repository. No dependencies.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MARKETPLACE_FILE, ROOT, readJson } from './lib.mjs';

const MAX_CONTENT = 6000;
const REPO = process.env.GITHUB_REPOSITORY || 'free3et/dev-digest-ai-marketplace';

const posix = (p) => relative(ROOT, p).split('\\').join('/');
const read = (p) => readFileSync(p, 'utf8');
const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const list = (p) => (isDir(p) ? readdirSync(p).sort() : []);
const tryJson = (p) => {
  try { return JSON.parse(read(p)); } catch { return null; }
};

function lastModified(path) {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', path], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (out) return out;
  } catch { /* no git history */ }
  return statSync(path).mtime.toISOString();
}

/** Minimal frontmatter reader: flat `key: value` pairs only. */
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

const csv = (v) => (v ? String(v).replace(/^\[|\]$/g, '').split(',').map((x) => x.trim()).filter(Boolean) : []);
const clip = (t) => (t.length > MAX_CONTENT ? `${t.slice(0, MAX_CONTENT)}\n…` : t);

/** Keep a Changelog: `## [1.2.0] - 2026-01-31` followed by bullet lines. */
function parseChangelog(path) {
  if (!existsSync(path)) return [];
  const out = [];
  let cur = null;
  for (const line of read(path).split(/\r?\n/)) {
    const h = line.match(/^##\s+\[?v?([0-9][^\]\s]*)\]?(?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/);
    if (h) { cur = { ver: h[1], date: h[2] || null, notes: [] }; out.push(cur); continue; }
    if (/^##\s/.test(line)) { cur = null; continue; }
    const b = line.match(/^\s*[-*]\s+(.*\S)/);
    if (cur && b && cur.notes.length < 6) cur.notes.push(b[1]);
  }
  return out;
}

function indexPlugin(entry, dir) {
  const rel = posix(dir);
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  const manifest = existsSync(manifestPath) ? tryJson(manifestPath) : null;
  const problems = [];
  const warnings = [];
  if (!manifest) problems.push('noManifest');
  if (manifest && manifest.name !== entry.name) problems.push('nameMismatch');
  if (manifest && !manifest.description) problems.push('noDescription');
  if (manifest && entry.version) warnings.push('versionDup');
  if (manifest && !manifest.license) warnings.push('noLicense');
  const changelogPath = join(dir, 'CHANGELOG.md');
  if (!existsSync(changelogPath)) warnings.push('noChangelog');

  const name = entry.name;
  const version = (manifest && manifest.version) || entry.version || '0.0.0';
  const tags = entry.tags || (manifest && manifest.keywords) || [];
  const updated = lastModified(dir);
  const arts = [];
  const push = (type, aname, desc, file, extra = {}, content) => {
    const full = join(dir, file);
    arts.push({
      id: `${name}/${type}/${aname}`, type, plugin: name, name: aname, desc: desc || '', tags: extra.tags || [], kw: extra.kw || [],
      updated: lastModified(existsSync(full) ? full : dir), file, path: `${rel}/${file}`, ...extra.rest, ...(content ? { content: clip(content) } : {}),
    });
  };

  for (const s of list(join(dir, 'skills'))) {
    const f = join(dir, 'skills', s, 'SKILL.md');
    if (!existsSync(f)) continue;
    const text = read(f), fm = frontmatter(text);
    push('skill', fm.name || s, fm.description, `skills/${s}/SKILL.md`, { kw: csv(fm.keywords), tags: csv(fm.tags), rest: { tools: fm['allowed-tools'] || '' } }, text);
  }
  for (const f of list(join(dir, 'agents')).filter((x) => x.endsWith('.md'))) {
    const text = read(join(dir, 'agents', f)), fm = frontmatter(text);
    push('agent', fm.name || f.replace(/\.md$/, ''), fm.description, `agents/${f}`, { kw: csv(fm.keywords), rest: { tools: fm.tools || '', model: fm.model || '' } }, text);
  }
  for (const f of list(join(dir, 'commands')).filter((x) => x.endsWith('.md'))) {
    const text = read(join(dir, 'commands', f)), fm = frontmatter(text), base = f.replace(/\.md$/, '');
    push('command', `/${base}`, fm.description, `commands/${f}`, { kw: csv(fm.keywords), rest: { run: `/${base}${fm['argument-hint'] ? ` ${fm['argument-hint']}` : ''}` } }, text);
  }
  const hooksFile = join(dir, 'hooks', 'hooks.json');
  if (existsSync(hooksFile)) {
    const hooks = tryJson(hooksFile);
    if (!hooks) problems.push('badHooks');
    const text = read(hooksFile);
    for (const [event, groups] of Object.entries((hooks && hooks.hooks) || {})) {
      (groups || []).forEach((g, gi) => (g.hooks || []).forEach((h, hi) => {
        const matcher = g.matcher || '*';
        const aname = `${event}${g.matcher ? `:${g.matcher}` : ''}${gi || hi ? `#${gi}.${hi}` : ''}`;
        push('hook', aname, `${event} hook${g.matcher ? ` for ${g.matcher}` : ''}.`, 'hooks/hooks.json', { rest: { event, matcher, run: h.command || h.prompt || h.type || '' } }, text);
      }));
    }
  }
  const mcpFile = join(dir, '.mcp.json');
  if (existsSync(mcpFile)) {
    const mcp = tryJson(mcpFile);
    if (!mcp) problems.push('badMcp');
    const text = read(mcpFile);
    for (const [sname, cfg] of Object.entries((mcp && (mcp.mcpServers || mcp)) || {})) {
      if (!cfg || typeof cfg !== 'object') continue;
      const run = cfg.url || [cfg.command, ...(cfg.args || [])].filter(Boolean).join(' ');
      push('mcp', sname, `MCP server ${sname}.`, '.mcp.json', { rest: { transport: cfg.type || (cfg.url ? 'http' : 'stdio'), run } }, text);
    }
  }

  const log = parseChangelog(changelogPath).filter((r) => r.date || r.ver === version);
  const plugin = {
    name, ver: version, cat: entry.category || 'Other', desc: (manifest && manifest.description) || entry.description || '',
    updated, path: rel, tags, kw: [...new Set([...(tags || []), ...((manifest && manifest.keywords) || [])])],
    health: problems.length ? 'err' : warnings.length ? 'warn' : 'ok',
    healthCodes: [...problems, ...warnings],
    log: log.length ? log : [{ ver: version, date: updated, notes: [] }],
  };
  return { plugin, arts };
}

/** Builds the catalog from the repository as it is right now. */
export function buildCatalog() {
  const marketplace = readJson(MARKETPLACE_FILE);
  const plugins = [];
  const artifacts = [];
  for (const entry of marketplace.plugins || []) {
    const src = entry.source;
    const local = typeof src === 'string' && src.startsWith('./') ? join(ROOT, src) : null;
    if (local && isDir(local)) {
      const { plugin, arts } = indexPlugin(entry, local);
      plugins.push(plugin);
      artifacts.push(...arts);
    } else {
      plugins.push({
        name: entry.name, ver: entry.version || '', cat: entry.category || 'Other', desc: entry.description || '', updated: new Date().toISOString(),
        tags: entry.tags || [], kw: entry.tags || [], external: true, health: 'warn',
        healthCodes: ['external'], log: [],
      });
    }
  }
  return { meta: { repo: REPO, marketplace: marketplace.name, generatedAt: new Date().toISOString() }, plugins, artifacts };
}

// `npm run catalog` prints a summary, handy when checking what the site will show.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const c = buildCatalog();
  console.log(`${c.plugins.length} plugin(s), ${c.artifacts.length} artifact(s)`);
  for (const p of c.plugins) console.log(`  ${p.name}@${p.ver} [${p.health}] ${c.artifacts.filter((a) => a.plugin === p.name).length} artifact(s)`);
}
