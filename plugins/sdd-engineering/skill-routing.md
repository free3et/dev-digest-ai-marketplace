# Skill routing

Single source of truth for which shared skill applies to which kind of change. Agents read it as `${CLAUDE_PLUGIN_ROOT}/skill-routing.md`. It is read by `implementation-planner` (to name skills per step), `implementer` (to load them per step) and the review and verification agents, so a plan never promises a skill the implementer will not apply. Update this file when skills are added or removed; the `skills/` directory of the `engineering-paved-path` plugin is the truth.

## Routing table

Match on the kind of change, not on a path: map it to your own project layout. Skills belong to the `engineering-paved-path` plugin and are loaded through the `Skill` tool with the namespaced name.

| Change type | Skill |
|---|---|
| Backend code: layering, use cases, ports and adapters, dependency direction | `engineering-paved-path:onion-architecture` |
| HTTP / route work: Fastify route, plugin, hook, schema, error handling | `engineering-paved-path:fastify-best-practices` |
| Schema or contract validation: Zod schema, `safeParse`, shared request/response contracts | `engineering-paved-path:zod` |
| Frontend placement: new component, hook, constant, helper, folder | `engineering-paved-path:frontend-ui-architecture` |
| React internals: component internals, hooks, state, performance | `engineering-paved-path:react-best-practices` |
| Next.js app router: RSC boundaries, metadata, route handlers | `engineering-paved-path:next-best-practices` |
| Client tests (React Testing Library) | `engineering-paved-path:react-testing-library` |
| Auth, user input, file handling, secrets, new endpoints | `engineering-paved-path:security` |
| Non-trivial type-level work | `engineering-paved-path:typescript-expert` |
| Diagrams in docs or specs | `engineering-paved-path:mermaid-diagram` |

If the project does not use the technology a row names, skip the row. A skill that is not installed is not an error: say so in the plan or report and follow the project's own conventions.

## Loading rule

Shared skills belong to another plugin (`engineering-paved-path`), so they are **never** preloaded via an agent's `skills:` frontmatter. Every skill in the table is loaded **on demand** through the `Skill` tool, at most once per run: the `implementer` loads what a task needs just before that task; the `implementation-planner` names skills per task from this table and loads one only when a task's design depends on it; the reviewers load the ones that match the diff. Preloading would put the full `SKILL.md` into every turn of the agent and multiply that cost by every parallel implementer, so the table, not a preload list, is what keeps plan and implementation consistent.

The one exception is `sdd-spec`: it lives in this plugin, so agents that need the spec rules may preload it with `skills:`.

**Skills per agent.**

| Agent | Preloaded (`skills:`) | Loaded on demand |
|---|---|---|
| `sdd-engineering:spec-creator` | `sdd-spec` | `engineering-paved-path:mermaid-diagram` when a diagram is needed |
| `sdd-engineering:implementation-planner` | `sdd-spec` | skills from the routing table, only when a task's design depends on them |
| `sdd-engineering:implementer` | none | skills from the routing table, per task |
| `sdd-engineering:plan-verifier` | `sdd-spec` | skills from the routing table, only to judge an item against them |
| `architecture-review:architecture-reviewer` | none (other plugin) | `onion-architecture`, `frontend-ui-architecture`, `zod` and others by what the diff touches |

Changing one of these lists means changing this table in the same edit.

**Sync rule.** `implementation-planner` and `implementer` use this routing table as their only skill contract. Neither agent keeps a private skill list. `implementation-planner` preloads `sdd-spec` (spec rules: review checklist, AC to task to test traceability); it governs reading a spec, not writing code. The `implementer` gets AC IDs through the plan, so it does not need it.

## Not routed

- `code-review`, `security-review`, `simplify`: review roles, not implementation. Architecture review is done by `architecture-review:architecture-reviewer`; checking work against a plan by `sdd-engineering:plan-verifier`.

## Commands per project

Commands are project-specific, so this plugin does not hard-code them. The **main session** decides them once and passes three commands into every agent prompt:

- **baseline check command**: run once before implementers start and after each wave (typecheck plus fast tests, or whatever the project treats as "green");
- **per-step check command**: the cheapest check that covers the files a step changed (typecheck plus related tests);
- **test command**: the command that runs the project's tests (the full suite, and how to run one file).

Agents use the commands from their prompt and do not guess. If a prompt carries none, the agent asks the main session or looks in the project's own instructions (CLAUDE.md or equivalent) and `package.json` / build files, and records which command it used.

Examples for common stacks:

| Stack | Baseline check | Per-step check | Tests |
|---|---|---|---|
| npm | `npm run typecheck && npm test` | `npm run typecheck` | `npm test`; one file: `npx vitest run <file>` |
| pnpm | `pnpm typecheck && pnpm test` | `pnpm typecheck` | `pnpm test`; one file: `pnpm exec vitest run <file>` |
| cargo | `cargo check && cargo test` | `cargo check` | `cargo test`; one test: `cargo test <name>` |
| go | `go vet ./... && go test ./...` | `go vet ./<pkg>/...` | `go test ./...`; one package: `go test ./<pkg>` |

Check `package.json` (or the equivalent) before relying on a script such as lint: it may not exist.

## Known traps a plan must account for

- Contract changes go to the shared contracts package (if the project has one) first, then to consumers. If a consumer holds a hand-copied version, add an explicit sync step.
- Importing a value (not a type) from a shared package in client code can break a framework production build; run the build when a task touches such imports.
- Migrations are never invented or rewritten. Before trusting a generator, check the real schema against the database; the local database may have drifted, and generators can block on interactive prompts.
- A `tools` allowlist does not make an agent read-only if it has Bash; the plugin's `hooks/agent-guard.sh` guards the hooked agents, and `architecture-reviewer` simply has no Bash.
- Never touch generated or vendored directories, migrations or lockfiles unless the plan says so explicitly.
