---
name: spec-creator-reports-incomplete-coverage-for-an-undecided-goal
description: A goal nobody has decided must not be silently dropped; the spec is reported as incomplete.
tags: [positive]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 40
timeout_seconds: 1200
allowed_tools: [Agent, Skill, Read, Grep, Glob, Write, Edit]
---

Use the spec-creator agent, pass 2, to write the feature spec. Target location: the top-level `specs/` folder. Report its spec report.

Feature: a "dark mode" toggle in the settings page of a small notes web app (React client, Fastify server). The choice must persist per user across sessions. Project notes: monorepo with `client/` and `server/`; no existing specs; user preferences are stored in `server/src/preferences.ts`.

Product goals: G-1, the theme choice persists per user across sessions. G-2, the settings page must feel fast. The product owner has not decided what "fast" means: no number, no behavior. Do not guess it.

Answers to the pass 1 questions: the toggle has two states, light and dark (no "system" option). The choice is stored on the server per signed-in user and applied on page load. Signed-out users are out of scope. No UX proposals are accepted. Nothing else is open except G-2.
