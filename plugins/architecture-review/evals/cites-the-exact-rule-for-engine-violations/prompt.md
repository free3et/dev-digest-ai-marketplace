---
name: cites-the-exact-rule-for-engine-violations
description: An engine package gains file I/O and skips the validation gate; each finding must name its documented rule identifier.
tags: [positive]
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
diff --git a/packages/engine/src/run.ts b/packages/engine/src/run.ts
--- a/packages/engine/src/run.ts
+++ b/packages/engine/src/run.ts
@@ -1,12 +1,14 @@
+import { readFileSync } from 'node:fs';
 import type { Provider } from './ports';
 import { dedupe } from './dedupe';
 import { validateFindings } from './validate';

 export async function runPipeline(input: string, provider: Provider) {
   const raw = await provider.complete(input);
   const deduped = dedupe(raw);
-  return validateFindings(deduped);
+  const rules = readFileSync('rules.json', 'utf8');
+  return { rules, findings: deduped };
 }
```
