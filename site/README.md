# Catalog site

A static search UI for the marketplace in this repository, published at https://free3et.github.io/dev-digest-ai-marketplace/. It lists plugins and the skills, agents, commands, hooks and MCP servers they contain, with their versions, dependencies, change history and links to each plugin's documentation.

It is **not part of the marketplace**: Claude Code never reads this folder. Installing a plugin does not need the site.

## How it works

- **No server and no database.** `scripts/catalog.mjs` reads `.claude-plugin/marketplace.json` and `plugins/` and builds one index. The Vite plugin in `vite.config.js` serves it as `/catalog.json` in development and writes the same file into `dist/` on build. The page fetches that file.
- **Only real content.** Versions come from each `plugin.json`, dependencies from its manifest, change history from its `CHANGELOG.md`. Nothing is typed into the site by hand.
- **Hash routes**, so deep links work on GitHub Pages: `#/catalog?q=…&type=skill&plugin=…`, `#/p/<plugin>`, `#/a/<artifact>`.
- **Client-side search** with weighted fields (name, keywords, description, plugin, usage).

What the site shows, the index fields and the routes are specified in [`docs/SITE-SPEC.md`](../docs/SITE-SPEC.md).

## Layout

| Path | Purpose |
|---|---|
| `index.html`, `src/main.jsx`, `src/App.jsx` | Entry point and shell |
| `src/pages/` | Home, catalog, plugin and artifact pages, static pages, not found |
| `src/components/ui.jsx` | Shared components (badges, panels, install command, timeline) |
| `src/lib/` | Routing, search, formatting, catalog loading, i18n; unit tests sit next to the code (`*.test.js`) |
| `src/locales/en.js` | All UI text |
| `src/styles.css` | Styles |
| `public/` | Static files copied as they are |
| `vite.config.js` | Vite config and the catalog plugin |

## Run it

Run these from the **repository root** (the scripts are in the root `package.json`). Node 20.19 or newer.

```bash
npm install        # once
npm run dev        # http://localhost:5173, re-indexes on every change under plugins/ and .claude-plugin/
npm test           # unit tests
npm run build      # writes site/dist
npm run preview    # serves site/dist
npm run catalog    # prints what the site would list, without starting it
```

## UI text

All visible text lives in `src/locales/en.js` and is read through `t()` from `src/lib/i18n.jsx`. Components contain no literal text. `npm test` fails on a missing or unused key and on text written directly in a component. To add a language, copy `en.js`, translate the values and select it in `i18n.jsx`.

## Publishing

`.github/workflows/pages.yml` ("Catalog site") has three jobs: **Site tests**, **Build site** and, on `main` only, **Deploy to GitHub Pages**. The first two run on every pull request and are required checks; the deploy runs on pushes to `main` that touch `site/`, `plugins/`, `.claude-plugin/` or the catalog scripts. One-time setup: Settings → Pages → Source: **GitHub Actions**.

To check that a deploy is current, open `catalog.json` on the published site: `meta.generatedAt` must be later than the merge of the change, and each plugin's `ver` must match its `plugin.json`.
