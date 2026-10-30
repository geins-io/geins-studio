# `useUserStore`

The `useUserStore` Pinia store provides centralized user data management and computed properties for displaying user information throughout the application. The auth session carries tokens only, so the store loads the signed-in user (with their accounts) from `user/me` through `$geinsApi`.

## Features

- **User data** loaded from `user/me` (with accounts)
- **User initials computation** with intelligent fallback logic
- **Formatted user name** concatenation
- **Email access** with fallback handling
- **Accounts** sorted by name, plus the current account's name

## Loading

- `geins-global.ts` awaits `init()` at boot when the user is authenticated (pages read `user` synchronously, e.g. per-user cookies), calls it again on login, and calls `reset()` on logout.
- The login page calls `init()` before showing account selection, since that happens before an account key is set.
- Concurrent `init()` calls share one request. A failed load is logged and leaves `user` as it was.

## Usage

```ts
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// Access user data
const { user, userInitials, userName, userEmail } = storeToRefs(userStore);
```

## Properties

### `user`

A `ref` that contains the signed-in user.

- **Type**: `Ref<User | undefined>`
- **Source**: `userApi.me.get({ fields: ['accounts'] })`, loaded by `init()`
- **Updates**: On `init()`, `updateUser()` (merged, e.g. after a profile edit) and `reset()`

### `userInitials`

A `computed` property that generates user initials with intelligent fallback logic.

- **Type**: `ComputedRef<string>`
- **Logic**:
  1. If both `firstName` and `lastName` exist: First letter of each (e.g., "John Doe" → "JD")
  2. If only `firstName` exists (≥2 chars): First two letters (e.g., "John" → "JO")
  3. If only `lastName` exists (≥2 chars): First two letters (e.g., "Doe" → "DO")
  4. Fallback to first two letters of email address
  5. Final fallback: "N/A"

### `userName`

A `computed` property that returns the full name by concatenating first and last names.

- **Type**: `ComputedRef<string>`
- **Format**: `"${firstName} ${lastName}"`
- **Handles**: Missing names with empty string fallbacks

### `userEmail`

A `computed` property that returns the user's email address.

- **Type**: `ComputedRef<string>`
- **Fallback**: "N/A" if email is not available

## Methods

### `init`

```ts
init(): Promise<void>
```

Loads the signed-in user from `user/me` with accounts. Concurrent calls share one request.

### `reset`

```ts
reset(): void
```

Clears the user (on logout).

### `updateUser`

```ts
updateUser(newUser: User): void
```

Merges `newUser` into the loaded user, keeping fields the update response omits (such as accounts).

## Example

```vue
<script setup lang="ts">
const userStore = useUserStore();
const { user, userInitials, userName, userEmail } = userStore;

// Display user avatar with initials
const showUserAvatar = () => {
  console.log(`Avatar initials: ${userInitials.value}`);
};

// Show user info
const displayUserInfo = () => {
  console.log(`Name: ${userName.value}`);
  console.log(`Email: ${userEmail.value}`);
};
</script>

<template>
  <div class="user-info">
    <div class="avatar">{{ userInitials }}</div>
    <div class="details">
      <div class="name">{{ userName }}</div>
      <div class="email">{{ userEmail }}</div>
    </div>
  </div>
</template>
```

## Type Definitions

```ts
function useUserStore(): UserStoreReturnType;

interface UserStoreReturnType {
  user: Ref<User | undefined>;
  userInitials: ComputedRef<string>;
  userName: ComputedRef<string>;
  userEmail: ComputedRef<string>;
  userAccounts: ComputedRef<AuthAccounts[]>;
  currentAccountName: ComputedRef<string>;
  hasMultipleAccounts: ComputedRef<boolean>;
  init: () => Promise<void>;
  reset: () => void;
  updateUser: (newUser: User) => void;
  hasAnyRole: (roles: string[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}
```

## Dependencies

This store depends on:

1. **Pinia**: For store management
2. **useGeinsRepository**: `userApi.me.get` to load the user
3. **useGeinsAuth**: The session's `accountKey`, for `currentAccountName`
