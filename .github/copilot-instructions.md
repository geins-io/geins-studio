# Geins Studio — GitHub Copilot Agent Instructions

<!-- ⚠️ BRANCHING RULE — READ THIS FIRST, BEFORE ANY OTHER ACTION ⚠️ -->
> **NEVER branch from `main`. ALWAYS branch from `next`. ALWAYS open PRs targeting `next`, not `main`.**
>
> The repository is cloned as a **shallow clone** — `next` may not be available locally.
> Run these exact commands at the start of every task, before creating any branch:
>
> ```bash
> git fetch origin next:refs/remotes/origin/next
> git checkout -b feat/{issue-number}-{short-description} origin/next
> # or for bug fixes:
> git checkout -b fix/{issue-number}-{short-description} origin/next
> ```
>
> If you skip the fetch and the branch creation from `origin/next`, you will branch from the wrong commit.
> The PR **must** target `next`. Never target `main`.

## Source of Truth

**`CLAUDE.md` is the canonical reference** for all codebase conventions, patterns, architecture, and domain knowledge. Read it before starting any task. Follow every convention described there.

## Model Selection

- **Complex tasks** (multi-file features, architectural changes, new entities, tricky bugs): Use **Claude Opus 4.6**
- **Simple tasks** (single-file fixes, small UI tweaks, copy changes, i18n updates): Use **Claude Sonnet 4.6**

## Workflow Rules

These MUST be followed for every task.

### 1. Before writing code

1. **Linear issue status**: Set the issue status to **"In Progress"** before writing any code.
2. **Branch from `next`**: Always create a new branch from the `next` branch without asking. The repo is a shallow clone — `next` is not fetched by default. Use these exact commands:
   ```bash
   git fetch origin next:refs/remotes/origin/next
   git checkout -b feat/{linear-issue-number}-{short-description} origin/next
   ```
   Naming convention:
   - Features: `feat/{linear-issue-number}-{short-description}`
   - Bug fixes: `fix/{linear-issue-number}-{short-description}`
   - Example: `feat/123-add-quotation-export`, `fix/456-price-list-save-error`
3. **Read CLAUDE.md**: Read the relevant sections of `CLAUDE.md` to understand conventions and patterns before making changes.

### 2. While writing code

4. **Follow CLAUDE.md conventions**: All coding patterns, component conventions, API patterns, and domain knowledge in `CLAUDE.md` apply. Key rules:
   - Never use `console.log` — use `useGeinsLog('scope')` scoped loggers
   - Always update both `i18n/locales/en.json` and `sv.json`
   - Use `defineProps<{}>()` with `withDefaults()`
   - Never manually create shadcn-vue components — use `npx shadcn-vue@latest add`
   - Use `#shared/types` for type imports
   - Follow the entity edit page patterns (see `CLAUDE.md` → "Entity Edit Page")
5. **Performance**: Consider performance implications, especially for data fetching, state management, and rendering.
6. **Conventional commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) for all commit messages:
   - `feat: add quotation export functionality`
   - `fix: resolve price list save error`
   - `refactor: extract address validation logic`
   - `docs: update API repository documentation`
   - `chore: update dependencies`
   - Include the Linear issue reference in the commit body when applicable.

### 3. Before submitting PR

7. **Update CLAUDE.md**: Add any new learnings about the codebase, patterns, or conventions discovered during the task. Remove outdated information. This makes future tasks more efficient and reduces token usage.
8. **Update `/docs`**: If any architectural changes, new patterns, or important onboarding information was introduced, update the relevant files in `/docs`.
9. **Run checks**: Before creating the PR, run:
   ```bash
   pnpm lint:check       # ESLint (read-only)
   pnpm typecheck        # Type checking
   pnpm test --run       # Vitest
   ```
10. **Create PR to `next`**: Always target the `next` branch. Include a clear description of what changed and why.
11. **Linear issue status**: Set the issue status to **"In Review"**.

## Quick Reference (from CLAUDE.md)

### Commands

```bash
pnpm dev              # Dev server at localhost:3000
pnpm lint             # ESLint with auto-fix
pnpm lint:check       # ESLint read-only (CI-safe)
pnpm typecheck        # Nuxi typecheck
pnpm test --run       # Vitest single run (CI-safe)
```

### Path Aliases

| Alias           | Maps To            |
| --------------- | ------------------ |
| `#shared/types` | `shared/types/`    |
| `#shared/utils` | `shared/utils/`    |
| `@/components`  | `app/components/`  |
| `@/composables` | `app/composables/` |
| `@/utils`       | `app/utils/index`  |

### Project Structure

```
app/
├── pages/              # File-based routing
├── components/
│   ├── ui/             # shadcn-vue primitives (CLI-installed)
│   └── {domain}/       # Domain components
├── composables/        # Auto-imported composables (use*.ts)
├── stores/             # Pinia stores
├── plugins/            # App initialization
├── utils/repositories/ # API repository factories
└── lib/                # Pure logic

shared/types/           # All TypeScript interfaces
shared/utils/           # Shared utilities
server/api/             # Nitro proxy + NextAuth.js handler
i18n/locales/           # en.json, sv.json
docs/                   # VitePress documentation
```

For full details on entity patterns, component conventions, table patterns, API repositories, and domain-specific knowledge, always refer to `CLAUDE.md`.
