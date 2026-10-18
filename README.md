# dev-digest-ai-marketplace

A [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces): a catalog of plugins (skills, agents, hooks, MCP servers) that you can install with one command.

## Install

Add the marketplace, then install a plugin from it:

```bash
claude plugin marketplace add free3et/dev-digest-ai-marketplace
claude plugin install <plugin>@dev-digest-ai-marketplace
```

Inside a Claude Code session the same commands are `/plugin marketplace add ...` and `/plugin install ...`.

To get updates, refresh the catalog first and then update the plugin:

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update <plugin>@dev-digest-ai-marketplace
```

Third-party marketplaces do not auto-update by default. You can enable auto-update for this marketplace in the `/plugin` menu.

## Available plugins

None yet. The catalog lives in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json).

## Repository layout

| Path | Purpose |
|---|---|
| `.claude-plugin/marketplace.json` | The catalog: marketplace metadata and the list of plugins |
| `plugins/` | One directory per plugin that lives in this repository |
| `scripts/` | Dependency-free Node scripts: `validate-marketplace`, `release`, `rollback`, `build-site` |
| `site/` | Static catalog UI for GitHub Pages. Separate from the marketplace; see below |
| `docs/` | Plugin guidelines, security policy, release process |
| `.github/` | CI workflow and pull request template |

## Catalog site

`site/` is a static search UI (plugins, skills, agents, commands, hooks, MCP servers) published to GitHub Pages at https://free3et.github.io/dev-digest-ai-marketplace/. It is not part of the marketplace and Claude Code never reads it.

- `node scripts/build-site.mjs` reads `.claude-plugin/marketplace.json` and `plugins/` and writes `site/data/catalog.js` (git-ignored).
- While the repository has no plugins, the site shows the demo data from `site/data/catalog.sample.js`.
- `.github/workflows/pages.yml` rebuilds and deploys on every push to `main`. One-time setup: Settings → Pages → Source: **GitHub Actions**.
- Local preview: `npm run serve:site`.

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md): how to change the catalog or add a plugin safely
- [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md): plugin structure, manifest, dependency requirements
- [docs/SECURITY.md](docs/SECURITY.md): permissions, secrets policy, script review
- [docs/RELEASES.md](docs/RELEASES.md): SemVer, tags, updates, rollback

## Maintainer commands

Requires Node 20 or newer. No `npm install` is needed.

```bash
node scripts/validate-marketplace.mjs --strict   # lint the catalog and plugins
node scripts/release.mjs <plugin> patch          # bump, changelog, commit, tag
node scripts/rollback.mjs <plugin> 1.2.0         # restore old content as a new version
```

Use `--dry-run` with `release` and `rollback` to preview. Neither script pushes anything.
