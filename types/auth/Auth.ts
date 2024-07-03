export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe: boolean;
}
export interface LoginResponse {
  uid?: string;
  name?: string;
  email?: string;
  roles?: string[];
  dfa?: Dfa;
}

export interface UserResponse {
  uid?: string;
  name?: string;
  email?: string;
  roles?: string[];
  dfa?: Dfa;
}

export interface Dfa {
  username: string;
  sentTo: string;
  active: boolean;
  token: string;
}

export interface Session {
  uid: string;
  jwt: string;
  type: string;
  user: User;
  dfa?: Dfa;
  roles: string[];
}

export interface JwtType {
  id: string;
  jwt: string;
  type: string;
  user: User;
  dfa?: Dfa;
  roles: string[];
}
