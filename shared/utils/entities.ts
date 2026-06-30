/**
 * Entity registry — the single source of truth for every *domain* entity's
 * wiring. Each entry reconciles the three string forms an entity is known by:
 *
 * - **i18n key** — the registry *key itself* (e.g. `price_list`). Resolved via
 *   `@.lower:{entityName}` / `@:{entityName}` links and the `entity_*` action
 *   keys. Consumed by repo factories (`entityRepo`'s `entityKey` → global error
 *   toast), page `usePageError({ entityName })`, table empty states, and
 *   validation messages — all of which must agree on the same key.
 * - **endpoint** — the API base path the repo fetches (current, verbatim — this
 *   file does NOT change any endpoint string). Read by `repo.entity(ENTITIES.x, fetch)`.
 * - **route** — the page folder under `app/pages/`. The one place the
 *   route↔i18n-key mismatch (e.g. plural folders) is reconciled.
 *
 * Reference the registry (or pass a typed {@link EntityKey} literal) instead of
 * a bare string so a value lives in one place and a rename can't silently drift
 * between a repo and its page. The `entities.test.ts` suite asserts every key
 * exists in both locale files and every `route` resolves to a real page folder.
 *
 * Label-only entity-name keys (`name`, `currency`, … — used purely as
 * `entityName:` interpolation in validation/labels, with no endpoint/repo/route)
 * are NOT domain entities; they stay as plain i18n keys (raw string literals at
 * the call site), not here. The `entities.test.ts` en↔sv key-parity check guards
 * those (and every other key) against drift with zero per-key maintenance.
 */
export interface EntityDescriptor {
  /**
   * API endpoint base for the entity's repo (current value, verbatim). Omitted
   * for singletons with no standard CRUD endpoint (`profile`, served via
   * `/user/me`).
   */
  endpoint?: string;
  /**
   * Page route folder relative to `/` (e.g. `pricing/price-list`). Omitted for
   * sub-entities rendered inside a parent page (`buyer`, `customer`) and
   * entities with no list/`[id]` page of their own (`product`, `message`).
   */
  route?: string;
}

/**
 * Builds the registry, stamping each entry with its own `key` (literal-typed)
 * so an entry is a complete, self-describing identity: pass `ENTITIES.product`
 * and it carries both its endpoint and its i18n key. The `const` type parameter
 * preserves the literal endpoint/route/key types without a call-site `as const`.
 */
function defineEntities<const T extends Record<string, EntityDescriptor>>(
  entries: T,
): { [K in keyof T]: T[K] & { readonly key: K } } {
  return Object.fromEntries(
    Object.entries(entries).map(([key, value]) => [key, { ...value, key }]),
  ) as { [K in keyof T]: T[K] & { readonly key: K } };
}

export const ENTITIES = defineEntities({
  product: { endpoint: '/product' },
  price_list: { endpoint: '/product/pricelist', route: 'pricing/price-lists' },
  quotation: { endpoint: '/quotation', route: 'orders/quotations' },
  message: { endpoint: '/quotation/message' },
  channel: { endpoint: '/account/channel', route: 'settings/channels' },
  company: { endpoint: '/wholesale/account', route: 'customers/companies' },
  customer: { endpoint: '/wholesale/customer' },
  buyer: { endpoint: '/wholesale/buyer' },
  user: { endpoint: '/user', route: 'account/user' },
  profile: { route: 'account/profile' },
  workflow: {
    endpoint: '/orchestrator/workflows',
    route: 'orchestrator/workflows',
  },
  execution: {
    endpoint: '/orchestrator/executions',
    route: 'orchestrator/executions',
  },
  variable: {
    endpoint: '/orchestrator/variables',
    route: 'settings/orchestrator/variables',
  },
});

/** Union of all domain-entity keys (e.g. 'price_list' | 'quotation' | …). */
export type EntityKey = keyof typeof ENTITIES;

/** A single registry entry: its descriptor plus its own `key`. */
export type Entity = (typeof ENTITIES)[EntityKey];

/** Subset of {@link EntityKey} whose descriptor declares a page `route`. */
export type EntityKeyWithRoute = {
  [K in EntityKey]: (typeof ENTITIES)[K] extends { route: string } ? K : never;
}[EntityKey];

/**
 * Page-path helpers derived from the registry `route` — the single source for
 * an entity's URLs. Use these in `navigation.ts` (and anywhere that builds an
 * entity link) instead of hardcoding `/domain/entity/...`, so a route can't
 * drift between the registry and the nav config.
 */
/** `/pricing/price-lists` — the entity's base page path (also its list/index URL). */
export const entityBasePath = (key: EntityKeyWithRoute): string =>
  `/${ENTITIES[key].route}`;
/** `/pricing/price-lists` — the entity's list page href (the collection index). */
export const entityListHref = (key: EntityKeyWithRoute): string =>
  entityBasePath(key);
/** `/pricing/price-lists/123` — link to a specific entity's `[id]` page. */
export const entityDetailHref = (key: EntityKeyWithRoute, id: string): string =>
  `${entityBasePath(key)}/${id}`;
/** `/pricing/price-lists/:id` — the nav `childPattern` for the entity's `[id]` page. */
export const entityChildPattern = (key: EntityKeyWithRoute): string =>
  `${entityBasePath(key)}/:id`;
