---
type: llm
---

PASS if the reply reports no architecture violation for this diff (at most `info`-level, non-blocking remarks) and the gate verdict is PASS.
FAIL if the reply reports any critical, high or medium finding, names a rule as violated, or gives a FAIL verdict. Inventing a violation for a rename is the failure this case exists to catch.
