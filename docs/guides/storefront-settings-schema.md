# Storefront Settings Schema

The Storefront Settings tab in a channel is entirely driven by a **JSON schema**. The schema defines what tabs, sections, and fields appear in the UI — no code changes are needed to customize it.

Geins ships a **default schema** with two tabs: _Base settings_ and _Layout options_. Merchants building custom storefronts can replace it with their own schema to get a completely different editor.

---

## How the schema maps to the UI

```
Schema (JSON)                     UI
─────────────────────────────     ──────────────────────────────
Top-level key                 →   Sub-tab (e.g. "Base settings")
  sections[]                  →     Section card
    fields[]                  →       Form fields inside the card
      children[] (optional)   →         Nested fields / group toggles
```

### Top-level structure

```json
{
  "baseSettings": {
    "label": "Base settings",
    "sections": [ ... ]
  },
  "layoutOptions": {
    "label": "Layout options",
    "sections": [ ... ]
  }
}
```

Each key becomes a sub-tab. The `label` is what users see in the tab bar.

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

| Property      | Required | Description                                         |
| ------------- | -------- | --------------------------------------------------- |
| `key`         | Yes      | Unique identifier (used as the settings key prefix) |
| `title`       | Yes      | Heading shown at the top of the section card        |
| `description` | No       | Subtitle shown below the heading                    |
| `icon`        | No       | Lucide icon name shown next to the section title    |
| `fields`      | Yes      | Array of field definitions (see below)              |

---

## Field types

### `radio-cards`

Renders a set of card-style radio buttons. Each option shows an icon, label, and description.

```json
{
  "key": "storefrontMode",
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
  "key": "themeColors.siteBackground.color",
  "type": "radio-cards",
  "label": "Site background",
  "default": "#ffffff",
  "options": [
    {
      "value": "#ffffff",
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

### `boolean`

Renders a toggle switch.

```json
{
  "key": "accessRequirements.priceVisibility",
  "type": "boolean",
  "label": "Price visibility",
  "description": "Prices are visible only to logged-in users.",
  "icon": "DollarSign",
  "default": true
}
```

**Renders as:** A labeled row with a toggle on the right. The description appears as a subtitle.

---

### `group`

A toggle that acts as a parent for a set of nested boolean fields. When the group toggle is off, the children are visually dimmed/disabled.

```json
{
  "key": "accessRequirements",
  "type": "group",
  "label": "Access requirements",
  "description": "Define which actions require login.",
  "icon": "UserLock",
  "default": true,
  "children": [
    {
      "key": "accessRequirements.priceVisibility",
      "type": "boolean",
      "label": "Price visibility",
      "description": "Prices are visible only to logged-in users.",
      "icon": "DollarSign",
      "default": true
    },
    {
      "key": "accessRequirements.orderPlacement",
      "type": "boolean",
      "label": "Order placement",
      "description": "Orders can only be placed by logged-in users.",
      "icon": "ShoppingCart",
      "default": true
    },
    {
      "key": "accessRequirements.stockStatus",
      "type": "boolean",
      "label": "Stock status",
      "description": "Stock levels are visible only to logged-in users.",
      "icon": "ChartColumn",
      "default": false
    }
  ]
}
```

**Renders as:** A toggle row at the top followed by indented child toggles.

---

### `color`

Renders a color picker input.

```json
{
  "key": "themeColors.primary",
  "type": "color",
  "label": "Primary color",
  "columns": 4,
  "default": "#171717"
}
```

**Renders as:** A color swatch button that opens a color picker overlay.

---

### `font`

Renders a font picker (searchable select populated with Google Fonts).

```json
{
  "key": "fonts.headings",
  "type": "font",
  "label": "Headings",
  "description": "Used for heading elements on pages and content.",
  "placeholder": "Geist (template default)",
  "default": "Geist",
  "columns": 2
}
```

**Renders as:** A searchable dropdown. The selected font name is previewed in that font.

---

### `file`

Renders a file upload input. Used for images (e.g. logotype).

```json
{
  "key": "logotype",
  "type": "file",
  "label": "Logotype",
  "accept": "image/*",
  "columns": 2
}
```

| Property  | Description                                         |
| --------- | --------------------------------------------------- |
| `accept`  | MIME type filter, e.g. `"image/*"` or `"image/png"` |
| `columns` | Grid width (out of 4). `2` = half width, `4` = full |

**Renders as:** A drag-and-drop upload zone with a preview thumbnail after upload.

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
          "key": "themeColors.buttons.general.background",
          "type": "color",
          "label": "Background",
          "columns": 2
        },
        {
          "key": "themeColors.buttons.general.text",
          "type": "color",
          "label": "Text",
          "columns": 2
        }
      ]
    }
  ]
}
```

**Renders as:** A labeled sub-group with its children laid out in a grid.

---

## Common field properties

| Property      | Type   | Description                                                            |
| ------------- | ------ | ---------------------------------------------------------------------- |
| `key`         | string | Dot-notation path used to store the value (e.g. `themeColors.primary`) |
| `type`        | string | Field type (see above)                                                 |
| `label`       | string | Field label shown to the user                                          |
| `description` | string | Subtitle / helper text below the label                                 |
| `icon`        | string | Lucide icon name shown next to the label                               |
| `default`     | any    | Default value applied when no override is set                          |
| `columns`     | number | Grid column span (1–4). Controls the field's width                     |
| `children`    | array  | Nested fields (used by `group` and `sub-section`)                      |

---

## Settings storage

Settings are stored as a flat key→value object using the dot-notation `key` from each field:

```json
{
  "storefrontMode": "commerce",
  "accessRequirements.priceVisibility": true,
  "accessRequirements.orderPlacement": true,
  "accessRequirements.stockStatus": false,
  "cornerStyle": "round",
  "fonts.headings": "Inter",
  "fonts.body": "Geist",
  "themeColors.primary": "#0f172a",
  "themeColors.secondary": "#ffffff",
  "themeColors.buttons.general.background": "#0f172a",
  "themeColors.buttons.general.text": "#ffffff",
  "themeColors.siteBackground.color": "#ffffff",
  "themeColors.navBarBackground.color": "#F5F5F5"
}
```

The backend treats both the schema and the settings as opaque JSON — it stores and returns them without interpretation. The frontend is responsible for mapping dot-notation keys to nested structure.

---

## Default schema reference

The default Geins schema covers two tabs:

### Base settings

| Section             | Field                                | Type        | Default    |
| ------------------- | ------------------------------------ | ----------- | ---------- |
| Storefront mode     | `storefrontMode`                     | radio-cards | `commerce` |
| Access requirements | `accessRequirements.priceVisibility` | boolean     | `true`     |
| Access requirements | `accessRequirements.orderPlacement`  | boolean     | `true`     |
| Access requirements | `accessRequirements.stockStatus`     | boolean     | `false`    |

### Layout options

| Section       | Field                                     | Type        | Default   |
| ------------- | ----------------------------------------- | ----------- | --------- |
| Logotype      | `logotype`                                | file        | —         |
| Corner style  | `cornerStyle`                             | radio-cards | `square`  |
| Font settings | `fonts.headings`                          | font        | `Geist`   |
| Font settings | `fonts.body`                              | font        | `Geist`   |
| Theme colors  | `themeColors.primary`                     | color       | `#171717` |
| Theme colors  | `themeColors.secondary`                   | color       | `#ffffff` |
| Theme colors  | `themeColors.buttons.general.background`  | color       | —         |
| Theme colors  | `themeColors.buttons.general.text`        | color       | —         |
| Theme colors  | `themeColors.buttons.purchase.background` | color       | —         |
| Theme colors  | `themeColors.buttons.purchase.text`       | color       | —         |
| Theme colors  | `themeColors.siteBackground.color`        | radio-cards | `#ffffff` |
| Theme colors  | `themeColors.navBarBackground.color`      | radio-cards | `#F5F5F5` |
| Theme colors  | `themeColors.topBar.background`           | color       | —         |
| Theme colors  | `themeColors.topBar.text`                 | color       | —         |
| Theme colors  | `themeColors.footer.background`           | color       | —         |
| Theme colors  | `themeColors.footer.text`                 | color       | —         |

---

## Using a custom schema

From the channel edit page, open the `...` menu on the Storefront Settings tab and choose **Edit schema**. This opens a JSON editor where you can paste a custom schema. Changes take effect immediately after clicking **Apply**.

To revert to the Geins default, click **Reset to default** in the same panel.

> **Note:** Custom schema keys map directly to your storefront's settings consumption code. Changing key names will break existing saved values until you migrate the stored settings.
