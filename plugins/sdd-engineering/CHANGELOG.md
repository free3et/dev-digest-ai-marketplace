# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [SemVer](https://semver.org/).

## [Unreleased]

### Added
- `spec-creator` no longer finishes a spec while a goal (`G-n`) or an NFR has no acceptance criterion: the spec report carries one line, `Mandatory coverage: complete` or `incomplete — <ids>`; `sdd-spec` §11 final self-check has an 11th item for it.
- Behavior evals in `evals/` (6 cases).
- `docs/COST-BASELINE.md` (repository root): cost baseline and a no-effect experiment.
- `COMPATIBILITY.md`: verified and declared Claude Code versions, relied-on features, required tools, tested dependency combinations.

## [1.0.0] - 2026-10-19

### Added
- Agents `spec-creator`, `implementation-planner`, `implementer` and `plan-verifier`.
- Skills `sdd-spec`, `run-plan` and `workflow-retro`.
- `skill-routing.md`: maps change types to `engineering-paved-path:<skill>`.
- `hooks/agent-guard.sh`: write and shell guard for `spec-creator` and `plan-verifier`.
- Dependencies on `engineering-paved-path`, `research-tools` and `architecture-review`, all `^1.0.0`.

Initial release; generalised from a private project.
