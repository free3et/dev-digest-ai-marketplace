---
name: flags-layering-violations
description: A domain file imports a framework type and a service constructs its own repository; both must be reported with a documented rule.
tags: [smoke, positive]
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
@@ -1,6 +1,8 @@
+import type { FastifyReply } from 'fastify';
+
 export interface Order {
   id: string;
   totalCents: number;
 }

 export function applyDiscount(order: Order, percent: number): Order {
   return { ...order, totalCents: Math.round(order.totalCents * (1 - percent / 100)) };
 }
+
+export function describeOrder(order: Order, reply?: FastifyReply): string {
+  return `order ${order.id}: ${order.totalCents}`;
+}
diff --git a/src/application/order-service.ts b/src/application/order-service.ts
--- a/src/application/order-service.ts
+++ b/src/application/order-service.ts
@@ -1,9 +1,10 @@
-import type { OrderRepository } from './ports';
+import { PgOrderRepository } from '../adapters/pg-order-repository';
 import { applyDiscount } from '../domain/order';

 export class OrderService {
-  constructor(private readonly orders: OrderRepository) {}
+  private readonly orders = new PgOrderRepository();

   async discount(id: string, percent: number) {
     const order = await this.orders.get(id);
     return applyDiscount(order, percent);
   }
 }
```
