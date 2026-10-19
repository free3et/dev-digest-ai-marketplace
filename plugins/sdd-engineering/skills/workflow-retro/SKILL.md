---
name: workflow-retro
description: "Use when the user explicitly asks for a retrospective on a multi-agent workflow run ('run a retro', 'how did that workflow go', 'retro this run', /sdd-engineering:workflow-retro), right after a run such as /sdd-engineering:run-plan or a spec-creator → implementation-planner back-and-forth. Produces an agent-orchestration retro: total tokens, agent order, per-phase breakdown, handoff efficiency, and concrete recommendations. NOT for code lessons and NOT for reviewing code quality, architecture, or security (that is architecture-review:architecture-reviewer, /security-review, /code-review). Never runs automatically."
when_to_use: "The user says 'run a retro', 'how did that workflow go', 'retro this run', or invokes /sdd-engineering:workflow-retro, right after a multi-agent run. Never runs automatically."
version: 1.3.0
user-invocable: true
disable-model-invocation: true
---

# Workflow Retro

Produces a retrospective on how a multi-agent workflow run went —
orchestration performance (tokens, agent order, handoff efficiency,
recommendations) — not code lessons. The pipeline it usually reports on is
`spec-creator` → `implementation-planner` → `implementer` → `architecture-reviewer`
+ `plan-verifier`, orchestrated by `/sdd-engineering:run-plan`.

## Configuration

- **Ledger folder** — default `docs/retro/ledger/`. If the user (or the project's
  own instructions) names another folder, use it everywhere this file says
  "the ledger folder". Create it if it does not exist.

Design rationale: [README.md](README.md).

## Step 0 — confirm manual invocation and scope

This skill only runs when explicitly invoked — never automatically, never as
an "at the end of every session" habit, regardless of how the run went.

Name the workflow run being retro'd: which agents ran, in roughly what
order, and what artifact (if any) it produced. State the mode: base, or
`--deep` (Step 6).

**Refuse to infer a run from a conversation that dispatched no agents.** If
the current conversation's history contains no `Agent`/`SendMessage` calls to
retro, say so and stop — do not emit an empty or fabricated retrospective.

## Step 1 — reconstruct the timeline (in-context)

Walk the orchestrator's own history of `Agent`/`SendMessage` calls, in the
order they happened. For each entry, record:

- **Agent name** (e.g. `sdd-engineering:implementer`, `sdd-engineering:plan-verifier`).
- **Dispatch kind** — `Agent` (fresh dispatch, cold context) or `SendMessage`
  (continuation of an already-dispatched instance).
- **One-line purpose** — what this dispatch was for.
- **Usage** — `subagent_tokens`, `tool_uses`, `duration_ms` from the
  dispatch's reported `usage` block. If a dispatch has no `usage` reported,
  record it as `not reported` — never estimate (see "must not do" below).
- **Outcome** — finished artifact (name it), stop-and-ask
  (`AskUserQuestion` round), or gate verdict (e.g. `PASS`/`INCOMPLETE`).

This is the raw material every later step reads from. Do not skip a dispatch
because it looks minor — a short `SendMessage` continuation still counts as
a timeline entry.

## Step 2 — totals and per-phase breakdown

Sum `subagent_tokens` across the whole run for a session total. Group
dispatches into phases (e.g. one phase per agent, or per named stage in the
pipeline) and produce a per-phase token/tool-use/duration table.

**Cost per output.** For each phase add one ratio next to its tokens:
`subagent_tokens` per finished artifact unit — spec AC, plan task, changed
file, or verifier row, whichever the phase produced (count it from the
artifact; if none can be counted, write `n/a`). It shows where an agent is
expensive for a small result.

**Trend.** Before writing, read the totals of up to the **five** most recent
entries in the ledger folder (by filename date) and add a table: date, agent
count, session tokens. A ledger entry that does not state a total is
`not reported` — never reconstruct it.

Flag any phase that consumed roughly **30% or more of the session total**,
or whose token spend looks disproportionate to the size of its output — call
this out explicitly, it's usually the single most decision-changing number
in the report.

## Step 3 — signals

Derive these from the Step 1 timeline, each reported as a **heuristic**, not
a certainty, with the evidence cited:

1. **Handoff efficiency.** Flag a fresh `Agent` dispatch to an agent that had
   already run earlier in the same timeline, where a `SendMessage`
   continuation to the existing instance would have resumed its context
   instead. This measures compliance against the norm this plugin already
   states in
   [`../run-plan/SKILL.md`](../run-plan/SKILL.md) (fix-loop rounds go to the
   same implementer through `SendMessage`, so its context is kept). Cite the
   two call sites (the earlier dispatch and the later fresh one) as evidence;
   never assert this as certain — the orchestrator's own transcript can be
   ambiguous about whether a fresh dispatch was actually warranted (e.g. a
   genuinely new task for the same agent type).
2. **Clarification rounds per agent.** A plain count of stop-and-resume /
   `AskUserQuestion` round-trips before each agent produced a finished
   artifact or verdict.
3. **Artifact rework/thrash (transcript-only form).** How many times a given
   output path (e.g. a specific file) appears as written or edited across
   reports in *this* session. This is the cheap, transcript-only signal;
   reconstructing *why* a decision was reversed needs git history or raw
   transcripts and belongs to deep mode (Step 6), not here.
4. **Duplicated or re-derived information.** The same file read, or the same
   fact established, by two different agents in this timeline — a sign a
   handoff should have carried more context forward.
5. **Misses.** Something a later phase had to discover for itself that an
   earlier phase should already have surfaced or handed off.
6. **Friction and ease per agent.** For each agent, one line each: what was
   hard (blocked, repeated a question, hit a guard or permission error, needed
   a re-dispatch) and what went smoothly (finished in one pass, no clarification
   needed). Cite the dispatch; if the transcript shows neither, write
   `no signal` rather than guessing. These lines are what a future agent prompt
   or hook change should be based on.
7. **Guard and permission blocks.** A plain count, per agent, of tool calls
   refused by a hook (e.g. the plugin's `agent-guard.sh`) or a permission prompt, quoting the
   refusal text in a few words and the command class that triggered it. Repeated
   refusals of a legitimate command point at a guard or allowlist that needs a
   fix.

## Step 4 — recommendations

Every recommendation is concrete, never generic advice, enforced by
construction: it must carry a **`Target`** field — an exact file path (e.g.
`skills/run-plan/SKILL.md` of the plugin, or a project file) — the concrete change proposed, and
the Step 3 signal that justifies it. No `Target`, not a recommendation. Check that the `Target` path exists (`ls`) before writing it;
a path that does not exist is either a typo or a file to create — say which. Pass
bar and examples: [examples.md](examples.md).

**Before writing**, list the ledger folder and read the Recommendations
section of the **two most recent** existing entries (by filename date, most
recent first). If a recommendation here repeats one already made in either
of those two, mark it `RECURRING (Nth run)` instead of restating it as new.

## Step 5 — write the ledger and report to chat

`Write` the ledger file to
`<ledger folder>/YYYY-MM-DD-<slug>.md` (today's date, a short slug for the
run being retro'd). **Never overwrite an existing path** — if a file at that
exact path already exists, disambiguate with `-2`, `-3`, etc. Never `Edit` an
existing ledger entry.

Then show a short summary in the conversation: session totals, agent order,
and the top 2-3 recommendations. Both outputs are required — the ledger file
alone is not sufficient, and neither is a chat-only summary.

## Step 6 — deep mode (`--deep`, optional)

Same steps as above, plus: for each transcript worth a closer look, dispatch
one `research-tools:researcher` subagent (read-only) per transcript, instructed
to extract fields with `Bash` (`jq`/`grep`/`wc`) — never to `Read` the JSONL
file whole — and to return a bounded digest under a stated line budget. **The
orchestrator's own context must never read one of these transcript files
directly** — that dispatch, and its bounded-digest contract, is the only
sanctioned way this skill touches raw transcript content.

The transcript path the `Agent` tool itself reports is the primary source.
As a fallback, Claude Code stores session transcripts as JSONL files under
`~/.claude/projects/<project-slug>/` (the slug is the project's working
directory path with separators replaced by dashes; subagent transcripts live
in a subfolder of the session). List that folder, pick the files whose
modification time matches the run, and hand the paths to the researcher.
The location is machine-local and reading it may prompt for permission;
treat it as best-effort only. If no usable transcript path is available,
say so explicitly and degrade to base mode rather than fail the run.

## What this skill must not do

- Never run automatically, and never suggest or configure an automatic
  trigger — this skill is manual-only, stated twice by the skill's authors.
- Never write project knowledge files (docs, ADRs, lessons-learned notes) —
  this skill only writes ledger entries.
- Never write to `specs/`, `<module>/specs/` or a `<spec>.plan.md` — this
  skill produces a third, distinct artifact class (a retro ledger entry),
  never a spec or a plan.
- Never review code quality, architecture, or security — that is
  `architecture-review:architecture-reviewer`, `/security-review`, `/code-review`, none of which
  this skill substitutes for.
- Never invent token numbers. A phase or dispatch with no reported `usage`
  is marked `not reported`, never estimated or guessed.
- Never paste raw transcript text, prompts, secrets, or file contents into
  the ledger — numbers, short quotes, and file paths only.
- Never overwrite an existing ledger file — disambiguate the filename
  instead.
