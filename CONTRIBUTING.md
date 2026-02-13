# Contributing to Geins Studio

## Quick Start

```bash
pnpm install           # Install dependencies (pnpm, via Corepack)
pnpm dev               # Start dev server at localhost:3000
pnpm lint              # ESLint with auto-fix
pnpm lint:check        # ESLint without auto-fix (CI-safe)
pnpm typecheck         # Run nuxi typecheck
pnpm format:check      # Check Prettier formatting
pnpm test              # Run Vitest tests
```

**Required environment variables** — create `.env`:

```bash
GEINS_API_URL=https://mgmtapi.geins.services/v2
AUTH_SECRET=<random-secret>    # generate at https://auth-secret-generator.vercel.app
GEINS_DEBUG=true               # enable useGeinsLog output
```

## Where Does New Code Go?

### Adding a New Entity (end-to-end checklist)

1. **Types** → `shared/types/{Entity}.ts` — Define `{Entity}Base`, `{Entity}Response`, `{Entity}Create`, `{Entity}Update`
2. **Repository** → `app/utils/repositories/{entity}.ts` — Create factory using `entityRepo<Response, Create, Update>`
3. **Register repo** → `app/utils/repos.ts` — Add to barrel export
4. **Register in composable** → `app/composables/useGeinsRepository.ts` — Expose via return object
5. **List page** → `app/pages/{domain}/{entity}/list.vue` — Follow list page pattern
6. **Detail page** → `app/pages/{domain}/{entity}/[id].vue` — Follow detail/edit page pattern
7. **Navigation** → `app/lib/navigation.ts` — Add nav entry
8. **i18n** → `i18n/locales/en.json` + `sv.json` — Add translations

### Decision Guide

| I want to…                      | Put it in…                                                                  |
| ------------------------------- | --------------------------------------------------------------------------- |
| Add a reusable UI primitive     | `app/components/ui/` via `npx shadcn-vue@latest add`                        |
| Add a domain-specific component | `app/components/{domain}/`                                                  |
| Add stateful composition logic  | `app/composables/use{Name}.ts`                                              |
| Add a pure utility function     | `shared/utils/{name}.ts` (if shared) or `app/utils/{name}.ts` (client-only) |
| Add a TypeScript type/interface | `shared/types/{Domain}.ts` → re-export from `shared/types/index.ts`         |
| Add an API interaction          | `app/utils/repositories/{domain}.ts` using repository factories             |
| Add a global reactive store     | `app/stores/{name}.ts` as Pinia store                                       |
| Add a page                      | `app/pages/{domain}/{entity}/list.vue` or `[id].vue`                        |
| Add a server endpoint           | `server/api/{path}.ts`                                                      |

## Code Conventions

### Logging

**Never use `console.log`** — ESLint enforces this. Use the scoped logger:

```typescript
const { geinsLog, geinsLogError, geinsLogWarn } = useGeinsLog('my-component');
geinsLog('Something happened', data);
```

### Composables

- File: `use{Name}.ts`
- Must export a named function: `export function use{Name}(): Use{Name}ReturnType`
- Always define an explicit return type interface ending in `ReturnType`

### Components

- Props: `defineProps<{}>()` with `withDefaults()` — no `vue/require-default-prop`
- shadcn-vue components: install via CLI, never create manually
- Icons: use Lucide icons (auto-imported via `nuxt-lucide-icons`)

### Imports

- Nuxt auto-imports composables, utils, and components — don't import them manually
- Enforce consistent order (ESLint `import/order`): builtin → external → internal → relative → types
- Type imports: `import type { X } from '#shared/types'`

### Forms

- Define Zod schemas, convert with `toTypedSchema(zodSchema)` for vee-validate
- Use `<FormField v-slot="{ componentField }">` pattern
- Never implement custom unsaved-changes tracking — `useEntityEdit` handles this

### Stores

- Access via `const store = use{Name}Store()`
- Destructure state with `storeToRefs(store)` for reactivity
- Actions can be destructured directly (no `storeToRefs` needed)

## Branching & CI

- PRs target `main` or `next`
- CI runs `lint:check`, `typecheck`, and `test --run` on every PR
- All checks must pass before merge

## Scripts Reference

| Script              | Purpose                         | Safe for CI?       |
| ------------------- | ------------------------------- | ------------------ |
| `pnpm lint`         | ESLint with auto-fix            | No (mutates files) |
| `pnpm lint:check`   | ESLint read-only                | Yes                |
| `pnpm typecheck`    | Nuxi typecheck                  | Yes                |
| `pnpm format:check` | Prettier read-only              | Yes                |
| `pnpm test`         | Vitest (watch mode)             | No                 |
| `pnpm test --run`   | Vitest single run               | Yes                |
| `pnpm build`        | Nuxt production build           | Yes                |
| `pnpm dev`          | Dev server (localhost:3000)     | —                  |
| `pnpm docs:dev`     | VitePress docs (localhost:3010) | —                  |
