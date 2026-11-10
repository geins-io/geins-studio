import type { ApiOptions } from './Api';
import type { CreateEntity, UpdateEntity, ResponseEntity } from './Global';

export type ApiUserType = 'api' | 'personal';

export interface UserBase {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phoneNumber?: string;
  roles?: string[];
  apiUserType?: ApiUserType;
  error?: unknown;
  accountCount?: number;
  basicAccounts?: AuthAccounts[];
}

export interface UserCreate extends Omit<CreateEntity<UserBase>, 'name'> {
  name?: string;
}
export interface UserUpdate extends Omit<UpdateEntity<UserBase>, 'name'> {
  name?: string;
}
export interface User extends ResponseEntity<UserBase> {
  password?: string;
}

export type UserProfileBase = Omit<UserBase, 'roles' | 'apiUserType' | 'error'>;

export type UserProfileCreate = CreateEntity<UserProfileBase>;
export type UserProfileUpdate = UpdateEntity<UserProfileBase>;
export type UserProfile = ResponseEntity<UserProfileBase>;

export type UserProfileFieldsFilter = 'accounts' | 'none' | 'all';
export type UserProfileApiOptions = ApiOptions<UserProfileFieldsFilter>;

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  loginToken?: string;
  mfaCode?: string;
  accountKey?: string;
}

export interface AuthResponse extends AuthTokens {
  mfaRequired?: boolean;
  mfaMethod?: string;
  accounts?: AuthAccounts[];
}

/**
 * Why the last token refresh didn't go through. `RefreshTokenInvalid`: Geins
 * rejected the refresh token (any 4xx but 408/429; an expired one gets a 403),
 * so the session is over unless another tab rotated it meanwhile.
 * `RefreshFailed`: transient (5xx, 408, 429, network, timeout); the token is
 * kept and the next session fetch retries.
 */
export type AuthSessionError = 'RefreshTokenInvalid' | 'RefreshFailed';

/**
 * Server-only: the tokens a session holds, as the refresh helpers in
 * `shared/utils/auth-session.ts` see them. Never sent to the browser.
 */
export interface TokenSession extends AuthTokens {
  isAuthenticated?: boolean;
  tokenExpires?: number;
  refreshedAt?: number;
  mfaActive?: boolean;
  error?: AuthSessionError;
}

/**
 * The session the browser sees (`GET /api/auth/session`). It never holds a
 * token: the Geins tokens stay in the sealed session cookie on the server.
 */
export interface Session {
  isAuthenticated: boolean;
  accountKey?: string;
  /** The access token's `exp`, in seconds. Also identifies the token. */
  tokenExpires?: number;
  /** Waiting for the MFA code; the login token stays on the server. */
  mfaActive?: boolean;
  mfaMethod?: string;
  error?: AuthSessionError;
}

export interface LoginCredentials {
  username: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthAccounts {
  accountKey: string;
  name: string;
  roles: string[];
}

/**
 * Body of `POST /api/auth/refresh`, sent after the API answered 401 to a token
 * that hasn't expired. `rejectedTokenExpires` is the `tokenExpires` of the
 * session the tab holds; the server refreshes only while the cookie still
 * holds that token, so a token another tab already rotated isn't revoked again.
 */
export interface ForceRefreshRequest {
  rejectedTokenExpires: number | undefined;
}

/**
 * Cross-tab auth signal on the `geins-auth` BroadcastChannel. Signals only —
 * never tokens or sessions: tabs share the session cookie, so a receiver
 * re-reads its own session and decides for itself.
 */
export type AuthBroadcastMessage =
  | { type: 'session-changed' }
  | { type: 'signed-out' };

/**
 * Result of `login`, `verify` and `setAccount` in `useGeinsAuth`. `status` is
 * the HTTP status of the auth route (`429`: too many attempts), or `0` when no
 * response came back.
 */
export interface SignInResponse {
  ok: boolean;
  status: number;
}

export type AuthFormMode =
  | 'login'
  | 'verify'
  | 'account'
  | 'forgot-password'
  | 'reset-password'
  | 'logout';

export interface LoginFormValues {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordFormValues {
  email: string;
}

export interface ResetPasswordFormValues {
  newPassword: string;
  passwordRepeat: string;
}
