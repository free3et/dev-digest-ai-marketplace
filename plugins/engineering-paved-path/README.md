# engineering-paved-path

A set of 10 reusable engineering skills ("paved path" conventions) for TypeScript web projects: React and Next.js, Fastify, layered backend architecture, testing, security, Zod and TypeScript. The plugin ships skills only, no agents, hooks or commands.

Each skill is project-neutral. Where a skill needs project specifics (package names, folder layout), it asks the session to follow the project's own instructions (CLAUDE.md or equivalent), if any.

## Install

```bash
claude plugin marketplace add free3et/dev-digest-ai-marketplace
claude plugin install engineering-paved-path@dev-digest-ai-marketplace
```

## Skills

### Frontend

| Skill | Triggers when |
| --- | --- |
| `frontend-ui-architecture` | Adding or moving a component, page, hook, constant or helper in a React + Next.js App Router app; deciding where client code belongs, when to split a component, or when to use barrel files. Architecture and file placement only. |
| `react-best-practices` | Writing, reviewing or refactoring React components, hooks and state management; component design, hooks misuse, performance, data fetching, code organization. |
| `react-testing-library` | Writing, reviewing or setting up React component and hook tests with React Testing Library and Vitest; query priority, userEvent, async patterns, mocking. |
| `next-best-practices` | Writing or reviewing Next.js code: file conventions, RSC boundaries, data patterns, async APIs, metadata, error handling, route handlers, image/font optimization, bundling. Loaded by Claude as background knowledge; it is not invocable as a slash command. |

### Backend

| Skill | Triggers when |
| --- | --- |
| `fastify-best-practices` | Building, configuring or debugging a Fastify application: routes, plugins, JSON Schema validation, error handling, performance, authentication, CORS, databases, deployment. |
| `zod` | Defining `z.object` schemas, string validations, `safeParse`, `z.infer`; Zod parsing, composition and error handling. |

### Architecture

| Skill | Triggers when |
| --- | --- |
| `onion-architecture` | Adding or changing an API route, service, repository, adapter, schema, transaction or DI container wiring; deciding where backend code belongs; reviewing a backend diff for layering violations. Dependencies point inward, ports live inside, adapters and DB live outside, routes stay thin. |
| `mermaid-diagram` | Visualizing workflows, architectures, API flows, data models, state machines or system designs as Mermaid diagrams in markdown. |

### Security

| Skill | Triggers when |
| --- | --- |
| `security` | Reviewing code for vulnerabilities, implementing auth/authorization, handling user input, file uploads, secrets or API endpoints. Based on OWASP Top 10:2025. |

### Cross-cutting

| Skill | Triggers when |
| --- | --- |
| `typescript-expert` | Writing or debugging complex TypeScript types, fixing tsconfig or compiler errors, speeding up type checking, setting up a TypeScript monorepo, or migrating to TypeScript. |

## How skills trigger

- Automatically: Claude loads a skill when the task matches its `description`. Mention the topic ("where does this query go?", "review this route for security issues") and the matching skill is picked up.
- Explicitly: type `/engineering-paved-path:<skill>` (for example `/engineering-paved-path:onion-architecture`), or have an agent or prompt load `engineering-paved-path:<skill>` through the `Skill` tool.

## Use from other plugins

Agents and skills in other plugins load these skills by their namespaced name through the `Skill` tool, for example `engineering-paved-path:onion-architecture`. The following plugins in this marketplace depend on `engineering-paved-path`:

- `architecture-review` (architecture-reviewer agent)
- `sdd-engineering` (spec, plan, implement and verify workflow)

Installing either of them pulls this plugin in as a dependency.

## Requirements

None. The skills are plain markdown plus reference files. No network access, runtime or external tools are required (`typescript-expert` bundles an optional Python diagnostic script that you run yourself).

## Versioning

Semantic versioning. See [CHANGELOG.md](CHANGELOG.md) for release notes.
