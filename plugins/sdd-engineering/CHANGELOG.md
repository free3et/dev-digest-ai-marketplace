# Changelog

All notable changes to this plugin are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the plugin uses [SemVer](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-10-19

### Added
- Agents `spec-creator`, `implementation-planner`, `implementer` and `plan-verifier`.
- Skills `sdd-spec`, `run-plan` and `workflow-retro`.
- `skill-routing.md`: maps change types to `engineering-paved-path:<skill>`.
- `hooks/agent-guard.sh`: write and shell guard for `spec-creator` and `plan-verifier`.
- Dependencies on `engineering-paved-path`, `research-tools` and `architecture-review`, all `^1.0.0`.

Initial release; generalised from a private project.
