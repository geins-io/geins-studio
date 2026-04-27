# Storefront Settings Schema

The Storefront Settings tab in a channel is entirely driven by a **JSON schema**. The schema defines what tabs, sections, and fields appear in the UI — no code changes are needed to customize it.

Geins ships a **default schema** with four tabs: _Base settings_, _Layout options_, _SEO_, and _Contact_. Merchants building custom storefronts can replace it with their own schema to get a completely different editor.

---

## How the schema maps to the UI

```
Schema (JSON)                     UI
─────────────────────────────     ──────────────────────────────
Top-level key                 →   Sub-tab (e.g. "Base settings")
  sections[]                  →     Section card
    fields[]                  →       Form fields inside the card
      children[] (optional)   →         Nested fields / sub-sections
```

### Top-level structure

```json
{
  "baseSettings": {
    "label": "Base settings",
    "sections": [ ... ]
  },
  "layoutOptions": { "label": "Layout options", "sections": [ ... ] },
  "seo":           { "label": "SEO",            "sections": [ ... ] },
  "contact":       { "label": "Contact",        "sections": [ ... ] }
}
```

Each key becomes a sub-tab. The `label` is what users see in the tab bar. **Tab keys are purely a UI concern** — they do NOT correspond to top-level keys in the persisted settings object.

---

## Section

A section groups related fields under a heading.

```json
{
  "key": "storefrontMode",
  "title": "Storefront mode",
  "description": "Choose if you want your storefront to enable direct purchases…",
  "icon": "ShoppingCart",
  "fields": [ ... ]
}
```

| Property      | Required | Description                                                              |
| ------------- | -------- | ------------------------------------------------------------------------ |
| `key`         | Yes      | Unique layout identifier for the section card. Not part of the data shape. |
| `title`       | Yes      | Heading shown at the top of the section card                             |
| `description` | No       | Subtitle shown below the heading                    |
| `icon`        | No       | Lucide icon name shown next to the section title    |
| `fields`      | Yes      | Array of field definitions (see below)              |

---

## Field types

### `radio-cards`

Renders a set of card-style radio buttons. Each option shows an icon, label, and description.

```json
{
  "key": "mode",
  "type": "radio-cards",
  "label": "Storefront mode",
  "default": "commerce",
  "options": [
    {
      "value": "commerce",
      "label": "Commerce",
      "description": "Enables visitors to purchase your products directly.",
      "icon": "ShoppingCart"
    },
    {
      "value": "catalogue",
      "label": "Catalogue",
      "description": "Shows all your products without buy buttons or checkout.",
      "icon": "BookOpenText"
    }
  ]
}
```

**Renders as:** Two (or more) selectable cards side by side. The active card is highlighted.

**Option properties:**

| Property      | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `value`       | The stored value when this option is selected                |
| `label`       | Option title                                                 |
| `description` | Short explanation shown below the label                      |
| `icon`        | Lucide icon name shown at the top of the card                |
| `type`        | Set to `"color"` to render a color swatch instead of an icon |

**Example — site background picker using `type: "color"`:**

```json
{
  "key": "theme.colors.siteBackground",
  "type": "radio-cards",
  "label": "Site background",
  "default": "#FFFFFF",
  "options": [
    {
      "value": "#FFFFFF",
      "label": "White",
      "type": "color",
      "description": "The background of your storefront will be white"
    },
    {
      "value": "#FAFAFA",
      "label": "Light gray",
      "type": "color",
      "description": "The background of your storefront will be light gray"
    }
  ]
}
```

---

### `radio`

Renders a standard vertical list of radio buttons. Simpler than `radio-cards` — shows only a label per option, no icons or descriptions.

```json
{
  "key": "seo.robots",
  "type": "radio",
  "label": "Robots policy",
  "default": "index, follow",
  "options": [
    { "value": "index, follow", "label": "Index, follow" },
    { "value": "noindex, nofollow", "label": "No index, no follow" }
  ]
}
```

---

### `boolean`

Renders a toggle switch.

```json
{
  "key": "feature.someToggle",
  "type": "boolean",
  "label": "Some toggle",
  "description": "Optional description.",
  "icon": "ToggleLeft",
  "default": true
}
```

**Renders as:** A labeled row with a toggle on the right.

---

### `boolean-choice`

A toggle that, when enabled, reveals a secondary choice (radio buttons or radio cards). Generic "switch + revealed choice" pattern. Always stores `{ enabled: boolean, [choiceKey]: value }` at the field's path.

```json
{
  "key": "features.priceVisibility",
  "type": "boolean-choice",
  "label": "Price visibility",
  "description": "Controls whether prices are shown on the storefront.",
  "icon": "DollarSign",
  "default": { "enabled": true, "access": "authenticated" },
  "choice": {
    "key": "access",
    "label": "Who can see prices",
    "type": "radio",
    "options": [
      { "value": "authenticated", "label": "Authenticated users only" },
      { "value": "all", "label": "All users" }
    ]
  }
}
```

| `choice` property | Description                                                                  |
| ----------------- | ---------------------------------------------------------------------------- |
| `key`             | Inner property name (e.g. `access` → produces `features.priceVisibility.access`) |
| `label`           | Optional label shown above the revealed choice                               |
| `type`            | `radio` or `radio-cards` — delegates to the matching renderer                |
| `options`         | Choice options (`SchemaFieldOption[]`)                                       |

**Renders as:** A `ContentSwitch` with a master `Switch`; flipping it on reveals the inner choice with an animated transition.

---

### `color`

Renders a color picker input.

```json
{
  "key": "theme.colors.buttonBackground",
  "type": "color",
  "label": "Background",
  "columns": 4,
  "default": "#0E7490"
}
```

---

### `font`

Renders a font picker (searchable select populated with Google Fonts).

```json
{
  "key": "theme.typography.headingFontFamily",
  "type": "font",
  "label": "Headings",
  "description": "Used for heading elements on pages and content.",
  "placeholder": "Geist (template default)",
  "default": "Hanuman",
  "columns": 2
}
```

---

### `image`

Renders an image upload input with a square preview thumbnail.

```json
{
  "key": "branding.logoUrl",
  "type": "image",
  "label": "Logotype",
  "description": "PNG, JPEG, SVG, or WebP. Maximum file size: 5 MB.",
  "accept": "image/png,image/jpeg,image/svg+xml,image/webp",
  "maxSizeMB": 5,
  "columns": 2
}
```

| Property      | Type   | Description                                                                                                                                                    |
| ------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `description` | string | Free-text hint shown inside the empty-state of the upload card. Use this to communicate constraints (size, accepted formats, intent) — nothing auto-generated. |
| `accept`      | string | Standard HTML `accept` value (comma-separated MIME types and/or extensions, e.g. `".ico,image/x-icon"` or `"image/png,image/svg+xml"`). Defaults to `image/*`.   |
| `maxSizeMB`   | number | Maximum file size in megabytes. Files exceeding the limit are rejected with a toast. Not auto-rendered — describe it in `description` if you want it visible.   |

---

### `string`

Renders a single-line text input.

```json
{
  "key": "seo.defaultTitle",
  "type": "string",
  "label": "Default title",
  "placeholder": "My Store",
  "default": ""
}
```

---

### `textarea`

Renders a multi-line text input. Use for free-text content longer than a single line, e.g. SEO meta descriptions.

```json
{
  "key": "seo.defaultDescription",
  "type": "textarea",
  "label": "Default description",
  "description": "Recommended max ~160 characters.",
  "default": ""
}
```

---

### `sub-section`

A layout container for grouping related fields visually. Does not produce a value itself.

```json
{
  "key": "themeColors.buttons",
  "type": "sub-section",
  "label": "Buttons",
  "description": "Set background and text colors for buttons.",
  "columns": 2,
  "children": [
    {
      "key": "themeColors.buttons.general",
      "type": "sub-section",
      "label": "General buttons",
      "children": [
        {
          "key": "theme.colors.buttonBackground",
          "type": "color",
          "label": "Background",
          "columns": 2
        },
        {
          "key": "theme.colors.buttonText",
          "type": "color",
          "label": "Text",
          "columns": 2
        }
      ]
    }
  ]
}
```

`sub-section` `key` values are layout-only and do not need to match the data shape — only leaf field `key`s map to stored values.

---

## Common field properties

| Property      | Type   | Description                                                                  |
| ------------- | ------ | ---------------------------------------------------------------------------- |
| `key`         | string | Deep dot-notation path used to store the value (e.g. `theme.colors.buttonBackground`) |
| `type`        | string | Field type (see above)                                                       |
| `label`       | string | Field label shown to the user                                                |
| `description` | string | Subtitle / helper text below the label                                       |
| `icon`        | string | Lucide icon name shown next to the label                                     |
| `default`     | any    | Default value applied when no override is set                                |
| `columns`     | number | Grid column span (1–4). Controls the field's width                           |
| `children`    | array  | Nested fields (used by `sub-section`)                                        |
| `choice`      | object | Inner choice descriptor (used by `boolean-choice`)                           |

---

## Settings storage

Settings are stored as a **nested object**. Each field's `key` is a deep dot-notation path that walks into the nested shape.

```json
{
  "mode": "commerce",
  "theme": {
    "colors": {
      "buttonBackground": "#0E7490",
      "buttonText": "#FFFFFF",
      "buttonPurchaseBackground": "#0E7490",
      "buttonPurchaseText": "#FFFFFF",
      "siteBackground": "#FFFFFF",
      "navBarBackground": "#F5F5F5",
      "topBarBackground": "#0E7490",
      "topBarText": "#FFFFFF",
      "footerBackground": "#F5F5F5",
      "footerText": "#0A0A0A"
    },
    "radius": "0",
    "typography": {
      "fontFamily": "Geist",
      "headingFontFamily": "Hanuman"
    }
  },
  "branding": { "logoUrl": "", "faviconUrl": "" },
  "features": {
    "priceVisibility": { "enabled": true, "access": "authenticated" },
    "orderPlacement":  { "enabled": true, "access": "authenticated" },
    "stockStatus":     { "enabled": false, "access": "authenticated" }
  },
  "seo": {
    "defaultTitle": "", "titleTemplate": "", "defaultDescription": "",
    "defaultKeywords": "", "robots": "index, follow",
    "googleAnalyticsId": "", "googleTagManagerId": "", "verification": ""
  },
  "contact": {
    "email": "", "phone": "",
    "address": { "street": "", "city": "", "postalCode": "", "country": "" }
  }
}
```

The backend treats both the schema and the settings as opaque JSON — it stores and returns them without interpretation. The frontend's `getSettingValue` / `setSettingValue` helpers in `app/utils/storefront.ts` walk the deep paths.

### File uploads (multipart)

When a field of type `image` has a `File` value at save time, the channel update repository extracts it into a multipart part named with the field's full deep path (e.g. `storefrontSettings.branding.logoUrl`) and substitutes an empty string in the JSON payload. The walker recurses into nested objects, so file paths can live anywhere in the shape.

---

## Default schema reference

The default Geins schema covers four tabs:

### Base settings

| Section             | Field                       | Type           | Default                                          |
| ------------------- | --------------------------- | -------------- | ------------------------------------------------ |
| Storefront mode     | `mode`                      | radio-cards    | `commerce`                                       |
| Access requirements | `features.priceVisibility`  | boolean-choice | `{ enabled: true, access: "authenticated" }`     |
| Access requirements | `features.orderPlacement`   | boolean-choice | `{ enabled: true, access: "authenticated" }`     |
| Access requirements | `features.stockStatus`      | boolean-choice | `{ enabled: false, access: "authenticated" }`    |

### Layout options

| Section       | Field                                  | Type        | Default   |
| ------------- | -------------------------------------- | ----------- | --------- |
| Branding      | `branding.logoUrl`                     | image       | —         |
| Branding      | `branding.faviconUrl`                  | image       | —         |
| Corner style  | `theme.radius`                         | radio-cards | `0`       |
| Font settings | `theme.typography.headingFontFamily`   | font        | `Hanuman` |
| Font settings | `theme.typography.fontFamily`          | font        | `Geist`   |
| Theme colors  | `theme.colors.buttonBackground`        | color       | `#0E7490` |
| Theme colors  | `theme.colors.buttonText`              | color       | `#FFFFFF` |
| Theme colors  | `theme.colors.buttonPurchaseBackground`| color       | `#0E7490` |
| Theme colors  | `theme.colors.buttonPurchaseText`      | color       | `#FFFFFF` |
| Theme colors  | `theme.colors.siteBackground`          | radio-cards | `#FFFFFF` |
| Theme colors  | `theme.colors.navBarBackground`        | radio-cards | `#F5F5F5` |
| Theme colors  | `theme.colors.topBarBackground`        | color       | `#0E7490` |
| Theme colors  | `theme.colors.topBarText`              | color       | `#FFFFFF` |
| Theme colors  | `theme.colors.footerBackground`        | color       | `#F5F5F5` |
| Theme colors  | `theme.colors.footerText`              | color       | `#0A0A0A` |

### SEO

| Section          | Field                       | Type     | Default          |
| ---------------- | --------------------------- | -------- | ---------------- |
| SEO & analytics  | `seo.defaultTitle`          | string   | `""`             |
| SEO & analytics  | `seo.titleTemplate`         | string   | `""`             |
| SEO & analytics  | `seo.defaultDescription`    | textarea | `""`             |
| SEO & analytics  | `seo.defaultKeywords`       | string   | `""`             |
| SEO & analytics  | `seo.robots`                | radio    | `index, follow`  |
| SEO & analytics  | `seo.googleAnalyticsId`     | string   | `""`             |
| SEO & analytics  | `seo.googleTagManagerId`    | string   | `""`             |
| SEO & analytics  | `seo.verification`          | string   | `""`             |

### Contact

| Section          | Field                       | Type     | Default |
| ---------------- | --------------------------- | -------- | ------- |
| Contact details  | `contact.email`             | string   | `""`    |
| Contact details  | `contact.phone`             | string   | `""`    |
| Contact details  | `contact.address.street`    | string   | `""`    |
| Contact details  | `contact.address.postalCode`| string   | `""`    |
| Contact details  | `contact.address.city`      | string   | `""`    |
| Contact details  | `contact.address.country`   | string   | `""`    |

---

## Using a custom schema

From the channel edit page, open the `...` menu on the Storefront Settings tab and choose **Edit schema**. This opens a JSON editor where you can paste a custom schema. Changes take effect immediately after clicking **Apply**.

To revert to the Geins default, click **Reset to default** in the same panel.

> **Note:** Custom schema keys map directly to your storefront's settings consumption code. Changing key names will break existing saved values until you migrate the stored settings.
