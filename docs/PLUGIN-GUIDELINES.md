# Plugin guidelines

Rules for every plugin in this marketplace. `scripts/validate-marketplace.mjs` enforces the ones marked **(checked)**.

## Directory structure

```
plugins/<name>/
├── .claude-plugin/
│   └── plugin.json        # manifest (required here, optional in Claude Code)
├── skills/<skill>/SKILL.md
├── agents/*.md
├── commands/*.md          # legacy format; prefer skills/
├── hooks/hooks.json
├── .mcp.json
├── bin/                   # executables added to PATH
├── README.md              # what it does, requirements, usage
└── CHANGELOG.md           # Keep a Changelog style, with an [Unreleased] section
```

- `.claude-plugin/` contains only `plugin.json`. All components live at the plugin root.
- Every directory under `skills/` contains a `SKILL.md` **(checked)**.
- `hooks/hooks.json` and `.mcp.json` must be valid JSON **(checked)**.

## Manifest (`plugin.json`)

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "One sentence about what the plugin does.",
  "author": { "name": "free3et" },
  "license": "MIT"
}
```

- `name` equals the `name` of the marketplace entry **(checked)**. Use kebab-case; do not use reserved names.
- `version` is a SemVer string and is set **only** in `plugin.json`, never in the marketplace entry **(checked)**. Do not edit it by hand; use `scripts/release.mjs`.
- `description` is required and written in English **(checked)**.
- `license` is expected; its absence is a warning **(checked)**.

## Paths

- A plugin cannot read files outside its own directory: Claude Code copies it into a cache. Paths such as `../shared` do not work **(checked in the manifest)**.
- Reference bundled files with `${CLAUDE_PLUGIN_ROOT}` (changes on every version).
- Store state that must survive updates in `${CLAUDE_PLUGIN_DATA}`, never inside the plugin directory.
- Use forward slashes only.

## Dependency requirements

- **Prefer zero dependencies.** Plain Markdown skills and shell or Node scripts without packages are easiest to review and safest to run.
- **Node packages:** commit a lockfile (`package-lock.json`, `npm-shrinkwrap.json` or `bun.lock`). Claude Code installs only from these, exact-pinned, without lifecycle scripts, and gives up after 60 seconds. `yarn.lock` and `pnpm-lock.yaml` are not supported.
- **External tools** (for example `jq`, `gh`, `python3`): list them in the plugin README with minimum versions, and make scripts fail with a clear message when a tool is missing.
- **MCP servers:** pin the server package or binary to an exact version. Do not use `latest` or an unpinned `npx` call.
- **Network access:** document every host the plugin contacts in its README.
- **No Git LFS files.** Users would receive pointer files instead of the content.
- **Other plugins:** if a plugin depends on another one, say so in its README. Cross-marketplace dependencies need `allowCrossMarketplaceDependenciesOn` in `marketplace.json`.

## Marketplace entry

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "One sentence about what the plugin does."
}
```

- `source` starts with `./`, uses forward slashes and has no `..` **(checked)**.
- Do not set `strict` or declare components in the entry unless you need to; keep everything in `plugin.json`.
- Hooks declared in an entry must be inline objects. A file path passes validation but never runs.
- Plugins from other repositories use an object `source` pinned to a full `sha` **(checked)**.

## Language and style

- All text is English: manifest descriptions, README, skill instructions, comments **(checked for Cyrillic characters)**.
- Skill `description` fields say **when** the skill should trigger, not only what it does.
- Keep each plugin focused on one job. Split large plugins.

## Removing or renaming a plugin

Add a `renames` entry (old name to new name, or `null` when removed) to `marketplace.json`. Set `forceRemoveDeletedPlugins` only if the plugin must disappear from users' machines. There is no deprecation state; see [RELEASES.md](RELEASES.md).
