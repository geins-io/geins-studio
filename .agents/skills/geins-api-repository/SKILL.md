---
name: geins-api-repository
description: "Add a new typed API repository or extend an existing one in Geins Studio without bypassing the project's API architecture. Use when creating new API integrations, adding endpoints, or wiring repositories. Trigger on: repository, API repository, add repo, new endpoint, create repository, extend repository, API integration, useGeinsRepository, entityRepo."
---

# Geins Studio — API Repository: Add or Extend

Add a new typed repository or extend an existing one without bypassing the project's API architecture. See `CLAUDE.md` → "API Repositories" for the canonical reference.

## Hard Rules

- **NEVER write raw `fetch()` calls for standard CRUD** — always use the factory chain.
- **NEVER use PUT for updates** — the standard is PATCH (the `entityRepo` factory handles this).
- **ALWAYS use `buildQueryObject(options)` for query params** — never pass raw objects as `{ query: options }`.
- **ALWAYS use typed `ApiOptions` interfaces** — never use untyped option objects.
- All API calls flow through typed repository factories accessed via `useGeinsRepository()`.
- The Nitro server proxy (`server/api/[...].ts`) is a transparent passthrough — adds auth headers, no response transformation.

## Types — MUST follow the `{Entity}Base` convention

Types go in `shared/types/{Entity}.ts` and use the utility types from `shared/types/Global.ts`:

```ts
// shared/types/Global.ts provides these:
// CreateEntity<T> = Omit<T, keyof EntityBase>      — strips _id, _type
// UpdateEntity<T> = Partial<CreateEntity<T>> & Partial<EntityBase>  — all optional
// ResponseEntity<T> = T & EntityBase                — adds _id, _type

import type { CreateEntity, UpdateEntity, ResponseEntity } from './index';

// 1. Base interface — shared readable fields (NO _id, _type)
export interface MyEntityBase {
  name: string;
  description?: string;
  active: boolean;
}

// 2. Create type — fields accepted by POST (extends Base minus EntityBase fields)
export interface MyEntityCreate extends CreateEntity<MyEntityBase> {
  // Add create-only fields here (e.g. nested create objects)
}

// 3. Update type — fields accepted by PATCH (all optional)
export interface MyEntityUpdate extends UpdateEntity<MyEntityBase> {
  // Add update-only fields here
}

// 4. Response type — what the API returns (Base + _id + _type)
export interface MyEntity extends ResponseEntity<MyEntityBase> {
  // Add response-only fields here (nested objects, computed fields)
}
```

**Response types MUST extend `ResponseEntity<Base>`** (which adds `_id: string` and `_type: string`). The factory chain has `TResponse extends EntityBase` constraints — types without `_id`/`_type` will fail.

For simple entities where Create/Update/Response don't need extra fields, use type aliases:

```ts
export type MyEntityCreate = CreateEntity<MyEntityBase>;
export type MyEntityUpdate = UpdateEntity<MyEntityBase>;
export type MyEntity = ResponseEntity<MyEntityBase>;
```

Register in `shared/types/index.ts`:
```ts
export * from './MyEntity';
```

### Anti-patterns (from the Workflow types — DO NOT repeat)

```ts
// BAD: Standalone request/response types that ignore the Base/Create/Update/Response convention
export interface CreateWorkflowRequest { ... }   // Should be WorkflowCreate extends CreateEntity<WorkflowBase>
export interface UpdateWorkflowRequest { ... }    // Should be WorkflowUpdate extends UpdateEntity<WorkflowBase>
export interface WorkflowDefinition { ... }       // Should be Workflow extends ResponseEntity<WorkflowBase>

// BAD: No shared base interface — duplicates fields across types
// BAD: Response type doesn't extend ResponseEntity<Base> — may lack _id/_type contract
```

### Options types

If the endpoint supports field filtering, define a typed options interface:

```ts
export type MyEntityFieldsFilter = 'all' | 'default' | 'details' | 'items';
export type MyEntityApiOptions = ApiOptions<MyEntityFieldsFilter>;
```

## Repository factory chain

Located in `app/utils/repositories/entity-base.ts` and `entity.ts`.

Pick the right level for the entity's API capabilities:

| Factory | Methods | When to use |
|---|---|---|
| `entityGetRepo<TResponse, TOptions>` | `get(id)` | Read-only single entity |
| `entityListRepo<TResponse, TOptions>` | `list()` | Read-only list |
| `entityBaseRepo<TResponse, TOptions>` | `get(id)` + `list()` | Read-only get + list |
| `entityRepo<TResponse, TCreate, TUpdate, TOptions>` | `get` + `list` + `create` + `update` + `delete` | Full CRUD |

Access them via the auto-imported `repo` object (from `app/utils/repos.ts`):

```ts
repo.entity<Response, Create, Update, Options>(endpoint, fetch)
repo.entityBase<Response, Options>(endpoint, fetch)
```

### Correct repository pattern

```ts
import type { MyEntity, MyEntityCreate, MyEntityUpdate, MyEntityApiOptions } from '#shared/types';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/my-domain';

export function myDomainRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  // Use the factory chain for standard CRUD
  const myEntityEndpoint = `${BASE_ENDPOINT}/entity`;
  const myEntityRepo = repo.entity<
    MyEntity,
    MyEntityCreate,
    MyEntityUpdate,
    MyEntityApiOptions
  >(myEntityEndpoint, fetch);

  return {
    entity: {
      ...myEntityRepo,  // Spread gives: get(), list(), create(), update(), delete()

      // Domain-specific methods as thin wrappers
      async validate(data: MyEntityCreate): Promise<ValidationResult> {
        return await fetch<ValidationResult>(`${myEntityEndpoint}/validate`, {
          method: 'POST',
          body: data,
        });
      },
    },
  };
}
```

### Anti-patterns (from the Workflow repo — DO NOT repeat)

```ts
// BAD: Manual CRUD instead of using the factory
workflow: {
  async list(): Promise<WorkflowSummary[]> {
    return await fetch<WorkflowSummary[]>(WORKFLOW_ENDPOINT);  // Should use repo.entity spread
  },
  async get(id: string): Promise<WorkflowDefinition> {
    return await fetch<WorkflowDefinition>(`${WORKFLOW_ENDPOINT}/${id}`);  // Duplicates entityGetRepo
  },
  async create(data) { ... },   // Duplicates entityRepo.create
  async update(id, data) {       // Uses PUT instead of PATCH!
    return await fetch(`${WORKFLOW_ENDPOINT}/${id}`, { method: 'PUT', body: data });
  },
  async delete(id) { ... },     // Duplicates entityRepo.delete
}

// BAD: Raw query objects instead of buildQueryObject
{ query: options }        // Should be: { query: buildQueryObject(options) }

// BAD: No ApiOptions typing
options?: ListExecutionLogsOptions  // Should extend ApiOptions<string>
```

### Correct fix for workflow-style CRUD

```ts
const workflowCrud = repo.entity<
  WorkflowDefinition,
  CreateWorkflowRequest,
  UpdateWorkflowRequest
>(WORKFLOW_ENDPOINT, fetch);

return {
  workflow: {
    ...workflowCrud,  // get, list, create, update (PATCH), delete — all handled

    // Only write custom methods for non-CRUD endpoints
    async validate(data: CreateWorkflowRequest): Promise<ValidateWorkflowResult> {
      return await fetch<ValidateWorkflowResult>(`${WORKFLOW_ENDPOINT}/validate`, {
        method: 'POST',
        body: data,
      });
    },
  },
};
```

## Domain repo patterns (reference examples)

### Nested sub-repos (like customer)

```ts
return {
  company: {
    ...companyRepo,      // Spread CRUD from factory
    tags: { ... },       // Custom endpoints
    id: (companyId: string) => ({    // ID-scoped factory
      buyer: {
        ...repo.entity<Buyer, BuyerCreate, BuyerUpdate>(
          `${companyEndpoint}/${companyId}/buyer`, fetch
        ),
        async assign(id: string): Promise<void> { ... },  // Custom action
      },
    }),
  },
};
```

### Overriding base methods (like product)

```ts
return {
  ...productRepo,

  // Override list() with a custom query-based implementation
  async list(options?: ProductApiOptions): Promise<BatchQueryResult<Product>> {
    return await fetch<BatchQueryResult<Product>>(`${BASE_ENDPOINT}/query`, {
      method: 'POST',
      body: { ...batchQueryMatchAll.value },
      query: buildQueryObject(options),  // ALWAYS use buildQueryObject
    });
  },
};
```

### Status transition methods (like quotation)

```ts
async send(id: string, data: StatusTransitionRequest): Promise<void> {
  await fetch<null>(`${QUOTATION_ENDPOINT}/${id}/send`, {
    method: 'POST',
    body: data,
  });
},
```

## Checklist

1. **Types** → `shared/types/{Entity}.ts` using `{Entity}Base` → `CreateEntity`/`UpdateEntity`/`ResponseEntity` convention. Register in `shared/types/index.ts`.
2. **Repository** → `app/utils/repositories/{entity}.ts` using factory chain. Spread CRUD, only write custom fetch calls for non-standard endpoints.
3. **Register** → Add factory to `app/utils/repos.ts` and expose via `app/composables/useGeinsRepository.ts`.
4. **Verify** → `pnpm typecheck` passes. `list()` and `get(id)` use `buildQueryObject` for `fields` support.

## Self-check before finishing

- [ ] Response types extend `ResponseEntity<Base>` (have `_id`, `_type`)
- [ ] CRUD operations use the factory chain, not manual fetch calls
- [ ] Updates use PATCH (via `entityRepo`), not PUT
- [ ] Query params use `buildQueryObject(options)`, not raw objects
- [ ] Options types extend `ApiOptions<string>` if field filtering is needed
- [ ] No duplicated logic that the factory already provides
