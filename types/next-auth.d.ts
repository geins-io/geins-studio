/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';

import type {
  Session as CustomSession,
  User as CustomUser,
} from '@/types/auth/Auth';

declare module 'next-auth' {
  interface User extends CustomSession {}
  interface Session extends CustomSession {
    user?: CustomUser;
    expires?: ISODateString;
  }
}
declare module 'next-auth/jwt' {
  interface JWT extends CustomSession {}
}
