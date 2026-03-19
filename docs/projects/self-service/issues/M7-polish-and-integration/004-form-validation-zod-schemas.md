---
title: 'Zod form validation and per-tab error indicators for channel edit page'
project: 'Self Service (Channels)'
milestone: 'M7 — Polish & Integration'
priority: 2
estimate: 5
labels:
  - feature
  - confidence-medium
  - risk-medium
  - geins-studio
depends_on:
  - './003-unsaved-changes-cross-tab.md'
model: opus
mode: claude-code interactive
---

## Context

The M1 scaffold defined a minimal Zod schema covering only `displayName`, `name`, `url`, and `type`. By M7, the channel edit page spans five tabs with many more editable fields: mail general settings, layout color/font fields, storefront settings (schema-driven), language/market/payment sub-entities. A comprehensive validation pass ensures the form blocks invalid saves and surfaces errors to the user on the correct tab.

Additionally, when a tab contains validation errors, the `ContentEditTabs` tab trigger should show a visual error indicator (e.g. a red dot or badge), so users know which tab to visit to fix errors before saving.

## Expected Outcome

- All editable fields on the channel edit page have Zod validation rules.
- Attempting to save with invalid data shows field-level errors via VeeValidate's `<FormField>` pattern.
- The `ContentEditTabs` tab trigger shows a red error dot when that tab contains a validation error.
- The save button is disabled when the form is invalid (standard `useEntityEdit` behaviour).
- Valid channel forms save successfully; invalid ones do not reach the API.

## Implementation Notes

### Zod schema scope

Extend the channel Zod schema in `[id].vue` to cover all VeeValidate-bound fields:

**General tab fields:**
- `displayName: z.string().min(1)` — required
- `name: z.string().min(1).regex(/^[a-z0-9-]+$/)` — lowercase slug, auto-generated but editable
- `url: z.string().url()` — full URL (Zod `.url()` validates format)
- `type: z.enum(['webshop', 'physical', 'other'])`

**Mail general settings fields** (if stored as form fields rather than standalone refs):
- `mail.displayName: z.string().min(1)`
- `mail.fromEmailAddress: z.string().email()`
- `mail.loginUrl: z.string().url().optional().or(z.literal(''))`
- `mail.passwordResetUrl: z.string().url().optional().or(z.literal(''))`
- `mail.bccEmail: z.string().email().optional().or(z.literal(''))`
- `mail.smtpHost: z.string().optional()`
- `mail.smtpPort: z.coerce.number().int().min(1).max(65535).optional()`
- `mail.smtpUser: z.string().optional()`
- `mail.smtpPassword: z.string().optional()`

**Storefront settings**: Schema-driven values live outside VeeValidate (managed by `StorefrontSchemaRenderer`). Validate only the schema JSON field (valid JSON string) if it is exposed as a form field. Individual settings values are not validated by Zod — schema-level validation is out of scope for this issue.

**Sub-entity arrays** (markets, languages, payments): These are standalone refs managed outside VeeValidate — no Zod validation. The constraint "at least one default market" is enforced by UX (the last market cannot be removed) rather than schema validation.

### Per-tab error indicators

`ContentEditTabs` receives a `tabs` prop of `string[] | { label, badge? }[]`. Extend this to support an `error?: boolean` flag on the object variant:

```ts
// Extended tab descriptor
interface TabDescriptor {
  label: string
  badge?: number
  error?: boolean
}
```

When `error: true`, the tab trigger renders a small red dot (e.g. `<span class="absolute -right-1 -top-1 size-2 rounded-full bg-destructive" />`) in the trigger button's top-right corner.

In `[id].vue`, compute per-tab error state from VeeValidate's `form.errors`:

```ts
const tabErrors = computed(() => ({
  general: !!(errors.value.displayName || errors.value.name || errors.value.url),
  mails: !!(errors.value['mail.displayName'] || errors.value['mail.fromEmailAddress'] || ...),
  // storefrontSettings, markets, payments: no schema errors (managed outside VeeValidate)
}))
```

Pass the computed error state into the `tabs` prop of `ContentEditTabs`.

### `ContentEditTabs` changes

- Add `error?: boolean` to the `TabDescriptor` type (already used for `badge`).
- Render the red dot conditionally in the tab trigger — use `absolute` positioning inside a `relative` wrapper on the trigger, following the `v-auto-animate` gotcha note in `CLAUDE.md` (use CSS opacity/scale transitions, not `v-if/v-else` with auto-animate).
- No breaking changes to existing usages — `error` defaults to `false`/`undefined`.

### Helper texts and field-level error messages

Add descriptive validation error messages as i18n keys:
- `channel.validation_display_name_required` → `"Display name is required"`
- `channel.validation_url_format` → `"Enter a valid URL (e.g. https://www.myshop.com)"`
- `channel.validation_name_format` → `"Name must be lowercase letters, numbers, and hyphens only"`
- `channel.validation_email_format` → `"Enter a valid email address"`
- `channel.validation_smtp_port_range` → `"Port must be between 1 and 65535"`
- (Swedish equivalents in `sv.json`)

## Acceptance Criteria

- Clearing `displayName` and clicking Save shows a VeeValidate error on the field; save is blocked.
- Entering an invalid URL in the URL field shows a format error.
- Entering an invalid email in `fromEmailAddress` shows an email format error.
- When the General tab has errors, the General tab trigger shows a red error dot.
- When the Mails tab has errors, the Mails tab trigger shows a red error dot.
- Fixing all errors removes the error dots.
- `ContentEditTabs` change is backward-compatible: existing usages with string arrays or `{ label, badge }` objects work unchanged.
- All validation error messages exist in both `en.json` and `sv.json`.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: test that `tabErrors.general` is `true` when `displayName` error is present; test that `ContentEditTabs` renders the error dot when `error: true` is passed; test that the error dot is absent when `error: false`; test that submitting an invalid form calls no API methods.

## Agent Execution

- **Model**: opus
- **Mode**: claude-code interactive
- **Why**: Extends a shared UI primitive (`ContentEditTabs`), defines the complete cross-tab Zod schema, and introduces a new computed error-state pattern — risk-medium with broad impact across the channel edit page; human review before applying is warranted.
