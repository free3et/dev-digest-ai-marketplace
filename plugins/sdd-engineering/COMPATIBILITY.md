# Compatibility

What `sdd-engineering` needs, and what has actually been checked. "Verified" means observed on a real install; "declared" means stated but not independently tested.

## Claude Code

| | Version | Status |
|---|---|---|
| Verified | 2.1.303 | Installed from the marketplace, dependencies resolved by tag, plugin and catalog updates run separately, `claude plugin validate` passes for every plugin, the guard hook runs from the plugin cache |
| Declared minimum | 2.1.110 | Needed for version-constrained plugin dependencies (`^1.0.0`). **Declared from course material; not verified** against older releases or the public changelog. Treat it as unconfirmed until tested on that version |
| Evals only | 2.1.269 | `claude plugin eval`, which the dependency plugin `architecture-review` uses for its behavior evals. Not needed to use the plugins |

Raise the minimum, and note why, whenever the plugin starts to use a newer Claude Code feature.

## Features the plugin relies on

| Feature | Where | Notes |
|---|---|---|
| Plugin dependencies with version ranges | `plugin.json` | Resolved from git tags named `<plugin>--v<version>` |
| Namespaced components | agents and skills | `engineering-paved-path:<skill>`, `research-tools:researcher`, `architecture-review:architecture-reviewer` |
| Plugin-wide hooks | `hooks/hooks.json` | The guard needs `agent_type` in the hook input to tell `spec-creator` and `plan-verifier` from other callers. The docs describe the field; it was **not** observed directly. Indirect evidence (2026-10-22, 1.1.0 installed at user scope in another project): during a live `spec-creator` pass 2 the guard blocked Bash searches such as `rg "dark-mode"` and `rg "dark mode\|theme"`, as reported by the agent. That suggests the field arrives, but the hook input was not logged. Known problem: those searches are read-only and should not be blocked (false positive, not yet investigated). Without the field the guard does nothing |
| `${CLAUDE_PLUGIN_ROOT}` | hook command, agent prompts | Plugin-level files such as `skill-routing.md` |
| Agent frontmatter | agents | Only fields supported for plugin agents (`name`, `description`, `model`, `tools`, `maxTurns`, `skills`); `hooks` and `permissionMode` are ignored there and are not used |

## Tools on the machine

| Tool | Needed for | If missing |
|---|---|---|
| `jq` | `hooks/agent-guard.sh` | The guard exits 0 with a warning, so the agents run unguarded |
| `git` | `run-plan` review input (`git diff HEAD`) | `run-plan` asks for a hand-written file list instead |
| Project check command | `run-plan --check`, `implementer`, `plan-verifier` | Asked for once; the agents never assume a script exists |

## Tested dependency combinations

| sdd-engineering | engineering-paved-path | research-tools | architecture-review |
|---|---|---|---|
| 1.0.0 | 1.0.0 | 1.0.0 | 1.0.0 |
| 1.0.0 | 1.0.0 | 1.0.1 | 1.0.0 |

The ranges are `^1.0.0` for all three. A dependency release that renames an agent or skill is a major version, so the ranges keep the chain working.
