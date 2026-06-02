# `ContentEditCard`

`ContentEditCard` is the standard collapsible content block used on entity edit pages — a card with a title, optional description, and either a regular content slot or a step-aware "create mode" with previous/next navigation.

## Features

- Two modes: regular (single open card) and **create mode** (collapsible, drives a multi-step entity creation flow)
- In create mode: shows step number prefix (`"1. Title"`), only the current step is open, future steps are dimmed and non-interactive
- Previous / Next buttons in create mode (auto-hidden on first/last step)
- Separate `create` and default slots so the same card can render different content during create vs edit
- `header-action` slot for a trailing action button next to the title
- Built on shadcn-vue [`Collapsible`](/components/shadcn-vue) with `unmount-on-hide="false"` so step state persists

## Usage

### Regular (edit) mode

```vue
<template>
  <ContentEditCard :title="$t('general')" :description="$t('general_description')">
    <FormGridWrap>
      <FormGrid design="1+1">
        <FormFieldName />
        <FormFieldStatus />
      </FormGrid>
    </FormGridWrap>
  </ContentEditCard>
</template>
```

### Create mode — multi-step flow

```vue
<script setup lang="ts">
const { currentStep, nextStep, previousStep } = useStepManagement(3);
</script>

<template>
  <ContentEditCard
    :step="1"
    :current-step="currentStep"
    :total-steps="3"
    :title="$t('basics')"
    :description="$t('basics_description')"
    create-mode
    :step-valid="step1Valid"
    @previous="previousStep"
    @next="nextStep"
  >
    <template #create>
      <FormFieldName />
    </template>
  </ContentEditCard>
</template>
```

## Props

### `title`

```ts
title?: string
```

Card heading.

### `description`

```ts
description?: string
```

Subheading rendered below the title.

### `createMode`

```ts
createMode?: boolean
```

Enables the step UI: number prefix, collapsing, prev/next buttons.

- **Default:** `false`

### `step`

```ts
step?: number
```

This card's step number (1-indexed).

- **Default:** `1`

### `currentStep`

```ts
currentStep?: number
```

The flow's currently active step. Cards where `step !== currentStep` are collapsed (and dimmed if in the future).

- **Default:** `1`

### `totalSteps`

```ts
totalSteps?: number
```

Used to hide the Next button on the last step.

- **Default:** `1`

### `stepValid`

```ts
stepValid?: boolean
```

Reserved for callers that want to gate Next on validation. Currently unused inside the component but kept on the public API.

- **Default:** `true`

## Events

### `previous`

Emitted when the user clicks Previous (create mode).

### `next`

Emitted when the user clicks Next (create mode).

## Slots

### default

The card body in regular mode (and as a fallback when `create` slot is not provided in create mode).

### `create`

The card body shown only when `createMode` is `true`. Use this when create-mode UI differs from edit-mode UI.

### `header-action`

Trailing content rendered next to the title — typically an action button.

## Dependencies

- shadcn-vue `Card`, [`Collapsible`](/components/shadcn-vue), `Button`
- [`ContentCardHeader`](/components/content/ContentCardHeader) — title + description rendering
- [`useStepManagement`](/composables/useStepManagement) — typical pairing for create mode
