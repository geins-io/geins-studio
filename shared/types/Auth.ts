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
  accountKey: string;
  displayName: string;
  roles: string[];
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
