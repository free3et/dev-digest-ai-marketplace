---
name: spec-creator-pass1-asks-questions-and-writes-nothing
description: Pass 1 of spec-creator returns an analysis with blocking questions and writes no file.
tags: [smoke, positive]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 3
max_turns: 30
timeout_seconds: 900
allowed_tools: [Agent, Skill, Read, Grep, Glob, Write, Edit]
---

Use the spec-creator agent, pass 1, to analyse this feature. Report its analysis.

Feature: a "dark mode" toggle in the settings page of a small notes web app (React client, Fastify server). The choice must persist per user across sessions. Project notes: monorepo with `client/` and `server/`; no existing specs; user preferences are stored in `server/src/preferences.ts`.
