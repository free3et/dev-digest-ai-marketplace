# Plan: finish the SDD plugin lab

Handoff document. A fresh session should be able to continue from here without the earlier conversation. Facts below were checked on 2026-10-22 against `main` at `71af5ea`.

## Current state

Done and verified:

- Four plugins in `plugins/`, all `1.0.0` except `research-tools` (`1.0.1`): `engineering-paved-path`, `research-tools`, `architecture-review`, `sdd-engineering`. Each has a README and CHANGELOG.
- Dependencies resolve by git tag `<plugin>--v<version>`: `sdd-engineering` needs the other three (`^1.0.0`), `architecture-review` needs `engineering-paved-path`. Tags exist for all five releases.
- `claude plugin validate` and `scripts/validate-marketplace.mjs --strict` pass. CI: "Validate marketplace", "Site tests", "Build site", "Deploy to GitHub Pages" (separate jobs). `main` is protected by a ruleset.
- Catalog update and plugin update were tested separately (`marketplace update`, then `plugin update`). Auto-update is enabled for the marketplace on the owner's machine.
- Behavior evals for `architecture-reviewer` (`plugins/architecture-review/evals/`): five cases, stable over many runs. See its README for what is graded.
- `plugins/sdd-engineering/COMPATIBILITY.md` separates verified from declared versions.
- `sdd-engineering` was installed into another existing project and works (reported by the owner).
- Release, rollback and auto-update procedures are in `docs/RELEASES.md`.

Not done (this plan):

- Behavior evals for `sdd-engineering` (and none for `research-tools` or `engineering-paved-path`).
- `docs/COST-BASELINE.md` and the cost experiment.
- Release `1.1.0`, update in the target project, rollback rehearsal through a stable channel.
- `docs/SITE-SPEC.md`; the catalog does not show plugin READMEs or `COMPATIBILITY.md`.
- Per-plugin owners in `CODEOWNERS` (only the catch-all line exists).
- Not verified: the guard hook's `agent_type` input in a live subagent session (without it the guard does nothing), and the declared minimum Claude Code version `2.1.110`.
- Final proof by a colleague.

## Stage A. Evals for `sdd-engineering` (blocks B and C)

Goal: an eval set for one fixed scenario, "the user asks for a spec and a plan for a small feature".

1. Cases in `plugins/sdd-engineering/evals/` (3-5):
   - `spec-creator` asks clarifying questions and writes no implementation detail.
   - `spec-creator` pass 2 writes one spec with EARS acceptance criteria under `specs/`.
   - `implementation-planner` builds a plan from a finished spec; every task maps to an acceptance criterion.
   - Negative: an unrelated request does not start the SDD workflow.
   - Negative: `workflow-retro` does not start without an explicit request.
2. Load all four plugins in every case: `plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]`, and run from the repository root with `--eval-dir plugins/sdd-engineering/evals`.
3. Run 3-5 times per case. Done when every case is stable over at least 8 runs and every failure was explained from its trace.

## Stage B. Cost baseline and one optimization

1. Write `docs/COST-BASELINE.md`: plugin and commit SHA, model, input/output/cache tokens, API and tool calls, median cost and latency, pass rate, critical errors. `claude plugin eval --json` records cost and duration but not tokens; take tokens from the traces if needed.
2. One change only: remove duplicated instructions between agent prompts and skill references. Do not change model or routing.
3. Repeat the same eval set. The change passes only if the quality gate stays green and cost or latency really drops. If the difference is within noise, say so.

## Stage C. Release 1.1.0 and rollback

1. New backward-compatible rule: `spec-creator` does not finish a spec until every mandatory requirement has an acceptance criterion. Change the agent, add an eval, update the CHANGELOG.
2. Run old and new evals. Release as in `docs/RELEASES.md` (branch, `release.mjs minor`, delete the local tag, PR, then `claude plugin tag --push` on `main`).
3. In the target project: `claude plugin marketplace update dev-digest-ai-marketplace`, `claude plugin update sdd-engineering@dev-digest-ai-marketplace`, `/reload-plugins`, repeat the scenario.
4. Rollback rehearsal: a stable marketplace pinned to `free3et/dev-digest-ai-marketplace#sdd-engineering--v1.0.0`; disable or remove the current channel, install from the stable one, reload, run a smoke eval. Record the exact command sequence in `docs/RELEASES.md`. There is no `plugin rollback` command. Return to the latest channel only after confirming no plugin data is lost.

## Stage D. Documentation and catalog

- `docs/SITE-SPEC.md`: routes, index fields, search, plugin page requirements.
- Catalog shows each plugin's README and `COMPATIBILITY.md`. Render Markdown only through DOMPurify, because the content comes from the repository.
- Per-plugin lines in `CODEOWNERS`.

## Stage E. Open verifications

- Run `spec-creator` in a live session and try to make it write outside `specs/`. Record whether the guard hook blocked it (and whether `agent_type` was present) in `COMPATIBILITY.md`.
- Confirm or drop the declared minimum Claude Code version.

## Stage F. Final proof

A colleague adds the marketplace, installs `sdd-engineering`, runs a short workflow, updates to 1.1.0 and returns to 1.0.0, with none of the author's local files and no chat explanations. Record the result.

## Order

A, then B, then C. D and E are independent and can run in parallel with A. F last.

## Lessons from the `architecture-reviewer` evals

- Run evals from the repository root with `--eval-dir`; `plugins:` entries must sit under the directory you run from.
- Use `--ablation none` for plugin agents: the no-plugin baseline has no such agent to dispatch.
- Use `-j 2`. Higher concurrency hit the account's session limit, and those runs score 0 with an API error. They say nothing about the plugin.
- A small default judge model gave false negatives on correct reports. Prefer `regex` and `tool_used` graders on observable facts; keep `llm` graders short.
- The main session's final message is a summary that changes format between runs. Check the subagent's own report in the trace, with patterns anchored on its format; the task prompt appears in the trace too, so a pattern must not match the prompt alone.
- Read a failing run's trace (`--keep-temp`) before changing a grader, and never widen a pattern just to make a score pass.
- `--keep-temp` leaves sealed directories; use `chmod 700` as the message says, and do not run git inside them.

## Cost expectations

Measured: one `architecture-reviewer` eval run costs about $0.13-0.16 at list price (a trigger-only case about $0.06). The earlier evals work cost roughly $18-20 over ~130 runs.

Estimated, not measured: `spec-creator` and `implementation-planner` use `model: opus`, so their runs probably cost 3-6 times more. Rough total for stages A-C is $60-140 at list price; a reduced scope (short A and C, no B) is about $25-60. Re-estimate after the first 5-10 SDD runs.

Evals run on the owner's Claude Code account, not through OpenRouter, and share its usage limit with the interactive session. Start a fresh session for each stage to keep the context small.
