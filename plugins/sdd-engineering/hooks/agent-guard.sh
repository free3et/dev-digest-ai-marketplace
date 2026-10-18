#!/usr/bin/env bash
# PreToolUse guard for the sdd-engineering agents `spec-creator` and `plan-verifier`.
#
# Registered plugin-wide in hooks/hooks.json (matcher "Edit|Write|Bash"), because plugin
# agents cannot declare per-agent hooks in their frontmatter. The hook therefore fires for
# EVERY tool call in a session that has this plugin enabled, and must stay invisible for
# everything except the two guarded agents.
#
# How the caller is identified: Claude Code hook input carries `agent_type` (and `agent_id`)
# when the tool call is made inside a subagent (or a session started with --agent). Plugin
# agents appear namespaced (`sdd-engineering:spec-creator`); the prefix is stripped here, and
# an unprefixed name is accepted too. Main-session calls carry no `agent_type`, and any other
# agent (other plugins, user agents, built-ins) has a different name: all of these exit 0
# immediately.
#
# Guarded profiles:
#   spec-creator  Edit/Write only to *.md files under specs/ or <anything>/specs/;
#                 Bash is a read-only allowlist.
#   plan-verifier No Edit/Write at all; Bash is a read-only allowlist plus typecheck/test runners.
# Both also get the generic hard denials: history-changing git commands, file-mutating shell
# commands, command substitution and output redirection.
#
# Exit 2 blocks the tool call and sends stderr back to the agent. Best-effort guard, not a
# sandbox: a `tools` allowlist does not stop Bash from writing, so this narrows the gap.
#
# jq missing: FAIL OPEN (exit 0 plus a stderr warning). The hook is plugin-wide; failing
# closed would block every Edit/Write/Bash call of the user's own session and of other
# plugins just because jq is not installed. Install jq to enable the guard.
set -u

command -v jq >/dev/null 2>&1 || { echo "agent-guard: jq not found, guard disabled (fail open). Install jq to enforce the sdd-engineering agent guard." >&2; exit 0; }

input="$(cat)"
agent="$(printf '%s' "$input" | jq -r '.agent_type // empty' 2>/dev/null)" || exit 0
profile="${agent#sdd-engineering:}"
case "$profile" in
  spec-creator|plan-verifier) ;;
  *) exit 0 ;;   # main session or any other agent: never interfere
esac

tool="$(printf '%s' "$input" | jq -r '.tool_name // empty')"
root="${CLAUDE_PROJECT_DIR:-$PWD}"

deny() { echo "agent-guard($profile): $1" >&2; exit 2; }

# ---------- Edit / Write: path allowlist ----------
if [ "$tool" = "Edit" ] || [ "$tool" = "Write" ]; then
  path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
  rel="${path#"$root"/}"
  case "$rel" in
    */node_modules/*|*/vendor/*|*pnpm-lock.yaml|*package-lock.json|*yarn.lock)
      deny "'$rel' is on the do-not-touch list." ;;
  esac
  case "$profile" in
    spec-creator)
      case "$rel" in
        */README.md|README.md) deny "spec-creator must not rewrite '$rel'; suggest the change in the report instead." ;;
        specs/*.md|*/specs/*.md) exit 0 ;;
      esac
      deny "spec-creator may only write .md files under specs/ or <module>/specs/. '$rel' is out of scope." ;;
    *) deny "plan-verifier is read-only and has no write access." ;;
  esac
fi

# ---------- Bash ----------
if [ "$tool" = "Bash" ]; then
  cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"

  # Hard denials.
  printf '%s' "$cmd" | grep -Eq 'git[[:space:]]+(add|commit|push|reset|checkout|clean|stash|rebase|merge|rm|mv|restore|cherry-pick)\b' && deny "git commands that change history, index or worktree are forbidden."
  printf '%s' "$cmd" | grep -Eq '(^|[^[:alnum:]_])(rm|mv|cp|tee|dd|truncate|chmod|chown)[[:space:]]|sed[[:space:]]+(-[a-zA-Z]*i|--in-place)|\$\(|`' && deny "file-mutating commands and command substitution are forbidden."
  # Redirects: allow 2>&1 and >/dev/null, block anything else.
  stripped="$(printf '%s' "$cmd" | sed -E 's#[0-9]*>&[0-9]##g; s#[0-9]*>[[:space:]]*/dev/null##g')"
  printf '%s' "$stripped" | grep -q '>' && deny "output redirection to files is forbidden."

  # Allowlist: every segment of the command line must match.
  readonly_cmds='cd [^ ]+|git (diff|log|show|status|blame)( .*)?|rg( .*)?|ls( .*)?|wc( .*)?'
  case "$profile" in
    plan-verifier)
      runners='(pnpm|npm|yarn|bun) (run )?(typecheck|test|lint|check|build)( .*)?|(pnpm|npm) exec (vitest|jest|tsc)( .*)?|npx (vitest|jest|tsc)( .*)?|(pytest|go test|cargo (test|check)|make (test|check))( .*)?'
      allow="^(${readonly_cmds}|${runners})\$" ;;
    *) allow="^(${readonly_cmds})\$" ;;
  esac
  segs="$(printf '%s' "$cmd" | sed -E 's/(&&|\|\||;|\|)/\n/g')"
  while IFS= read -r seg; do
    seg="$(printf '%s' "$seg" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')"
    [ -z "$seg" ] && continue
    printf '%s' "$seg" | grep -Eq "$allow" || deny "'$seg' is not on the Bash allowlist."
  done <<< "$segs"
fi

exit 0
