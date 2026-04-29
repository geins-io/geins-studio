---
name: implementation-plan
description: >
  Generate rigorous, repo-grounded implementation plans from Linear issues (or any issue tracker).
  This skill is the repository's "brain" — it encodes how the codebase builds itself with LLMs.
  Use this skill whenever you need to plan work before writing code: new features, refactors,
  integrations, API additions, or any task that touches multiple files or introduces new patterns.
  Also use when asked to "make a plan", "break down this issue", "how should I implement X",
  or when a Linear/GitHub issue is referenced. Trigger even for shorthand prompts like
  "build issue STU-52", "prep issue STU-52", or "make STU-52 implementation-ready". Trigger even
  for seemingly simple tasks — a plan that confirms simplicity is still valuable. Do NOT skip this
  skill just because you think you already know the answer; the repo may have conventions that
  override your assumptions.
metadata:
  short-description: Repo-grounded implementation planning
---

# Implementation Plan

Generate implementation plans that are grounded in the actual repository, not in general knowledge.
The cardinal rule: **facts before code**. Every plan must be derived from what exists in the repo
and its specifications, never from assumptions about what *probably* exists.

## Why this skill exists

LLMs producing implementation plans tend to fail in predictable ways:

1. **Inventing patterns** — guessing at type shapes, file locations, or conventions instead of reading them
2. **Placeholder syndrome** — proposing "reasonable placeholders" that create rework and wrong contracts downstream
3. **Architecture drift** — following textbook patterns instead of the repo's actual patterns
4. **Missing pre-flight** — jumping to code without checking issue state, branch strategy, or blocking dependencies
5. **Scope creep by detail** — listing speculative endpoints that look thorough but are largely wrong

This skill prevents all five by enforcing a strict sequence: orient -> gather facts -> plan -> scope -> verify.

## Before you start

Read the following files if they exist in the repository root or common locations. These define the
repo's own rules and override anything in this skill that contradicts them:

- `CLAUDE.md` or `.claude/CLAUDE.md` — repo-specific LLM instructions
- `CONTRIBUTING.md` — contribution conventions
- `ARCHITECTURE.md` or `docs/architecture.md` — system design documentation
- Any existing skills in the repo (check `.agents/skills/`, `.claude/skills/`, `skills/`, `.cursor/rules/`)

If the repo has its own implementation workflow documented, merge it with this skill's workflow.
The repo's conventions always win.

## The plan workflow

### Phase 1: Orient

Before writing a single line of plan, answer these questions:

1. **What is the issue?** Read the full issue description, comments, and linked issues. If it's a
   Linear issue, check its status, assignee, priority, and parent/child relationships.
2. **What branch strategy applies?** Check if there's an existing feature branch, whether to branch
   from the expected base branch, and what the naming convention is.
3. **What blocks this?** Identify dependencies — other issues, pending API specs, design decisions,
   external integrations. If a critical dependency is unresolved, the plan must say so and stop.
4. **Set issue status.** If using Linear or similar, the first action is moving the issue to
   "In Progress" or equivalent.

Output a short pre-flight checklist confirming these answers before proceeding.

### Phase 2: Gather facts

This is the most important phase. Read the actual codebase to understand:

**Architecture scan:**
- What frameworks, languages, and build tools does this repo use?
- What is the directory structure convention? Where do types, utilities, components, and tests live?
- What existing patterns are closest to what this issue requires?

**Convention extraction:**
- Find 2-3 existing implementations that are analogous to what this issue asks for.
  Read them thoroughly. These are your reference implementations.
- Extract the naming conventions: files, types, exports, functions, test files.
- Identify the registration/wiring pattern: how do new modules get connected to the app?

**Specification check:**
- If the feature involves an API: find the OpenAPI spec, GraphQL schema, or endpoint documentation.
  Derive types and contracts from the spec, not from imagination.
- If the feature involves a UI: find design files, component libraries, or existing similar screens.
- If the feature involves data: find the schema, migrations pattern, and existing model conventions.

**The spec-first rule:** If the issue requires external contracts (API specs, schemas, protocols)
that you don't have access to, the plan must explicitly state this as a blocker and describe what
information is needed. Do NOT proceed with placeholder types.

### Phase 3: Write the plan

Structure the plan as follows:

```md
## Summary
One paragraph: what this plan achieves and the approach taken.

## Reference implementations
List the 2-3 existing files you're using as models, with a one-line note on what
convention each one demonstrates.

## Changes

### 1. [Component/file group name]
- What to create or modify
- Specific types, functions, or exports (derived from specs and conventions)
- Which reference implementation this follows

### 2. [Next component/file group]
...

## Wiring
How the new code connects to the existing app (registration, exports, imports, config).

## Will NOT do
Explicit list of things that are out of scope or intentionally deferred.
Prevents scope creep and sets expectations.

## Verification
- What commands to run (lint, typecheck, test)
- What to manually verify
- What the definition of done looks like

## Open questions
Anything that needs human input before or during implementation.
```

### Phase 4: Self-review

Before presenting the plan, verify it against these criteria:

- [ ] Every type name and file path is derived from the codebase or spec, not invented
- [ ] The plan references specific existing files as models (not "follow existing patterns")
- [ ] Registration/wiring steps are explicit and match the repo's actual wiring mechanism
- [ ] The "Will NOT do" section exists and is specific
- [ ] No placeholder types or "we'll figure this out later" hand-waving
- [ ] If external specs are needed and unavailable, this is flagged as a blocker
- [ ] Verification steps include the repo's actual lint/typecheck/test commands

## Quality markers

A good plan reads like a TODO list a developer can follow without asking questions.
A bad plan reads like a blog post about how one might approach the problem.

**Good signals:**
- "Create `shared/types/Workflow.ts` following the pattern in `shared/types/Order.ts`"
- "Register in `app/utils/repos.ts` alongside the existing `orderApi` registration"
- "Derive request/response types from the endpoint OpenAPI spec"

**Bad signals:**
- "Create appropriate type definitions" (which ones? where? based on what?)
- "Follow existing patterns" (which patterns? in which files?)
- "We can use reasonable placeholder interfaces for now" (no, fetch the spec)

## When comparing implementation plans

If asked to evaluate or compare plans (e.g., from different models or team members), use this rubric:

| Criterion | Weight | What to check |
|-----------|--------|---------------|
| Spec-grounded | High | Are types derived from actual specs or invented? |
| Convention-aligned | High | Does it match the repo's file structure, naming, wiring? |
| Pre-flight included | Medium | Does it handle issue status, branch, blockers? |
| Scope bounded | Medium | Is there a "Will NOT do" section? |
| Decomposition quality | Medium | Are sub-components explicitly identified? |
| Verification concrete | Medium | Are lint/test commands specific to this repo? |
| Placeholder avoidance | High | Any "reasonable defaults" or "refine later" language? |
