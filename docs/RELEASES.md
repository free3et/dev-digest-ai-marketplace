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

Tags matter for more than rollback: a plugin that depends on another one (`"version": "^1.0.0"` in its `plugin.json`) only sees a new release of the dependency once the tag `<plugin>--v<version>` exists. Without the tag, the dependent plugin keeps the old version. Always create the tag.

## Release a plugin

`main` is protected, so a release is a pull request and the tag is created on `main` after the merge.

1. Branch from an up-to-date `main` and make the change. List it under `## [Unreleased]` in `plugins/<name>/CHANGELOG.md`.
2. On the branch, preview and then release (`patch`, `minor`, `major` or an explicit `X.Y.Z`):
   ```bash
   node scripts/release.mjs <plugin> patch --dry-run
   node scripts/release.mjs <plugin> patch
   ```
   The script requires a clean working tree, validates the marketplace, bumps `plugin.json`, turns `[Unreleased]` into a dated section, commits as `release(<plugin>): vX.Y.Z` and creates a local tag. It never pushes. It prints a warning when you are not on `main`; that is expected here.
3. **Delete the local tag**, because it points at a commit on the branch (which disappears if the PR is squash-merged). The tag is recreated on `main` in step 5:
   ```bash
   git tag -d <plugin>--v<version>
   ```
4. Push the branch, open a pull request and merge it once the checks are green.
5. Update `main`, then create and push the tag from the plugin directory. The command validates the plugin, checks that the versions in `plugin.json` and the marketplace entry agree, and refuses to overwrite an existing tag (use `--dry-run` to preview):
   ```bash
   git checkout main && git pull
   (cd plugins/<plugin> && claude plugin tag --push)
   ```

When two plugins change together (for example a dependency and a dependent), tag the dependency first.

## Update (user side)

### Automatic updates

Claude Code turns auto-update on by default only for Anthropic's own marketplaces. For this one it is **off** until the user enables it:

1. In a session, run `/plugin` and open the **Marketplaces** tab.
2. Select `dev-digest-ai-marketplace` and choose **Enable auto-update**.

How it behaves:
- After the first message of an interactive session Claude Code waits a random time of up to ten minutes, then refreshes the marketplace and updates the installed plugins.
- The running session keeps the versions it loaded and shows `Plugin updated: <name> · Run /reload-plugins to apply`. The next session loads the new versions.
- A plugin only updates when its version changes, which is why releases always bump `version` in `plugin.json`.
- Auto-update is switched off by the environment variables `DISABLE_AUTOUPDATER`, `DISABLE_UPDATES` and `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`.
- The marketplace is cloned over the transport you added it with. For background updates over SSH, the key must work without a passphrase prompt.

### Manual updates

```bash
claude plugin marketplace update dev-digest-ai-marketplace   # refreshes the catalog only
claude plugin update <plugin>@dev-digest-ai-marketplace      # updates one plugin
```

`marketplace update` does not touch installed plugins; run `plugin update` for each one. A dependency is updated to the highest tag that satisfies the range of the plugin that needs it, so the output can read `updated from 1.0.0-… to 1.0.1-… (highest tag satisfying ^1.0.0 from <plugin>)`. Running sessions need a restart to load the new version.

### Check that an update arrived

```bash
claude plugin list | grep -A2 <plugin>
ls ~/.claude/plugins/cache/dev-digest-ai-marketplace/<plugin>/
```

A tag-resolved version carries a 12-character commit suffix, for example `1.0.1-0147707d816e`.

Users can also pin a catalog channel by adding the marketplace with a ref, for example `free3et/dev-digest-ai-marketplace#<tag-or-branch>`.

## Roll back a plugin

Rollback means **rolling forward with old content**. A lower version number would not reach users because their cache already holds a higher one. The rollback script restores the files of an older tag and publishes them as a new patch version above the highest released one.

```bash
node scripts/rollback.mjs <plugin> 1.1.0 --dry-run   # preview
node scripts/rollback.mjs <plugin> 1.1.0             # restore v1.1.0 content as v1.2.1
```

`main` is protected, so publish the rollback like a release: run the script on a branch, delete the local tag it created (`git tag -d <plugin>--v1.2.1`), push the branch, merge the pull request, then tag on `main` with `(cd plugins/<plugin> && claude plugin tag --push)`. See [Release a plugin](#release-a-plugin).

What the script does:

1. Requires a clean working tree and an existing tag `<plugin>--v1.1.0` older than the current version.
2. Replaces `plugins/<plugin>/` with the content of that tag, keeping the current `CHANGELOG.md` history.
3. Sets the version to the next patch after the highest released version and adds a changelog entry.
4. Validates, commits as `rollback(<plugin>): restore v1.1.0 as v1.2.1` and creates the new tag. On failure it restores the working tree. It never pushes.

After a rollback, fix the problem on a branch and release a new version as usual.

### Rollback rehearsal (user side, recorded 2026-10-22)

A stable channel is the same marketplace added with a tag as its ref. Rehearsed on one machine with `sdd-engineering` 1.1.0 installed at user scope; Claude Code 2.1.303.

```bash
claude plugin marketplace list
claude plugin uninstall sdd-engineering@dev-digest-ai-marketplace --keep-data
claude plugin marketplace remove dev-digest-ai-marketplace
claude plugin marketplace add free3et/dev-digest-ai-marketplace#sdd-engineering--v1.0.0
claude plugin install sdd-engineering@dev-digest-ai-marketplace
claude plugin list | grep -A3 sdd-engineering
```

Observed:

- The catalog name is the same in both channels, so the current channel has to be removed before the stable one is added.
- `marketplace remove` also removed the three dependencies (`engineering-paved-path`, `research-tools`, `architecture-review`) with their data. They came back with `plugin install`, pulled in as dependencies. `claude plugin prune` was not needed.
- The marketplace was cloned over SSH, and the entry appeared in the user settings.
- The install resolved `sdd-engineering` `1.0.0`, scope user, enabled; `/reload-plugins` reported 7 plugins.
- No plugin in this repository uses a persistent data directory (`CLAUDE_PLUGIN_DATA` is not referenced), so `--keep-data` protected nothing here. It is kept in the sequence as a safe default.
- Smoke check on 1.0.0 (2026-10-23, live session in another project): `spec-creator` pass 2 with the undecided goal "the page must feel fast" produced a spec report **without** a `Mandatory coverage` line, and the written spec had none. On 1.1.0 the same request printed `Mandatory coverage: incomplete — G-2, NFR-1`. The difference is the 1.1.0 rule, so the rollback restored the 1.0.0 behavior. This is a manual run, not the eval suite.
- Way back to the latest channel (2026-10-23), same machine:

  ```bash
  claude plugin marketplace remove dev-digest-ai-marketplace
  claude plugin marketplace add free3et/dev-digest-ai-marketplace
  claude plugin install sdd-engineering@dev-digest-ai-marketplace
  claude plugin list | grep -A3 sdd-engineering
  ```

  `marketplace remove` removed `sdd-engineering` and its three dependencies. `marketplace add` without a ref added the marketplace from the default branch, with no plugins installed. `plugin install` installed `sdd-engineering` **1.1.0** (user scope, enabled) and the three dependencies with it; `plugin list` confirmed 1.1.0 and `/reload-plugins` reported 7 plugins. `claude plugin list --json` (7 plugins, all enabled) contains no occurrence of `error` (`grep -i error` exits 1).
- Version suffix on dependencies, seen again after this clean install: `engineering-paved-path` and `architecture-review` show `1.0.0-6f1b986e1698`, `research-tools` `1.0.1-0147707d816e`, while `sdd-engineering`, which was installed directly, shows plain `1.1.0`. The same suffixes appeared after the first install on 2026-10-19. So far every plugin installed as a dependency carries `<version>-<12 characters>`, and the one installed by name does not. The cause is not confirmed; a colleague installing a dependency directly would settle it.
- Not covered by this rehearsal: auto-update (the updates were run by hand) and a colleague's machine.

## Emergency options

| Situation | Action |
|---|---|
| Broken release, need to stop the damage now | Run the rollback on a branch, merge the PR, then tag on `main`. Users get it on their next `plugin update`, or automatically if they enabled auto-update. |
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
- [ ] Tag `<plugin>--v<version>` created on `main` after the merge and pushed (`claude plugin tag --push`)
