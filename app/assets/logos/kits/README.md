# Kit logos

Logos shown on the integration directory cards (`/settings/orchestrator/kits/list`)
and the install dialog header.

The kit API has no logo field, so logos are resolved locally by matching the kit
against the SVG filenames in this folder.

## Naming

Drop an `.svg` here named after a **slugified** kit identifier. A logo is matched
when its filename (without extension) equals the slug of any of, in priority order:

1. the kit **name** — e.g. `Klaviyo Sync` → `klaviyo-sync.svg`
2. the kit **category** — e.g. `ERP Integration` → `erp-integration.svg`
3. any kit **tag** — e.g. tag `monitor` → `monitor.svg`

Slug = lowercased, non-alphanumeric runs collapsed to `-` (e.g. `Monitor ERP Sync`
→ `monitor-erp-sync`).

Kits with no matching file fall back to a generated initials avatar.

SVGs are imported as Vue components (via `import.meta.glob`), so keep them as plain
inline SVG markup — no `<?xml?>` prolog needed.
