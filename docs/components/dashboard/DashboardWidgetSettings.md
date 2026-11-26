# `DashboardWidgetSettings`

A dashboard widget's settings: the sliders icon button for the header's `actions` slot of [`DashboardWidget`](/components/dashboard/DashboardWidget.md), and the narrow [`PanelEdit`](/components/panel/PanelEdit.md) it opens. The button has a tooltip and `aria-label` (`label`) and works in and outside edit mode; the header doesn't start a drag from a button.

The widget owns the draft it puts in the default slot: it seeds the draft on `open` (before the panel shows) and stores it on `save`, after which the panel closes. Cancel or closing the panel drops the draft, with no unsaved-changes prompt.

## Usage

```vue
<template>
  <DashboardWidget :instance="instance">
    <template #actions>
      <DashboardWidgetSettings
        :label="t('dashboards.widgets.quick_access.choose')"
        :title="t('dashboards.widgets.quick_access.title')"
        :description="t('dashboards.widgets.quick_access.choose_description')"
        @open="draft = [...chosen]"
        @save="save"
      >
        <DashboardWidgetQuickAccessPicker v-model="draft" />
      </DashboardWidgetSettings>
    </template>
    …
  </DashboardWidget>
</template>
```

## Props

| Prop          | Type     | Meaning                                   |
| ------------- | -------- | ----------------------------------------- |
| `label`       | `string` | Tooltip and accessible name of the button |
| `title`       | `string` | Panel title                               |
| `description` | `string` | Panel description                         |

## Events

| Event  | Payload | When                                          |
| ------ | ------- | --------------------------------------------- |
| `open` | —       | The button is clicked, before the panel opens |
| `save` | —       | Save is clicked; the panel closes after       |

## Slots

| Slot    | Content                        |
| ------- | ------------------------------ |
| default | The settings form in the panel |
