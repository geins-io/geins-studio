/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from 'next-auth';
import type {
  Session as CustomSession,
  User as CustomUser,
} from '#shared/types';
import type { DefaultUser } from 'next-auth';
import type { JWT, DefaultJWT } from 'next-auth/jwt';


declare module 'next-auth' {
  interface User extends DefaultUser, CustomSession {}
  interface Session extends CustomSession {
    user?: CustomUser;
  }
}
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT, CustomSession {}
}
