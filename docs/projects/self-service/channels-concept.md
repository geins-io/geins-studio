# Channels — Concept Documentation

> Domain model, relationships, and data flow for the Channel entity in Geins Commerce.

---

## What is a Channel?

A **Channel** represents a sales channel — a distinct storefront or point of sale through which products are sold to customers. The most common type is a **webshop**, but channels can also represent physical stores or other sales points.

Each Geins account can have multiple channels. A channel is the top-level container that ties together _where_ you sell (markets), _what_ the customer sees (storefront settings, languages), _how_ they pay (payment methods), and _what_ communications they receive (transaction mails).

### Channel identity

| Field         | Description                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------- |
| `name`        | Internal/admin name — not shown to customers. Auto-generated from display name on creation. |
| `displayName` | The customer-facing name of the channel.                                                    |
| `url`         | The channel's URL (e.g. `www.butiken.se`). Changing this breaks existing links.             |
| `type`        | `webshop`, `physical`, or `other`.                                                          |
| `active`      | Whether the channel is live and operational.                                                |

---

## What's inside a Channel?

A channel is composed of several sub-systems, each managing a different aspect of the sales experience:

```
Channel
├── Languages (what languages the storefront supports)
├── Markets (where you sell — country + currency combinations)
├── Payment methods (how customers can pay)
├── Transaction mails (automated emails sent to customers)
├── Product search config (how products are found in the storefront)
└── Storefront settings (how the storefront looks and behaves)
```

---

## Languages

A channel has one **default language** and zero or more **additional languages**. These determine which translations are available on the storefront.

- **Default language**: The primary language of the channel. Always active. Can be changed but not removed.
- **Additional languages**: Optional languages that can be individually activated or deactivated. When active, customers can switch to that language on the storefront.

Languages are selected from the full list of system languages available in the Geins account. The `defaultLanguage` field and the `languages` array are both part of the Channel entity and updated via the channel PATCH endpoint.

### Language properties

All entity types extend `EntityBase` (`_id`, `_type`) from `shared/types/Global.ts`.

| Field    | Description                                      |
| -------- | ------------------------------------------------ |
| `_id`    | Unique identifier                                |
| `name`   | Language name (e.g. "Swedish", "English")        |
| `active` | Whether this language is enabled for the channel |

---

## Markets

A market represents a **country + currency combination** — it defines where products can be sold and in what currency. Each channel has one **default market** and zero or more **additional markets**.

Markets are a shared entity in Geins — they exist independently of channels and can be assigned to multiple channels. From the channel context, markets are **read-only** (you can add/remove/enable/disable them, but editing market properties like currency or VAT happens on the dedicated market page).

### Market properties (read-only from channel)

| Field              | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `_id`              | Unique identifier                                     |
| `country`          | The country this market serves (e.g. Sweden, Denmark) |
| `currency`         | The currency used (e.g. SEK, EUR, DKK)                |
| `virtual`          | Whether this is a virtual market                      |
| `allowedLanguages` | Which languages are available in this market          |
| `defaultLanguage`  | The default language for this market                  |
| `group`            | Optional grouping (e.g. "EU") for organizing markets  |
| `active`           | Whether the market is active on this channel          |

### How markets connect

```
Channel
└── Markets[]
    ├── Default market (1) — the primary selling country/currency
    └── Additional markets (0..n) — each can be enabled/disabled per channel
        └── Country → Currency → VAT rate
```

Markets determine which products are shown (products have prices per currency), which shipping options are available, and which payment methods apply.

---

## Payment Methods

Payment methods define **how customers can pay** on the channel. All available payment methods in the system are shown on the channel, and each can be individually **enabled or disabled**.

Payment methods are not created or configured from the channel page — the channel only controls which ones are active. Configuration (markets, customer types, customer groups) is managed elsewhere and displayed as read-only context.

### Payment method properties

| Field            | Description                                                |
| ---------------- | ---------------------------------------------------------- |
| `_id`            | Unique identifier                                          |
| `name`           | Method name (e.g. "Manual Invoice", "Geins Pay", "PayPal") |
| `icon`           | Logo or icon for the payment provider                      |
| `markets`        | Which markets this method is available in                  |
| `customerTypes`  | Which customer types can use this (e.g. "Company", "All")  |
| `customerGroups` | Which customer groups can use this (e.g. "Buyers", "All")  |
| `active`         | Whether this method is active on the channel               |

---

## Transaction Mails

Transaction mails are **automated emails** sent to customers when specific events happen (order confirmed, item shipped, password reset, etc.). Each channel has its own mail configuration.

### Structure

Mails have three layers of configuration:

1. **General settings** — shared across all mail templates for the channel:
   - Display name (sender name)
   - From email address
   - Login URL, Password reset URL
   - BCC email for order confirmations

2. **Layout options** — shared visual styling across all mail templates:
   - Images: logo, header image
   - Colors: background, body, header background, button background, button text
   - Font settings: heading and body fonts

3. **Mail content** — per-template text and state:
   - Each template type has its own content fields (title, subtitle, footer) with template variable support (e.g. `{name}`, `{refund_amount}`)
   - Content is translatable per language
   - Each template can be individually enabled/disabled

### Mail template types

| Template                | Trigger                              |
| ----------------------- | ------------------------------------ |
| `CustomerRefunded`      | A refund is issued                   |
| `CustomerRegistered`    | A new customer account is created    |
| `CustomerUnregistered`  | A customer account is deleted        |
| `CustomerPasswordReset` | A password reset is requested        |
| `OrderConfirmation`     | An order is placed                   |
| `OrderDelivered`        | An order is marked as delivered      |
| `OrderCancelled`        | An order is cancelled                |
| `OrderRowRemoved`       | A line item is removed from an order |
| `OrderRowReturned`      | A line item is returned              |

### API design

- Single endpoint with **template type as a parameter** (not one endpoint per template)
- Mail preview is a separate endpoint that returns **rendered HTML**
- Layout options are shared across all templates (not per-template)

---

## Product Search Configuration

Search configuration controls **how products are found** when customers search in the storefront. It defines which fields are indexed, their relative weighting (importance), and whether they're enabled.

### Built-in search fields

| Field                  | Description                       |
| ---------------------- | --------------------------------- |
| `ArticleNumber`        | Product article number            |
| `Product id`           | Internal product ID               |
| `Name`                 | Product name                      |
| `Category name`        | Name of the product's category    |
| `Category description` | Category description text         |
| `Brand`                | Brand name                        |
| `SKU Article number`   | SKU-level article number          |
| `Text 1–3`             | Custom text fields on the product |

Each field has:

- **Weighting**: A numeric value (e.g. `1.5`) that determines how important matches in this field are relative to other fields. Higher = more important.
- **Enabled**: Whether the field is indexed and searchable at all.

### Custom search fields

In addition to the built-in fields, up to **6 custom search fields** can be added. These follow the same weighting + enabled pattern.

There is a "Restore to default weighting" action that resets all weights to their default values.

> **Note**: Product search has the lowest priority in this project. It likely has its own dedicated API endpoint per channel.

---

## Storefront Settings

Storefront settings control **how the storefront looks and behaves**. This is the most complex and highest-priority part of the channel configuration.

### JSON schema-driven

The entire storefront settings section is **driven by a JSON schema**. The schema defines:

- **Which tabs** appear (top-level keys = sub-tabs)
- **Which sections and fields** each tab contains
- **What input types** to render (toggles, dropdowns, color pickers, file uploads, etc.)

This means the settings UI is fully dynamic. Geins provides a **default schema** with standard tabs, but users building custom storefronts can **replace the schema entirely** to get a completely different set of settings tailored to their storefront.

### Default schema tabs

The default Geins storefront schema has two tabs:

#### Base settings

Controls the fundamental behavior of the storefront.

- **Storefront mode**: Choose between:
  - **Commerce** — full e-commerce with buy buttons and checkout flow
  - **Catalogue** — product display only, no purchasing
- **Access Requirements** — global rules for what requires login:
  - Price visibility (prices only for logged-in users)
  - Order placement (only logged-in users can order)
  - Stock status (stock levels only for logged-in users)

#### Layout options

Controls the visual appearance of the storefront.

- **Logotype**: Upload a logo image
- **Corner style**: Square or rounded corners for UI elements
- **Font settings**: Heading font and body text font (dropdowns)
- **Theme colors**: Color pickers for the storefront palette (future)

### Custom schemas

Users can replace the default schema via the "Change JSON schema" action in the `...` menu. This opens an editor panel where they can paste or edit a JSON schema. The schema defines the complete tab/section/field structure, so a custom storefront could have entirely different settings (e.g. "Hero banner", "Navigation style", "Footer links") with no overlap to the default.

### Preview

A "Preview" button opens the storefront in a new browser tab with a preview token, allowing the user to see the effect of their settings changes before publishing.

---

## How everything connects

```
Geins Account
└── Channel (e.g. "Swedish Webshop")
    │
    ├── Identity
    │   ├── name: "swedish-webshop" (internal)
    │   ├── displayName: "Butiken"
    │   ├── url: "www.butiken.se"
    │   └── active: true
    │
    ├── Languages
    │   ├── defaultLanguage: Swedish
    │   └── additional: [English (active), Danish (active), Finnish (inactive)]
    │
    ├── Markets
    │   ├── defaultMarket: Sweden (SEK, 25% VAT)
    │   └── additional:
    │       ├── Denmark (DKK, 25% VAT, group: EU) — active
    │       ├── Finland (EUR, 25% VAT, group: EU) — active
    │       ├── Norway (NOK, 25% VAT) — active
    │       └── Germany (EUR, 19% VAT, group: EU) — inactive
    │
    ├── Payment methods
    │   ├── Manual Invoice — enabled
    │   ├── Geins Pay — enabled
    │   ├── SVEA — disabled
    │   └── PayPal — enabled
    │
    ├── Transaction mails
    │   ├── General: from "butiken@geins.io", display "Butiken"
    │   ├── Layout: logo.png, blue header, Geist font
    │   └── Templates:
    │       ├── OrderConfirmation — enabled, translated to SV/EN/DA
    │       ├── CustomerRegistered — disabled
    │       └── ... (9 template types)
    │
    ├── Product search
    │   ├── ArticleNumber: weight 1.5, enabled
    │   ├── Name: weight 2.0, enabled
    │   ├── Brand: weight 1.0, disabled
    │   └── ... + up to 6 custom fields
    │
    └── Storefront settings (JSON schema-driven)
        ├── [Tab: Base settings]
        │   ├── mode: "commerce"
        │   └── accessRequirements: { priceVisibility: true, orderPlacement: true, stockStatus: false }
        └── [Tab: Layout options]
            ├── logotype: "logo.png"
            ├── cornerStyle: "round"
            └── fonts: { headings: "Geist", body: "Geist" }
```

### Key relationships

- **Languages ↔ Markets**: Each market has `allowedLanguages` and a `defaultLanguage`. The channel's language list should be a superset of what its markets need.
- **Markets ↔ Products**: Products have prices per currency. A market's currency determines which product prices are shown. The product search and product listings are filtered by market.
- **Markets ↔ Payment methods**: Payment methods can be restricted to specific markets (e.g. SVEA only in Sweden).
- **Storefront settings ↔ Everything**: The storefront mode (Commerce vs Catalogue) affects whether payment and checkout flows are relevant. Layout options affect the visual presentation of all pages.
- **Mails ↔ Languages**: Mail content is translated per language. The available languages come from the channel's language configuration.
