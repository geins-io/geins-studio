export interface User {
  id: number | string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  roles: string[];
}

export interface Session {
  isAuthorized: boolean;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  tfa?: TFA;
}

export interface LoginCredentials extends TFA {
  username: string;
  password?: string;
  rememberMe?: boolean;
}

export interface TFA {
  token?: string;
  sentTo?: string;
  username?: string;
  code?: string;
}

export type AuthFormMode = 'login' | 'verify';
