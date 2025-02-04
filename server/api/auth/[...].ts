import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import type { LoginCredentials, AuthResponse, AuthTokens } from '#shared/types';

const geinsAuth = auth();
const { geinsLog, geinsLogWarn } = log('server/api/auth/[...].ts');

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (trigger === 'signIn' && user) {
        // If this is a sign in, set the token to include the user object,
        // where our session data is stored when returned from the API
        token = {
          ...user,
        };
      } else if (
        trigger === undefined &&
        user === undefined &&
        geinsAuth.shouldRefresh(token)
      ) {
        // If the token should be refreshed, try to do so
        try {
          const newTokens = await geinsAuth.refresh(token.refreshToken);
          if (newTokens) {
            // If refresh is successful, update the token with the new session data
            const tokenData = geinsAuth.getSession(newTokens);
            token = {
              ...tokenData,
            };
            geinsLog('jwt returned ::: refresh:', token);
            return token;
          }
        } catch (error) {
          // TODO: type errors
          // If the refresh fails, check the error status and handle accordingly
          if (error.status === 401 || error.status === 403) {
            // This will force logout in session callback
            token = {
              isAuthenticated: false,
            };
            geinsLog('jwt returned ::: refresh fail:', token);
            return token;
          } else {
            // TODO: Decide what to do here
          }
        }
      }
      geinsLog('jwt returned:', token);
      return token;
    },
    session: async ({ session, token }) => {
      if (token.isAuthenticated && token.accessToken) {
        // If we are authorized and have an access token, update the session
        session = {
          ...session,
          isAuthenticated: token.isAuthenticated,
          accessToken: token.accessToken,
          refreshedAt: token.refreshedAt,
          accountKey: token.accountKey,
          accounts: token.accounts,
        };
        // If we don't have a user object yet, fetch it
        if (
          !session.user?.email &&
          !geinsAuth.isExpired(token.tokenExpires) &&
          session.accountKey
        ) {
          try {
            const user = await geinsAuth.getUser(
              token.accessToken,
              session.accountKey,
            );
            session.user = user;
          } catch (error) {
            geinsLogWarn('error fetching user:', error);
            session.user = {
              error,
            };
            // Keep session as is if we can't fetch the user, maybe there is a network error..
          }
        }
      } else if (token.mfaActive) {
        // If MFA is active, set the session to reflect this
        session = {
          ...session,
          ...token,
        };
      } else {
        // Throw error to force log out
        geinsLogWarn('user unauthorized, logging out');
        throw { status: 401, message: 'AUTH_ERROR' };
      }
      geinsLog('session:', session);
      return session;
    },
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
      async authorize(payload: LoginCredentials | AuthTokens | AuthResponse) {
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
        return geinsAuth.getSession(authResponse);
      },
    }),
  ],
});
