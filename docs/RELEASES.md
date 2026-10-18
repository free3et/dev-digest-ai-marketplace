# Releases, updates and rollback

## How versions work in Claude Code

- The version comes from `plugin.json` in the plugin directory. The marketplace entry does not carry a version in this repository **(checked)**.
- Claude Code caches each plugin under its version. Users receive new content **only when the version changes**. Editing files without bumping the version changes nothing for existing users.
- If a plugin has no version, Claude Code falls back to the commit SHA. We always set one so that releases are deliberate.
- Updates are two steps for users: refresh the catalog, then update the plugin.

## Versioning (SemVer)

`MAJOR.MINOR.PATCH`

| Bump | When |
|---|---|
| `major` | Breaking change: renamed or removed skills, commands, hooks or settings that users rely on |
| `minor` | New backwards-compatible capability |
| `patch` | Bug fix, wording fix, dependency pin update |

New plugins start at `0.1.0`. Use `1.0.0` when the interface is stable.

## Tags

Every release has an annotated tag named `<plugin>--v<version>` (double dash: Claude Code resolves dependency version ranges from tags in exactly this form), for example `code-review--v1.2.0`. Tags are the source of truth for rollback. Never move or delete a published tag.

## Release a plugin

1. Merge the changes to `main`. Make sure `plugins/<name>/CHANGELOG.md` lists them under `## [Unreleased]`.
2. Preview:
   ```bash
   node scripts/release.mjs <plugin> patch --dry-run
   ```
3. Release (`patch`, `minor`, `major` or an explicit `X.Y.Z`):
   ```bash
   node scripts/release.mjs <plugin> minor
   ```
   The script requires a clean working tree, validates the marketplace, bumps `plugin.json`, turns `[Unreleased]` into a dated section, commits as `release(<plugin>): vX.Y.Z` and creates the tag. It never pushes.
4. Review (`git show <tag>`), then publish:
   ```bash
   git push origin main <tag>
   ```

## Update (user side)

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update <plugin>@dev-digest-ai-marketplace
```

Users can also pin a catalog channel by adding the marketplace with a ref, for example `free3et/dev-digest-ai-marketplace#<tag-or-branch>`.

## Roll back a plugin

Rollback means **rolling forward with old content**. A lower version number would not reach users because their cache already holds a higher one. The rollback script restores the files of an older tag and publishes them as a new patch version above the highest released one.

```bash
node scripts/rollback.mjs <plugin> 1.1.0 --dry-run   # preview
node scripts/rollback.mjs <plugin> 1.1.0             # restore v1.1.0 content as v1.2.1
git push origin main <plugin>--v1.2.1
```

What the script does:

1. Requires a clean working tree and an existing tag `<plugin>--v1.1.0` older than the current version.
2. Replaces `plugins/<plugin>/` with the content of that tag, keeping the current `CHANGELOG.md` history.
3. Sets the version to the next patch after the highest released version and adds a changelog entry.
4. Validates, commits as `rollback(<plugin>): restore v1.1.0 as v1.2.1` and creates the new tag. On failure it restores the working tree. It never pushes.

After a rollback, fix the problem on a branch and release a new version as usual.

## Emergency options

| Situation | Action |
|---|---|
| Broken release, need to stop the damage now | Run the rollback, push the commit and tag. Users get it on their next `plugin update`. |
| Plugin is dangerous and must disappear | Remove the entry from `marketplace.json`, add it to `renames` with `null`, and set `forceRemoveDeletedPlugins: true` so it is uninstalled on users' machines. |
| Plugin is renamed | Add `"old-name": "new-name"` to `renames`. |
| Bad commit in an external plugin | Change its `sha` back to the last good commit in `marketplace.json`. |
| Users must stay on a known-good catalog | They add the marketplace with a pinned ref: `free3et/dev-digest-ai-marketplace#<tag>`. |

There is no deprecation state in Claude Code. Announce deprecations in the plugin README and CHANGELOG before removal.

## Checklist for a safe release

- [ ] CI is green on `main`
- [ ] Changelog is accurate and in English
- [ ] Security checklist in [SECURITY.md](SECURITY.md) was applied to hooks, scripts and MCP changes
- [ ] Installed the plugin from a local checkout and confirmed it works (`claude plugin marketplace add .`)
- [ ] Tag pushed together with the commit
