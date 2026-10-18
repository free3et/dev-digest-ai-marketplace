#!/usr/bin/env node
// Roll a plugin back by rolling FORWARD: restore the files of an older release tag and
// publish them under a new, higher patch version. Claude Code caches plugins per version
// and updates when the version changes, so a lower version number would never reach users.
// Usage: node scripts/rollback.mjs <plugin> <version|tag> [--dry-run]
// Nothing is pushed. The script prints the push command at the end.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  addChangelogSection, bumpVersion, compareVersions, findPlugin, git, isTreeClean,
  readJson, releasedVersions, tagExists, tagFor, validateMarketplace, writeJson,
} from './lib.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [pluginName, target] = args.filter((a) => !a.startsWith('--'));

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

if (!pluginName || !target) {
  fail('usage: node scripts/rollback.mjs <plugin> <version|tag> [--dry-run]');
}

let restoreDir = null;

try {
  if (!isTreeClean()) fail('working tree is not clean. Commit or stash your changes first.');

  const plugin = findPlugin(pluginName);
  const targetVersion = target.replace(`${pluginName}--v`, '').replace(/^v/, '');
  const targetTag = tagFor(pluginName, targetVersion);
  if (!tagExists(targetTag)) {
    const known = releasedVersions(pluginName).sort(compareVersions).join(', ') || 'none';
    fail(`tag ${targetTag} does not exist. Released versions: ${known}`);
  }

  const current = readJson(plugin.manifestPath).version;
  const highest = [current, ...releasedVersions(pluginName)].sort(compareVersions).at(-1);
  if (compareVersions(targetVersion, current) >= 0) fail(`rollback target ${targetVersion} must be older than the current ${current}.`);
  const next = bumpVersion(highest, 'patch');
  const nextTag = tagFor(pluginName, next);
  if (tagExists(nextTag)) fail(`tag ${nextTag} already exists.`);

  console.log(`Rollback ${pluginName}: restore ${targetVersion} content, publish as ${next} (tag ${nextTag})`);
  if (dryRun) {
    console.log('Dry run: no files changed.');
    process.exit(0);
  }

  const changelog = existsSync(plugin.changelogPath) ? readFileSync(plugin.changelogPath, 'utf8') : null;
  restoreDir = plugin.relDir;

  git('rm', '-r', '-q', '--ignore-unmatch', '--', plugin.relDir);
  git('checkout', targetTag, '--', plugin.relDir);

  // Keep the full changelog history instead of the old one from the tag.
  if (changelog !== null) writeFileSync(plugin.changelogPath, changelog);
  const manifest = readJson(plugin.manifestPath);
  manifest.version = next;
  writeJson(plugin.manifestPath, manifest);
  addChangelogSection(plugin.changelogPath, next, `- Rolled back to the content of v${targetVersion}.`);

  const { errors } = validateMarketplace();
  if (errors.length > 0) throw new Error(`validation failed after restore:\n  ${errors.join('\n  ')}`);

  git('add', '-A', '--', plugin.relDir);
  git('commit', '-m', `rollback(${pluginName}): restore v${targetVersion} as v${next}`);
  git('tag', '-a', nextTag, '-m', `${pluginName} v${next} (rollback to v${targetVersion})`);
  restoreDir = null;

  console.log(`\nDone. Review with: git show ${nextTag}`);
  console.log(`Publish with:      git push origin main ${nextTag}`);
} catch (e) {
  if (restoreDir) {
    try {
      git('reset', '-q', 'HEAD', '--', restoreDir);
      git('checkout', '--', restoreDir);
      git('clean', '-fdq', '--', restoreDir);
      console.error('Changes were reverted; the working tree is back to HEAD.');
    } catch {
      console.error(`Could not revert automatically. Run: git reset --hard HEAD`);
    }
  }
  if (e instanceof Error && 'stderr' in e) fail(`${e.message}\n${e.stderr}`);
  fail(e instanceof Error ? e.message : String(e));
}
