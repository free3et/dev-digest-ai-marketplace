# Evals for `architecture-reviewer`

Behavior evals for the agent, run with the built-in `claude plugin eval` command. They check that the composition works: the agent is dispatched, it loads its rules from `engineering-paved-path`, it reports real violations with a documented rule, severity and quoted evidence, and it stays silent when it should.

## Cases

| Case | Kind | What it proves |
|---|---|---|
| `flags-layering-violations` | positive | A domain file importing a framework type and a service constructing its own repository are both reported, with rule identifiers, quoted lines, a severity and a FAIL verdict |
| `cites-the-exact-rule-for-engine-violations` | positive | Each finding names its exact documented rule (`engine-no-io`, `validate-before-emit`) instead of describing it in prose |
| `benign-rename-has-no-findings` | negative | A pure local-variable rename produces no violation and a PASS verdict |
| `out-of-scope-issues-are-not-reported` | negative | Naming, logging and missing tests are out of scope and are not reported as architecture findings |
| `unrelated-request-does-not-start-the-reviewer` | negative (trigger) | A plain editing request does not dispatch the reviewer |

The cases are generic: the project's architecture notes are part of each prompt, so no repository files are needed. Rule names and the order domain are invented for the eval.

## Run

Run from the **repository root**, because each case loads two plugins (`architecture-review` and the `engineering-paved-path` it depends on) and `claude plugin eval` only loads plugins that sit under the directory you run it from:

```bash
claude plugin eval . \
  --eval-dir plugins/architecture-review/evals \
  --ablation none \
  --trust-plugin \
  --runs 3 \
  --max-cost-usd 6 \
  --no-publish
```

- `--ablation none`: the no-plugin baseline arm cannot work for a plugin's agents, because the baseline session has no `architecture-review:architecture-reviewer` to dispatch. The with/without delta is meaningless here.
- `--trust-plugin`: only for plugins you wrote or reviewed.
- Use `--case "<glob>"` to run one case, and add `--keep-temp` to keep a run's trace for debugging.
- Pin `--model` and `--judge-model` when comparing runs over time.

Requirements: Claude Code 2.1.269 or later and git 2.31 or later. Results are written to `evals/results/` (ignored by git).

## Cost and limits

A run costs about $0.10-0.20 at list price (the agent runs as a subagent, plus up to three judge calls for each `llm` grader). The full suite at 3 runs per case is 14 agent runs, about $2-3. Runs share your account's rate limit: with high `-j` values you can hit a session limit, and those runs end as `API error` with score 0. Such runs say nothing about the plugin; rerun them.

## Graders and known limits

- Positive cases use deterministic `regex` graders on observable facts (rule identifiers, verbatim quoted lines, a severity word, an uppercase `FAIL`). An earlier version used one `llm` grader for "report quality"; it gave false negatives on correct reports (a small judge model penalised the format of the main session's summary), so it was replaced.
- The grader sees the main session's final message, which summarises the subagent's report. Checks therefore look for facts, not for the agent's own layout.
- Negative cases use short `llm` graders because "no violation reported" is a semantic judgement. These have been the least stable graders; read a failing run's trace before changing a rubric, and do not widen a rubric to make a score pass.
- The cases are not wired into CI: they need credentials and cost money. Run them before releasing a change to the agent or to `engineering-paved-path:onion-architecture`.
