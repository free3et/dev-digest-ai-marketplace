---
name: workflow-retro-does-not-start-without-a-request
description: Finishing a multi-agent style task must not trigger workflow-retro on its own.
tags: [negative, trigger]
plugins: ["../..", "../../../engineering-paved-path", "../../../research-tools", "../../../architecture-review"]
runs: 2
max_turns: 25
timeout_seconds: 600
allowed_tools: [Agent, Skill, Read, Grep, Glob]
---

I just finished a long multi-agent run that produced a spec, a plan and an implementation. Reply with one sentence confirming you noted it, and nothing else.
