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
 * rejected the refresh token (401/403), so the session is over unless another
 * tab rotated it meanwhile. `RefreshFailed`: transient (5xx, network, timeout);
 * the token is kept and the next session fetch retries.
 */
export type AuthSessionError = 'RefreshTokenInvalid' | 'RefreshFailed';

export interface Session extends AuthTokens {
  isAuthenticated?: boolean;
  tokenExpires?: number;
  refreshedAt?: number;
  mfaActive?: boolean;
  mfaMethod?: string;
  expires?: string;
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
 * Cross-tab auth signal on the `geins-auth` BroadcastChannel. Signals only —
 * never tokens or sessions: tabs share the session cookie, so a receiver
 * re-reads its own session and decides for itself.
 */
export type AuthBroadcastMessage =
  | { type: 'session-changed' }
  | { type: 'signed-out' };

/**
 * Response from auth sign-in operations.
 *
 * Represents the result of calling signIn through @sidebase/nuxt-auth.
 * Used as the return type for login, verify, and setAccount
 * in the useGeinsAuth composable.
 */
export interface SignInResponse {
  /** Error message if the sign-in failed, null on success */
  error: string | null;
  /** HTTP status code of the sign-in response */
  status: number;
  /** Whether the sign-in was successful */
  ok: boolean;
  /** Redirect URL, if any */
  url: string | null;
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
