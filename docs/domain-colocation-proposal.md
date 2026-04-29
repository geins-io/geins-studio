# Domain Co-location Proposal

> Technical proposal for organizing Geins Studio code by domain boundaries within Nuxt 4 constraints.

## Approaches Evaluated

### 1. Nuxt Layers (Maximum Isolation)

Each domain becomes a Nuxt Layer with its own `composables/`, `components/`, `pages/`, and `types/`.

```
domains/
├── orders/
│   ├── composables/
│   ├── components/
│   ├── pages/
│   └── types/
├── pricing/
│   └── ...
```

**Pros**: True package-per-domain, independent testing, clear ownership.
**Cons**: Significant configuration complexity, layers must be registered in `nuxt.config.ts`, cross-layer type sharing is awkward, pages routing requires layer merging, breaks existing auto-import patterns. High migration risk.

### 2. Subdirectories Within Existing Structure (Minimal Disruption) — RECOMMENDED

Domain-specific files move into subdirectories within their existing homes. Nuxt auto-imports continue to work with the `imports.dirs` config.

```
app/composables/
├── pricing/usePriceListProducts.ts     # domain
├── customers/useCustomerCompanies.ts   # domain
├── orders/useCompanyOrders.ts          # domain
├── products/useGeinsImage.ts           # domain
├── auth/useGeinsAuth.ts                # domain
├── useEntityEdit.ts                    # infrastructure (root)
├── useTable.ts                         # infrastructure (root)
└── useColumns.ts                       # infrastructure (root)
```

**Pros**: Minimal disruption, preserves auto-imports (with `imports.dirs: ['composables/**']`), git history preserved via `git mv`, easy to verify (typecheck + tests), reversible.
**Cons**: Less isolation than layers, components can't easily follow the same pattern (Nuxt component naming depends on directory path).

### 3. Hybrid (Subdirectories Now, Layers Later)

Start with subdirectories (approach 2) for composables, repositories, and types. Evaluate layers later once the domain boundaries are proven.

**Assessment**: This is effectively approach 2 with a documented upgrade path.

## Recommended Approach: Subdirectories

**Justification**: Lowest risk, proven to work (STU-45 already validated composable subdirectories with passing typecheck and tests), preserves all auto-import behavior with a one-line config addition, and is fully reversible.

### What Moves

| Layer | Strategy | Notes |
|---|---|---|
| **Composables** | Subdirectories by domain | Done (STU-45). Config: `imports.dirs: ['composables/**']` |
| **Components** | Document classification only | Moving components changes auto-import names (e.g. `ContentEditCard` → `InfraContentEditCard`), which is too disruptive. Classify in APP.md instead. |
| **Repositories** | Already domain-organized | One file per domain in `utils/repositories/`. No changes needed. |
| **Types** | Already domain-organized | One file per domain in `shared/types/`. No changes needed. |
| **Pages** | Already domain-organized | `pages/{domain}/{entity}/`. No changes needed. |
| **Stores** | Too few to subdirectory | Only 4 stores. Classification in domain-audit.md is sufficient. |

### What Stays Put

- **Components**: Moving breaks auto-import naming. Document classification in APP.md instead.
- **Stores**: Only 4 files, already clearly named.
- **Plugins**: All infrastructure. No domain-specific plugins.

## Target Directory Structure

```
app/
├── composables/
│   ├── pricing/          # 5 composables (usePriceList*)
│   ├── customers/        # 1 composable (useCustomerCompanies)
│   ├── orders/           # 1 composable (useCompanyOrders)
│   ├── products/         # 1 composable (useGeinsImage)
│   ├── auth/             # 1 composable (useGeinsAuth)
│   └── *.ts              # 19 infrastructure composables at root
├── components/
│   ├── ui/               # shadcn-vue (infrastructure)
│   ├── company/          # Customers domain
│   ├── price-list/       # Pricing domain
│   ├── quotation/        # Orders domain
│   ├── auth/             # Account/Auth domain
│   ├── content/          # Infrastructure
│   ├── table/            # Infrastructure
│   ├── form/             # Infrastructure
│   ├── dialog/           # Infrastructure
│   ├── selector/         # Infrastructure
│   └── ...               # Other infrastructure
└── utils/repositories/   # Already domain-organized
```

## Migration Status

- [x] **Phase 1**: Composables into subdirectories (STU-45) — done, verified
- [x] **Phase 2**: Component classification documented (STU-46) — document only
- [x] **Phase 3**: Shared import boundary audit (STU-47) — clean
- [x] **Phase 4**: ESLint enforcement (STU-48) — automated guard

## Risks and Rollback

**Risk**: Auto-imports break after composable moves.
**Mitigation**: `nuxt.config.ts` `imports.dirs: ['composables/**']` enables recursive scanning. Verified with `nuxi prepare` + `pnpm typecheck`.
**Rollback**: `git mv` back to root + remove the `imports.dirs` config. One commit to revert.

**Risk**: Component moves break template references.
**Mitigation**: Don't move components. Classify via documentation instead.

## Decision Log

**2026-03-19: Subdirectories over Nuxt Layers**
Layers provide maximum isolation but the configuration complexity and migration risk outweigh the benefits for a 5-domain admin SPA. Subdirectories achieve 80% of the organizational benefit with near-zero risk.

**2026-03-19: Components classified, not moved**
Nuxt auto-import naming depends on directory path. Moving `content/edit/ContentEditCard.vue` would change its import name, requiring updates across dozens of templates. The cost/benefit ratio is unfavorable.
