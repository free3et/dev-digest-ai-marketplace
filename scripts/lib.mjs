// Shared helpers for the marketplace scripts (validate, release, rollback).
// Node >= 20, no dependencies.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const MARKETPLACE_FILE = join(ROOT, '.claude-plugin', 'marketplace.json');

export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SHA_RE = /^[0-9a-f]{40}$/;
const SOURCE_TYPES = new Set(['github', 'url', 'git-subdir', 'npm', 'archive']);
const GIT_SOURCE_TYPES = new Set(['github', 'url', 'git-subdir']);

// Names Claude Code reserves for Anthropic or for its own internals.
const RESERVED_NAMES = new Set([
  'claude-code-marketplace', 'claude-code-plugins', 'claude-plugins-official',
  'anthropic-marketplace', 'anthropic-plugins', 'agent-skills', 'anthropic-agent-skills',
  'life-sciences', 'knowledge-work-plugins', 'claude-for-legal', 'claude-for-financial-services',
  'financial-services-plugins', 'first-party-plugins', 'claude-tag-plugins',
  'claude-community', 'claude-plugins-community', 'healthcare',
  'anthropic-plugin-directory', 'claude-plugin-directory',
  'inline', 'builtin', 'skills-dir', 'synced', 'claude-plugin-test',
  'npm', 'pip', 'uv', 'cargo', 'github', 'gh',
  'constructor', 'tostring', 'valueof', 'hasownproperty', '__proto__',
]);

// ---------------------------------------------------------------- basics

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function writeJson(path, data) {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

export function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isReservedName(name) {
  const lower = name.toLowerCase();
  return RESERVED_NAMES.has(lower) || lower.startsWith('claudeai-');
}

// ---------------------------------------------------------------- git

export function git(...args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function isTreeClean() {
  return git('status', '--porcelain') === '';
}

export function tagExists(tag) {
  try {
    git('rev-parse', '--verify', '--quiet', `refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}

export function tagFor(plugin, version) {
  return `${plugin}-v${version}`;
}

/** Versions released for a plugin, read from tags named `<plugin>-v<semver>`. */
export function releasedVersions(plugin) {
  const prefix = `${plugin}-v`;
  return git('tag', '--list', `${prefix}*`)
    .split('\n')
    .filter(Boolean)
    .map((tag) => tag.slice(prefix.length))
    .filter((v) => SEMVER.test(v));
}

// ---------------------------------------------------------------- versions

function core(version) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(version);
  if (!m) throw new Error(`Not a semantic version: "${version}"`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareVersions(a, b) {
  const [x, y] = [core(a), core(b)];
  for (let i = 0; i < 3; i += 1) {
    if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1;
  }
  return 0;
}

/** `kind` is patch | minor | major, or an explicit X.Y.Z. */
export function bumpVersion(current, kind) {
  if (/^\d+\.\d+\.\d+$/.test(kind)) return kind;
  const [major, minor, patch] = core(current);
  if (kind === 'major') return `${major + 1}.0.0`;
  if (kind === 'minor') return `${major}.${minor + 1}.0`;
  if (kind === 'patch') return `${major}.${minor}.${patch + 1}`;
  throw new Error(`Unknown bump "${kind}". Use patch, minor, major or an explicit X.Y.Z.`);
}

// ---------------------------------------------------------------- plugins

export function loadMarketplace() {
  return readJson(MARKETPLACE_FILE);
}

/** Locate an in-repo plugin (relative-path source) by its marketplace entry name. */
export function findPlugin(name) {
  const entry = (loadMarketplace().plugins ?? []).find((p) => p.name === name);
  if (!entry) throw new Error(`Plugin "${name}" is not listed in marketplace.json.`);
  if (typeof entry.source !== 'string') {
    throw new Error(`Plugin "${name}" uses an external source; release it in its own repository.`);
  }
  const dir = resolve(ROOT, entry.source);
  return { entry, dir, relDir: relative(ROOT, dir), manifestPath: join(dir, '.claude-plugin', 'plugin.json'), changelogPath: join(dir, 'CHANGELOG.md') };
}

/**
 * Add a dated section to a plugin CHANGELOG.md. If an "## [Unreleased]" heading exists,
 * the new section goes directly below it, so the unreleased notes become the release notes.
 * Returns false when the plugin has no changelog.
 */
export function addChangelogSection(path, version, note = '') {
  if (!existsSync(path)) return false;
  const text = readFileSync(path, 'utf8');
  const section = `## [${version}] - ${today()}\n${note ? `\n${note}\n` : ''}`;
  let next;
  if (text.includes('## [Unreleased]')) {
    next = text.replace('## [Unreleased]', `## [Unreleased]\n\n${section}`);
  } else {
    const idx = text.search(/^## \[/m);
    next = idx === -1 ? `${text.trimEnd()}\n\n${section}` : `${text.slice(0, idx)}${section}\n${text.slice(idx)}`;
  }
  writeFileSync(path, `${next.replace(/\n{3,}/g, '\n\n').trimEnd()}\n`);
  return true;
}

// ---------------------------------------------------------------- validation

const SECRET_PATTERNS = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'AWS access key id'],
  [/\bgh[pousr]_[A-Za-z0-9]{36,}\b/, 'GitHub token'],
  [/\bsk-ant-[A-Za-z0-9_-]{20,}/, 'Anthropic API key'],
  [/\bxox[abprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
];

const TEXT_EXTENSIONS = new Set(['.md', '.json', '.mjs', '.js', '.yml', '.yaml', '.sh', '.txt', '.toml']);
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const MAX_SCAN_BYTES = 1024 * 1024;

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

function extensionOf(path) {
  const i = path.lastIndexOf('.');
  return i > path.lastIndexOf('/') ? path.slice(i) : '';
}

function hasParentSegment(value) {
  return value.split(/[\\/]/).includes('..');
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => collectStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => collectStrings(v, out));
  return out;
}

function checkJsonFile(path, label, err) {
  if (!existsSync(path)) return;
  try {
    readJson(path);
  } catch (e) {
    err(`${label} is not valid JSON: ${e.message}`);
  }
}

function checkPluginDir(entry, dir, err, warn) {
  const where = `plugin "${entry.name}"`;
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    err(`${where}: source directory does not exist (${entry.source})`);
    return;
  }
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifestPath)) {
    err(`${where}: missing .claude-plugin/plugin.json`);
  } else {
    let manifest = null;
    try {
      manifest = readJson(manifestPath);
    } catch (e) {
      err(`${where}: plugin.json is not valid JSON: ${e.message}`);
    }
    if (manifest) {
      if (manifest.name !== entry.name) err(`${where}: plugin.json name "${manifest.name}" must match the marketplace entry name`);
      if (typeof manifest.version !== 'string' || !SEMVER.test(manifest.version)) err(`${where}: plugin.json must have a semantic "version" (X.Y.Z)`);
      if (typeof manifest.description !== 'string' || manifest.description.trim() === '') err(`${where}: plugin.json must have a non-empty "description"`);
      if (!manifest.license) warn(`${where}: plugin.json has no "license"`);
      for (const key of ['commands', 'agents', 'skills', 'hooks', 'mcpServers']) {
        if (collectStrings(manifest[key]).some(hasParentSegment)) err(`${where}: "${key}" in plugin.json must not contain ".." (components cannot leave the plugin directory)`);
      }
    }
  }
  if ('version' in entry) err(`${where}: set "version" only in plugin.json, not in the marketplace entry`);
  if (!existsSync(join(dir, 'README.md'))) warn(`${where}: missing README.md`);
  if (!existsSync(join(dir, 'CHANGELOG.md'))) warn(`${where}: missing CHANGELOG.md (release and rollback scripts update it when present)`);

  const skillsDir = join(dir, 'skills');
  if (existsSync(skillsDir)) {
    for (const name of readdirSync(skillsDir)) {
      const skillDir = join(skillsDir, name);
      if (statSync(skillDir).isDirectory() && !existsSync(join(skillDir, 'SKILL.md'))) err(`${where}: skills/${name} has no SKILL.md`);
    }
  }
  checkJsonFile(join(dir, 'hooks', 'hooks.json'), `${where}: hooks/hooks.json`, err);
  checkJsonFile(join(dir, '.mcp.json'), `${where}: .mcp.json`, err);

  for (const file of walk(dir)) {
    if (statSync(file).size > MAX_SCAN_BYTES) continue;
    const text = readFileSync(file, 'utf8');
    if (text.includes('\0')) continue;
    for (const [pattern, label] of SECRET_PATTERNS) {
      if (pattern.test(text)) err(`${relative(ROOT, file)}: looks like it contains a ${label}`);
    }
  }
}

function checkExternalSource(entry, err, warn) {
  const where = `plugin "${entry.name}"`;
  const src = entry.source;
  if (!SOURCE_TYPES.has(src.source)) {
    err(`${where}: unsupported source type "${src.source}" (use ${[...SOURCE_TYPES].join(', ')} or a "./" path)`);
    return;
  }
  if (GIT_SOURCE_TYPES.has(src.source)) {
    if (!src.sha) err(`${where}: external ${src.source} sources must be pinned with a full commit "sha"`);
    else if (!SHA_RE.test(src.sha)) err(`${where}: "sha" must be a full 40-character lowercase commit SHA`);
  }
  if (src.source === 'archive' && !/^[0-9a-f]{64}$/.test(src.sha256 ?? '')) err(`${where}: archive sources need a 64-character "sha256"`);
}

// The only place Cyrillic is allowed: Ukrainian UI translation files, for example
// src/locales/uk.json or i18n/uk.yml. English is the source language; Ukrainian is additional.
const UKRAINIAN_LOCALE = /(^|\/)(locales?|i18n)\/uk([._-][^/]*)?$/;

function checkRepoText(err) {
  const cyrillic = new RegExp("[\\u0400-\\u04FF]");
  const pluginsRoot = join(ROOT, 'plugins');
  for (const file of walk(ROOT)) {
    if (UKRAINIAN_LOCALE.test(relative(ROOT, file).split('\\').join('/'))) continue;
    const ext = extensionOf(file);
    const isText = TEXT_EXTENSIONS.has(ext) || ext === '' || file.startsWith(pluginsRoot);
    if (!isText || statSync(file).size > MAX_SCAN_BYTES) continue;
    const text = readFileSync(file, 'utf8');
    if (text.includes('\0')) continue;
    const lines = text.split('\n');
    const line = lines.findIndex((l) => cyrillic.test(l));
    if (line !== -1) err(`${relative(ROOT, file)}:${line + 1}: non-English text (all repository content must be in English)`);
  }
}

/** Structural lint of the marketplace. Returns { errors, warnings }. */
export function validateMarketplace() {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  if (!existsSync(MARKETPLACE_FILE)) {
    err('.claude-plugin/marketplace.json not found');
    return { errors, warnings };
  }
  let mp;
  try {
    mp = readJson(MARKETPLACE_FILE);
  } catch (e) {
    err(`marketplace.json is not valid JSON: ${e.message}`);
    return { errors, warnings };
  }

  if (typeof mp.name !== 'string' || !NAME_RE.test(mp.name) || mp.name.includes('..')) err('marketplace "name" is required (letters, digits, ".", "_", "-"; must start with a letter or digit)');
  else if (isReservedName(mp.name)) err(`marketplace name "${mp.name}" is reserved`);
  if (!mp.owner || typeof mp.owner.name !== 'string' || mp.owner.name === '') err('marketplace "owner.name" is required');
  if (typeof mp.description !== 'string' || mp.description.trim() === '') warn('marketplace "description" is missing');
  if (!Array.isArray(mp.plugins)) {
    err('marketplace "plugins" must be an array');
  } else {
    const seen = new Set();
    for (const [i, entry] of mp.plugins.entries()) {
      if (!entry || typeof entry.name !== 'string' || !NAME_RE.test(entry.name) || entry.name.includes('..')) {
        err(`plugins[${i}]: invalid or missing "name"`);
        continue;
      }
      if (seen.has(entry.name)) err(`duplicate plugin name "${entry.name}"`);
      seen.add(entry.name);
      if (typeof entry.description !== 'string' || entry.description.trim() === '') warn(`plugin "${entry.name}": entry has no "description"`);
      if (typeof entry.source === 'string') {
        if (!entry.source.startsWith('./') || hasParentSegment(entry.source) || entry.source.includes('\\')) {
          err(`plugin "${entry.name}": relative source must start with "./", use forward slashes and contain no ".."`);
        } else {
          checkPluginDir(entry, resolve(ROOT, entry.source), err, warn);
        }
      } else if (entry.source && typeof entry.source === 'object') {
        checkExternalSource(entry, err, warn);
      } else {
        err(`plugin "${entry.name}": "source" is required`);
      }
    }
  }
  checkRepoText(err);
  return { errors, warnings };
}
