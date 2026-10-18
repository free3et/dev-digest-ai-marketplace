# Security policy

Installing a plugin means running someone else's instructions and code with the user's permissions. Treat every change to this repository as a change to software that runs on other people's machines.

## What a plugin can do

| Component | Runs with the user's rights? | Review focus |
|---|---|---|
| `hooks/hooks.json` | Yes, shell commands on tool events | Exact commands, what data they read or send |
| `.mcp.json` | Yes, starts local processes or connects to remote servers | Package/binary source, pinned version, hosts, tokens |
| `bin/` | Yes, added to the PATH of the Bash tool | Every file; names that shadow common tools |
| `skills/`, `agents/`, `commands/` | Shape what Claude does and which tools it may use | Prompt injection, over-broad `allowed-tools` |
| `settings.json` | Only `agent` and `subagentStatusLine` take effect | Unexpected agent switches |

## Permissions

- Request the minimum. Narrow `allowed-tools` in skills and agents to what the task needs; avoid unrestricted `Bash`.
- A hook must do one clearly described thing. Hooks that run on every tool call need a documented reason.
- Do not write outside the project or `${CLAUDE_PLUGIN_DATA}`. Do not modify user settings, shell profiles or credentials.
- Document in the plugin README every permission, network host and file location the plugin touches.

## Secrets policy

- **Never commit** API keys, tokens, passwords, private keys or `.env` files. This applies to examples and tests too.
- Read secrets from environment variables or Claude Code user configuration at run time; document the variable names, not values.
- Do not print secrets in logs or hook output.
- The validator scans `plugins/` for common secret formats (private keys, AWS, GitHub, Anthropic and Slack tokens) and fails the build **(checked)**. It is a safety net, not a guarantee.
- If a secret is committed: revoke it immediately, then remove it from history. Deleting the file in a later commit is not enough.

## Script review checklist

Before approving a PR that adds or changes executable content:

- [ ] Read every script fully; no obfuscated, encoded or minified code
- [ ] No `curl ... | sh`, `eval` of downloaded content or runtime self-updating
- [ ] Every network call goes to a documented host over HTTPS; no data leaves the machine without being documented
- [ ] Inputs from files, tool output or the web are quoted and never passed unescaped to a shell
- [ ] Destructive commands (`rm -rf`, `git reset --hard`, force pushes) are absent or guarded
- [ ] Dependencies are pinned and come from a lockfile; no install scripts
- [ ] External plugin sources are pinned to a full commit `sha`
- [ ] Skill and agent text does not instruct Claude to bypass permissions, hide actions from the user or exfiltrate data

## Supply chain

- External sources (`github`, `url`, `git-subdir`) require a 40-character `sha` **(checked)**. Update the SHA only after reviewing the diff between the old and new commit.
- `CODEOWNERS` requires maintainer review of every change. Enable branch protection on `main` with required reviews and the `Validate marketplace` check.
- Releases are tagged and annotated. Never move or delete a published tag; publish a new version instead (see [RELEASES.md](RELEASES.md)).

## Reporting a vulnerability

Do not open a public issue for security problems. Use GitHub's private vulnerability reporting for this repository ("Security" tab, "Report a vulnerability"). Include the affected plugin and version, and steps to reproduce. Expect an acknowledgement within a few days. If a released plugin is affected, the fix is shipped as a new version and, when needed, the plugin is rolled back or removed as described in [RELEASES.md](RELEASES.md).
