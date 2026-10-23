# Cost baseline: `sdd-engineering` 1.0.0

Baseline for the cost experiment on `sdd-engineering`. Nothing was changed to produce it: it is read from eval runs already made on 2026-10-22.

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

## Experiment: remove duplicated instructions

One change, no change of model, routing, tools or `maxTurns`: four phrases in `implementation-planner.md` and `spec-creator.md` that restated `sdd-spec` (spec status, traceability rules, the AC `Source`/`Verify` check) now point to the section instead. About 150 words removed from roughly 3,500 per agent prompt.

Same cases, 3 runs each, Claude Code 2.1.303, runs on 2026-10-22 after the baseline. Baseline column is the 3-run series with the same case wording; the 8-run series is shown where it differs.

| Case | Cost, before (median) | Cost, after (median) | Range before | Range after | Latency before / after | Cache write after | Pass rate |
|---|---|---|---|---|---|---|---|
| `spec-creator-pass1` | $0.31 (8-run: $0.30) | $0.30 | 0.27-0.34 | 0.28-0.33 | 71 s / 72 s | 22.7k (before 23.4k) | 3 of 3 before and after |
| `spec-creator-pass2` | $0.40 (8-run: $0.41) | $0.43 | 0.37-0.44 | 0.36-0.44 | 98 s / 112 s | 29.5k (before 28.2k) | 3 of 3 before and after |
| `implementation-planner` | $0.52 (8-run, older spec: $0.41) | $0.44 | 0.38-0.60 | 0.38-0.45 | 127 s / 103 s | 35.0k (before 28.7k, older spec) | 3 of 3 before and after |

### Cost per successful workflow

A workflow here is the chain pass 1, pass 2, plan. A run counts as successful when the case scores 1.00. Cost per successful workflow is the sum of the per-case median costs divided by the success rate of the final-wording cases (100% before and after).

| | Before | After |
|---|---|---|
| Sum of medians | $1.23 | $1.17 |
| Success rate | 100% (3 of 3 each) | 100% (3 of 3 each) |
| **Cost per successful workflow** | **$1.23** | **$1.17** |

Using the 8-run medians as "before" instead gives $1.12, which is below "after". The direction depends on which baseline is chosen.

### Verdict

**No measurable difference.** The quality gate (rule 1) holds: every case is 1.00 in 3 of 3 runs. The cost gate (rule 2) fails: the change in the sum of medians is about 5% and it flips sign with the 8-run baseline; every per-case difference lies inside the run-to-run spread (10-25%). The planner shows the largest drop (-17%), but its ranges overlap and the 8-run baseline for it ($0.41) is already lower than the "after" value.

Why this is unsurprising: uncached input is under 15 tokens per run, and cost is driven by about 6-12k output tokens and 23-35k cache-write tokens on `opus`. Removing 150 words changes cache writes by a few hundred tokens. A real saving would need shorter agent output or a smaller preloaded context, which changes behavior and is a separate experiment.

The wording change is kept: it is harmless and removes duplicated rules, but it is not a cost optimisation. 3 runs per case cannot detect a drop smaller than about 15%.
