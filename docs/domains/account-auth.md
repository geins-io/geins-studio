# Account & Auth Domain

> Authentication, user management, and merchant account configuration.
> For system architecture, see `ARCHITECTURE.md`. For app-level routing, see `APP.md`.

---

## Purpose

The Account & Auth domain handles everything related to identity and merchant configuration. It spans both client and server: authentication flows (login, MFA, password reset), user profile management, and the merchant account context (channels, currencies, languages) that all other domains depend on.

## Key Concepts

**Multi-layered auth flow** — Authentication involves 6 layers working in sequence:

1. **Middleware** (`auth.global.ts`) — Route guard redirecting unauthenticated users to `/auth/login`
2. **Server handler** (`server/api/auth/[...].ts`) — NextAuth.js with `CredentialsProvider`, JWT handling. Its `jwt`/`session` callbacks never throw (next-auth 4 wipes the cookie on a throw); a failed refresh becomes `session.error` (`RefreshTokenInvalid` on 401/403, else `RefreshFailed` with the token kept). Decisions live in `shared/utils/auth-session.ts`
3. **Server utility** (`server/utils/auth.ts`) — Direct API calls to Geins auth endpoints (login, refresh, verify); throws `AuthApiError` (HTTP status, or `0` for network/timeout)
4. **Plugin** (`geins-api.ts`) — `$geinsApi` fetch instance; refreshes a due token before each request through `useGeinsAuth().refresh` (one refresh in flight per tab, one at a time across tabs via the Web Lock `geins-auth-refresh`)
5. **Composable** (`useGeinsAuth`) — Client-side auth state: `session`, `isAuthenticated`, `login()`, `logout()`
6. **Plugin** (`auth-state.ts`) — Cross-tab sync via `BroadcastChannel('geins-auth')`; proactive refresh (every 60s and when a tab becomes visible); the deliberate logout, after one re-check of a `RefreshTokenInvalid` session

**Multi-account support** — Users can belong to multiple merchant accounts (`AuthAccounts[]`). After login, if `accounts.length > 1`, the user selects an account. The selected `accountKey` is passed to all subsequent API calls.

**MFA** — Supported via `mfaRequired` / `mfaMethod` on `AuthResponse`. The `AuthForm` component switches to `verify` mode when MFA is triggered.

**Account store** — `useAccountStore` caches merchant-level data (channels, currencies, languages) and persists user preferences (`currentChannelId`, `currentCurrency`, `currentLanguage`) in cookies. Initialized by the `geins-global.ts` plugin on session start. On logout the plugin resets it and the products store. It ignores the brief `loading` status during a token refresh, so a refresh never counts as a logout.

**User store** — `useUserStore` loads the signed-in user from `user/me` (with accounts) through `$geinsApi` — the session carries tokens only. `geins-global.ts` awaits `init()` at boot and resets it on logout; the login page loads it for account selection. It derives display properties (`userInitials`, `userName`, `userEmail`, `userAccounts`) and provides role/permission checks (`hasAnyRole`, `hasAnyPermission` — currently TODO stubs).

## API Shape

| Endpoint                 | Method  | Purpose                            |
| ------------------------ | ------- | ---------------------------------- |
| `/user`                  | CRUD    | User management (admin)            |
| `/user/me`               | GET/PUT | Current user profile               |
| `/user/me/password`      | POST    | Password change                    |
| `/user/password/restore` | POST    | Begin password reset flow          |
| `/user/password`         | POST    | Complete password reset with token |
| `/account`               | GET     | Merchant account details           |
| `/account/channel/list`  | GET     | Available channels                 |
| `/account/currency/list` | GET     | Available currencies               |
| `/account/language/list` | GET     | Available languages                |

**User types** — `ApiUserType` is either `'api'` (service account) or `'personal'` (human user).

**Profile vs User** — `UserProfile` is a subset of `User` without `roles`, `apiUserType`, or `error`. The `/me` endpoints use the profile subset.

## Contracts (Cross-Domain Usage)

| Type                            | Used By     | Purpose                                                   |
| ------------------------------- | ----------- | --------------------------------------------------------- |
| `Channel`, `Market`, `Currency` | All domains | Scoping products, prices, and quotations                  |
| `Account`                       | All domains | Merchant context (`accountKey`, `defaultCurrency`)        |
| `User`                          | Orders      | Author info for quotation messages and status transitions |
| `Session`, `AuthTokens`         | Plugins     | Token management and request authentication               |

## Dependencies

- **Depends on**: None (foundational domain alongside Products)
- **Depended on by**: All other domains (authentication, merchant context, user identity)

## Key Files

| Layer        | Path                                                                                                  |
| ------------ | ----------------------------------------------------------------------------------------------------- |
| Types        | `shared/types/Auth.ts`, `shared/types/Account.ts`                                                     |
| Repositories | `app/utils/repositories/user.ts`, `app/utils/repositories/global.ts`                                  |
| Stores       | `app/stores/account.ts`, `app/stores/user.ts`                                                         |
| Composables  | `useGeinsAuth.ts`, `useGeinsApi.ts`                                                                   |
| Plugins      | `geins-api.ts`, `auth-state.ts`, `geins-global.ts`, `error-handler.ts`                                |
| Server       | `server/api/auth/[...].ts`, `server/utils/auth.ts`                                                    |
| Components   | `app/components/auth/AuthForm.vue`                                                                    |
| Pages        | `app/pages/auth/login.vue`, `logout.vue`, `reset-password.vue`, `app/pages/account/profile/index.vue` |

## Decision Log

**2024-07-02: NextAuth.js for authentication**
Server-side JWT handling keeps secrets off the client. The `CredentialsProvider` bridges to the Geins auth API while NextAuth manages token lifecycle and session serialization.

**2024-07-03: Six-layer auth architecture**
Each layer has a single responsibility (route guard → server handler → server utility → fetch plugin → composable → cross-tab sync). This separation makes each layer independently testable and replaceable.

**2025-03-01: Cookie-persisted account preferences**
`currentChannelId`, `currentCurrency`, and `currentLanguage` are stored in cookies so they survive page reloads and new tabs without requiring an API call.

**2026-10-30: Session holds tokens only; user loaded client-side**
The `session` callback used to call `user/me` on every `/api/auth/session` (the user was never stored in the token) and threw on failure, which wiped the cookie. Now the callbacks are pure and never throw, and `useUserStore` loads the user via `$geinsApi`. Keeps the JWT cookie small (staff users have long account lists) and the name fresh after a profile edit.
