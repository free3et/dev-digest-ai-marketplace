#!/usr/bin/env node
// Release an in-repo plugin: bump its version, update its changelog, commit and tag.
// Usage: node scripts/release.mjs <plugin> <patch|minor|major|X.Y.Z> [--dry-run]
// Nothing is pushed. The script prints the push command at the end.
import {
  addChangelogSection, bumpVersion, compareVersions, findPlugin, git, isTreeClean,
  readJson, releasedVersions, tagExists, tagFor, validateMarketplace, writeJson,
} from './lib.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [pluginName, bump] = args.filter((a) => !a.startsWith('--'));

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function validateOrFail() {
  const { errors } = validateMarketplace();
  if (errors.length > 0) fail(`validation failed:\n  ${errors.join('\n  ')}`);
}

if (!pluginName || !bump) {
  fail('usage: node scripts/release.mjs <plugin> <patch|minor|major|X.Y.Z> [--dry-run]');
}

try {
  if (!isTreeClean()) fail('working tree is not clean. Commit or stash your changes first.');
  if (git('branch', '--show-current') !== 'main') console.warn('warning: you are not on the main branch.');
  validateOrFail();

  const plugin = findPlugin(pluginName);
  const manifest = readJson(plugin.manifestPath);
  const current = manifest.version;
  const next = bumpVersion(current, bump);
  const tag = tagFor(pluginName, next);

  if (compareVersions(next, current) <= 0) fail(`new version ${next} must be greater than the current ${current}.`);
  const highest = releasedVersions(pluginName).sort(compareVersions).at(-1);
  if (highest && compareVersions(next, highest) <= 0) fail(`new version ${next} must be greater than the latest released ${highest}.`);
  if (tagExists(tag)) fail(`tag ${tag} already exists.`);

  console.log(`Release ${pluginName}: ${current} -> ${next} (tag ${tag})`);
  if (dryRun) {
    console.log('Dry run: no files changed.');
    process.exit(0);
  }

  manifest.version = next;
  writeJson(plugin.manifestPath, manifest);
  const changelogUpdated = addChangelogSection(plugin.changelogPath, next);
  if (!changelogUpdated) console.warn('warning: plugin has no CHANGELOG.md; skipped.');

  validateOrFail();
  git('add', '--', plugin.relDir);
  git('commit', '-m', `release(${pluginName}): v${next}`);
  git('tag', '-a', tag, '-m', `${pluginName} v${next}`);

  console.log(`\nDone. Review with: git show ${tag}`);
  console.log(`Publish with:      git push origin main ${tag}`);
} catch (e) {
  if (e instanceof Error && 'stderr' in e) fail(`${e.message}\n${e.stderr}`);
  fail(e instanceof Error ? e.message : String(e));
}
