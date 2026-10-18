# Specification: SDD Engineering plugin family

Date: 2026-10-19. Status: draft for review. Document language: English.

Source of content: <https://github.com/free3et/dev-digest> (`.claude/agents/`, `.claude/skills/`, `.claude/hooks/`). The component selection and dependency graph follow the four release slides supplied by the owner.

The mark **[my decision]** denotes an assumption made without explicit confirmation. Check it while reading.

## 1. Why

DevDigest contains a working Spec Driven Development (SDD) chain of subagents and skills, but it is welded to that repository (paths, scripts, project instructions). The goal is to publish a generic version through this marketplace so any team can install it with one command and get the whole chain, while the reusable parts stay independently installable.

## 2. Goals and non-goals

**Goals**
1. Four plugins registered in `.claude-plugin/marketplace.json`, each with its own `name`, `version`, owner and source.
2. `sdd-engineering` installs the other three automatically as dependencies (`^1.0.0`).
3. No DevDigest-specific content in any plugin.
4. A README that explains how the SDD chain works end to end, and a changelog per plugin.
5. Every plugin passes `scripts/validate-marketplace.mjs` and `claude plugin validate`.

**Non-goals (v1)**
- Not ported: product specs, secrets, cache, DevDigest-specific instructions (slide 2).
- Not ported: agents `test-writer` and `doc-writer`; skills `engineering-insights`, `dependency-checker`, `pr-self-review`, `drizzle-orm-patterns`, `postgresql-table-design` **[my decision]**. They are DevDigest-specific or absent from the slides, and can ship in later minor versions.
- No new behaviour: the port keeps the agents' logic and only removes project coupling.

## 3. Plugin map

```
engineering-paved-path   (skills only)             no dependencies
research-tools           (agent: researcher)       no dependencies
architecture-review      (agent: architecture-reviewer)   no dependencies
sdd-engineering          (4 agents, 3 skills)      depends on the three above, ^1.0.0
```

All four live in `plugins/<name>/` and start at version `1.0.0` **[my decision]**: the `^1.0.0` range on the slide requires it, and `docs/PLUGIN-GUIDELINES.md` allows `1.0.0` once the interface is stable.

### 3.1 `engineering-paved-path`

Supplies reusable, stack-level knowledge. No agents, hooks or scripts.

| Group | Skills |
|---|---|
| Frontend | `react-best-practices`, `next-best-practices`, `react-testing-library`, `frontend-ui-architecture` |
| Backend | `fastify-best-practices` |
| Architecture | `onion-architecture` |
| Security | `security` |
| Cross-cutting | `zod`, `typescript-expert`, `mermaid-diagram` |

Rules for ported skills: keep `SKILL.md` and its `references/` or `rules/` files; keep `evals/` where they exist (`onion-architecture`); drop DevDigest fixtures and paths from skill text; keep a `SOURCES.md` where the original has one, so provenance stays visible.

### 3.2 `research-tools`

Agent `researcher`: read-only, model `sonnet`, tools `Read, Grep, Glob, Bash, WebFetch, WebSearch`. Answers a concrete question from the repository and/or external sources and returns a report with evidence and a "could not find" list.

Generalisation: the repository-research order (`specs/` → `docs/` → `INSIGHTS.md` → source) becomes "curated documents first, then source", and the DevDigest exclusions (`server/clones/**`) are removed.

### 3.3 `architecture-review`

Agent `architecture-reviewer`: read-only reviewer that returns findings with evidence. Its architecture rules come from `engineering-paved-path:onion-architecture` and `engineering-paved-path:frontend-ui-architecture`, loaded through the `Skill` tool. The agent works without them but says so in its report.

### 3.4 `sdd-engineering`

Agents (the chain):

| Agent | Role | Model |
|---|---|---|
| `spec-creator` | Pass 1: questions, gaps, UX proposals. Pass 2: writes one feature spec with EARS acceptance criteria. | `opus` |
| `implementation-planner` | Reviews the spec, asks single vs multi-agent, returns a plan traceable T-n → AC-n → test. | `opus` |
| `implementer` | Executes the plan task by task, runs checks on its own changes, returns a report. | `sonnet` |
| `plan-verifier` | Checks the result against the spec and plan, item by item, with verdicts. | as in source |

Skills:

| Skill | Role |
|---|---|
| `sdd-spec` | Rules: spec template, naming, EARS, contracts, checklists, AC → task → test traceability. |
| `run-plan` | `/sdd-engineering:run-plan`: implementer → architecture-reviewer + plan-verifier → capped fix loop → AC report. |
| `workflow-retro` | `/sdd-engineering:workflow-retro`: manual retrospective of a multi-agent run. `--deep` delegates transcript reading to `researcher`. |

Also shipped: `evals/` for the agents and skills, `README.md`, `CHANGELOG.md`.

Chain:

```
feature + design sources ─► spec-creator (pass 1) ─► researcher ×N + user answers
                         ─► spec-creator (pass 2) ─► spec file
spec ─► implementation-planner (pass 1, 2) ─► plan file
plan ─► implementer ─► architecture-reviewer + plan-verifier ─► fix loop (capped) ─► AC report
                                                                   └─► workflow-retro (optional)
```

Only the main session delegates: no agent has the `Agent` tool.

## 4. Where shared skills live and how they are used

- A plugin cannot read files outside its directory, so shared skills cannot sit in a common folder. They are shipped once, by `engineering-paved-path`, and other plugins call them by namespace: `engineering-paved-path:react-best-practices`.
- `sdd-engineering` declares a dependency on `engineering-paved-path`, so those skills are always present when the chain runs.
- `sdd-engineering` owns only SDD-specific skills (`sdd-spec`, `run-plan`, `workflow-retro`). Agents of `sdd-engineering` may preload them with `skills:` in frontmatter, because they live in the same plugin.
- Skills of **another** plugin are loaded through the `Skill` tool at run time, never through `skills:` preloading **[my decision]**. Reason: namespaced preloading across plugins is not documented, so the safe form is used.
- Source agents preload `onion-architecture`, `frontend-ui-architecture`, `zod`, `mermaid-diagram` through `skills:`. In the port, each preload list becomes an explicit instruction to call `Skill` with the namespaced name.

## 5. Adaptations from the DevDigest source

| Source behaviour | Port |
|---|---|
| Paths such as `server/`, `client/`, `<module>/specs/`, `INSIGHTS.md` | Explicit inputs in the prompt (spec folder, plan path, package list). Default spec folder: `specs/`. |
| `scripts/check-all.sh`, `scripts/check-pkg.sh` | The baseline check command is an input passed by the main session. Agents never assume a script exists. |
| `.claude/skills/<name>/scripts/…` | `${CLAUDE_SKILL_DIR}/scripts/…` (slide 4). |
| `skills:` listing skills from other plugins | `Skill` tool with namespaced name (section 4). |
| Per-agent `hooks:` in frontmatter (`agent-guard.sh`) | **Ignored in plugin agents** (verified in the plugin docs). Move the write guard to `plugins/sdd-engineering/hooks/hooks.json`, command `"${CLAUDE_PLUGIN_ROOT}"/hooks/agent-guard.sh`. The hook is plugin-wide, so the script decides by the calling agent's name taken from the hook input. If the hook input does not carry the agent name, fall back to an instruction-only guard and document the weaker guarantee. |
| `.claude/settings.json`, `.claude/references/skill-routing.md` | `skill-routing.md` becomes a reference file inside `run-plan`/`implementation-planner`, listing `engineering-paved-path:*` skills. Settings are not shipped. |
| `unpack-design.py` | Not ported (design-prototype tooling, DevDigest-specific). `spec-creator` accepts screenshots and text only. **[my decision]** |
| Language | All text in English (validator rejects Cyrillic). |

## 6. Manifests and registration

Each plugin has `.claude-plugin/plugin.json` with `name`, `version`, `description`, `author` and `license`. The marketplace entry has `name`, `source` (`./plugins/<name>`) and `description`, and no version.

```json
{
  "name": "sdd-engineering",
  "version": "1.0.0",
  "description": "Spec Driven Development agents and workflow skills.",
  "author": { "name": "free3et" },
  "license": "MIT",
  "dependencies": [
    { "name": "engineering-paved-path", "version": "^1.0.0" },
    { "name": "research-tools", "version": "^1.0.0" },
    { "name": "architecture-review", "version": "^1.0.0" }
  ]
}
```

Owner is `free3et` (marketplace owner, slide 5). A commit or tag of the marketplace fixes the catalog state (slide 5).

## 7. Releases and versioning

Verified in the Claude Code docs: a dependency range resolves against git tags named **`<plugin>--v<version>`** (double dash). The repository currently uses `<plugin>-v<version>` in `scripts/lib.mjs`, `scripts/release.mjs`, `scripts/rollback.mjs` and `docs/RELEASES.md`. These must change before the first release, or `^1.0.0` cannot resolve to a tag.

Changes:
1. `tagFor` returns `<plugin>--v<version>`; `releasedVersions` and the rollback prefix parsing use the same prefix.
2. `docs/RELEASES.md` and `docs/PLUGIN-GUIDELINES.md` examples are updated.
3. Because the plugins use relative-path sources, the tags live in this marketplace repository. All four plugins are tagged `--v1.0.0` in the first release, so that the `^1.0.0` constraints resolve.

Versions are recorded in three places, each with one purpose:
- `plugin.json`: the authoritative version.
- `plugins/<name>/CHANGELOG.md`: per-plugin release notes (Keep a Changelog, `[Unreleased]` section).
- `plugins/sdd-engineering/README.md` section "Compatibility": a table of `sdd-engineering` version against the dependency versions it was tested with.

## 8. README for `sdd-engineering`

Required sections, in order: what SDD is and why; install (one command, dependencies come automatically); the chain diagram (section 3.4); each agent with input and output; `/run-plan` and `/workflow-retro` usage; which shared skills are used and from where; required inputs per stage; compatibility table; what is not included; link to the changelog.

## 9. Repository layout after this work

```
plugins/
├── engineering-paved-path/   .claude-plugin/plugin.json  skills/<10 skills>/  README.md  CHANGELOG.md
├── research-tools/           .claude-plugin/plugin.json  agents/researcher.md   README.md  CHANGELOG.md
├── architecture-review/      .claude-plugin/plugin.json  agents/architecture-reviewer.md  README.md  CHANGELOG.md
└── sdd-engineering/          .claude-plugin/plugin.json  agents/ (4)  skills/ (3)  hooks/  evals/  README.md  CHANGELOG.md
```

## 10. Acceptance criteria

- AC-1: `node scripts/validate-marketplace.mjs` passes with the four entries.
- AC-2: `claude plugin validate` passes for each plugin directory.
- AC-3: Installing only `sdd-engineering` from a local marketplace checkout also enables the other three plugins.
- AC-4: `grep -ri "devdigest\|server/clones\|\.claude/skills/"` over `plugins/` returns nothing, except in `SOURCES.md` provenance lines.
- AC-5: `researcher` and `architecture-reviewer` have no `Write` or `Edit` in `tools`.
- AC-6: `release.mjs` creates tags in the `<plugin>--v<version>` form, and a dry run of `release.mjs` plus `rollback.mjs` on a test plugin still works.
- AC-7: The README covers every section in section 8.
- AC-8: A manual smoke run of the chain on a small sample feature completes: spec → plan → implementation → verification report.

## 11. Open items to settle during planning

1. Whether the hook input identifies the calling agent (decides how strong the write guard is, section 5).
2. Exact `tools` and `model` for `plan-verifier` and `architecture-reviewer` (copy from source files, not yet read in full).
3. Whether `zod` and `typescript-expert` should stay in `engineering-paved-path` or move out because they are less "paved path" than the rest.
