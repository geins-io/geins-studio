# Testing Conventions

This guide covers the testing patterns and conventions used in Geins Studio.

## Overview

Tests are written with [Vitest](https://vitest.dev/) and live in `__tests__/` directories colocated with source files:

```
app/
  utils/
    __tests__/
      errors.test.ts
      password-validation.test.ts
      index.test.ts
      tooltip.test.ts
    repositories/
      __tests__/
        entity-base.test.ts
        entity.test.ts
  composables/
    __tests__/
      usePrice.test.ts
      useUnsavedChanges.test.ts
      useDeleteDialog.test.ts
      useEntityUrl.test.ts
shared/
  utils/
    __tests__/
      deployment.test.ts
```

## Running Tests

```bash
pnpm test              # Watch mode
pnpm test --run        # Single run (used by CI)
pnpm test --run <path> # Run specific file or folder
```

## Two-Environment Strategy

The Vitest config (`vitest.config.ts`) sets `environment: 'nuxt'` globally for component tests. Pure-logic and composable tests opt out by adding a pragma at the top of the file:

```typescript
// @vitest-environment node
```

This skips the heavy Nuxt bootstrap (~2s) and keeps unit tests fast (~5ms per file).

**Rule of thumb:**

| Test type                          | Environment pragma            | When to use                                    |
| ---------------------------------- | ----------------------------- | ---------------------------------------------- |
| Utils / pure functions             | `// @vitest-environment node` | No Vue or Nuxt dependencies                    |
| Composables with light mocking     | `// @vitest-environment node` | Only needs `ref`, `computed`, simple mocks     |
| Component tests (`mountSuspended`) | _(none — uses global `nuxt`)_ | Needs full Nuxt runtime, auto-imports, plugins |

## Writing Pure-Logic Tests (Utils)

These test files have zero Vue/Nuxt dependencies and run the fastest.

```typescript
// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { myFunction } from '../my-util';

describe('myFunction', () => {
  it('does the thing', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

**Key points:**

- Import directly from the source file (`../my-util`)
- No mocking needed
- Use an identity function for `t` when testing i18n-dependent code:
  ```typescript
  const t = (key: string) => key;
  const schema = createPasswordSchema(t);
  ```

## Writing Composable Tests (Light Mocking)

Composables use Nuxt auto-imports (`navigateTo`, `useRoute`, `useI18n`, etc.) that resolve to actual module paths at build time. Mock the **real module paths**, not `#imports`.

### Finding the Right Mock Target

Check `.nuxt/imports.d.ts` to see where each auto-import resolves:

| Auto-import                   | Actual module                    |
| ----------------------------- | -------------------------------- |
| `navigateTo`, `useRoute`      | `#app/composables/router`        |
| `onBeforeRouteLeave`          | `vue-router`                     |
| `useI18n`                     | `vue-i18n`                       |
| `useGeinsLog`                 | `../useGeinsLog` (relative path) |
| `ref`, `computed`, `nextTick` | `vue` (no mock needed)           |

### Example: Mocking Nuxt Router

```typescript
// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
}));

vi.mock('#app/composables/router', () => ({
  navigateTo: mockNavigateTo,
}));

import { useMyComposable } from '../useMyComposable';
```

### Example: Mocking a Sibling Composable

```typescript
vi.mock('../useGeinsLog', () => ({
  useGeinsLog: vi.fn(() => ({
    geinsLog: vi.fn(),
    geinsLogError: vi.fn(),
    geinsLogInfo: vi.fn(),
    geinsLogWarn: vi.fn(),
  })),
}));
```

### Common Pattern: `vi.hoisted` for Mock References

Use `vi.hoisted` when you need to reference mock functions in both the `vi.mock` factory and your test assertions:

```typescript
const { mockNavigateTo, mockOnBeforeRouteLeave } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockOnBeforeRouteLeave: vi.fn(),
}));

vi.mock('#app/composables/router', () => ({
  navigateTo: mockNavigateTo,
}));

vi.mock('vue-router', () => ({
  onBeforeRouteLeave: mockOnBeforeRouteLeave,
}));
```

## Writing Component Tests

Component tests use `mountSuspended` from `@nuxt/test-utils/runtime` and run in the full Nuxt environment. They are slower (~1-2s each) but test real rendering.

```typescript
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect } from 'vitest';
import { MyComponent } from '#components';

describe('MyComponent', () => {
  it('can mount the component', async () => {
    const component = await mountSuspended(MyComponent, {
      props: { title: 'Hello' },
    });
    expect(component.find('h1').text()).toBe('Hello');
  });
});
```

### Providing Context for Components

Some components require context from parent providers (e.g., `useSidebar` needs `SidebarProvider`). Wrap the component in a stub provider:

```typescript
import { defineComponent, computed, ref, h } from 'vue';
import { provideSidebarContext } from '@/components/ui/sidebar/utils';

const SidebarProviderStub = defineComponent({
  setup(_props, { slots }) {
    provideSidebarContext({
      state: computed(() => 'expanded' as const),
      open: ref(true),
      setOpen: () => {},
      isMobile: ref(false),
      openMobile: ref(false),
      setOpenMobile: () => {},
      toggleSidebar: () => {},
    });
    return () => h('div', slots.default?.());
  },
});

// Use as a wrapper component
const wrapper = defineComponent({
  components: { SidebarProviderStub, MyComponent },
  template: '<SidebarProviderStub><MyComponent /></SidebarProviderStub>',
});
const component = await mountSuspended(wrapper);
```

## Writing Repository Tests

Repository factories accept a `$fetch` function, making them easy to test with a mock:

```typescript
// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { entityRepo } from '../entity';

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
});

describe('entityRepo', () => {
  const repo = entityRepo('/products', mockFetch as any);

  it('sends POST on create', async () => {
    mockFetch.mockResolvedValue({ _id: '1', _type: 'product' });
    await repo.create({ name: 'New' });
    expect(mockFetch).toHaveBeenCalledWith('/products', {
      method: 'POST',
      body: { name: 'New' },
      query: undefined,
    });
  });
});
```

## Naming Conventions

| Convention     | Example                                                    |
| -------------- | ---------------------------------------------------------- |
| Test file name | `<source-file>.test.ts`                                    |
| Test directory | `__tests__/` next to source                                |
| Describe block | Named after function or composable                         |
| Test case      | Starts with verb: `returns`, `rejects`, `calls`, `accepts` |

## Anti-Patterns

- **Don't mock `#imports`** — it doesn't intercept auto-imports in the source. Mock the actual resolved module paths instead.
- **Don't use `console.log`** in tests — use `vi.fn()` to assert logging behavior if needed.
- **Don't create component tests for deep Nuxt dependencies** — if a component requires full store/plugin context that can't be reasonably stubbed, skip it with a TODO comment explaining why.
- **Don't mix environments** — a single test file should be either `node` (unit) or `nuxt` (component), not both.
