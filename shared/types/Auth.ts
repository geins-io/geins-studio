export type ApiUserType = 'api' | 'personal';

export interface UserBase {
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phoneNumber?: string;
  company?: string;
  roles?: string[];
  apiUserType?: ApiUserType;
  error?: unknown;
}

export type UserCreate = CreateEntity<UserBase>;
export type UserUpdate = UpdateEntity<UserBase>;
export interface User extends ResponseEntity<UserBase> {
  password?: string;
}

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  loginToken?: string;
  mfaCode?: string;
  accounts?: AuthAccounts;
  accountKey?: string;
}

export interface AuthResponse extends AuthTokens {
  mfaRequired?: boolean;
  mfaMethod?: string;
}

export interface Session extends AuthTokens {
  isAuthenticated?: boolean;
  tokenExpires?: number;
  refreshedAt?: number;
  user?: User;
  mfaActive?: boolean;
  mfaMethod?: string;
  expires?: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
  rememberMe?: boolean;
}

export interface AuthAccounts {
  [key: string]: {
    displayName: string;
  };
}

export interface AuthBroadcastData {
  session?: Session | null;
  isRefreshing?: boolean;
}

export type AuthFormMode =
  | 'login'
  | 'verify'
  | 'account'
  | 'forgot-password'
  | 'reset-password';
