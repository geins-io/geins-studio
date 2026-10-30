import CredentialsProvider from 'next-auth/providers/credentials';
import type { LoginCredentials, AuthResponse, AuthTokens } from '#shared/types';
import {
  sessionFromToken,
  tokenAfterRefresh,
  tokenAfterRefreshError,
} from '#shared/utils/auth-session';
import { NuxtAuthHandler } from '#auth';

const geinsAuth = auth();
const { geinsLog, geinsLogWarn } = log('server/api/auth/[...].ts');
const config = useRuntimeConfig();

export default NuxtAuthHandler({
  secret: config.private.authSecret,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
  },
  debug: config.public.debug,
  callbacks: {
    // Neither callback may throw: next-auth 4 clears the session cookie on any
    // throw here, which turned a Geins hiccup into a logout.
    jwt: async ({ token, user, trigger }) => {
      if (trigger === 'signIn' && user) {
        // Our session data comes back from `authorize` as the user object
        return { ...user };
      }
      // Only a plain session read refreshes: a sign-in has just minted fresh
      // tokens, and `update` isn't used.
      if (
        trigger !== undefined ||
        user !== undefined ||
        !geinsAuth.shouldRefresh(token)
      ) {
        return token;
      }
      // Returned as spreads: `JWT` has an index signature the `Session`
      // interface lacks.
      try {
        const response = await geinsAuth.refresh(token.refreshToken);
        const refreshed = tokenAfterRefresh(token, response);
        geinsLog('jwt ::: token refreshed, expires:', refreshed.tokenExpires);
        return { ...refreshed };
      } catch (error) {
        const next = tokenAfterRefreshError(token, error);
        geinsLogWarn(
          `jwt ::: refresh failed (${next.error}):`,
          error instanceof Error ? error.message : error,
        );
        return { ...next };
      }
    },

    session: async ({ session, token }) =>
      sessionFromToken(token, session.expires),
  },
  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
    CredentialsProvider.default({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(
        payload: LoginCredentials | AuthTokens | AuthResponse | Session,
      ) {
        let authResponse: AuthResponse | null = null;

        // Check if we have a login token and MFA code, or a username and password,
        // or an account key, and according to that, fetch or set the auth response accordingly
        // and call the appropriate login method
        if ('username' in payload && payload.username && payload.password) {
          authResponse = await geinsAuth.login(payload);
        } else if (
          'loginToken' in payload &&
          payload.loginToken &&
          payload.mfaCode
        ) {
          authResponse = await geinsAuth.verify(payload);
        } else if ('accountKey' in payload && payload.accountKey) {
          authResponse = payload as AuthResponse;
        }

        // If we don't have a valid response, return null
        if (!authResponse) {
          return null;
        }

        // If we have a valid response, return the session data
        return geinsAuth.getSessionFromResponse(authResponse);
      },
    }),
  ],
});
