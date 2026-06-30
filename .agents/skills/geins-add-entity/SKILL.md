---
name: geins-add-entity
description: "Step-by-step checklist for adding a complete new entity to Geins Studio — types, repository, registration, list page, detail edit page, navigation, and i18n. Use this skill whenever the user wants to add, scaffold, or create a new entity, domain object, or CRUD feature in geins-studio, even if they say 'add a new X page', 'create a Y feature', 'I need CRUD for Z', or 'scaffold a new entity'. Trigger on: new entity, add entity, scaffold, new page, new domain, create entity, new CRUD."
---

# Geins Studio — Add a New Entity

Follow this checklist in order. Each step lists what to create/modify and the key convention to follow. See `CLAUDE.md` → "Workflow Rules", "API & Repositories", and "Page Patterns - Adding a New Entity Checklist" for the canonical reference.

## Before you start

1. If this work comes from a Linear issue, set the issue to `In Progress` before writing code.
2. Ask whether to keep working on the current branch or create a new one.
3. If creating a branch, base it on `next` and use `feat/{linear-issue-number}-{short-description}` or `fix/{linear-issue-number}-{short-description}`.
4. Read the issue against `CLAUDE.md` and the relevant skills first. If the issue is missing codebase-specific guidance, update it before implementing.

## 1. Types — `shared/types/<Entity>.ts`

This file contains **only type definitions** — no logic, no imports from repositories.

```ts
import type { CreateEntity, UpdateEntity, ResponseEntity } from './index'

export interface EntityBase {
  name: string
  // shared readable fields
}

export interface EntityCreate extends CreateEntity<EntityBase> {
  // create-only fields
}

export interface EntityUpdate extends UpdateEntity<EntityBase> {
  // update-only fields
}

export interface Entity extends ResponseEntity<EntityBase> {
  // response-only fields (nested objects, computed, etc.)
}
```

Prefer the plain entity name for the response type (`Entity`), not `EntityResponse`, unless a separate response-specific type name is genuinely clearer.

**This applies to ALL types in the file — including sub-entities, auxiliary response types, and nested objects.** If a type has `_id` and/or `_type` fields, it MUST use `ResponseEntity<Base>` or extend `EntityBase`. Never write `_id: string` or `_type: string` inline in any interface.

```ts
// BAD — even for non-primary types
export interface WorkflowExecution {
  _id: string;    // ❌
  _type: string;  // ❌
  status: string;
}

// GOOD
export interface WorkflowExecutionBase { status: string }
export type WorkflowExecution = ResponseEntity<WorkflowExecutionBase>;
```

## 2. Export types — `shared/types/index.ts`

Every new type file must be exported:

```ts
export * from './Entity'
```

Import shared types elsewhere via `#shared/types` (never long relative imports).

## 3. Register in the entity registry — `shared/utils/entities.ts`

`ENTITIES` is the single source of truth for every domain entity. Add one entry — **the key IS the i18n entity key**, the descriptor holds the API `endpoint` and (if the entity has its own list/`[id]` page) the `route` folder:

```ts
export const ENTITIES = {
  // …existing
  entity: { endpoint: '/entity-endpoint', route: 'domain/entity' },
} as const satisfies Record<string, EntityDescriptor>;
```

- `EntityKey` is derived from these keys — a new entry instantly becomes a valid `EntityKey` everywhere (repos, `usePageError`, error toasts).
- Omit `route` for a sub-entity rendered inside a parent page; omit `endpoint` for a singleton with no CRUD endpoint.
- Add the singular/plural i18n key to **both** locale files (step 9). The `entities.test.ts` guard asserts en/sv have identical keys, the registry key resolves in both locales, and the `route` resolves to a real page folder.
- Label-only names (`name`, `currency`, …) are NOT entities — leave them as plain i18n keys (raw literals at the call site), never add them here.

## 4. Repository — `app/utils/repositories/<entity>.ts`

This is a **separate file** from the types. It imports from `#shared/types` and uses the factory chain — don't write raw fetch calls. Pass the registry entry to `repo.entity(ENTITIES.entity, fetch)` so the endpoint comes from the registry (no endpoint literal here) and the i18n key is wired into the global error toast:

```ts
import type { Entity, EntityCreate, EntityUpdate } from '#shared/types'
import { ENTITIES } from '#shared/utils/entities'
import type { NitroFetchRequest, $Fetch } from 'nitropack'

export function entityRepoFactory(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return repo.entity<Entity, EntityCreate, EntityUpdate>(ENTITIES.entity, fetch)
}
```

Available base repos (simplest → fullest): `entityGetRepo` → `entityListRepo` → `entityBaseRepo` (all take a raw endpoint string) → `entityRepo` (full CRUD; takes an entity target). Pass `ENTITIES.entity` to `repo.entity(...)` for registry-backed domain entities; pass an inline `{ endpoint, key }` only for sub-entities on a scoped/non-registry endpoint, and use thin custom wrappers for non-standard endpoints/actions.

## 5. Register the repo

Two files to update:

**`app/utils/repos.ts`** — add the factory to the repo map:
```ts
entityName: entityRepoFactory,
```

**`app/composables/useGeinsRepository.ts`** — expose it on the returned object:
```ts
interface UseGeinsRepositoryReturnType {
  entityApi: ReturnType<typeof repo.entityName>;
}

export function useGeinsRepository(): UseGeinsRepositoryReturnType {
  const { $geinsApiFetchInstance } = useNuxtApp();

  return {
    entityApi: repo.entityName($geinsApiFetchInstance),
  };
}
```

## 6. List page — `app/pages/<domain>/<entity>/index.vue`

Standard pattern:
```ts
definePageMeta({ pageType: 'list' })
const { entityApi } = useGeinsRepository()
const fetchError = ref(false)
const { data, error, refresh } = await useAsyncData('entities', () => entityApi.list())

const rows = computed(() => data.value ?? [])
const { getColumns } = useColumns<Entity>()
const columns = getColumns(rows.value, {
  includeColumns: ['name'],
})
const table = useTable({ data: rows, columns })

watch([data, error], ([newData, newError]) => {
  fetchError.value = Boolean(newError)
})
```

List pages should use the standard `fetchError` + `TableView` retry pattern from `CLAUDE.md`, not fatal page errors for normal fetch failures.

## 7. Detail page — `app/pages/<domain>/<entity>/[id].vue`

This is the most involved step — use the **geins-entity-edit-page** skill (or see `CLAUDE.md` → "Entity Edit Page") for the full pattern. Key requirements:
- `route.params.id === 'new'` → create mode; any other value → edit mode
- Pass the registry entry `entity: ENTITIES.entity` to `useEntityEdit` and `usePageError` (the composable derives the i18n key from it) — don't rely on route-folder derivation
- `useEntityEdit` with `parseEntityData`, `prepareCreateData`, `prepareUpdateData`, `onFormValuesChange`
- The required edit-mode loading block at the bottom of `<script setup>`

## 8. Navigation — `app/lib/navigation.ts`

Add the nav entry. Build entity paths from the registry — **never hardcode** a path that lives in `ENTITIES[key].route`:
- `entityListHref('entity')` → `/domain/entities` (the item `href`; the collection index)
- `entityChildPattern('entity')` → `/domain/entities/:id` (the `childPattern`)
- `entityDetailHref('entity', id)` → `/domain/entities/id` (link to a specific item)
- `entityBasePath('entity')` → `/domain/entities` (base path; also singletons like `profile`)

(For the **current** entity on an `[id]`/`new` page, `useEntityUrl()` also provides `getEntityUrl(id)` / `getEntityNewUrl()`.)

**Sidebar gotchas** (all three are required for correct rendering):
1. Items in the `workspace` group **must** have a `children` array — without it, the sidebar renders a flat button instead of the collapsible parent/child style used by all other workspace items.
2. Parent and child labels **must be distinct** (domain ≠ entity). If both share the same label and href, breadcrumbs and page title duplicate (e.g. "Workflows > Workflows"). Use a domain-level parent label: "Pricing" > "Price lists", "Orchestrator" > "Workflows".
3. `icon` strings are resolved dynamically by `useLucideIcon()` — any PascalCase Lucide name works, no manual import/map needed.

## 9. i18n — **both** locale files (don't skip this)

Always update both files in the same commit — leaving one out breaks the Swedish locale:
- `i18n/locales/en.json`
- `i18n/locales/sv.json`

Add keys for: entity name (singular/plural), field labels, action labels (create, save, delete), and any status/state values.

## Verify

```bash
pnpm lint:check
pnpm typecheck
```

Run `pnpm test --run` when tests exist for the changed code.

Manual smoke test:
- Create → confirm auto-navigate to edit URL
- Reload edit URL → form is populated
- List page → new entity appears
