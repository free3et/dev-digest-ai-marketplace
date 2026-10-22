---
name: implementation-planner-maps-every-task-to-an-ac
description: Pass 2 of implementation-planner returns a plan in which every AC is covered by a task and a test.
tags: [positive]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 30
timeout_seconds: 1200
allowed_tools: [Agent, Skill, Read, Grep, Glob]
---

Use the implementation-planner agent, pass 2, mode single-agent, to produce the Implementation Plan for the approved spec below. All questions are answered; there is no code to inspect, so plan against the spec alone. Report the plan.

Spec (SPEC-2026-01-10-dark-mode, Status: approved):

- Goal G-1: a signed-in user can switch the notes app between light and dark theme in the settings page.
- Goal G-2: the choice persists across sessions.
- **AC-1** — WHEN a signed-in user selects "Dark" on the settings page, the client SHALL send `PUT /preferences` with `{ "theme": "dark" }`.
  - Source: G-1
  - Verify: component (RTL) — the request body
- **AC-2** — WHEN the server receives a valid `PUT /preferences`, it SHALL store the theme for that user and respond 200.
  - Source: G-2
  - Verify: integration (Fastify inject) — stored value read back
- **AC-3** — IF `PUT /preferences` carries a theme other than "light" or "dark", THEN the server SHALL respond 400 and store nothing.
  - Source: G-2
  - Verify: integration — status 400, stored value unchanged
- **AC-4** — WHEN the app loads for a signed-in user, the client SHALL apply the stored theme before the first paint.
  - Source: G-2
  - Verify: component (RTL) — root element carries the theme class
- **AC-5** — WHEN a signed-in user requests `GET /preferences`, the server SHALL respond 200 with `{ "theme": "light" | "dark" }`, defaulting to "light" when nothing is stored.
  - Source: G-2
  - Verify: integration (Fastify inject) — body and default
- Packages: `client/`, `server/`. Preferences live in `server/src/preferences.ts`.
