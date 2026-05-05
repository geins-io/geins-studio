# `ContentEditMain`

`ContentEditMain` is the layout wrapper for entity edit page bodies — a two-column grid (main content + summary sidebar) with optional toggleable sidebar behavior on smaller viewports.

## Features

- Two-column grid using the `--grid-cols-main` CSS custom property
- Sidebar slot is optional — when absent, content fills the full width
- When `showSidebar` is `false` and a sidebar slot exists, renders a floating toggle button on the right edge that opens/closes the sidebar with a scale + opacity animation
- Provides `sidebar-floating` (a computed `Ref<boolean>`) via Vue `provide` — child components like [`ContentEditSummary`](/components/content/edit/ContentEditSummary) read this to adjust max-height
- Optional `secondary` slot rendered below the main grid

## Usage

```vue
<template>
  <ContentEditWrap>
    <template #header>
      <ContentHeader :title="entity?.name" />
    </template>
    <ContentEditMain>
      <ContentEditTabs v-model:current-tab="currentTab" :tabs="tabs" />
      <ContentEditMainContent>
        <ContentEditCard v-show="currentTab === 0" :title="$t('general')">
          <FormFields />
        </ContentEditCard>
      </ContentEditMainContent>
      <template #sidebar>
        <ContentEditSummary
          v-model:active="entityDataUpdate.active"
          :summary="summary"
          :entity-name="entityName"
        />
      </template>
    </ContentEditMain>
  </ContentEditWrap>
</template>
```

## Props

### `showSidebar`

```ts
showSidebar?: boolean
```

When `true`, the sidebar is always visible (desktop layout). When `false` and a sidebar slot is provided, the sidebar becomes toggleable via a floating button.

- **Default:** `true`

## Slots

### default

The main-column content.

### `sidebar`

Right-column content. Typically [`ContentEditSummary`](/components/content/edit/ContentEditSummary).

### `secondary`

Optional content rendered below the main grid (e.g. an embedded table).

## Provides

### `sidebar-floating`

```ts
Ref<boolean>
```

`true` when the sidebar is in floating-toggle mode. Child components inject this to know whether to constrain their height.
