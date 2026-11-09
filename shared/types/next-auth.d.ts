/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth from 'next-auth';
import type { Session as CustomSession } from '#shared/types';
import type { DefaultUser } from 'next-auth';
import type { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface User extends DefaultUser, CustomSession {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- merges our fields into next-auth's Session
  interface Session extends CustomSession {}
}
declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT, CustomSession {}
}
