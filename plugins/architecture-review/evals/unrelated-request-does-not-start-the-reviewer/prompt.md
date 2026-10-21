---
name: unrelated-request-does-not-start-the-reviewer
description: A plain editing request must not dispatch the architecture reviewer.
tags: [smoke, negative, trigger]
plugins: ["../..", "../../../engineering-paved-path"]
runs: 2
max_turns: 25
timeout_seconds: 600
allowed_tools: [Agent, Skill, Read, Grep, Glob]
---

Rewrite this sentence so it is shorter: "We are currently in the process of evaluating the possibility of migrating our services to the new platform."
