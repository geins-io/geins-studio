# `useUserStore`

The `useUserStore` Pinia store provides centralized user data management and computed properties for displaying user information throughout the application. It builds on top of the `useGeinsAuth` composable to access session data and transforms it into user-friendly formats.

## Features

- **User data access** from the current session
- **User initials computation** with intelligent fallback logic
- **Formatted user name** concatenation
- **Email access** with fallback handling
- **Reactive updates** when session changes

## Usage

```ts
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();

// Access user data
const { user, userInitials, userName, userEmail } = storeToRefs(userStore);
```

## Properties

### `user`

A `ref` that contains the current user object from the session.

- **Type**: `Ref<User | null | undefined>`
- **Source**: Derived from `session.value?.user` via `useGeinsAuth`
- **Updates**: Automatically when session changes

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
  user: Ref<User | null | undefined>;
  userInitials: ComputedRef<string>;
  userName: ComputedRef<string>;
  userEmail: ComputedRef<string>;
}
```

## Dependencies

This store depends on:

1. **Pinia**: For store management
2. **useGeinsAuth**: To access session data and user information
