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

## 3. Repository — `app/utils/repositories/<entity>.ts`

This is a **separate file** from the types. It imports from `#shared/types` and uses the factory chain — don't write raw fetch calls:

```ts
import type { Entity, EntityCreate, EntityUpdate } from '#shared/types'
import type { NitroFetchRequest, $Fetch } from 'nitropack'

export function entityRepoFactory(fetch: $Fetch<unknown, NitroFetchRequest>) {
  return repo.entity<Entity, EntityCreate, EntityUpdate>('/entity-endpoint', fetch)
}
```

Available base repos (simplest → fullest): `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Pick the right level for the endpoint's API capabilities, and use thin custom wrappers for non-standard endpoints/actions.

## 4. Register the repo

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

## 5. List page — `app/pages/<domain>/<entity>/list.vue`

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

## 6. Detail page — `app/pages/<domain>/<entity>/[id].vue`

This is the most involved step — use the **geins-entity-edit-page** skill (or see `CLAUDE.md` → "Entity Edit Page") for the full pattern. Key requirements:
- `route.params.id === 'new'` → create mode; any other value → edit mode
- `useEntityEdit` with `parseEntityData`, `prepareCreateData`, `prepareUpdateData`, `onFormValuesChange`
- The required edit-mode loading block at the bottom of `<script setup>`

## 7. Navigation — `app/lib/navigation.ts`

Add route entries. Use `useEntityUrl()` helpers — never hardcode route strings:
- `getEntityUrl(id)` — uses current route context
- `getEntityUrlFor('entity-name', 'domain', id)` — cross-domain links

**Sidebar gotchas** (all three are required for correct rendering):
1. Items in the `workspace` group **must** have a `children` array — without it, the sidebar renders a flat button instead of the collapsible parent/child style used by all other workspace items.
2. Parent and child labels **must be distinct** (domain ≠ entity). If both share the same label and href, breadcrumbs and page title duplicate (e.g. "Workflows > Workflows"). Use a domain-level parent label: "Pricing" > "Price lists", "Orchestrator" > "Workflows".
3. **CRITICAL**: New `icon` strings require importing the Lucide component and adding it to the `iconComponents` map in `app/components/layout/sidebar/LayoutSidebar.vue`. The string→component resolution is manual; if you skip this step, the icon will silently fail to render in the UI.

## 8. i18n — **both** locale files (don't skip this)

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
