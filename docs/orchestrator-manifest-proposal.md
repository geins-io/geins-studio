# Orchestrator Editor Manifest — Proposed Shape

This document describes how the editor manifest should be structured to support the new node picker sidebar. The UX follows the n8n pattern: a root panel of category cards (icon + name + description + chevron), each drilling into a second panel that lists the nodes/actions within that category.

Written from the frontend's perspective. Intended as a contract between backend and frontend.

## Design Reference

The sidebar follows n8n's two-level drill-down:

**Level 1 — Category cards** (root panel)

```
┌─────────────────────────────────┐
│  What happens next?             │
├─────────────────────────────────┤
│  🔍 Search nodes…              │
├─────────────────────────────────┤
│                                 │
│  🔀  Data transformation        →
│      Compose, map, and reshape  │
│      data between steps         │
│                                 │
│  🔀  Flow                       →
│      Branch, merge or loop      │
│      the flow                   │
│                                 │
│  🌐  Network                    →
│      HTTP requests, email,      │
│      and other network calls    │
│                                 │
│  💾  Storage                    →
│      Store, read, and query     │
│      documents                  │
│                                 │
│  ⏱   Runtime                    →
│      Timing, sub-workflows,     │
│      and execution control      │
│                                 │
│  ─── Integrations ────────────  │
│                                 │
│  📦  Action in an app           →
│      Do something in Litium,    │
│      Monitor, or another app    │
│                                 │
│  ★   My Templates               →
│      3 saved templates          │
│                                 │
└─────────────────────────────────┘
```

Each card is a row: icon (left), name + description (center), chevron arrow (right). Clicking drills into level 2.

**Level 2 — Nodes within a category** (drill-in panel)

```
┌─────────────────────────────────┐
│  ←  Flow                        │
├─────────────────────────────────┤
│  🔍 Search…                    │
├─────────────────────────────────┤
│                                 │
│  🔀  Condition                  │
│      Branch based on a          │
│      condition                  │
│                                 │
│  🔁  Iterator                   │
│      Loop over a collection     │
│                                 │
│  📄  Paginator                  │
│      Paginate through results   │
│                                 │
└─────────────────────────────────┘
```

For the "Action in an app" category, level 2 shows **provider cards** (same card style), and level 3 shows the actions within that provider. This gives integrations a natural 3-level path: Integrations → Provider → Action.

```
Level 1                    Level 2                    Level 3
─────────────────          ─────────────────          ─────────────────
Flow              →        Condition                  (adds node)
Runtime           →        Delay                      (adds node)
Network           →        HTTP Request               (adds node)
Storage           →        Store Document             (adds node)
Transform         →        Compose Object             (adds node)
Action in an app  →        Litium            →        Get Product
                           Monitor           →        Monitor
My Templates      →        My HTTP setup              (adds node)
```

Built-in categories (Flow, Runtime, Network, Storage, Transform) are **two levels**: category → nodes. Each click on a node adds it directly.

Integration categories go through **three levels**: "Action in an app" → provider → actions. This matches n8n's "Action in an app" pattern where you first pick the service, then the action.

## Goals

1. The sidebar separates first-party capabilities (node types + built-in providers) from third-party/domain providers, following n8n's category card pattern.
2. The frontend should not hardcode provider names to determine grouping. The manifest must carry enough metadata for the sidebar to render purely from data.
3. Node types (condition, iterator, delay, etc.) and provider actions (net.httpRequest, storage.storeDocument, etc.) remain distinct concepts in the manifest — they are only unified at the presentation layer.
4. The root panel must be entirely manifest-driven: categories, their order, icons, and descriptions all come from the API.

## Current Manifest Shape

```jsonc
{
  "schemaVersion": "1.0",
  "nodeTypes": [
    /* ManifestNodeType[] */
  ],
  "actions": [
    /* WorkflowAction[] — flat list, all providers mixed */
  ],
  "actionCategories": [
    /* ManifestActionCategory[] — provider metadata */
  ],
  "triggerTypes": [
    /* ... */
  ],
  "eventEntities": [
    /* ... */
  ],
  "expressionFunctions": [
    /* ... */
  ],
  "expressionVariables": [
    /* ... */
  ],
  "enums": {
    /* ... */
  },
}
```

### What is missing

- No way to distinguish built-in providers from integration providers without hardcoding names.
- No way to group node types into sidebar categories (Flow, Runtime) without hardcoding.
- No category descriptions — the root panel needs a subtitle for each card.
- No provider ordering metadata — frontend falls back to alphabetical.

## Proposed Manifest Shape

Three changes to the manifest. All are additive — no existing fields are removed or renamed.

### 1. Add `providers[]` with `kind` classification

Replace or supplement `actionCategories[]` with a `providers[]` array that carries a `kind` field.

```jsonc
{
  "providers": [
    {
      "name": "net",
      "displayName": "Network",
      "description": "HTTP requests, email, and other network calls",
      "icon": "Globe",
      "kind": "builtIn",
      "order": 10,
    },
    {
      "name": "storage",
      "displayName": "Storage",
      "description": "Store, read, and query documents",
      "icon": "Database",
      "kind": "builtIn",
      "order": 20,
    },
    {
      "name": "transform",
      "displayName": "Transform",
      "description": "Compose, map, and reshape data between steps",
      "icon": "ArrowRightLeft",
      "kind": "builtIn",
      "order": 30,
    },
    {
      "name": "monitor",
      "displayName": "Monitor",
      "description": "Observability and monitoring actions",
      "icon": "Activity",
      "kind": "integration",
      "order": 100,
    },
    {
      "name": "litium",
      "displayName": "Litium",
      "description": "Products, orders, pricing, and more",
      "icon": "Package",
      "kind": "integration",
      "order": 110,
    },
  ],
}
```

#### Provider fields

| Field         | Type                         | Required | Description                                                                                                                                  |
| ------------- | ---------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`        | `string`                     | yes      | Unique key. Matches the prefix in `action.name` (e.g. `"net"` matches `"net.httpRequest"`).                                                  |
| `displayName` | `string`                     | yes      | Human label shown on the category card and as the drill-in panel title.                                                                      |
| `description` | `string`                     | yes      | Subtitle shown below the name on the root-level category card.                                                                               |
| `icon`        | `string`                     | no       | PascalCase Lucide icon name. Frontend resolves dynamically via `useLucideIcon()`.                                                            |
| `kind`        | `"builtIn" \| "integration"` | yes      | `builtIn` providers become their own root-level category card. `integration` providers are grouped under the "Action in an app" card.        |
| `order`       | `number`                     | no       | Sort order within its `kind` group. Lower values appear first. Providers without `order` are sorted alphabetically after those with `order`. |

#### How `kind` drives the sidebar

- **`builtIn` providers** (net, storage, transform) each get their own category card at the root level, alongside the node-type categories (Flow, Runtime). Clicking drills directly into that provider's actions. This means built-in providers are presented as first-class workflow capabilities, not as "apps".

- **`integration` providers** (litium, monitor, future vendors) are all grouped behind a single "Action in an app" category card at the root level. Clicking that card shows a list of provider cards (one per integration). Clicking a provider card then shows that provider's actions. This matches n8n's "Action in an app" pattern.

#### Relationship to `actionCategories`

`providers[]` replaces `actionCategories[]`. If both are present during a transition period, the frontend will prefer `providers[]` and ignore `actionCategories[]`.

If the backend prefers to keep a single field name, renaming `actionCategories` to `providers` and adding the new fields to the existing type is equally fine. The frontend will adapt to whichever field name carries the `kind` property.

### 2. Add `nodeCategories[]` for node-type grouping

Node types today are a flat `nodeTypes[]` array. The frontend needs to know which node types belong in which root-level category card (e.g. Flow vs Runtime). Rather than hardcode this, the manifest should declare it.

```jsonc
{
  "nodeCategories": [
    {
      "key": "flow",
      "displayName": "Flow",
      "description": "Branch, merge or loop the flow",
      "icon": "GitBranch",
      "types": ["condition", "iterator", "paginator"],
      "order": 1,
    },
    {
      "key": "runtime",
      "displayName": "Runtime",
      "description": "Timing, sub-workflows, and execution control",
      "icon": "Timer",
      "types": ["delay", "workflow"],
      "order": 2,
    },
  ],
}
```

#### NodeCategory fields

| Field         | Type       | Required | Description                                                                                                                        |
| ------------- | ---------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `key`         | `string`   | yes      | Stable identifier for the group.                                                                                                   |
| `displayName` | `string`   | yes      | Human label shown on the root-level category card and as the drill-in panel title.                                                 |
| `description` | `string`   | yes      | Subtitle shown below the name on the root-level category card.                                                                     |
| `icon`        | `string`   | no       | PascalCase Lucide icon name for the category card.                                                                                 |
| `types`       | `string[]` | yes      | `WorkflowNodeType` values that belong to this group, in display order.                                                             |
| `order`       | `number`   | no       | Sort order relative to other node categories. Built-in provider `order` values are interleaved with these for final card ordering. |

#### Interaction with `nodeTypes[]`

`nodeTypes[]` continues to carry the full metadata for each node type (connections, config schema, etc.). `nodeCategories[]` only governs sidebar grouping and card presentation. A node type not listed in any category is omitted from the sidebar (e.g. `trigger` is never shown in the add-node panel).

When drilling into a node category, each node type within it is shown as a clickable card with its own `displayName`, `description`, and `icon` — pulled from the corresponding `nodeTypes[]` entry.

### 3. No changes to `actions[]`

The flat `actions[]` array stays unchanged. The frontend groups actions by provider using the dotted `name` prefix (e.g. `"storage.storeDocument"` belongs to provider `"storage"`).

Actions within an integration provider are sub-grouped by `action.category` when the provider has enough actions to warrant it (e.g. Litium's Products, Orders, Pricing categories). This already works today.

```jsonc
{
  "actions": [
    {
      "name": "net.httpRequest",
      "displayName": "HTTP Request",
      "description": "Make an HTTP request to any URL",
      "category": "Network",
      "icon": "Globe",
      "parameters": [
        /* ... */
      ],
      "output": [
        /* ... */
      ],
    },
    {
      "name": "litium.getProduct",
      "displayName": "Get Product",
      "description": "Retrieve a product by ID",
      "category": "Products",
      "icon": "Package",
    },
  ],
}
```

No new fields needed on actions. Provider classification lives on the provider, not on individual actions.

## Complete Example

Putting it all together, the relevant parts of the manifest look like this:

```jsonc
{
  "schemaVersion": "2.0",

  "nodeCategories": [
    {
      "key": "flow",
      "displayName": "Flow",
      "description": "Branch, merge or loop the flow",
      "icon": "GitBranch",
      "types": ["condition", "iterator", "paginator"],
      "order": 1,
    },
    {
      "key": "runtime",
      "displayName": "Runtime",
      "description": "Timing, sub-workflows, and execution control",
      "icon": "Timer",
      "types": ["delay", "workflow"],
      "order": 2,
    },
  ],

  "nodeTypes": [
    {
      "type": "condition",
      "displayName": "Condition",
      "description": "Branch based on a condition",
      "icon": "GitBranch",
      "connections": { "...": "..." },
    },
    {
      "type": "iterator",
      "displayName": "Iterator",
      "description": "Loop over a collection",
      "icon": "Repeat",
      "connections": { "...": "..." },
    },
    {
      "type": "paginator",
      "displayName": "Paginator",
      "description": "Paginate through results",
      "icon": "Layers",
      "connections": { "...": "..." },
    },
    {
      "type": "delay",
      "displayName": "Delay",
      "description": "Wait before continuing",
      "icon": "Timer",
      "connections": { "...": "..." },
    },
    {
      "type": "workflow",
      "displayName": "Workflow",
      "description": "Run a sub-workflow",
      "icon": "Workflow",
      "connections": { "...": "..." },
    },
    {
      "type": "trigger",
      "displayName": "Trigger",
      "description": "Entry point",
      "icon": "Zap",
      "connections": { "...": "..." },
    },
  ],

  "providers": [
    {
      "name": "net",
      "displayName": "Network",
      "description": "HTTP requests, email, and other network calls",
      "icon": "Globe",
      "kind": "builtIn",
      "order": 10,
    },
    {
      "name": "storage",
      "displayName": "Storage",
      "description": "Store, read, and query documents",
      "icon": "Database",
      "kind": "builtIn",
      "order": 20,
    },
    {
      "name": "transform",
      "displayName": "Transform",
      "description": "Compose, map, and reshape data between steps",
      "icon": "ArrowRightLeft",
      "kind": "builtIn",
      "order": 30,
    },
    {
      "name": "monitor",
      "displayName": "Monitor",
      "description": "Observability and monitoring actions",
      "icon": "Activity",
      "kind": "integration",
      "order": 100,
    },
    {
      "name": "litium",
      "displayName": "Litium",
      "description": "Products, orders, pricing, and more",
      "icon": "Package",
      "kind": "integration",
      "order": 110,
    },
  ],

  "actions": [
    {
      "name": "net.httpRequest",
      "displayName": "HTTP Request",
      "description": "Make an HTTP request to any URL",
      "category": "Network",
      "icon": "Globe",
    },
    {
      "name": "net.sendEmail",
      "displayName": "Send Email",
      "description": "Send an email via SMTP",
      "category": "Network",
      "icon": "Mail",
    },
    {
      "name": "storage.storeDocument",
      "displayName": "Store Document",
      "description": "Store a document in blob storage",
      "category": "Storage",
      "icon": "Database",
    },
    {
      "name": "storage.readDocument",
      "displayName": "Read Document",
      "description": "Read a document from storage",
      "category": "Storage",
      "icon": "FileText",
    },
    {
      "name": "storage.queryDocuments",
      "displayName": "Query Documents",
      "description": "Query documents by filter",
      "category": "Storage",
      "icon": "Search",
    },
    {
      "name": "transform.compose",
      "displayName": "Compose Object",
      "description": "Build an object from fields",
      "category": "Transform",
      "icon": "Layers",
    },
    {
      "name": "transform.map",
      "displayName": "Transform Data",
      "description": "Map and reshape data",
      "category": "Transform",
      "icon": "ArrowRightLeft",
    },
    {
      "name": "litium.getProduct",
      "displayName": "Get Product",
      "description": "Retrieve a product by ID",
      "category": "Products",
      "icon": "Package",
    },
    {
      "name": "litium.listProducts",
      "displayName": "List Products",
      "description": "List products with filtering",
      "category": "Products",
      "icon": "List",
    },
    {
      "name": "litium.getOrder",
      "displayName": "Get Order",
      "description": "Retrieve an order by ID",
      "category": "Orders",
      "icon": "ShoppingCart",
    },
    {
      "name": "monitor.monitor",
      "displayName": "Monitor",
      "description": "Emit a monitoring event",
      "category": "Monitor",
      "icon": "Activity",
    },
  ],

  // triggerTypes, eventEntities, expressionFunctions, expressionVariables, enums — unchanged
}
```

## How the Frontend Consumes This

### Root panel — category cards

The root panel merges two data sources into a single ordered list of category cards:

1. **Node categories** from `nodeCategories[]` — each becomes one card.
2. **Built-in providers** from `providers[]` where `kind === "builtIn"` — each becomes one card.
3. **"Action in an app"** — a synthetic card that groups all `integration` providers. Only shown when at least one integration provider exists.
4. **"My Templates"** — a synthetic card from localStorage. Only shown when templates exist.

Cards are sorted by `order`. Node categories and built-in providers share the same ordering space, so `order` values determine interleaving. The "Action in an app" card appears after all built-in cards. "My Templates" appears last.

#### Resulting root panel (from the example manifest)

| Order | Card                                                                 | Source                                  |
| ----- | -------------------------------------------------------------------- | --------------------------------------- |
| 1     | Flow — "Branch, merge or loop the flow"                              | `nodeCategories[0]`                     |
| 2     | Runtime — "Timing, sub-workflows, and execution control"             | `nodeCategories[1]`                     |
| 10    | Network — "HTTP requests, email, and other network calls"            | `providers[0]` (builtIn)                |
| 20    | Storage — "Store, read, and query documents"                         | `providers[1]` (builtIn)                |
| 30    | Transform — "Compose, map, and reshape data between steps"           | `providers[2]` (builtIn)                |
| —     | _── Integrations ──_                                                 | Visual divider                          |
| auto  | Action in an app — "Do something in Litium, Monitor, or another app" | Synthetic (integration providers exist) |
| last  | My Templates — "3 saved templates"                                   | localStorage                            |

### Drill-in panels

| Root card clicked | Level 2 shows                                                                                          | Level 3                           |
| ----------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------- |
| Flow              | Node type cards: Condition, Iterator, Paginator (from `nodeTypes[]` matched by `nodeCategories.types`) | n/a — click adds node             |
| Runtime           | Node type cards: Delay, Workflow                                                                       | n/a — click adds node             |
| Network           | Action cards: HTTP Request, Send Email (from `actions[]` where name starts with `net.`)                | n/a — click adds node             |
| Storage           | Action cards: Store Document, Read Document, Query Documents                                           | n/a — click adds node             |
| Transform         | Action cards: Compose Object, Transform Data                                                           | n/a — click adds node             |
| Action in an app  | Provider cards: Litium, Monitor (from `providers[]` where `kind === "integration"`)                    | Action cards within that provider |
| My Templates      | Template cards (from localStorage)                                                                     | n/a — click adds node             |

### Search behavior

**Root-level search** filters across all categories, providers, node types, actions, and templates globally. Results are shown as a flat list of node cards (same as current behavior). Each result shows its provider/category icon so the user can identify where it belongs.

**Drill-in search** filters within the current panel only.

### Sorting rules

- **Root cards**: sorted by `order` (node categories and built-in providers share the same `order` space).
- **Node types within a category**: rendered in the order listed in `nodeCategory.types`.
- **Actions within a built-in provider**: sorted by `action.displayName`.
- **Integration provider cards**: sorted by `provider.order`, then alphabetically.
- **Actions within an integration provider**: grouped by `action.category` (with category divider headers), then sorted by `action.displayName` within each group.

### Fallback when `providers[]` is absent

During the transition period before the backend ships `providers[]`, the frontend falls back to:

1. Read `actionCategories[]` (existing field).
2. Classify providers using a hardcoded set: `net`, `storage`, `transform` as built-in, everything else as integration.
3. Use hardcoded descriptions and icon defaults.

This fallback is removed once the backend confirms `providers[]` is live.

### Fallback when `nodeCategories[]` is absent

The frontend falls back to a hardcoded grouping:

```ts
const FALLBACK_NODE_CATEGORIES = [
  {
    key: 'flow',
    displayName: 'Flow',
    description: 'Branch, merge or loop the flow',
    icon: 'GitBranch',
    types: ['condition', 'iterator', 'paginator'],
    order: 1,
  },
  {
    key: 'runtime',
    displayName: 'Runtime',
    description: 'Timing, sub-workflows, and execution control',
    icon: 'Timer',
    types: ['delay', 'workflow'],
    order: 2,
  },
];
```

This fallback is removed once the backend confirms `nodeCategories[]` is live.

## What Does NOT Change

| Concept                 | Status                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `nodeTypes[]`           | Unchanged. Still carries full node type metadata (connections, config, etc.).                 |
| `actions[]`             | Unchanged. Still a flat list. No new fields.                                                  |
| `triggerTypes[]`        | Unchanged.                                                                                    |
| `eventEntities[]`       | Unchanged.                                                                                    |
| `expressionFunctions[]` | Unchanged.                                                                                    |
| `enums`                 | Unchanged.                                                                                    |
| Workflow JSON           | Unchanged. `nodes[].actionName` stays `"storage.storeDocument"`. No `kind` in workflow state. |

## Summary of Backend Work

| #   | Change                                                                                                              | Required    | Scope              |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------ |
| 1   | Add `providers[]` to the manifest response (or add `kind`, `order`, `description` to existing `actionCategories[]`) | Yes         | Schema + API       |
| 2   | Set `kind: "builtIn"` on `net`, `storage`, `transform`                                                              | Yes         | Provider manifests |
| 3   | Set `kind: "integration"` on `monitor`, `litium`, and future providers                                              | Yes         | Provider manifests |
| 4   | Add `description` to each provider (shown as subtitle on category cards)                                            | Yes         | Provider manifests |
| 5   | Add `nodeCategories[]` to the manifest response                                                                     | Yes         | Schema + API       |
| 6   | Define Flow and Runtime groups with `description` in `nodeCategories[]`                                             | Yes         | Manifest data      |
| 7   | Add `order` to providers and node categories for stable sidebar ordering                                            | Recommended | Schema             |

Items 1-6 are needed for the frontend to render the n8n-style sidebar without hardcoded fallbacks. Item 7 is recommended for stable ordering but the frontend can fall back to alphabetical.
