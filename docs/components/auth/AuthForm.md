# `AuthForm`

`AuthForm` is the multi-mode authentication card used by every page under `/auth/*` — login, MFA verify, account selection, forgot password, reset password, and logout. One component, six modes, switched via the `mode` prop.

## Features

- Six modes via `AuthFormMode`: `login`, `verify`, `account`, `forgot-password`, `reset-password`, `logout`
- Per-mode validation schemas (vee-validate + zod) — auto-resets when `mode` changes
- Auto-focuses the email field on the login mode
- Built-in PIN input for the 6-digit MFA code (auto-submits on complete)
- Account picker list when the user belongs to multiple accounts
- Owns the password-reset request and reset flows internally — calls `userApi.password.beginRestore` and `userApi.password.restore` directly
- Surfaces errors via [`Feedback`](/components/feedback/Feedback) with mode-specific titles and descriptions
- "Back to login" button on every non-login mode

## Usage

This is mounted from the `/auth/*` pages — the page owns the `mode` state and reacts to events:

```vue
<script setup lang="ts">
import type { AuthFormMode, LoginCredentials } from '#shared/types';

const mode = ref<AuthFormMode>('login');
const loading = ref(false);
const showInvalid = ref(false);
const accounts = ref<AuthAccounts[]>([]);

const onLogin = async (credentials: LoginCredentials) => { /* ... */ };
const onVerify = async (code: string) => { /* ... */ };
const onSetAccount = async (accountKey: string) => { /* ... */ };
</script>

<template>
  <AuthForm
    :mode="mode"
    :loading="loading"
    :show-invalid="showInvalid"
    :accounts="accounts"
    @login="onLogin"
    @verify="onVerify"
    @set-account="onSetAccount"
    @set-mode="(m) => (mode = m)"
  />
</template>
```

## Props

### `mode`

```ts
mode: AuthFormMode  // 'login' | 'verify' | 'account' | 'forgot-password' | 'reset-password' | 'logout'
```

Drives which form/UI is rendered.

### `loading`

```ts
loading?: boolean
```

Spinner state on the primary button (login, verify, account list).

- **Default:** `false`

### `showInvalid`

```ts
showInvalid?: boolean
```

Triggers the negative feedback banner with mode-specific copy. Set after a failed login or verify.

- **Default:** `false`

### `mfaMethod`

```ts
mfaMethod?: string
```

Method name (e.g. `'email'`) shown after the verify description.

- **Default:** `''`

### `accounts`

```ts
accounts?: AuthAccounts[]
```

List shown in `account` and `logout` modes.

### `token`

```ts
token?: string
```

Reset-password token from the URL — passed through to `userApi.password.restore`.

## Events

### `login`

```ts
(credentials: LoginCredentials): void
```

Emitted on login submit with `{ username, password, rememberMe }`.

### `verify`

```ts
(code: string): void
```

Emitted when the 6-digit PIN is complete or the user clicks Verify.

### `set-account`

```ts
(accountKey: string): void
```

Emitted when the user picks an account from the list.

### `set-mode`

```ts
(mode: AuthFormMode): void
```

Emitted by internal links/buttons (forgot password, back to login, internal error recovery). Parent should update its `mode` state.

## Dependencies

- shadcn-vue `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `Button`, `Input`, `PinInput`, `PinInputGroup`, `PinInputSlot`, `Form` family
- [`Feedback`](/components/feedback/Feedback) — error/success banner
- vee-validate + zod, [`useGeinsRepository`](/composables/useGeinsRepository) (`userApi.password`), [`useGeinsLog`](/composables/useGeinsLog)
