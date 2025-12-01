# `useGeinsAuth`

The `useGeinsAuth` composable provides Geins specific authentication and session management features. It build on top of NuxtAuth's composable `useAuth` to handle tasks like login, logout, token parsing, and session refresh.

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
import { useGeinsAuth } from '@/composables/useGeinsAuth';

const {
  session,
  accessToken,
  isAuthenticated,
  isRefreshing,
  authStateDiffers,
  accountKey,
  preLogin,
  login,
  verify,
  setAccount,
  setSession,
  sessionsAreEqual,
  logout,
  refresh,
  setIsRefreshing,
  parseToken,
  isExpired,
  expiresSoon,
} = useGeinsAuth();
```

## Properties and Methods

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

### `accountKey`

A `computed` reference to the current account key from the session.

### `preLogin`

```ts
preLogin(): Promise<void>
```

Prepares the authentication environment by pinging auth and account endpoints.

- **Returns**: Promise that resolves when pre-login setup is complete

### `login`

```ts
login(credentials: LoginCredentials): Promise<any>
```

Logs in the user using the provided credentials.

- **Parameters:**
  - `credentials`: An object containing `username` and `password`
- **Returns:** A promise that resolves to the login response

### `verify`

```ts
verify(tokens: AuthTokens): Promise<any>
```

Verifies the user's tokens for MFA authentication.

- **Parameters:**
  - `tokens`: An object containing `loginToken` and `mfaCode`
- **Returns:** A promise that resolves to the verification response

### `setAccount`

```ts
setAccount(accountKey: string): Promise<any>
```

Sets the account context for the current session.

- **Parameters:**
  - `accountKey`: The account key to set for the session
- **Returns:** A promise that resolves to the updated session

### `setSession`

```ts
setSession(session: Session): Promise<any>
```

Updates the current session with new session data.

::: info Note
This method automatically excludes `user` from the session before updating to not store it in the JWT token.
:::

- **Parameters:**
  - `session`: The complete session object to set
- **Returns:** A promise that resolves to the updated session

### `sessionsAreEqual`

```ts
sessionsAreEqual(session1: Session, session2: Session): boolean
```

Compares two session objects for equality, excluding `expires` and `accounts` properties.

- **Parameters:**
  - `session1`: First session to compare
  - `session2`: Second session to compare
- **Returns:** `true` if sessions are equal, otherwise `false`

### `logout`

```ts
logout(): Promise<void>
```

Logs out the user and clears the session.

- **Returns:** A promise that resolves when the logout process is complete

### `refresh`

```ts
refresh(): Promise<Session>
```

Refreshes the session and retrieves a new access token.

- **Returns:** A promise that resolves to the updated session

### `setIsRefreshing`

```ts
setIsRefreshing(value: boolean): void
```

Sets the `isRefreshing` state.

- **Parameters:**
  - `value`: A boolean indicating the refresh state

### `parseToken`

```ts
parseToken(token?: string | null): any | null
```

Decodes the given JWT token and returns its payload.

- **Parameters:**
  - `token`: Optional. The token to decode. If not provided, the current `accessToken` from the session will be used
- **Returns:** The parsed token payload or `null` if decoding fails

### `isExpired`

```ts
isExpired(token?: string | null): boolean
```

Checks if a given token (or the current `accessToken`) is expired.

- **Parameters:**
  - `token`: Optional. The token to check
- **Returns:** `true` if the token is expired, otherwise `false`

### `expiresSoon`

```ts
expiresSoon(token?: string | null, threshold?: number): boolean
```

Checks if a token (or the current `accessToken`) is close to expiration.

- **Parameters:**
  - `token`: Optional. The token to check
  - `threshold`: Optional. Time (in milliseconds) before expiration to consider as "soon". Default is `300000`
- **Returns:** `true` if the token expires within the threshold, otherwise `false`

## Example

Here is an example of how you can use the `useGeinsAuth` composable:

```vue
<script setup lang="ts">
const {
  isAuthenticated,
  accountKey,
  login,
  verify,
  setAccount,
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

const handleSetAccount = async (accountKey: string) => {
  await setAccount(accountKey);
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

## Type Definitions

```ts
function useGeinsAuth(): UseGeinsAuthReturnType;

interface UseGeinsAuthReturnType {
  session: ComputedRef<Session | null>;
  accessToken: ComputedRef<string | undefined>;
  isAuthenticated: ComputedRef<boolean>;
  isRefreshing: Ref<boolean>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  preLogin: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<any>;
  verify: (tokens: AuthTokens) => Promise<any>;
  setAccount: (accountKey: string) => Promise<any>;
  setSession: (session: Session) => Promise<any>;
  sessionsAreEqual: (session1: Session, session2: Session) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
  setIsRefreshing: (value: boolean) => void;
  parseToken: (token?: string | null) => any | null;
  isExpired: (token?: string | null) => boolean;
  expiresSoon: (token?: string | null, threshold?: number) => boolean;
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthTokens {
  loginToken: string;
  mfaCode: string;
}

interface Session {
  isAuthenticated?: boolean;
  accessToken?: string;
  accountKey?: string;
  expires?: string;
  accounts?: any[];
  [key: string]: any;
}
```

## Dependencies

This composable depends on:

1. **NuxtAuth**: Ensure the `NuxtAuth` function is correctly set up.
2. **jwt-decode**: The `jwt-decode` plugin is used to parse JWT tokens.
