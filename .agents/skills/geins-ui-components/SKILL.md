---
name: geins-ui-components
description: "Conventions for adding or modifying UI components in Geins Studio (shadcn-vue primitives + app-level components). Use when creating components, understanding naming conventions, or working with shadcn-vue. Trigger on: component, shadcn, UI component, add component, ContentEditCard, FormGrid, SelectorPanel, component naming, component conventions."
---

# Geins Studio — UI Component Conventions

Add or modify UI components in a way that matches project conventions and avoids drift. See `CLAUDE.md` → "Component UI Patterns - Component Conventions" for the canonical reference.

## Rules

- **shadcn-vue primitives** live in `app/components/ui/` — install via CLI (`npx shadcn-vue@latest add`), never create manually.
- **Component filenames** must include the full directory path prefix — the filename IS the component name. Example: `app/components/content/edit/CustomerPanel.vue` → auto-imported as `ContentEditCustomerPanel`.
- **Never modify UI primitives** in `app/components/ui/` for mode-specific styling.

## Key components

| Component | Purpose |
|-----------|---------|
| `ContentEditCard` | Collapsible card sections on edit pages. Has `#header-action` slot. |
| `ContentEditAddressPanel` | Sheet-based address editor. |
| `ContentEditCustomerPanel` | Sheet-based panel for changing customer details. |
| `ContentSwitch` | Toggle with animated collapsible slot content. |
| `FormGridWrap` / `FormGrid` | Form layout (design: `"1"`, `"1+1"`, `"1+1+1"`, `"2+1+1"`). |
| `SelectorPanel` + `TableView` | Entity selection pattern. |
| `InputGroup` / `InputGroupAddon` | Composable input groups with addons. |
| `ButtonGroup` | Groups related buttons with shared border radius. |
| `ContentEditTabs` | Tab navigation bar for edit pages. |
| `ContentPriceSummary` | Price summary rows (subtotal, discount, shipping, VAT, total). |

## Common patterns

- **Labeled value sections** in read-only cards: `<p class="text-muted-foreground mb-1 text-xs font-medium">` for label, `<p class="text-sm">` for value, `'-'` as fallback.
- **Two-column layouts** in cards: `<div class="grid grid-cols-2 gap-4">` with `border-t pt-4` for separation.

## Verify

- Component auto-import name matches what you expect.
- `pnpm lint:check && pnpm typecheck` passes.
