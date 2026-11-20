# Colors

State and status colors live as CSS custom properties in [`app/assets/css/main.css`](https://github.com/geins-io/geins-studio/blob/next/app/assets/css/main.css), with a light value in `:root` and a dark value in `.dark`. Each one is registered in `@theme inline` as `--color-*`, so it works as a Tailwind utility: `--tone-info` → `bg-tone-info/10`, `text-tone-info`, `ring-tone-info/30`.

Use these tokens for anything that says _what state something is in_. Never reach for Tailwind's palette (`bg-green-500`, `text-red-600`) for a status — it doesn't follow the theme and most of it fails text contrast.

## Status tones

Status badges use a light tint of the tone with text in the tone itself, darker. All of them pass WCAG AA (4.5:1) as text on their own tint.

| Tone           | Token                                          | Means                                  | For example                 |
| -------------- | ---------------------------------------------- | -------------------------------------- | --------------------------- |
| success        | `--tone-success`                               | Positive                               | Accepted, Enabled           |
| success, solid | `--tone-success`                               | Positive and final                     | Finalized                   |
| info           | `--tone-info`                                  | In progress, or the seller's turn      | Pending, Sent, Partial      |
| info, solid    | `--tone-info`                                  | New and the seller's turn — stands out | Requested                   |
| warning        | `--tone-warning` on `--tone-warning-bg`        | Needs attention                        | Expired, On hold, Degraded  |
| danger         | `--tone-danger`                                | Stopped or refused                     | Rejected, Canceled          |
| neutral        | `--tone-neutral` + `--tone-neutral-foreground` | Waiting, nothing to do                 | Inactive, Refunded, Revised |
| draft          | `--tone-neutral`, dashed `--border-dark`       | Not sent yet                           | Draft                       |

Solid light green (`--positive`, white text) stays for Active, Completed and Confirmed.

Each tone is a `Badge` variant of the same name (`success`, `success-solid`, `info`, `info-solid`, `warning`, `danger`, `neutral`, `draft`, plus `positive`). [`StatusBadge`](/components/StatusBadge) picks one per status.

### Recipe

| Style          | Classes                                              |
| -------------- | ---------------------------------------------------- |
| Tint           | `bg-tone-info/10 text-tone-info` (success uses `/8`) |
| Neutral tint   | `bg-tone-neutral/10 text-tone-neutral-foreground`    |
| Warning        | `bg-tone-warning-bg text-tone-warning`               |
| Solid          | `bg-tone-info text-tone-solid-foreground`            |
| Dark-mode ring | `dark:ring-1 dark:ring-tone-info/30`                 |

Warning gets its own clear orange background instead of a tint, so it reads as needs attention. In dark mode `--tone-warning-bg` is the usual 10% tint.

Tinted badges have no ring in light mode and a thin ring in dark mode, where a low tint alone doesn't separate the badge from the card.

## Tag tones

Same recipe as the status tones, in hues the statuses don't use. For asset types and other categories that aren't a state.

| Token           | Light     |
| --------------- | --------- |
| `--tone-purple` | `#6b21a8` |
| `--tone-teal`   | `#115e59` |
| `--tone-indigo` | `#3730a3` |
| `--tone-pink`   | `#9d174d` |
| `--tone-slate`  | `#334155` |

Each is a `Badge` variant of the same name (`purple`, `teal`, `indigo`, `pink`, `slate`). Asset types reuse `info` (Image) and `warning` (Audio) on purpose, and Other is `neutral` so it doesn't look like Doc (`slate`) — see [`useAssetType`](/composables/useAssetType).

## Callouts

Callouts (`Feedback`) are filled in their type's color: background, border, text and icon. Each type has four tokens, `--{type}-callout-{bg|border|foreground|icon}`, for `info`, `warning`, `positive` and `negative`.

| Type     | Utilities                                                                             |
| -------- | ------------------------------------------------------------------------------------- |
| info     | `bg-info-callout-bg border-info-callout-border text-info-callout-foreground`          |
| warning  | `bg-warning-callout-bg border-warning-callout-border text-warning-callout-foreground` |
| positive | `bg-positive-callout-bg …`                                                            |
| negative | `bg-negative-callout-bg …`                                                            |

In a page, use [`Feedback`](/components/Feedback) (or `Alert` with `info`, `warning`, `positive` or `destructive`) rather than these utilities.

::: warning
`--warning-foreground` is **not** callout text: it's the white text on solid warning (the yellow toast). Use `--warning-callout-foreground` in callouts.
:::

## Toasts

| Variant  | Background                           | Text                |
| -------- | ------------------------------------ | ------------------- |
| positive | `--positive`                         | white               |
| negative | `--toast-negative` (calm red, 5.8:1) | white               |
| warning  | `--warning`                          | white               |
| default  | `--card` with a border               | `--card-foreground` |

White on the positive green and the warning yellow is below AA (2.2:1). That's a known design decision, kept for now.

## Base state colors

`--positive`, `--negative`, `--warning` and `--destructive` stay for solid fills: the Active badge, toasts, the switch and the Delete button. As text they fail contrast, so for status text use a tone instead.

## Dark mode

Every token above has a dark value. Tones, tags and callouts get lighter text in the same hue on a low tint, and tinted badges a thin ring.
