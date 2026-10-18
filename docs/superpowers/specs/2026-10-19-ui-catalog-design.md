# Specification: marketplace UI catalog on GitHub Pages

Date: 2026-10-19. Status: v1 implemented in `site/`. Document language: English. The UI is English only.

The mark **[my decision]** denotes an assumption made without confirmation. Check it while reading.

## 1. Why

The marketplace (`dev-digest-ai-marketplace`) consists of plugins that contain skills, agents, commands, hooks and MCP servers. To find what you need, you currently have to browse the repository. A catalog on GitHub Pages provides:

- **search by task**: the user types "I need a skill for code review" and sees cards of artifacts that match by keywords;
- **trust in installation**: it is visible what exactly the plugin runs (hooks, MCP, commands);
- **quick start**: new team members connect the marketplace in about 30 seconds.

## 2. Goals, non-goals, anti-goals

**Goals**
1. Search across the whole repository content, with results shown as cards.
2. All data comes from the repository itself. No manual duplication.
3. Works fully statically on GitHub Pages.
4. The feature list from section 5 (v1) and section 6 (v1.5 and later) is implemented in the stated order.

**Non-goals**
- Accounts, authentication, custom ratings and comments.
- Install counters and server-side analytics.
- Editing artifacts from the catalog. The catalog is read-only.

**Anti-goals (failure, even if it works technically)**
- The catalog shows stale data that diverges from the repository.
- Search requires a connection to any backend.
- A user cannot understand within 10 seconds what an artifact is and how to install it.

## 3. Constraints

- GitHub Pages: static files only, no server code.
- Any "dynamic" functionality works in one of three ways: computed at build time, computed in the browser, or read from the public GitHub API (read-only, respecting the unauthenticated rate limit).
- Build and deploy run through GitHub Actions.
- The catalog must work without a JavaScript framework that pulls in large dependencies. Initial load up to 300 KB gzip excluding data **[my decision]**.
- The repository is currently empty. The design cannot rely on existing plugins, so the mockups use test data (section 9).

## 4. Architecture

### 4.1. Data pipeline (build time)

A GitHub Action on every push to `main`:

1. Reads `.claude-plugin/marketplace.json`.
2. For each plugin, reads `plugin.json` (if present) and walks `skills/*/SKILL.md`, `agents/*.md`, `commands/*.md`, `hooks/hooks.json`, `.mcp.json`, `CHANGELOG.md`.
3. Parses frontmatter (`name`, `description`, `keywords`, `tools`, `model`, etc.) and the markdown body.
4. Computes derived data: statistics, the "what runs" list (hooks, MCP, commands), the last change date from `git log`, and the validation state from `claude plugin validate --strict`.
5. Writes the build artifacts:
   - `catalog.json`: all artifacts with metadata (without full texts);
   - `search-index.json`: the search index (with body text);
   - `artifacts/<id>.json`: the full content of a single artifact page;
   - `releases.json`: the release feed;
   - `feed.xml`: RSS/Atom.
6. Publishes to Pages.

An invalid plugin does not block the catalog build. It appears with the status "validation error" (see 6.6).

### 4.2. Client (runtime)

A static SPA with hash routing (`#/...`), because Pages cannot fall back to `index.html` for arbitrary paths. Search runs in the browser. Search and filter state lives in the URL. Personal data (bookmarks, the install kit, theme) lives in `localStorage`.

### 4.3. Technical choices **[my decision]**

- Build: Vite. UI: Preact (or plain JS if the design allows it).
- Search: MiniSearch.
- Markdown renderer with HTML sanitization (SKILL.md content is considered untrusted).
- Build script: Node.

## 5. Data model

All types share these fields: `id` (stable, `plugin/type/name`), `type`, `name`, `description`, `plugin`, `pluginVersion`, `category`, `tags[]`, `keywords[]`, `path` (path in the repository), `githubUrl`, `updatedAt`.

| Type | Additional fields |
|---|---|
| `plugin` | `version`, `source`, `components` (count of each type), `dependencies[]`, `validation` |
| `skill` | `allowedTools[]`, file layout |
| `agent` | `tools[]`, `model` |
| `command` | `argumentHint` |
| `hook` | `event`, `matcher`, `commandPreview` |
| `mcp` | `serverName`, `transport`, `commandPreview` |

Search fields and their weights: `name` (x5), `keywords`/`tags` (x4), `description` (x3), `plugin` (x2), markdown body (x1).

## 6. Functionality

For each feature below we state what the user sees, the data, and the states the design must cover.

### 6.1. v1 (core)

**F1. Task search with cards**
- One large search field on the home page and in the header. A natural-language query ("I need a skill for ...") is split into keywords. Filler words ("I", "need", "a", "skill", "for") are ignored and do not distort ranking. **[my decision]**
- Fuzzy search (typos), prefix search, ranking by the weights in section 5.
- Result: a grid of cards sorted by relevance, with match highlighting and a "Found N" counter.
- States for the design: empty field (home), index loading, results, nothing found (hint: try other words, list of popular tags), index load error.
- Content data: `search-index.json`.

**F2. Artifact card**
- Content: icon and type label, name, 2-3 lines of description, plugin and version, tags, validation state label, update date.
- Actions: "Copy install command", "Open on GitHub", go to the artifact page.
- Variants: default, "bookmarked" state, with match highlighting.

**F3. Filters**
- By type (multi-select), category, tag, plugin. A result counter next to each value.
- Filter and query state is written to the URL (`#/?q=...&type=skill&tag=...`) so links can be shared.
- Mobile variant: filters in a drawer.

**F4. Artifact page**
- Header with type and plugin; install block; rendered markdown; plugin file tree; the "What runs" block (see F9); dependencies; related artifacts of the same plugin; a link to the change history on GitHub.
- States: loading, not found (artifact was removed), error.

**F5. Install block (one-click installation)**
```
claude plugin marketplace add <owner>/<repo>
claude plugin install <plugin>@<marketplace>
```
Each line has its own copy button. After the click, a "Copied" confirmation is shown.

**F6. What's new: release feed from CHANGELOG/version**
- A chronological feed: plugin, version, date, short description of changes from `CHANGELOG.md`. New and updated artifacts are marked on cards with a "New" / "Updated" label (threshold of 14 days **[my decision]**).
- Data: `releases.json`. The user does not have to follow git.
- States: empty feed ("no releases yet"), plugin without CHANGELOG (only version and date are shown).

**F7. Stats tile**
- A block on the home page: number of plugins, skills, agents, commands, hooks, MCP; the date of the last catalog update; the share of valid plugins.
- Numbers are computed at build time from the index. Clicking a number applies the matching filter.

**F8. Onboarding "how to connect the marketplace"**
- A separate page and a compact card on the home page. A step-by-step scenario of about 30 seconds: (1) add the marketplace, (2) install a plugin, (3) reload plugins, (4) verify.
- Each step has a copy button. A separate tab for teams: a ready `.claude/settings.json` snippet with `extraKnownMarketplaces` and `enabledPlugins`.
- Uses the real `owner/repo` and marketplace name from the build.

### 6.2. v1.5

**F9. Security transparency**
- For each plugin and artifact, a "What runs" block: hooks (event, matcher, command), MCP servers (transport, command), commands, allowed tools of skills.
- A visual attention-level marker, for example "runs shell commands". Static analysis, no guarantees. The page shows a disclaimer that this is not a full audit.

**F10. Install builder**
- The user selects several plugins (checkbox on cards, a "cart" in the header). The builder generates: (a) a script with install commands, (b) a `.claude/settings.json` snippet for the whole team.
- The cart is stored in `localStorage`. States: empty, N selected, copied.

**F11. Bookmarks / "my set"**
- A star on the card and the page. A separate "Saved" section. Data only in `localStorage`. The design must show that it is local to this browser.

**F12. Health status**
- A validity label (`validate --strict`: ok / warning / error) and the last update date on the plugin card and page. Error details in a tooltip.

**F13. Contribution**
- The "Suggest a plugin" and "Report a problem" buttons open a GitHub Issue/PR with a template. A separate "How to build your own plugin" page with a `SKILL.md` template.

### 6.3. Later

**F14. Guided search (task matcher)**: 3-4 questions (what for, which language/stack, skill or agent) lead to a selection of cards. Rules and tags on the client.

**F15. Comparison**: up to three plugins or skills side by side in a table: components, tools, hooks, MCP, version.

**F16. Reviews and popularity**: repository stars and reactions from GitHub Discussions (read-only via the public API, with caching and a fallback state without this data). No custom counters.

**F17. RSS/Atom feed** of new plugins and releases (`feed.xml` from the build).

**F18. Offline mode (PWA)**: a service worker caches the shell and the index. Search works without a network.

## 7. Screens and navigation

| Screen | Route | Main content |
|---|---|---|
| Home | `#/` | Search, stats tile, What's new (short), onboarding card, popular tags |
| Results / catalog | `#/?q=...` | Filters, card grid |
| Artifact | `#/a/<id>` | F4, F5, F9 |
| Plugin | `#/p/<name>` | Plugin contents, versions, health status, list of artifacts |
| What's new | `#/new` | Full release feed |
| Getting started | `#/start` | Onboarding, team snippet |
| Saved / cart | `#/saved`, `#/install` | F11, F10 |
| Contribute | `#/contribute` | F13 |
| 404 | any unknown route | Return to home, search |

Header (on all screens): name, search field, links "What's new" and "Getting started", cart, theme switch, link to GitHub.

## 8. Non-functional requirements

- **Accessibility**: WCAG AA, keyboard navigation, visible focus, `aria` for search and cards. Copying does not rely on color alone.
- **Theme**: light and dark, following the system with a manual switch.
- **Responsiveness**: from 360 px. Grid of 1/2/3-4 columns.
- **Performance**: the first search after the index loads takes up to 100 ms on a catalog of up to 500 artifacts **[my decision]**. The index loads lazily after the shell is shown.
- **Language (decided)**: the interface is English only. Details in section 8.1. Artifact content (SKILL.md and so on) is shown as is.
- **Security**: markdown is sanitized, external links use `rel="noopener noreferrer"`.
- **Privacy**: no trackers. `localStorage` is wrapped in try/catch and the interface works without it.

### 8.1. Language

- **English only.** This follows the repository rule in `CONTRIBUTING.md` that all repository content is English. An earlier draft planned an additional Ukrainian locale; it was dropped.
- **Strings** live in `site/locales/en.js` (UI text and the stop-word list) so the code contains no user-facing literals. Adding a language later means adding a locale file and a switcher.
- **Dates** are formatted with `toLocaleDateString('en-GB')` and `<html lang="en">`.
- **Search** matches the words a user types against artifact text. Stop words are English.

## 9. What is needed from the design

1. Visual language: palette, typography, grid, light and dark themes.
2. Components: card (all variants), search field, filters, type and state badges, copy button, stats tile, release feed item, "What runs" block.
3. The screens from section 7 for desktop and mobile, including the empty, loading, error and "nothing found" states, in English.
4. Test data for mockups: a set of about 12 fictional artifacts of different types (at least one plugin with a hook and MCP to show F9, and one with a validation error).

## 10. Definition of done for v1

- The query "code review" on the test catalog returns relevant cards with highlighting.
- A change to `SKILL.md` pushed to `main` appears in the catalog after deployment with no manual steps.
- Filters and the query are restored from the URL after a page refresh.
- The install block and onboarding copy the correct commands for the real `owner/repo`.
- The stats tile matches the number of artifacts in the repository.
- The catalog works without errors on mobile and with `localStorage` disabled.

## 11. Open questions

1. **Audience** (unanswered): internal team or public community. This specification is written to suit both. The answer sets the priority of F13 and F16.
2. Whether a separate domain is needed, or `<user>.github.io/<repo>` is enough.
3. The `CHANGELOG.md` format for plugins (Keep a Changelog or another). The What's new parser depends on it.
4. Whether to document an optional `keywords` field in `SKILL.md` and agents. The build already reads it when present and search weights it at x4.

Resolved: interface language is English only, see 8.1.
