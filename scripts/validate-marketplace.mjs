#!/usr/bin/env node
// Structural linter for the marketplace. No dependencies.
// Usage: node scripts/validate-marketplace.mjs [--strict]
//   --strict  treat warnings as failures
import { validateMarketplace } from './lib.mjs';

const strict = process.argv.includes('--strict');
const { errors, warnings } = validateMarketplace();

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`error:   ${e}`);

const failed = errors.length > 0 || (strict && warnings.length > 0);
if (failed) {
  console.error(`\nValidation failed: ${errors.length} error(s), ${warnings.length} warning(s).`);
  process.exit(1);
}
console.log(`Validation passed (${warnings.length} warning(s)).`);
