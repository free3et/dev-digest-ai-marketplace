# Catalog site specification

The catalog UI in `site/` is a static React app (Vite) published on GitHub Pages by `.github/workflows/pages.yml`. This document records what it does today, so changes can be checked against it. It was written from the code on 2026-10-23; where a statement is a requirement rather than an observation it says so.

## Data

The site has no server. `scripts/catalog.mjs` builds one index from the repository (`buildCatalog()`), the Vite plugin in `site/` serves it as `catalog.json`, and the build writes the same file to Pages.

| Level | Fields |
|---|---|
| `meta` | `repo`, `marketplace`, `generatedAt` |
| Plugin | `name`, `ver`, `cat`, `desc`, `updated`, `path`, `tags`, `kw`, `deps` (`name`, `range`), `docs` (the existing files among `README.md`, `COMPATIBILITY.md`, `CHANGELOG.md`), `health` (`ok`, `warn`, `err`), `healthCodes`, `log` (changelog sections), `external` for plugins hosted elsewhere |
| Artifact (skill, agent, command, hook, MCP server) | `id`, `type`, `plugin`, `name`, `desc`, `tags`, `kw`, `updated`, `file`, `path`, `tools`, `content` (clipped file text) |

`ver` is the version in the plugin's `plugin.json`; the catalog never invents one. `deps` come from the manifest's `dependencies`. The index is rebuilt on every deploy, so the site shows the repository as of the last push to `main` that touched `site/**`, `plugins/**`, `.claude-plugin/**` or the catalog scripts.

## Routes

Hash routes, so deep links work on Pages.

| Route | Page |
|---|---|
| `#/` | Home |
| `#/catalog?q=&type=&cat=&plugin=&tag=` | Search and filters; `type` is a comma list of `plugin`, `skill`, `agent`, `command`, `hook`, `mcp` |
| `#/p/<plugin>` | Plugin page |
| `#/a/<artifact id>` | Artifact page |
| `#/new`, `#/start`, `#/saved`, `#/install`, `#/contribute` | Static pages |
| anything else | Not found |

## Search

The query is split into words; stop words are dropped; every remaining word must match somewhere. Field weights: name 5, keywords and tags 4, description 3, plugin name 2, usage and tools 1. Words over four letters also match by a simple stem at 60% weight. Matches are highlighted.

## Plugin page

Requirements, all met by `site/src/pages/Detail.jsx`:

1. Name, description and the install command for the plugin.
2. Contents: every indexed artifact with its type, linking to the artifact page.
3. File structure and change history parsed from `CHANGELOG.md` (only dated sections and the current version).
4. Status: version, category, age of the last change, validation result with the reason codes.
5. **Dependencies** with their ranges, each linking to the dependency's page, and the note that they install automatically.
6. **Documentation**: links to `README.md`, `COMPATIBILITY.md` and `CHANGELOG.md` on GitHub, for the files the plugin has. The site does not render these Markdown files; it links to them. Rendering would need a sanitizer such as DOMPurify, because the text comes from the repository, and is out of scope here.
7. A security panel for the artifacts that can run code.

Not shown: the Markdown content of README and COMPATIBILITY, plugin owners from `CODEOWNERS`, release tags.

## Checks

- `npm test`: unit tests for routes, search, i18n and the index (`site/src/lib/*.test.js`). The index test asserts the dependencies of `sdd-engineering` and the `docs` list of every plugin.
- CI jobs "Site tests" and "Build site" run on every pull request; "Deploy to GitHub Pages" runs on pushes to `main` that touch the paths above.
- To compare a deployed site with a release, read `catalog.json` on Pages: `meta.generatedAt` must be later than the merge of the release, and each plugin's `ver` must equal its `plugin.json`.
