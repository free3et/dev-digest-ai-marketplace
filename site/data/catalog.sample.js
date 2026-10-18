window.__CATALOG__={
 "meta": {
  "demo": true,
  "repo": "free3et/dev-digest-ai-marketplace",
  "marketplace": "dev-digest-ai-marketplace"
 },
 "plugins": [
  {
   "name": "code-quality",
   "ver": "1.4.0",
   "cat": "Code quality",
   "days": 3,
   "health": "ok",
   "desc": "Code review, refactoring plans and auto-formatting after edits.",
   "tags": [
    "review",
    "refactor",
    "format"
   ],
   "kw": [
    "code review",
    "pull request",
    "refactoring"
   ],
   "log": [
    {
     "ver": "1.4.0",
     "days": 3,
     "notes": [
      "Add refactor-plan skill",
      "Add format-on-write hook"
     ]
    },
    {
     "ver": "1.3.0",
     "days": 25,
     "notes": [
      "Reviewer agent can use Grep"
     ]
    },
    {
     "ver": "1.0.0",
     "days": 70,
     "notes": [
      "First release"
     ]
    }
   ]
  },
  {
   "name": "docs-writer",
   "ver": "0.9.2",
   "cat": "Documentation",
   "days": 9,
   "health": "ok",
   "desc": "Generate README files and API documentation from code.",
   "tags": [
    "docs",
    "readme",
    "api"
   ],
   "kw": [
    "documentation",
    "api reference"
   ],
   "log": [
    {
     "ver": "0.9.2",
     "days": 9,
     "notes": [
      "Fix empty sections in api-docs"
     ]
    },
    {
     "ver": "0.9.0",
     "days": 31,
     "notes": [
      "Add /docs command"
     ]
    }
   ]
  },
  {
   "name": "git-flow",
   "ver": "1.1.0",
   "cat": "Git",
   "days": 12,
   "health": "warn",
   "healthCodes": [
    "versionDup"
   ],
   "desc": "Commit messages, pull request descriptions and a guard against dangerous git commands.",
   "tags": [
    "git",
    "commit",
    "pr"
   ],
   "kw": [
    "commit",
    "pull request",
    "branch"
   ],
   "log": [
    {
     "ver": "1.1.0",
     "days": 12,
     "notes": [
      "Hook blocks git push --force to main"
     ]
    },
    {
     "ver": "1.0.0",
     "days": 48,
     "notes": [
      "First release"
     ]
    }
   ]
  },
  {
   "name": "data-tools",
   "ver": "0.6.0",
   "cat": "Data",
   "days": 20,
   "health": "err",
   "healthCodes": [
    "nameMismatch"
   ],
   "desc": "SQL helper and read-only database access.",
   "tags": [
    "sql",
    "database",
    "analytics"
   ],
   "kw": [
    "database",
    "query",
    "analytics"
   ],
   "log": [
    {
     "ver": "0.6.0",
     "days": 20,
     "notes": [
      "Add postgres-readonly MCP server"
     ]
    }
   ]
  },
  {
   "name": "test-kit",
   "ver": "2.0.1",
   "cat": "Testing",
   "days": 5,
   "health": "ok",
   "desc": "Test generation, flaky test detection and a test run after each answer.",
   "tags": [
    "test",
    "qa",
    "flaky"
   ],
   "kw": [
    "tests",
    "unit tests",
    "flaky"
   ],
   "log": [
    {
     "ver": "2.0.1",
     "days": 5,
     "notes": [
      "Fix jest config detection"
     ]
    },
    {
     "ver": "2.0.0",
     "days": 33,
     "notes": [
      "Add qa-agent",
      "Add run-tests-on-stop hook"
     ]
    }
   ]
  }
 ],
 "artifacts": [
  {
   "id": "code-quality/skill/code-review",
   "type": "skill",
   "plugin": "code-quality",
   "name": "code-review",
   "desc": "Systematic review of changes: correctness, security, style. Returns findings ordered by priority.",
   "tags": [
    "review",
    "quality"
   ],
   "kw": [
    "code review",
    "pull request",
    "audit"
   ],
   "days": 3,
   "tools": "Read, Grep, Glob",
   "use": [
    "Before merging a branch",
    "When you want a second look at a diff",
    "To onboard new teammates"
   ]
  },
  {
   "id": "code-quality/skill/refactor-plan",
   "type": "skill",
   "plugin": "code-quality",
   "name": "refactor-plan",
   "desc": "Builds a step-by-step refactoring plan with risks and ordering.",
   "tags": [
    "refactor",
    "planning"
   ],
   "kw": [
    "refactoring",
    "rewrite",
    "tech debt"
   ],
   "days": 3,
   "tools": "Read, Grep",
   "use": [
    "Before a large refactoring",
    "To size up technical debt"
   ]
  },
  {
   "id": "code-quality/agent/reviewer",
   "type": "agent",
   "plugin": "code-quality",
   "name": "reviewer",
   "desc": "A dedicated agent for deep reviews. Works in an isolated context.",
   "tags": [
    "review",
    "agent"
   ],
   "kw": [
    "code review",
    "audit"
   ],
   "days": 25,
   "tools": "Read, Grep, Glob",
   "model": "sonnet"
  },
  {
   "id": "code-quality/command//review",
   "type": "command",
   "plugin": "code-quality",
   "name": "/review",
   "desc": "Starts a review of the current changes in one call.",
   "tags": [
    "review"
   ],
   "kw": [
    "check changes"
   ],
   "days": 25,
   "run": "/review [file or branch]"
  },
  {
   "id": "code-quality/hook/format-on-write",
   "type": "hook",
   "plugin": "code-quality",
   "name": "format-on-write",
   "desc": "Formats a file after every Edit or Write.",
   "tags": [
    "format",
    "prettier"
   ],
   "kw": [
    "formatting",
    "style"
   ],
   "days": 3,
   "event": "PostToolUse",
   "matcher": "Edit|Write",
   "run": "npx prettier --write \"$CLAUDE_FILE_PATHS\""
  },
  {
   "id": "docs-writer/skill/readme-writer",
   "type": "skill",
   "plugin": "docs-writer",
   "name": "readme-writer",
   "desc": "Writes a README from scratch or updates one: description, install, examples.",
   "tags": [
    "docs",
    "readme"
   ],
   "kw": [
    "readme",
    "project description",
    "documentation"
   ],
   "days": 9,
   "tools": "Read, Glob",
   "use": [
    "A new repository without a README",
    "After large API changes"
   ]
  },
  {
   "id": "docs-writer/skill/api-docs",
   "type": "skill",
   "plugin": "docs-writer",
   "name": "api-docs",
   "desc": "Builds a reference from signatures and code comments.",
   "tags": [
    "docs",
    "api"
   ],
   "kw": [
    "api documentation",
    "reference",
    "openapi"
   ],
   "days": 9,
   "tools": "Read, Grep",
   "use": [
    "Publishing an SDK",
    "An internal service handbook"
   ]
  },
  {
   "id": "docs-writer/command//docs",
   "type": "command",
   "plugin": "docs-writer",
   "name": "/docs",
   "desc": "Updates the documentation of a given module.",
   "tags": [
    "docs"
   ],
   "kw": [
    "update documentation"
   ],
   "days": 31,
   "run": "/docs <module>"
  },
  {
   "id": "git-flow/skill/commit-message",
   "type": "skill",
   "plugin": "git-flow",
   "name": "commit-message",
   "desc": "Writes a Conventional Commits message from the staged changes.",
   "tags": [
    "git",
    "commit"
   ],
   "kw": [
    "commit",
    "commit message",
    "conventional commits"
   ],
   "days": 12,
   "tools": "Bash(git diff:*), Bash(git status:*)",
   "use": [
    "Before a commit",
    "For one style across the team"
   ]
  },
  {
   "id": "git-flow/skill/pr-description",
   "type": "skill",
   "plugin": "git-flow",
   "name": "pr-description",
   "desc": "Prepares a pull request description: what changed, why, how to verify.",
   "tags": [
    "git",
    "pr"
   ],
   "kw": [
    "pull request",
    "pr description",
    "merge request"
   ],
   "days": 12,
   "tools": "Bash(git log:*), Bash(git diff:*)",
   "use": [
    "Opening a PR",
    "Updating the description after review"
   ]
  },
  {
   "id": "git-flow/command//pr",
   "type": "command",
   "plugin": "git-flow",
   "name": "/pr",
   "desc": "Creates a PR description for the current branch.",
   "tags": [
    "git",
    "pr"
   ],
   "kw": [
    "pull request"
   ],
   "days": 48,
   "run": "/pr [base]"
  },
  {
   "id": "git-flow/hook/block-force-push",
   "type": "hook",
   "plugin": "git-flow",
   "name": "block-force-push",
   "desc": "Blocks git push --force to main and master.",
   "tags": [
    "git",
    "safety"
   ],
   "kw": [
    "guard",
    "force push"
   ],
   "days": 12,
   "event": "PreToolUse",
   "matcher": "Bash",
   "run": "./hooks/guard-force-push.sh"
  },
  {
   "id": "data-tools/skill/sql-helper",
   "type": "skill",
   "plugin": "data-tools",
   "name": "sql-helper",
   "desc": "Helps write and optimize SQL and explains query plans.",
   "tags": [
    "sql",
    "database"
   ],
   "kw": [
    "sql query",
    "database",
    "query optimization"
   ],
   "days": 20,
   "tools": "Read",
   "use": [
    "Complex joins",
    "Slow queries"
   ]
  },
  {
   "id": "data-tools/agent/data-analyst",
   "type": "agent",
   "plugin": "data-tools",
   "name": "data-analyst",
   "desc": "Analyzes data from the database and explains the findings in plain language.",
   "tags": [
    "analytics",
    "agent"
   ],
   "kw": [
    "analytics",
    "data report"
   ],
   "days": 20,
   "tools": "Read, mcp__postgres__query",
   "model": "opus"
  },
  {
   "id": "data-tools/mcp/postgres-readonly",
   "type": "mcp",
   "plugin": "data-tools",
   "name": "postgres-readonly",
   "desc": "Read-only connection to PostgreSQL.",
   "tags": [
    "postgres",
    "mcp"
   ],
   "kw": [
    "database",
    "postgres"
   ],
   "days": 20,
   "transport": "stdio",
   "run": "npx -y @modelcontextprotocol/server-postgres $DATABASE_URL"
  },
  {
   "id": "test-kit/skill/test-generator",
   "type": "skill",
   "plugin": "test-kit",
   "name": "test-generator",
   "desc": "Generates unit tests for a function or module, including edge cases.",
   "tags": [
    "test",
    "unit"
   ],
   "kw": [
    "tests",
    "unit tests",
    "coverage"
   ],
   "days": 5,
   "tools": "Read, Write, Bash(npm test:*)",
   "use": [
    "New code without tests",
    "Raising coverage"
   ]
  },
  {
   "id": "test-kit/skill/flaky-test-hunter",
   "type": "skill",
   "plugin": "test-kit",
   "name": "flaky-test-hunter",
   "desc": "Finds the causes of flaky tests from run history.",
   "tags": [
    "test",
    "flaky"
   ],
   "kw": [
    "flaky tests",
    "randomly failing"
   ],
   "days": 5,
   "tools": "Read, Grep, Bash(git log:*)",
   "use": [
    "A red build with no code changes"
   ]
  },
  {
   "id": "test-kit/agent/qa-agent",
   "type": "agent",
   "plugin": "test-kit",
   "name": "qa-agent",
   "desc": "Checks that a change does not break existing behavior.",
   "tags": [
    "qa",
    "agent"
   ],
   "kw": [
    "quality check",
    "regression"
   ],
   "days": 33,
   "tools": "Read, Bash",
   "model": "sonnet"
  },
  {
   "id": "test-kit/hook/run-tests-on-stop",
   "type": "hook",
   "plugin": "test-kit",
   "name": "run-tests-on-stop",
   "desc": "Runs the tests when Claude finishes an answer.",
   "tags": [
    "test",
    "hook"
   ],
   "kw": [
    "auto run tests"
   ],
   "days": 33,
   "event": "Stop",
   "matcher": "*",
   "run": "npm test --silent"
  }
 ]
};
