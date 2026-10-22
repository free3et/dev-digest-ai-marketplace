---
name: out-of-scope-issues-are-not-reported
description: Naming, logging and missing tests are explicitly out of scope; they must not become architecture findings.
tags: [negative]
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
diff --git a/src/http/orders-route.ts b/src/http/orders-route.ts
--- a/src/http/orders-route.ts
+++ b/src/http/orders-route.ts
@@ -3,8 +3,10 @@ import type { OrderService } from '../application/order-service';

-export function registerOrderRoutes(app: App, service: OrderService) {
-  app.post('/orders/:id/discount', async (req) => {
-    return service.discount(req.params.id, req.body.percent);
+export function register_order_routes(app: App, service: OrderService) {
+  app.post('/orders/:id/discount', async (req) => {
+    console.log('discount requested', req.params.id);
+    const r = await service.discount(req.params.id, req.body.percent);
+    return r;
   });
 }
```
This change adds no test and the function name no longer matches the naming convention.
