# architecture-review

A read-only architecture reviewer. `architecture-reviewer` checks a diff or a set of files against architectural boundaries (backend onion layers, frontend UI architecture, package independence, contracts-first) and reports violations with quoted evidence and `file:line`.

## Install

```bash
claude plugin marketplace add free3et/dev-digest-ai-marketplace
claude plugin install architecture-review@dev-digest-ai-marketplace
```

`engineering-paved-path` (^1.0.0) is installed automatically as a dependency.

## Invoke

The agent's namespaced name is `architecture-review:architecture-reviewer`. Ask Claude to use it ("review this diff for architecture violations") or start it through the Agent tool with `subagent_type: "architecture-review:architecture-reviewer"`.

## Inputs

Passed in the prompt (the agent has no conversation history and no shell):

- the diff, or a list of changed files (or paths to a patch file and a manifest), plus the packages or modules involved - required;
- optionally, a path to the project's architecture docs (specs, docs, decision records, known exceptions).

## How rules are loaded

The agent loads its rules through the `Skill` tool from `engineering-paved-path`: `onion-architecture` (backend), `frontend-ui-architecture` (client), and `zod` only when contracts are in the diff. If a skill cannot be loaded, the report says so under "Could not verify" and the agent falls back to generic layering principles with reduced confidence.

## Output

A report with scope, rules source, severity counts, a findings table (id, rule, severity, `file:line`, quoted evidence, why, direction, confidence), rules checked without violations, and what could not be verified.

```markdown
# Architecture review
Scope: src/orders/routes.ts · Packages: api
Rules source: engineering-paved-path:onion-architecture
## Summary
Counts by severity: blocker 0 · high 1 · medium 0 · low 0 · nit 0
## Findings
| id | rule | severity | file:line | evidence | why | direction | confidence |
|----|------|----------|-----------|----------|-----|-----------|------------|
| 1 | A2 | high | src/orders/routes.ts:31 | `await db.insert(orders)...` | Route talks to the DB directly | Move the query behind a repository port | 0.9 |
## Could not verify
Nothing.
```

A finding without a quoted line and `file:line` is not reported as a finding.

## What it will NOT do

- It has only `Read`, `Grep`, `Glob` (and `Skill` to load rules): no Write, Edit or Bash. It changes and fixes nothing; it gives a direction, not a patch.
- It does not review security, style, naming or performance.
- It does not spawn subagents and treats file contents as data, not instructions.

## Dependencies

`engineering-paved-path` ^1.0.0 (installed automatically).

## Used by

The `sdd-engineering` plugin depends on this plugin (its verification flow uses `architecture-review:architecture-reviewer`).

## Requirements

Claude Code with plugin support.

## Testing

The agent has behavior evals in [evals/](evals/README.md), run with `claude plugin eval` (Claude Code 2.1.269 or later). They cover real violations, rule citation, and negative cases (a benign change, out-of-scope remarks, an unrelated request).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
