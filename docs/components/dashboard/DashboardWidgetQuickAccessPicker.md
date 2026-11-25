# `DashboardWidgetQuickAccessPicker`

The settings form of [`DashboardWidgetQuickAccess`](/components/dashboard/DashboardWidgetQuickAccess.md): every shortcut in `QUICK_ACCESS_SHORTCUTS` as a row with a checkbox, its icon and its label, in catalog order. Clicking anywhere on a row toggles it. The model is the chosen shortcut ids; the widget puts them in catalog order when it saves.

## Usage

```vue
<DashboardWidgetQuickAccessPicker v-model="draft" />
```

## Props

| Prop         | Type       | Meaning                            |
| ------------ | ---------- | ---------------------------------- |
| `modelValue` | `string[]` | `v-model`, the chosen shortcut ids |
