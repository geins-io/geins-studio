---
name: verify-docs
description: "Check all documentation files against the current codebase and produce a discrepancy report. Use to detect documentation drift, broken pointers, stale patterns, and missing contracts."
---

# Verify Documentation

Checks all documentation files against the current codebase and produces a structured discrepancy report. Detects drift — does NOT fix it.

See `CLAUDE.md` → "Further Reading" for the documentation hierarchy.

## Usage

```
/verify-docs
```

No parameters. Checks all documentation files.

## Files to Check

| File | Altitude | Checks |
|---|---|---|
| `ARCHITECTURE.md` | 10,000ft | Pointer check, dependency diagram accuracy |
| `APP.md` | 1,000ft | Pattern check, component list accuracy |
| `CLAUDE.md` | 100ft | Pointer check, convention compliance |
| `CONTRIBUTING.md` | Onboarding | Pointer check, commands accuracy |
| `docs/domains/products.md` | 1,000ft | Full domain check |
| `docs/domains/customers.md` | 1,000ft | Full domain check |
| `docs/domains/orders.md` | 1,000ft | Full domain check |
| `docs/domains/pricing.md` | 1,000ft | Full domain check |
| `docs/domains/account-auth.md` | 1,000ft | Full domain check |

## Checks to Perform

### 1. Pointer Check (all docs)

For every file path or link referenced in documentation:
- Verify the target file exists: `ls {path}` or glob for it
- Flag: `[BROKEN] path/to/file.md — file does not exist`
- Pass: `[OK] path/to/file.md`

### 2. Dependency Check (domain docs)

For each domain doc's "Dependencies" section:
- Scan the domain's type files for imports from other domain type files
- Compare actual imports against documented dependencies
- Flag: `[DRIFT] orders.md says depends on X, but no import found` or `[MISSING] actual import from Y not documented`

### 3. Contract Check (domain docs)

For each type listed in a domain doc's "Contracts" table:
- Grep for the type name in `shared/types/`
- Verify it exists and is exported from `shared/types/index.ts`
- Flag: `[MISSING] Type QuotationFoo documented but not found in shared/types/`

### 4. Key Files Check (domain docs)

For each file path in a domain doc's "Key Files" table:
- Verify the file exists at the documented path
- Flag: `[MOVED] useCustomerCompanies.ts documented at app/composables/ but found at app/composables/customers/`

### 5. Convention Compliance Check (CLAUDE.md)

For key conventions documented in CLAUDE.md, spot-check compliance:
- `console.log` usage: `grep -r "console.log" app/ shared/` (should be zero outside tests)
- `storeToRefs` usage: check that store state is accessed via `storeToRefs` in components
- Manual shadcn-vue components: check `app/components/ui/` for files not in shadcn registry

### 6. Pattern Check (APP.md)

For page patterns documented in APP.md:
- Verify `useEntityEdit` is used in all `[id].vue` pages
- Verify `definePageMeta({ pageType: 'list' })` is in all `list.vue` pages
- Verify `useAsyncData` + `onMounted` + `parseAndSaveData` pattern in edit pages

### 7. Command Check (CONTRIBUTING.md)

Verify all documented commands exist in `package.json`:
- `pnpm dev`, `pnpm lint`, `pnpm lint:check`, `pnpm typecheck`, `pnpm test`

## Output Format

```markdown
## Documentation Verification Report

**Date**: YYYY-MM-DD
**Files checked**: N

### ARCHITECTURE.md
- [OK] ASCII diagram present
- [OK] Golden path references existing files
- [DRIFT] Dependency diagram shows X but actual import graph shows Y

### docs/domains/orders.md
- [OK] Dependencies match actual imports (3/3)
- [OK] Contracts: all 5 types found in shared/types/
- [MOVED] Key Files: useCompanyOrders.ts now at composables/orders/ (doc says composables/)
- [OK] API Shape Quirks: validPaymentMethods type matches code

### CLAUDE.md
- [OK] All 5 domain doc pointers resolve
- [WARN] Convention "no console.log" — 0 violations found
- [OK] Convention "storeToRefs" — 12/12 usages correct

### Summary
- Total checks: N
- Passed: N
- Warnings: N
- Drift: N
- Broken: N
```

## Important

- This skill is **read-only** — it reports problems, never fixes them
- Run after any significant refactoring to catch documentation drift
- Pair with `/sync-domain` to fix any domain-level drift found
- Focus on actionable discrepancies, not cosmetic differences
