# `useGeinsAuth`

The `useGeinsAuth` composable provides Geins specific authentication and session management features. It build on top of NuxtAuth's composbale useAuth to handle tasks like login, logout, token parsing, and session refresh.

::: tip
Read more about the full authentication flow in Geins MC here: [Authentication](/concepts/authentication)
:::

## Features

- Retrieve the current session and access token.
- Check if the user is authenticated.
- Log in and log out users.
- Refresh tokens and manage token expiration.
- Decode and parse JWT tokens.

## Usage

```ts
import { useGeinsAuth } from '@/composables/auth';

const {
  session,
  accessToken,
  isAuthenticated,
  isRefreshing,
  authStateDiffers,
  login,
  verify,
  logout,
  refresh,
  setIsRefreshing,
  parseToken,
  isExpired,
  expiresSoon,
} = useGeinsAuth();
```

## Returned Properties

### `session`

A `computed` reference to the current session data.

### `accessToken`

A `computed` reference to the access token from the session.

### `isAuthenticated`

A `computed` reference that returns `true` if the user is authenticated.

### `isRefreshing`

A `ref` that indicates whether a token refresh is in progress.

### `authStateDiffers`

A `computed` reference that returns `true` if the auth state indicates the user is authenticated but the session data does not.

## Returned Methods

### `login(credentials: LoginCredentials)`

Logs in the user using the provided credentials.

- **Parameters:**
  - `credentials`: An object containing `username` and `password`.
- **Returns:** A promise that resolves to the login response.

### `verify(credentials: AuthTokens)`

Verifies the user's tokens.

- **Parameters:**
  - `credentials`: An object containing `loginToken` and `mfaCode`.
- **Returns:** A promise that resolves to the verification response.

### `logout()`

Logs out the user and clears the session.

- **Returns:** A promise that resolves when the logout process is complete.

### `refresh(): Promise<Session>`

Refreshes the session and retrieves a new access token.

- **Returns:** A promise that resolves to the updated session.

### `setIsRefreshing(value: boolean)`

Sets the `isRefreshing` state.

- **Parameters:**
  - `value`: A boolean indicating the refresh state.

### `parseToken(token?: string | null)`

Decodes the given JWT token and returns its payload.

- **Parameters:**
  - `token`: Optional. The token to decode. If not provided, the current `accessToken` from the session will be used.
- **Returns:** The parsed token payload or `null` if decoding fails.

### `isExpired(token?: string | null)`

Checks if a given token (or the current `accessToken`) is expired.

- **Parameters:**
  - `token`: Optional. The token to check.
- **Returns:** `true` if the token is expired, otherwise `false`.

### `expiresSoon(token?: string | null, threshold: number = 150000)`

Checks if a token (or the current `accessToken`) is close to expiration.

- **Parameters:**
  - `token`: Optional. The token to check.
  - `threshold`: Optional. Time (in milliseconds) before expiration to consider as "soon". Default is `150000`.
- **Returns:** `true` if the token expires within the threshold, otherwise `false`.

## Example

Here is an example of how you can use the `useGeinsAuth` composable:

```ts
<script setup lang="ts">
    const {
      isAuthenticated,
      login,
      verify,
      logout,
      refresh,
      isExpired,
      expiresSoon,
    } = useGeinsAuth();

    const handleLogin = async () => {
      const credentials = { username: 'user', password: 'password' };
      await login(credentials);
    };

    const handleVerify = async () => {
      const tokens = { loginToken: 'token', mfaCode: 'code' };
      await verify(tokens);
      if (isAuthenticated.value) {
        console.log('User is authenticated!');
      }
    };

    const handleLogout = async () => {
      await logout();
    };

    const handleRefresh = async () => {
      if (isExpired() || expiresSoon()) {
        await refresh();
      }
    };
</script>
```

## Dependencies

This composable depends on:

1. **NuxtAuth**: Ensure the `NuxtAuth` function is correctly set up.
2. **jwtDecode**: The `jwtDecode` plugin is used to parse JWT tokens.
