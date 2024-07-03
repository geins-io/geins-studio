export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  permissions: string[];
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
