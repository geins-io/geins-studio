---
name: geins-add-entity
description: "Step-by-step checklist for adding a complete new entity to Geins Studio — types, repository, registration, list page, detail edit page, navigation, and i18n. Use this skill whenever the user wants to add, scaffold, or create a new entity, domain object, or CRUD feature in geins-studio, even if they say 'add a new X page', 'create a Y feature', 'I need CRUD for Z', or 'scaffold a new entity'. Trigger on: new entity, add entity, scaffold, new page, new domain, create entity, new CRUD."
---

# Geins Studio — Add a New Entity

Follow this 7-step checklist in order. Each step lists what to create/modify and the key convention to follow. See `CLAUDE.md` → "Page Patterns - Adding a New Entity Checklist" for the canonical reference.

## 1. Types — `shared/types/<Entity>.ts`

This file contains **only type definitions** — no logic, no imports from repositories.

```ts
export interface EntityBase {
  name: string
  // shared readable fields
}
export interface EntityResponse extends EntityBase {
  _id: string
  // response-only fields (nested objects, computed, etc.)
}
export interface EntityCreate {
  name: string
  // all required create fields
}
export interface EntityUpdate {
  name?: string
  // all patchable fields (all optional)
}
```

Import these types elsewhere via `#shared/types` alias (never relative imports).

## 2. Repository — `app/utils/repositories/<entity>.ts`

This is a **separate file** from the types. It imports from `#shared/types` and uses the factory chain — don't write raw fetch calls:

```ts
import type { EntityResponse, EntityCreate, EntityUpdate } from '#shared/types'
import { entityRepo } from './entity'
import type { $Fetch } from 'nitropack'

export function createEntityRepository(fetch: $Fetch) {
  return entityRepo<EntityResponse, EntityCreate, EntityUpdate>(
    '/entity-endpoint',
    fetch,
  )
}
```

Available base repos (simplest → fullest): `entityGetRepo` → `entityListRepo` → `entityBaseRepo` → `entityRepo` (full CRUD). Pick the right level for the entity's API capabilities.

## 3. Register the repo

Two files to update:

**`app/utils/repos.ts`** — add the factory to the repos map:
```ts
entityName: createEntityRepository,
```

**`app/composables/useGeinsRepository.ts`** — expose it on the returned object:
```ts
entityApi: { entity: repos.entityName($geinsApi) },
```

## 4. List page — `app/pages/<domain>/<entity>/list.vue`

Standard pattern:
```ts
definePageMeta({ pageType: 'list' })
const { repository } = useGeinsRepository()
const { data, error } = await useAsyncData(() => repository.entityApi.entity.list())
const { columns } = useColumns<EntityResponse>({ ... })
const table = useTable({ data, columns })
```

Use `usePageError()` to handle fetch errors. Columns use `useColumns.getColumns()` with `columnTypes` for type inference.

## 5. Detail page — `app/pages/<domain>/<entity>/[id].vue`

This is the most involved step — use the **geins-entity-edit-page** skill (or see `CLAUDE.md` → "Entity Edit Page") for the full pattern. Key requirements:
- `route.params.id === 'new'` → create mode; any other value → edit mode
- `useEntityEdit` with `parseEntityData`, `prepareCreateData`, `prepareUpdateData`, `onFormValuesChange`
- The required edit-mode loading block at the bottom of `<script setup>`

## 6. Navigation — `app/lib/navigation.ts`

Add route entries. Use `useEntityUrl()` helpers — never hardcode route strings:
- `getEntityUrl(id)` — uses current route context
- `getEntityUrlFor('entity-name', 'domain', id)` — cross-domain links

## 7. i18n — **both** locale files (don't skip this)

Always update both files in the same commit — leaving one out breaks the Swedish locale:
- `i18n/locales/en.json`
- `i18n/locales/sv.json`

Add keys for: entity name (singular/plural), field labels, action labels (create, save, delete), and any status/state values.

## Verify

```bash
pnpm lint:check
pnpm typecheck
pnpm test --run
```

Manual smoke test:
- Create → confirm auto-navigate to edit URL
- Reload edit URL → form is populated
- List page → new entity appears
