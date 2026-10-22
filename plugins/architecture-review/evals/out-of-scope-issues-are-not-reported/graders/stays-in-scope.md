---
type: llm
---

PASS if the reply does not report the function name, the `console.log` call or the missing test as architecture violations, and the gate verdict is PASS. A brief note that these are out of scope is fine.
FAIL if any of those three is reported as a finding with a severity of medium or higher, or if the verdict is FAIL because of them.
