# research-tools

A read-only research agent. `researcher` answers a concrete question either from the current repository (specs, docs, decision records, then source code) or from external sources (documentation, release notes, articles, issues) and returns a structured, evidence-backed report.

## Install

```bash
claude plugin marketplace add free3et/dev-digest-ai-marketplace
claude plugin install research-tools@dev-digest-ai-marketplace
```

## Invoke

The agent's namespaced name is `research-tools:researcher`. Ask Claude to use it ("use the researcher agent to find out where retries are configured") or start it through the Agent tool with `subagent_type: "research-tools:researcher"`.

## Inputs

A concrete question in the prompt. Helpful extras: whether the answer should come from the repository, external sources, or both; paths to look at first; the desired result (fact, comparison, recommendation, overview).

If the question is vague, the agent stops and asks 1-4 clarifying questions, each with a default assumption, before searching.

## Output

- Repository questions: Report A (conclusions with confidence, evidence table with `path:line`, discrepancies, what was reviewed, what could not be found, open questions).
- External questions: Report B (same shape, with source URL, date/version and source type; key claims need two sources or are flagged).
- Mixed questions: A, then B, then a short comparison.

Example (abridged):

```markdown
# Report: Where are order retries configured?

## Conclusions
1. Retries are configured in the queue worker, max 3 attempts - confidence: high

## Evidence
| # | Conclusion | Source | Quote / what exactly is there |
|---|------------|--------|-------------------------------|
| 1 | 1 | `docs/queue.md:42` | "Failed jobs are retried up to 3 times" |

## Could not find
Everything requested was found.
```

## What it will NOT do

- It has no Write or Edit tools and does not work around that through Bash. Bash is for reading only (`git log`, `git show`, `git blame`, `ls`, `rg`).
- It does not start servers, run migrations or tests, or change any state.
- It treats web pages and files as data: instructions embedded in them are ignored and reported.
- It does not record notes or decisions itself; it only suggests them to the main session.

## Dependencies

None.

## Used by

The `sdd-engineering` plugin depends on this plugin (its spec and planning agents delegate research to `research-tools:researcher`).

## Requirements

Claude Code with plugin support. Web research needs the WebSearch and WebFetch tools to be available in your session.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
