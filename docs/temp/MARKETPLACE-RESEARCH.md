# Research: how to build a Claude Code plugin marketplace repository

> Temporary file. Delete it together with `docs/temp/` once the first plugin exists.
> Date: 2026-10-19. Main source: the official Claude Code documentation. Quotes passed through a model, so verify exact strings before pasting them into a config.

## 1. Repository layout

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json        <- the only required marketplace file
└── plugins/
    └── my-plugin/
        ├── .claude-plugin/plugin.json   <- optional; only "name" is required
        ├── skills/<skill>/SKILL.md
        ├── commands/ agents/ hooks/hooks.json
        ├── .mcp.json  .lsp.json  bin/  settings.json
```

- `.claude-plugin/` holds only `marketplace.json` and `plugin.json`. All other components live at the plugin root.
- Relative paths resolve from the marketplace root, not from `.claude-plugin/`.
- The docs recommend `skills/` over the older `commands/` for new plugins.

## 2. marketplace.json

- Required: `name`, `owner` (object, `name` required), `plugins` (array).
- Optional: `description`, `metadata.pluginRoot`, `renames`, `forceRemoveDeletedPlugins`, `allowCrossMarketplaceDependenciesOn`.
- Plugin entry: `name` and `source` required. Also `description`, `version`, `category`, `tags`, `strict`, `dependencies`.
- Names: letters, digits, `.`, `_`, `-`; must start with a letter or digit.
- Reserved names: `claude-plugins-official`, `anthropic-*`, `agent-skills`, `claude-code-plugins` and similar, plus near-miss spellings.

```json
{
  "name": "my-marketplace",
  "description": "Plugins for my team",
  "owner": { "name": "Your Name" },
  "plugins": [
    {
      "name": "my-first-plugin",
      "source": "./plugins/my-first-plugin",
      "description": "A greeting plugin to learn the basics"
    }
  ]
}
```

### `source` types

| Type | Example |
|---|---|
| Relative path | `"./plugins/formatter"` (starts with `./`, no `..`) |
| `github` | `{ "source": "github", "repo": "owner/repo", "ref": "v2.0.0", "sha": "<40 chars>" }` |
| `url` | `{ "source": "url", "url": "https://.../x.git", "ref": "main" }` |
| `git-subdir` | `{ "source": "git-subdir", "url": "...", "path": "tools/formatter" }` |
| `npm` | `{ "source": "npm", "package": "@org/x", "version": "^2.0.0" }` |
| `archive` | `{ "source": "archive", "url": "https://...zip", "sha256": "<64 hex>" }` |
| `command` | `{ "source": "command", "command": "...", "timeout": 120 }` (user must accept) |

`sha` wins over `ref`.

### strict

`strict` defaults to `true`. Component fields in an entry are appended to `plugin.json`; `hooks` replace the manifest's hooks. `strict: false` with components on both sides fails with `conflicting manifests`.

## 3. Versions and updates

- Version resolution order: `version` in `plugin.json`, then in the marketplace entry, then the commit SHA.
- If `version` is set, users do not get new commits until it is bumped. If it is omitted, users track every commit.
- If `version` is set in both places, `plugin.json` wins and `validate` warns.
- Cache: `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`. Old versions are removed after 14 days.
- Auto-update is off by default for third-party marketplaces.
- Release channels: two marketplaces with different `ref`s (for example `stable` and `latest`).
- Users first update the marketplace (`marketplace update`), then the plugin.

## 4. Commands

```bash
claude plugin validate ./my-marketplace            # and each plugin separately
claude plugin validate ./my-marketplace --strict   # warnings become errors (for CI)
claude plugin marketplace add ./my-marketplace
claude plugin install my-plugin@my-marketplace
claude plugin marketplace update
claude plugin marketplace remove my-marketplace
```

- `validate` exit codes: `0` success, `1` failure, `2` unexpected error.
- `validate` does not open plugin files for entries that live in other directories, so validate each plugin separately.
- A local marketplace (path) loads in place. After edits, run `/reload-plugins`; no version bump is needed.
- `marketplace add` accepts `owner/repo`, `owner/repo#ref`, SSH, `https://...git`, a URL to `marketplace.json`, or a local path.

## 5. Distribution and access

- Private repositories: existing git credentials are used. HTTPS needs `gh auth setup-git`; SSH needs a key without a passphrase prompt. `GITHUB_TOKEN` does not work for background auto-update.
- Team auto-install in `.claude/settings.json`:

```json
{
  "extraKnownMarketplaces": {
    "your-marketplace": { "source": { "source": "github", "repo": "your-org/your-marketplace" } }
  },
  "enabledPlugins": { "code-formatter@your-marketplace": true }
}
```

- This takes effect only after the contributor accepts the workspace trust dialog. Plugins with an external `source` still need `claude plugin install ... --scope project` from each person.
- Organization-wide managed settings: `strictKnownMarketplaces`, `blockedMarketplaces`, `enabledPlugins`.

## 6. Gotchas

- Components cannot leave the plugin root (`../shared` gives `path escapes plugin directory`). Sharing files between plugins in one marketplace works through symlinks.
- The entry `name` and the `plugin.json` `name` must match.
- Unknown keys load silently; only `validate` catches typos.
- A missing relative path passes `validate` but fails at install time.
- Hooks in a marketplace entry must be an inline object. A file path passes validation but never runs.
- A marketplace hosted as a bare URL to `marketplace.json` cannot use relative paths. Use `github` or `archive` sources instead.
- Keep Git LFS files out of the repository; users receive pointer files.
- Node dependencies install automatically only from `package-lock.json`, `npm-shrinkwrap.json` or `bun.lock`, with a 60-second limit and no install scripts.
- Renames or removals need a `renames` entry or `forceRemoveDeletedPlugins`. There is no "deprecated" state.
- `${CLAUDE_PLUGIN_ROOT}` changes with every version. Use `${CLAUDE_PLUGIN_DATA}` for state that must survive updates.
- A bare host name (`gitlab.example.com/group/repo`) is read as GitHub shorthand. Write `https://`.

## 7. Community practices (less authoritative)

- Keep versions and descriptions in sync across `plugin.json`, `marketplace.json` and the changelog.
- Separate versions: `plugins[].version` changes on every plugin release; `metadata.version` changes only when plugins are added or removed.
- Use SemVer. Release flow: bump the version, update the changelog, tag, push.
- Run release commands from the marketplace root.
- There is no central review, so add CI with `claude plugin validate --strict` and a contributor checklist.
- According to secondary sources, the official `claude-plugins-official` separates `/plugins` (first-party) from `/external_plugins` (third-party). Not verified in the repository itself.

## Not verified

- The full `plugin.json` field list (the manifest reference page was not fetched).
- The `discover-plugins` page was not found in the docs map.
- Version gates (for example `pluginRoot` from v2.1.239) are as stated by the docs.

## Sources

- https://code.claude.com/docs/en/plugin-marketplaces
- https://skills.sh/sjnims/plugin-dev/marketplace-structure
- https://smithery.ai/skills/bbrowning/creating-and-managing-plugin-marketplaces
- https://skills.cat/skills/ed3dai/ed3d-plugins/maintaining-a-marketplace
- https://skills.cat/skills/emasoft/ghe-marketplace/marketplace-release
- https://www.morphllm.com/claude-code-marketplace
