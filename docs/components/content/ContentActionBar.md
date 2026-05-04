# `ContentActionBar`

A right-aligned flex container for page-level action buttons (Save, Delete, etc.) placed at the bottom or top of content sections.

## Features

- Zero configuration — pure layout wrapper
- Right-aligns all children with consistent horizontal gap

## Usage

### Basic Usage

```vue
<template>
  <ContentActionBar>
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </ContentActionBar>
</template>
```

## Slots

### default

Action buttons or any inline elements to render right-aligned.

## Dependencies

None — pure layout component.
