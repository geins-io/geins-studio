export interface User {
  id: number | string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string;
  company?: string;
  roles?: string[];
  apiUserType?: string;
  username?: string;
}

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
  loginToken?: string;
  mfaCode?: string;
}

export interface AuthResponse extends AuthTokens {
  mfaRequired?: boolean;
  mfaMethod?: string;
}

export interface Session extends AuthTokens {
  isAuthorized?: boolean;
  tokenExpires?: number;
  refreshedAt?: number;
  user?: User;
  mfaActive?: boolean;
  mfaMethod?: string;
}

export interface LoginCredentials extends AuthTokens {
  username: string;
  password?: string;
  rememberMe?: boolean;
}

export type AuthFormMode = 'login' | 'verify';
