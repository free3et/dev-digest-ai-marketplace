## What changed

<!-- One or two sentences. Name the plugin(s) affected. -->

## Checklist

- [ ] `node scripts/validate-marketplace.mjs --strict` passes locally
- [ ] All text (docs, descriptions, comments, commit messages) is in English
- [ ] New or changed plugin follows [docs/PLUGIN-GUIDELINES.md](../docs/PLUGIN-GUIDELINES.md)
- [ ] Hooks, scripts, MCP servers and `bin/` files were reviewed against [docs/SECURITY.md](../docs/SECURITY.md)
- [ ] No secrets, tokens or private keys are committed
- [ ] The plugin `CHANGELOG.md` has an entry under `## [Unreleased]`
- [ ] Version is **not** bumped in this PR (releases use `scripts/release.mjs`, see [docs/RELEASES.md](../docs/RELEASES.md))
