---
name: benign-rename-has-no-findings
description: A pure local-variable rename violates no rule; the reviewer must stay silent and pass the gate.
tags: [smoke, negative]
plugins: ["../..", "../../../engineering-paved-path"]
runs: 3
max_turns: 25
timeout_seconds: 600
allowed_tools: [Agent, Skill, Read, Grep, Glob]
---

Use the architecture reviewer agent to audit the diff below against the project's architecture notes. Report its findings and its gate verdict.

Project architecture notes (docs/architecture.md):

- Layers, innermost first: `src/domain`, `src/application`, then `src/adapters` and `src/http`. Dependencies point inward only.
- Rule `inward-only-dependencies`: `src/domain` imports nothing from frameworks, HTTP or I/O libraries.
- Rule `di-discipline`: concrete adapters and repositories are constructed only in the composition root `src/container.ts`. Services receive them through their constructor.
- Rule `engine-no-io`: `packages/engine` performs no I/O except through injected ports.
- Rule `validate-before-emit`: `packages/engine` must pass its results through `validateFindings()` before returning them.
- Naming, formatting and test coverage are out of scope for this review.

```diff
diff --git a/src/domain/order.ts b/src/domain/order.ts
--- a/src/domain/order.ts
+++ b/src/domain/order.ts
@@ -4,7 +4,7 @@ export interface Order {
 }

 export function applyDiscount(order: Order, percent: number): Order {
-  const t = Math.round(order.totalCents * (1 - percent / 100));
-  return { ...order, totalCents: t };
+  const discountedTotal = Math.round(order.totalCents * (1 - percent / 100));
+  return { ...order, totalCents: discountedTotal };
 }
```
