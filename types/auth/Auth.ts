export interface User {
  id: number;
  firstname: string;
  lastname: string;
  username: string;
  role: string;
  email: string;
  phone: string;
  permissions?: string[];
}
export interface LoginCredentials {
  username: string;
  password?: string;
  rememberMe?: boolean;
  tfaString?: string;
  tfa?: TFA;
}

export interface Session {
  isAuthorized: boolean;
  accessToken?: string;
  sessionId?: string;
  user?: User;
  roles?: string[];
  tfa?: TFA;
  type?: string;
}

export interface TFA {
  active: boolean;
  token: string;
  sentTo: string;
  username?: string;
  code?: string;
}

export type AuthFormMode = 'login' | 'verify';
