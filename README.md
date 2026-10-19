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
| `scripts/` | Dependency-free Node scripts: `validate-marketplace`, `release`, `rollback`, `catalog` |
| `site/` | React + Vite catalog UI for GitHub Pages. Separate from the marketplace; see below |
| `docs/` | Plugin guidelines, security policy, release process |
| `.github/` | CI workflow and pull request template |

## Catalog site

`site/` is a React + Vite search UI (plugins, skills, agents, commands, hooks, MCP servers) published to GitHub Pages at https://free3et.github.io/dev-digest-ai-marketplace/. It is not part of the marketplace and Claude Code never reads it.

- It shows only what is really in the repository. `scripts/catalog.mjs` indexes `.claude-plugin/marketplace.json` and `plugins/`; the Vite build writes the result to `catalog.json` next to the page. With no plugins, the site shows an empty state.
- `npm install` once, then `npm run dev` starts a local server at http://localhost:5173. It re-indexes on every request and reloads the page when anything under `plugins/` or `.claude-plugin/` changes.
- `npm run build` writes `site/dist`; `npm run preview` serves it. `npm test` runs the unit tests. `npm run catalog` prints what the site would list.
- **UI text** lives in one file, `site/src/locales/en.js`, and is read through `t()` in `site/src/lib/i18n.jsx`. Components contain no literal text; `npm test` fails on a missing or unused key and on text written directly in a component. To add a language, copy `en.js`, translate the values and select it in `i18n.jsx`.
- **CI:** `.github/workflows/pages.yml` ("Catalog site") is separate from "Validate marketplace" (which only lints plugin files) and shows three checks of its own: **Site tests**, **Build site** and, on `main` only, **Deploy to GitHub Pages**. It runs on every pull request (so the required checks always report) and on pushes to `main` that touch the site, plugins or marketplace file. One-time setup: Settings → Pages → Source: **GitHub Actions**.

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md): how to change the catalog or add a plugin safely
- [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md): plugin structure, manifest, dependency requirements
- [docs/SECURITY.md](docs/SECURITY.md): permissions, secrets policy, script review
- [docs/RELEASES.md](docs/RELEASES.md): SemVer, tags, updates, rollback

## Maintainer commands

Requires Node 20.19 or newer. The maintenance scripts need no `npm install`; the catalog site does (`npm install`, then `npm run dev`).

```bash
node scripts/validate-marketplace.mjs --strict   # lint the catalog and plugins
node scripts/release.mjs <plugin> patch          # bump, changelog, commit, tag
node scripts/rollback.mjs <plugin> 1.2.0         # restore old content as a new version
```

Use `--dry-run` with `release` and `rollback` to preview. Neither script pushes anything.
