# DESIGN.md — Design System & Visual Language

> Geins Studio's design system, token reference, layout primitives, and UI component conventions.
> For architecture see `ARCHITECTURE.md`. For app-level composition see `APP.md`.

---

## Design Philosophy

Geins Studio is a **professional commerce admin interface** designed for clarity and efficiency. The visual language prioritises legibility, density of information, and frictionless navigation over decorative aesthetics.

**Principles:**

1. **Content-first** — UI chrome fades away; entities and data are the hero.
2. **Consistent density** — Tables, forms, and cards share a compact rhythm that rewards familiarity.
3. **Light by default, dark by choice** — Full light/dark theme support via CSS custom properties and `@nuxtjs/color-mode`.
4. **Component ownership** — shadcn-vue primitives are copied into the project and customised in-place; no external component library lock-in.

---

## Typography

| Token | Value | Usage |
|---|---|---|
| `--font-sans` | `'Suisse Intl'` | All UI text. Loaded via `@font-face` (Regular 400, Medium 600). |
| `--tracking-normal` | `0.01em` | Default letter-spacing applied globally. |
| `--text-grid` | `0.8125rem` (13px) | Table cell text. |
| `--text-xxl` | `1.8rem` | Page-level headings. |
| Base `text-sm` | `0.875rem` (14px) | Form inputs, body text, descriptions. |
| `text-xs` | `0.75rem` (12px) | Buttons, badges, labels, muted metadata. |

Font files live in `public/fonts/` (woff2 + woff). `-webkit-font-smoothing: antialiased` and `-moz-osx-font-smoothing: grayscale` are applied globally.

---

## Color System

All colors are defined as HSL CSS custom properties on `:root` (light) and `.dark` (dark). Tailwind references them via `@theme inline` mappings in `app/assets/css/main.css`.

### Core Palette

| Token | Light | Dark | Purpose |
|---|---|---|---|
| `--background` | `hsl(0 0% 98%)` | `hsl(0 0% 0%)` | Page background |
| `--foreground` | `hsl(240 2% 22%)` | `hsl(0 0% 100%)` | Primary text |
| `--card` | `hsl(0 0% 100%)` | `hsl(0 0% 5%)` | Card/panel surfaces |
| `--card-foreground` | `hsl(0 0% 9%)` | `hsl(0 0% 100%)` | Card text |
| `--primary` | `hsl(0 0% 13%)` | `hsl(0 0% 100%)` | Primary actions, emphasis |
| `--primary-foreground` | `hsl(0 0% 100%)` | `hsl(0 0% 5%)` | Text on primary |
| `--secondary` | `hsl(0 0% 96%)` | `hsl(0 0% 15%)` | Secondary surfaces |
| `--muted` | `hsl(0 0% 91%)` | `hsl(0 0% 10%)` | Muted backgrounds |
| `--muted-foreground` | `hsl(0 0% 45%)` | `hsl(0 0% 63%)` | De-emphasised text |
| `--accent` | `hsl(0 0% 98%)` | `hsl(0 0% 10%)` | Hover/active accents |
| `--border` | `hsl(0 0% 90%)` | `hsl(0 0% 18%)` | Borders and dividers |
| `--input` | `hsl(0 0% 100%)` | `hsl(0 0% 9%)` | Input field backgrounds |
| `--ring` | `hsl(0 0% 13%)` | `hsl(210 15% 85%)` | Focus ring color |

> The palette is **achromatic (stone/grey)** by design — a neutral admin palette that keeps product images and status colors front and center.

### Semantic Colors

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--positive` | `hsl(151 45% 56%)` | `hsl(151 83% 35%)` | Success, active, confirmed |
| `--negative` | `hsl(0 59% 60%)` | *(inherited)* | Error, rejected |
| `--warning` | `hsl(32 78% 56%)` | *(inherited)* | Pending, on-hold, sent |
| `--info` | `hsl(194 85% 89%)` | *(inherited)* | Informational callouts |
| `--destructive` | `hsl(0 80% 58%)` | `hsl(0 75% 60%)` | Destructive actions (delete) |
| `--link` | `hsl(178 14% 44%)` | `hsl(177 35% 71%)` | Hyperlinks and cross-entity references |

### Sidebar Colors

Sidebar has its own dedicated token set (`--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`) to allow independent theming of the navigation chrome.

---

## Spacing & Radius

| Token | Value | Notes |
|---|---|---|
| `--radius` | `0.4rem` | Base border radius |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Small elements, badges |
| `--radius-md` | `calc(var(--radius) - 2px)` | Inputs, selects |
| `--radius-lg` | `var(--radius)` | Cards, buttons |
| `--radius-xl` | `calc(var(--radius) + 4px)` | Large containers |
| Content padding | `p-3 @2xl:p-8` | Responsive content area padding |
| Card padding | `p-4 @2xl:p-6` | ContentEditCard internal spacing |
| Form gap | `gap-4 @3xl/form-grid:gap-6` | FormGrid responsive gap |

---

## Elevation & Shadows

| Token | Value | Usage |
|---|---|---|
| `--shadow` | `rgb(0 0 0 / 10%)` (light), `rgb(0 0 0 / 100%)` (dark) | Base shadow color |
| `--shadow-only-right` | `3px 0 7px -2px var(--shadow)` | Sidebar right edge |
| `--shadow-only-left` | `-3px 0 7px -2px var(--shadow)` | Floating panel left edge |

The design is **elevation-minimal** — most layering is achieved through borders, background color contrast, and subtle border separators rather than drop shadows.

---

## Layout System

### Two Layouts

| Layout | File | Structure |
|---|---|---|
| **Default** | `app/layouts/default.vue` | `SidebarProvider` → `LayoutSidebar` + `SidebarInset` → sticky `LayoutHeader` (48px / `--h-header: 3rem`) → scrollable content slot |
| **Auth** | `app/layouts/auth.vue` | Minimal centered card on muted background, Geins logo, no sidebar |

### Content Area Scrolling

The default layout reads `route.meta.pageType`:
- **`pageType: 'list'`** → `overflow-hidden` (table manages its own scroll)
- **Other pages** → `overflow-y-auto` (standard document scroll)

Content height: `calc(100vh - var(--h-header))`.

### Main Content Grid

Edit pages use `ContentEditMain` which provides a two-column layout:

```
--grid-cols-main: minmax(50%, 1fr) minmax(300px, 360px)
```

- **Left column** — Primary form content (cards, tabs)
- **Right column** — Summary sidebar (`ContentEditSummary`)
- On smaller viewports, the sidebar collapses into a floating toggle button

---

## Page Archetypes

### List Page

Full-viewport data table with header toolbar, pagination, and maximise mode.

```
┌──────────────────────────────────────────────────┐
│ LayoutHeader (sticky, 48px)                      │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │ TableView (.table-view--advanced)          │  │
│  │ ┌──────────────────────────────────────┐   │  │
│  │ │ Header: search, filters, column      │   │  │
│  │ │ toggle, maximize button              │   │  │
│  │ ├──────────────────────────────────────┤   │  │
│  │ │ Table rows                           │   │  │
│  │ │ ...                                  │   │  │
│  │ ├──────────────────────────────────────┤   │  │
│  │ │ TablePagination                      │   │  │
│  │ └──────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

Key CSS classes:
- `.table-view` — rounded border, overflow hidden, relative positioning
- `.table-view--advanced` — negative translate for toolbar float effect
- `.table-view--maximized` — absolute positioning fills available viewport
- `.table-view__header` — sticky header with bottom separator pseudo-element

### Edit / Detail Page

Two-column layout with collapsible card sections and a sidebar summary.

```
┌──────────────────────────────────────────────────┐
│ LayoutHeader + Breadcrumbs                       │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─────── ContentEditMain ─────────────────────┐ │
│  │                                             │ │
│  │  ┌─ ContentEditCard ──────┐  ┌─ Summary ─┐ │ │
│  │  │ ContentCardHeader      │  │ Status     │ │ │
│  │  │ [Collapsible content]  │  │ Badge      │ │ │
│  │  │ FormGrid / FormGridWrap│  │ Active     │ │ │
│  │  └────────────────────────┘  │ toggle     │ │ │
│  │                              │ DataList   │ │ │
│  │  ┌─ ContentEditCard ──────┐  └────────────┘ │ │
│  │  │ Section 2              │                  │ │
│  │  └────────────────────────┘                  │ │
│  │                                              │ │
│  │  [ContentEditTabs — optional]                │ │
│  │                                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌─ Action Bar (sticky bottom) ─────────────────┐ │
│  │ [Back]              [Delete] [Save]          │ │
│  └──────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────┘
```

---

## Component Library

### Primitives (shadcn-vue / `app/components/ui/`)

38 UI component families installed via shadcn-vue CLI using the **New York** style with **Stone** base color. Components are owned by the project and customised in-place.

| Category | Components |
|---|---|
| **Actions** | `button`, `button-group`, `dropdown-menu` |
| **Data Display** | `badge`, `avatar`, `card`, `table`, `skeleton`, `empty` |
| **Forms** | `input`, `input-group`, `field`, `form`, `checkbox`, `radio-group`, `select`, `native-select`, `combobox`, `switch`, `textarea`, `tags-input`, `pin-input`, `label` |
| **Feedback** | `alert`, `alert-dialog`, `dialog`, `sheet`, `toast`, `tooltip`, `popover` |
| **Navigation** | `breadcrumb`, `tabs`, `sidebar`, `command` |
| **Layout** | `separator`, `collapsible`, `calendar` |

### App Components (Application-Level)

#### Layout Shell

| Component | Path | Purpose |
|---|---|---|
| `LayoutSidebar` | `components/layout/sidebar/` | Main navigation sidebar with group/item hierarchy |
| `LayoutHeader` | `components/layout/LayoutHeader.vue` | Sticky header with sidebar toggle + breadcrumbs |
| `SidebarNav` / `SidebarNavItem` | `components/sidebar/` | Navigation rendering within sidebar |

#### Content Building Blocks

| Component | Purpose |
|---|---|
| `ContentEditMain` | Two-column grid with floating sidebar toggle |
| `ContentEditCard` | Collapsible card with step navigation (create mode) or static (edit mode) |
| `ContentEditSummary` | Right sidebar card: status badge, active toggle, data list |
| `ContentEditTabs` | Tab strip navigation within edit pages |
| `ContentEditWrap` | Wrapper div for edit page content |
| `ContentHeader` | Page title + description |
| `ContentSwitch` | Toggle with animated collapsible content reveal |
| `ContentDataList` | Key-value pair display list |
| `ContentLinkCard` | Card with link styling |
| `ContentPriceSummary` | Financial summary table with two-way bound values |
| `ContentAddressDisplay` | Formatted address display |

#### Form System

| Component | Purpose |
|---|---|
| `FormGrid` | Responsive column grid with design presets (`1`, `1+1`, `1+1+1`, `2+1`, `2+2`, `2+1+1`, `1+1+2`, `1+2`, `1+1+1+1`) |
| `FormGridWrap` | Vertical spacing wrapper for consecutive FormGrids (`mt-8` between siblings) |
| `FormItem*` | Form field wrappers (label + input + error) |
| `FormInput*` | Specialised inputs (currency, percentage, etc.) |

#### Table System

| Component | Purpose |
|---|---|
| `TableView` | Full table with TanStack integration, mode-aware rendering, search, error state |
| `TablePagination` | Pagination controls with optional rows-per-page selector |
| `TableColumnToggle` | Column visibility dropdown |
| `TableCellActions` | Row action menu (edit, copy, delete) |
| `TableCellEditable` | Inline editable cell |
| `TableCellCurrency` | Formatted currency display |
| `TableCellProduct` | Product thumbnail + name |
| `TableCellStatus` | Status badge in cell |
| `TableCellTooltip` | Truncated text with hover tooltip |
| `TableCellBoolean` | Checkmark / icon for boolean values |

#### Dialogs

| Component | Purpose |
|---|---|
| `DialogDelete` | Confirm entity deletion |
| `DialogUnsavedChanges` | Warn about unsaved changes on navigation |
| `DialogStatusTransition` | Confirm status changes with preview |

#### Selector Pattern

| Component | Purpose |
|---|---|
| `SelectorPanel` | Full entity selection overlay with search + table |
| `Selector` | Composed selector with selection management |
| `SelectorSelection` | Display of currently selected items |
| `SelectorQuickAdd` | Inline quick-add within selector |
| `SelectorTag` / `SelectorTags` | Tag-style display of selections |

#### Feedback & Errors

| Component | Purpose |
|---|---|
| `StatusBadge` | Semantic status pill (maps status strings → badge variants) |
| `Feedback` | Toast / notification display |
| `error/404` | Not-found error page |
| `error/500` | Server error page |

---

## Button Variants

Defined via `class-variance-authority` in `components/ui/button/index.ts`:

| Variant | Appearance |
|---|---|
| `default` | Solid dark (primary bg, white text) |
| `destructive` | Solid red (destructive bg) |
| `outline` | Bordered, subtle bg |
| `secondary` | Card bg with border, subtle hover |
| `ghost` | Transparent until hover |
| `link` | Underlined text, no background |

**Sizes:** `default` (h-8/9), `xs` (h-7), `sm` (h-8), `lg` (h-10), `icon` (square 8/9), `icon-xs` (square 6).

---

## Badge Variants

Defined in `components/ui/badge/index.ts`:

| Variant | Appearance | Used for |
|---|---|---|
| `default` | Solid primary | Default state |
| `secondary` | Muted bg, muted text | Draft, inactive boolean |
| `outline` | Bordered, subtle | Unknown/default status |
| `positive` | Green solid | Completed, confirmed, active |
| `positive-light` | Green ring + tinted bg | Finalized |
| `positive-outline` | Green ring, transparent bg | Accepted |
| `negative` | Red solid | Rejected |
| `negative-light` | Red ring + tinted bg | Cancelled |
| `warning` | Orange solid | Pending, on-hold, sent, partial |
| `inactive` | Muted, low contrast | Refunded, inactive |

Status-to-variant mapping is centralized in `StatusBadge.vue`.

---

## Table Modes

The `TableMode` enum defines three display modes that affect styling, features, and density:

| Mode | Usage | Visual characteristics |
|---|---|---|
| **Advanced** | List pages | Full borders, pagination, sorting, column pinning, hover effect, toolbar float |
| **Simple** | Nested sub-tables | Reduced chrome, standard padding |
| **Minimal** | Edit page inline tables | No borders/pagination/sorting/pinning/hover, taller rows (68px), no column header interactions |

Mode is set via `table.options.meta.mode`. All mode overrides use scoped CSS on `.table-view--minimal` — shadcn table primitives (`components/ui/table/`) are never modified.

---

## Form Grid Layouts

`FormGrid` provides a responsive 12-column grid with named layout presets:

| Preset | Column distribution |
|---|---|
| `'1'` | Full width (12) |
| `'1+1'` | 6 + 6 |
| `'1+2'` | 4 + 8 |
| `'2+1'` | 8 + 4 |
| `'1+1+1'` | 4 + 4 + 4 (default) |
| `'2+1+1'` | 6 + 3 + 3 |
| `'1+1+2'` | 3 + 3 + 6 |
| `'2+2'` | 6 + 6 |
| `'1+1+1+1'` | 3 + 3 + 3 + 3 |

Below the `@max-xl` container breakpoint, all grids collapse to single-column.

---

## Animations

| Animation | Duration | Easing | Usage |
|---|---|---|---|
| `accordion-down/up` | 300ms | `ease-out` | Accordion expand/collapse |
| `collapsible-down/up` | 300ms | `ease-in-out` | ContentEditCard, ContentSwitch |
| Sidebar float | 300ms | `cubic-bezier(.29,.38,.18,1.47)` | ContentEditMain sidebar toggle (spring overshoot) |
| Button spinner | — | CSS `animate-spin` | Loading state indicator |
| Page transitions | — | `@formkit/auto-animate` | List reordering, content transitions |

---

## Responsive Breakpoints

Configured in `nuxt.config.ts` via `nuxt-viewport`:

| Name | Width | Usage |
|---|---|---|
| `xs` | 320px | Mobile |
| `sm` | 640px | Small mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop (fallback default) |
| `xl` | 1280px | Wide desktop |
| `2xl` | 1536px | Ultra-wide |

Container queries (`@container`) are used extensively via Tailwind's `@2xl:`, `@3xl:` syntax for component-level responsive behavior (e.g., content padding, form grid collapse, table pagination layout).

---

## Icons

- **Library:** Lucide via `nuxt-lucide-icons`
- **Prefix:** `Lucide` (e.g., `<LucidePanelLeftOpen />`)
- **Default sizes:** `size-4` (16px) for UI chrome, `size-5` (20px) for inputs/search, `size-6` (24px) for larger icons
- **Color:** Typically `text-muted-foreground` for chrome icons, `text-foreground` for interactive

---

## Brand Assets

| Asset | Path | Usage |
|---|---|---|
| Geins logo (full) | `app/assets/logos/geins.svg` | *(reserved)* |
| Geins "G" mark | `app/assets/logos/geins-g.svg` | Auth layout logo, sidebar, favicon context |

Logos are loaded via `nuxt-svgo` for inline SVG rendering with `font-controlled` control.

---

## Dark Mode

- **Strategy:** CSS class (`.dark` on `<html>`)
- **Module:** `@nuxtjs/color-mode` with `preference: 'system'`, fallback `'light'`
- **Storage key:** `geins-color-mode`
- **Implementation:** All color tokens have light (`:root`) and dark (`.dark`) definitions
- **Variant selector:** `@custom-variant dark (&:is(.dark *))` for Tailwind v4

---

## Utility Classes

Custom Tailwind utilities defined in `main.css`:

| Utility | Effect |
|---|---|
| `.container` | `max-width: 80rem`, horizontal auto-margin, `2rem` padding |
| `.form-grid-wrap` | Adds `mt-8` between adjacent `.form-grid-wrap` siblings |
| `.flex-center` | `display: flex; justify-content: center; align-items: center` |

### Text Link Classes

| Class | Appearance |
|---|---|
| `.link-text` | Link-colored, semibold, underlined (entity cross-references) |
| `.external-link-text` | Muted, inline-flex with gap, underline on hover |
| `.tooltip-text` | Dashed underline for text with tooltip info |

---

## Autofill Handling

Browser autofill styling is comprehensively overridden to prevent visual disruption:
- Background forced to `--input` color via `box-shadow` trick
- Text color forced to `--foreground`
- Subtle `--autofill-marker` border indicates autofilled fields (`#c9e4f0` light, `#203540` dark)

---

## Decision Log

**2024-05-24: Suisse Intl as primary typeface**
Swiss-style sans-serif that conveys professionalism without personality distraction. Two weights (400/600) cover all UI needs. Self-hosted for performance and privacy.

**2024-05-24: Achromatic color palette**
Admin interfaces benefit from neutral palettes that let content (product images, status colors) be the visual anchor. HSL-based tokens make dark mode straightforward.

**2024-05-24: shadcn-vue New York style + Stone base**
New York style provides denser, more professional components compared to the Default style. Stone base aligns with the achromatic palette choice.

**2024-06-17: Three table modes (Advanced/Simple/Minimal)**
Different contexts need different table chrome. List pages need full navigation; inline edit-page tables need to feel like part of the form. Mode-driven CSS keeps the same component flexible.

**2024-07-02: class-variance-authority for component variants**
CVA provides type-safe variant definitions that integrate naturally with Tailwind. Used for buttons, badges, and other multi-variant components.

**2026-03-30: DESIGN.md created**
Extracted design-specific documentation from ARCHITECTURE.md, APP.md, and CLAUDE.md into a dedicated design system reference.
