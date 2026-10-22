# Evals for `sdd-engineering`

Behavior evals for one fixed scenario: "the user asks for a spec and a plan for a small feature". They run with the built-in `claude plugin eval` command.

## Cases

| Case | Kind | What it proves |
|---|---|---|
| `spec-creator-pass1-asks-questions-and-writes-nothing` | positive | Pass 1 returns an analysis with a `## Blocking questions` section and calls no `Write` |
| `spec-creator-pass2-writes-one-ears-spec` | positive | Pass 2 writes exactly one `.md` under `specs/`, with `AC-1` in EARS form, `Status: draft` and (1.1.0) `Mandatory coverage: complete` |
| `spec-creator-reports-incomplete-coverage-for-an-undecided-goal` | positive (1.1.0) | A goal nobody decided gets no invented AC: the report says `Mandatory coverage: incomplete` |
| `implementation-planner-maps-every-task-to-an-ac` | positive | Pass 2 returns an Implementation Plan with a coverage matrix; AC-1 to AC-5 each have a task and a test; the plan adds no AC |
| `unrelated-request-does-not-start-the-sdd-workflow` | negative (trigger) | A plain editing request dispatches no SDD agent |
| `workflow-retro-does-not-start-without-a-request` | negative (trigger) | `workflow-retro` is not started unless asked |

All four plugins are loaded in every case. The feature (a dark-mode toggle) is invented and part of each prompt, so no repository files are needed.

## Run

From the **repository root**:

```bash
claude plugin eval . \
  --eval-dir plugins/sdd-engineering/evals \
  --allow-tools Write Edit \
  --ablation none --trust-plugin \
  --runs 3 -j 2 --max-cost-usd 5 --no-publish
```

- `--allow-tools Write Edit` is required. Without it the `Write` is withheld, `writes-nothing` passes vacuously and the pass 2 case cannot write its spec.
- `--ablation none` and `-j 2`: see `plugins/architecture-review/evals/README.md`.
- Use `--case "<glob>"` to run one case.

## Cost

Measured at list price: `spec-creator` about $0.27-0.44 per run, `implementation-planner` about $0.38-0.60, a negative case $0.06. A full suite at 3 runs is about $4. Both agents run on `opus`.

## Known limits and history

- **1.1.0 evidence.** On the 1.0.0 agent files the two new checks fail (`mandatory-coverage-complete` and `reports-incomplete`, 1 run each); on 1.1.0 all three `spec-creator` cases scored 1.00 in 3 of 3 runs and the planner case 1.00 in 2 of 2.

- Stability so far: `spec-creator-pass1` 11 of 11 runs; the other cases 3 of 3 in their final form. The target of 8 clean runs per case was **not** reached, because an 8-run series hit the account's session limit (17 runs scored 0 with an API error and say nothing about the plugin).
- Two failures of the first version were test bugs, found by reading traces:
  - The planner case spec had no way for the client to read the stored theme. The planner correctly marked AC-4 blocked rather than invent an AC, so the judge failed it in 2 of 8 runs. The spec now has AC-5 (`GET /preferences`).
  - `ears-criteria` accepted only `The system SHALL`; the agent wrote a valid `The settings page SHALL ...` once. The pattern now follows the EARS forms in `sdd-spec` §4.
- The pass 2 case checks the `Write` call and the spec text in the trace. It does not read the written file.
- Not wired into CI: needs credentials and costs money. Run before releasing a change to these agents or to `sdd-spec`.
