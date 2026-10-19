# Contributing

Thanks for helping. This repository is a plugin marketplace, so a mistake in the catalog can break installs for every user. Please follow the steps below.

## Ground rules

- **English only**, with no exceptions. Documentation, plugin descriptions, READMEs, code comments, UI text, commit messages and PR text must be in English. The validator rejects Cyrillic characters in every repository text file (Markdown, JSON, YAML, scripts, JS/JSX/TS, CSS, HTML).
- **Enable the git hook once per clone:** `npm run setup` (or `git config core.hooksPath .githooks`). The `pre-push` hook runs the validator and reminds you about branch protection.
- **Never commit secrets.** See [docs/SECURITY.md](docs/SECURITY.md).
- **Do not bump versions by hand.** Releases are cut with `scripts/release.mjs` ([docs/RELEASES.md](docs/RELEASES.md)).
- **Do not use reserved marketplace or plugin names** (for example `claude-plugins-official` or `anthropic-*`).

## Changing the catalog

1. Create a branch from `main`.
2. Edit `.claude-plugin/marketplace.json` or the plugin under `plugins/<name>/`.
3. Run the linter:
   ```bash
   node scripts/validate-marketplace.mjs --strict
   ```
4. Test it in Claude Code against your local checkout:
   ```bash
   claude plugin validate .
   claude plugin marketplace add .
   claude plugin install <plugin>@dev-digest-ai-marketplace
   ```
   Local marketplaces load in place, so after edits run `/reload-plugins` in the session.
5. Add a line under `## [Unreleased]` in the plugin's `CHANGELOG.md`.
6. Open a pull request and complete the checklist. CI runs the same linter.

## Adding a plugin

1. Create `plugins/<name>/` following [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md).
2. Add an entry to `.claude-plugin/marketplace.json`:
   ```json
   {
     "name": "<name>",
     "source": "./plugins/<name>",
     "description": "One sentence about what the plugin does."
   }
   ```
   Do not put `version` in the entry. The version lives only in `plugins/<name>/.claude-plugin/plugin.json`.
3. Start the plugin at version `0.1.0` and add a `CHANGELOG.md`.
4. Add a per-plugin line to `CODEOWNERS`.

## Plugins from other repositories

Entries with an object `source` (`github`, `url`, `git-subdir`) must be pinned with a full 40-character `sha`. A moving branch name alone is not accepted by the review checklist, because it lets upstream changes reach users unreviewed.

## Commit messages

Use short, imperative English summaries, for example `add code-review plugin` or `fix hook path in formatter`. Release and rollback commits are created by the scripts.
