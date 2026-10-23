# dev-digest-ai-marketplace

A [Claude Code plugin marketplace](https://code.claude.com/docs/en/plugin-marketplaces): a catalog of plugins (skills, agents, hooks, MCP servers) that you can install with one command.

## Install

Add the marketplace, then install a plugin from it:

```bash
claude plugin marketplace add free3et/dev-digest-ai-marketplace
claude plugin install <plugin>@dev-digest-ai-marketplace
```

Inside a Claude Code session the same commands are `/plugin marketplace add ...` and `/plugin install ...`.

Installing a plugin that depends on others (for example `sdd-engineering`) installs the dependencies too.

### Updates

Third-party marketplaces **do not auto-update by default**. To turn it on, run `/plugin`, open the **Marketplaces** tab, select `dev-digest-ai-marketplace` and choose **Enable auto-update**. After that, a few minutes after you send the first message of a session, Claude Code refreshes this catalog and updates the installed plugins. The running session keeps its current versions; the next session loads the new ones.

To update by hand, refresh the catalog first and then update the plugin:

```bash
claude plugin marketplace update dev-digest-ai-marketplace
claude plugin update <plugin>@dev-digest-ai-marketplace
```

To stay on a tested version, add the marketplace pinned to a release tag and install from it (see the rollback rehearsal in [docs/RELEASES.md](docs/RELEASES.md)):

```bash
claude plugin marketplace add free3et/dev-digest-ai-marketplace#sdd-engineering--v1.0.0
```

Details, rollback and the release process are in [docs/RELEASES.md](docs/RELEASES.md).

## Available plugins

| Plugin | Version | What it provides | Depends on |
|---|---|---|---|
| [`sdd-engineering`](plugins/sdd-engineering/README.md) | 1.1.0 | Spec Driven Development workflow: `spec-creator`, `implementation-planner`, `implementer` and `plan-verifier` agents, plus `run-plan` and `workflow-retro` skills | the three plugins below |
| [`engineering-paved-path`](plugins/engineering-paved-path/README.md) | 1.0.0 | Ten skills: React, Next.js, Fastify, layered architecture, testing, security, Zod, TypeScript, Mermaid | none |
| [`research-tools`](plugins/research-tools/README.md) | 1.0.1 | Read-only `researcher` agent | none |
| [`architecture-review`](plugins/architecture-review/README.md) | 1.0.0 | Read-only `architecture-reviewer` agent | `engineering-paved-path` |

The catalog lives in [`.claude-plugin/marketplace.json`](.claude-plugin/marketplace.json); the site below lists everything with search. Versions here are for orientation; the source of truth is each plugin's `plugin.json`.

`architecture-review` and `sdd-engineering` ship behavior evals in their `evals/` folders (`claude plugin eval`), and `sdd-engineering` documents the Claude Code versions it was tested with in its [`COMPATIBILITY.md`](plugins/sdd-engineering/COMPATIBILITY.md).

## Repository layout

| Path | Purpose |
|---|---|
| `.claude-plugin/marketplace.json` | The catalog: marketplace metadata and the list of plugins |
| `plugins/` | One directory per plugin that lives in this repository |
| `scripts/` | Dependency-free Node scripts: `validate-marketplace`, `release`, `rollback`, `catalog` |
| `site/` | React + Vite catalog UI for GitHub Pages. Separate from the marketplace; see below |
| `docs/` | Plugin guidelines, security policy, release process, cost baseline, catalog site spec |
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
- [docs/RELEASES.md](docs/RELEASES.md): SemVer, tags, updates, rollback and the recorded rollback rehearsal
- [docs/COST-BASELINE.md](docs/COST-BASELINE.md): cost and quality baseline of `sdd-engineering` and one measured experiment
- [docs/SITE-SPEC.md](docs/SITE-SPEC.md): what the catalog site shows and how it is built

## Maintainer commands

Requires Node 20.19 or newer. The maintenance scripts need no `npm install`; the catalog site does (`npm install`, then `npm run dev`).

```bash
node scripts/validate-marketplace.mjs --strict   # lint the catalog and plugins
node scripts/release.mjs <plugin> patch          # bump, changelog, commit, tag
node scripts/rollback.mjs <plugin> 1.2.0         # restore old content as a new version
```

Use `--dry-run` with `release` and `rollback` to preview. Neither script pushes anything.
