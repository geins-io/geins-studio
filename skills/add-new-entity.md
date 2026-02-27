# Add a new entity (end-to-end)

Goal: Add a new domain entity with repo wiring + list page + detail page + nav + i18n.

See also:

- CLAUDE.md → “Page Patterns - Adding a New Entity Checklist”
- CLAUDE.md → “API Repositories”
- CLAUDE.md → “Project Structure”
- CLAUDE.md → “i18n”

## Checklist

1. Types

- Add types in `shared/types/<Entity>.ts`:
  - `EntityBase`, `EntityResponse`, `EntityCreate`, `EntityUpdate` (names per project conventions).

2. Repository

- Create repository factory in `app/utils/repositories/<entity>.ts` using the standard `entityRepo` chain.
- If domain-specific logic is needed, extend the base repo pattern (don’t bypass it).

3. Register repo

- Register the repo in:
  - `app/utils/repos.ts`
  - `app/composables/useGeinsRepository.ts` (or wherever the registry is wired, per CLAUDE.md)

4. List page

- Add list page: `app/pages/<domain>/<entity>/list.vue`
- Use the standard list page pattern (definePageMeta pageType = list, useGeinsRepository, useAsyncData, useColumns, useTable, usePageError).

5. Detail page (create + edit)

- Add detail page: `app/pages/<domain>/<entity>/[id].vue`
- Must support both:
  - `id = new` → create mode
  - `id = <real id>` → edit mode

6. Navigation

- Add route helpers / navigation entries in `app/lib/navigation.ts`.
- Use `useEntityUrl` helpers; do not hardcode route strings.

7. i18n

- Update both:
  - `i18n/locales/en.json`
  - `i18n/locales/sv.json`

## Verify

- `pnpm lint:check`
- `pnpm typecheck`
- `pnpm test --run` (at least smoke the impacted areas)
- Manual smoke: can create entity, auto-navigate to edit URL, can reload and see data.
