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
  sessionError,
  authStateDiffers,
  accountKey,
  authSignal,
  broadcastAuthSignal,
  preLogin,
  login,
  verify,
  setAccount,
  logout,
  refresh,
  syncSession,
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

### `sessionError`

A `computed` reference to `session.error`: why the last token refresh failed, if it did. `'RefreshTokenInvalid'` means Geins rejected the refresh token (the session is `isAuthenticated: false`); `'RefreshFailed'` means a transient failure (5xx, network, timeout) — the session is kept and the next session fetch retries. See [When a refresh fails](/concepts/authentication#when-a-refresh-fails).

### `authStateDiffers`

A `computed` reference that returns `true` if the auth state indicates the user is authenticated but the session data does not.

### `accountKey`

A `computed` reference to the current account key from the session.

### `authSignal`

A `computed` reference to the last auth signal received from another tab on the `geins-auth` BroadcastChannel: `{ type: 'session-changed' }` or `{ type: 'signed-out' }`. The `auth-state.ts` plugin reacts to it. Tabs share the session cookie, so signals never carry tokens or sessions — a receiving tab re-reads its own session with `syncSession`.

### `broadcastAuthSignal`

```ts
broadcastAuthSignal(message: AuthBroadcastMessage): void
```

Posts an auth signal to the other tabs (a tab never receives its own). `login`, `verify`, `setAccount` and `refresh` post `session-changed` themselves when they leave the tab authenticated with a new session; the auth middleware posts `signed-out` on `/auth/logout`, where every logout lands after the cookie was cleared.

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

Sets the account context for the current session, then signals the other tabs (`session-changed`).

- **Parameters:**
  - `accountKey`: The account key to set for the session
- **Returns:** A promise that resolves to the updated session

### `logout`

```ts
logout(): Promise<void>
```

Logs out the user and clears the session. It lands on `/auth/logout`, where the auth middleware signals the other tabs (`signed-out`) to go to the login page.

- **Returns:** A promise that resolves when the logout process is complete

### `refresh`

```ts
refresh(): Promise<Session>
```

Re-reads the session from the server, which refreshes the access token if it is expired or expires within 5 minutes. Concurrent calls in a tab share one request, and calls across tabs run one at a time under the Web Lock `geins-auth-refresh` — so after one tab rotates the token, the others read it from the shared cookie instead of refreshing again. See [Refresh Flow](/concepts/authentication#refresh-flow).

- **Returns:** A promise that resolves to the updated session

When the access token changed, `refresh` signals the other tabs (`session-changed`).

### `syncSession`

```ts
syncSession(): Promise<Session>
```

Re-reads the session like `refresh` (same lock), but never signals the other tabs. Used by signal receivers, so a change doesn't echo back to every tab.

- **Returns:** A promise that resolves to the updated session

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
  sessionError: ComputedRef<AuthSessionError | undefined>;
  authStateDiffers: ComputedRef<boolean>;
  accountKey: ComputedRef<string | undefined>;
  authSignal: ComputedRef<AuthBroadcastMessage | undefined>;
  broadcastAuthSignal: (message: AuthBroadcastMessage) => void;
  preLogin: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<any>;
  verify: (tokens: AuthTokens) => Promise<any>;
  setAccount: (accountKey: string) => Promise<any>;
  logout: () => Promise<void>;
  refresh: () => Promise<Session>;
  syncSession: () => Promise<Session>;
  parseToken: (token?: string | null) => any | null;
  isExpired: (token?: string | null) => boolean;
  expiresSoon: (token?: string | null, threshold?: number) => boolean;
}

interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  loginToken?: string;
  mfaCode?: string;
  accountKey?: string;
}

interface AuthResponse extends AuthTokens {
  mfaRequired?: boolean;
  mfaMethod?: string;
  accounts?: AuthAccounts[];
}

type AuthSessionError = 'RefreshTokenInvalid' | 'RefreshFailed';

type AuthBroadcastMessage =
  | { type: 'session-changed' }
  | { type: 'signed-out' };

interface Session extends AuthTokens {
  isAuthenticated?: boolean;
  tokenExpires?: number;
  refreshedAt?: number;
  mfaActive?: boolean;
  mfaMethod?: string;
  expires?: string;
  error?: AuthSessionError;
}

interface LoginCredentials {
  username: string;
  password?: string;
  rememberMe?: boolean;
}

interface AuthAccounts {
  accountKey: string;
  displayName: string;
  roles: string[];
}
```

## Dependencies

This composable depends on:

1. **NuxtAuth**: Ensure the `NuxtAuth` function is correctly set up.
2. **jwt-decode**: The `jwt-decode` plugin is used to parse JWT tokens.
