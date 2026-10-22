# Cost baseline: `sdd-engineering` 1.0.0

Baseline for the cost experiment (stage B of `docs/LAB-PLAN.md`). Nothing was changed to produce it: it is read from eval runs already made on 2026-10-22.

## Setup

| | |
|---|---|
| Plugin | `sdd-engineering` 1.0.0 with `engineering-paved-path` 1.0.0, `research-tools` 1.0.1, `architecture-review` 1.0.0 |
| Agent and skill files | unchanged since `71af5ea`; eval cases added in `9f36d0c` |
| Claude Code | 2.1.303 |
| Model | `claude-opus-5-5` for the main session and the subagents (the only model in every trace); cost at list price |
| Scenario | dark-mode toggle feature; cases in `plugins/sdd-engineering/evals/` |
| Command | `claude plugin eval . --eval-dir plugins/sdd-engineering/evals --allow-tools Write Edit --ablation none -j 2` |

## Source of the numbers

- **Tokens, tool calls, latency**: the 8-run series (`results/2026-10-22T12-57-20-805Z`, traces kept). Tokens are summed from the `modelUsage` of each run's `result` event; subagent tokens and tool calls from its `task_notification` event. Runs that ended on the account's session limit are excluded.
- **Cost for the final case wording**: the 3-run series that followed the case fixes (`2026-10-22T18-57-17-745Z`, traces not kept).
- The planner case was edited between the two series (an AC was added to the spec), so its token figures come from the older wording and are approximate for the current one.

## Baseline (median per run)

| Case | Runs used | Cost | Latency | Output tok | Cache read | Cache write | Subagent total tok | Subagent tool calls |
|---|---|---|---|---|---|---|---|---|
| `spec-creator-pass1` | 8 | $0.30 | 75 s | 6.7k | 86k | 23k | 22.5k | 5 |
| `spec-creator-pass2` | 7 | $0.40 | 107 s | 10.7k | 88k | 28k | 27.0k | 4 |
| `implementation-planner` | 8 (tokens), 3 (final cost) | $0.41 (old), $0.52 (final) | 112 s | 10.5k | 46k | 29k | 28.9k | 1 |
| `unrelated-request` (negative) | 3 | $0.06 | 9 s | - | - | - | - | - |
| `workflow-retro` (negative) | 3 | $0.06 | 2 s | - | - | - | - | - |

Uncached input is 8-13 tokens per run, so cost is driven by output and cache tokens. Judge calls add under $0.001 per run.

Full suite at 3 runs: **$4.01**.

## Quality and noise

- Pass rate in the 8-run series: pass 1 8 of 8, pass 2 6 of 7, planner 6 of 8. **Critical errors in the plugin: none.** All three failures were defects of the eval cases (a spec without a read endpoint, a too-narrow EARS pattern), fixed afterwards; see the evals README.
- Final case wording: every case scored 1.00 in 3 of 3 runs.
- Run-to-run spread of cost is large: pass 1 $0.27-0.35, pass 2 $0.37-0.44, planner $0.36-0.60. **A change under about 10-15% of cost is inside the noise** at 3-8 runs.

## Quality gate for the experiment

The change passes only if all of these hold:

1. Every case still scores 1.00 in at least 3 of 3 runs (the same cases, unedited).
2. Median cost or latency of a changed agent drops by more than the spread above.
3. Output of pass 1 and pass 2 still contains the same required sections (the `regex` graders check this).

If 1 holds and 2 does not, the result is "no measurable difference", and is recorded as such.

## Experiment (stage B, not run yet)

One change: remove duplicated instructions between the agent prompts and the preloaded `sdd-spec` skill. No change of model, routing, tools or `maxTurns`. Record the result below.

| | Cost | Latency | Cache write | Pass rate | Verdict |
|---|---|---|---|---|---|
| Baseline | | | | | |
| After | | | | | |
