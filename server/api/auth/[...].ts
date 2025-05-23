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
  debug: process.env.GEINS_DEBUG === 'true',
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      geinsLog('JWT callback triggered:', {
        trigger,
        hasUser: !!user,
        tokenBefore: { ...token },
      });

      if (trigger === 'signIn' && user) {
        // If this is a sign in, set the token to include the user object,
        // where our session data is stored when returned from the API
        token = {
          ...user,
        };
        geinsLog('JWT after signIn:', { tokenAfter: { ...token } });
      } else if (
        trigger === undefined &&
        user === undefined &&
        geinsAuth.shouldRefresh(token)
      ) {
        // If the token should be refreshed, try to do so
        geinsLog('Attempting to refresh token');
        try {
          const newTokens = await geinsAuth.refresh(token.refreshToken);
          if (newTokens) {
            // If refresh is successful, update the token with the new session data
            const tokenData = geinsAuth.getSessionFromResponse(newTokens);
            // Set the new token data but keep accountKey and user as is
            token = {
              ...tokenData,
              accountKey: token.accountKey,
              user: token.user,
            };
            geinsLog('Token refreshed successfully:', {
              refreshedToken: { ...token },
            });
            return token;
          }
        } catch (error) {
          geinsLogWarn('Token refresh error:', error);
          // If the refresh fails, check the error status and handle accordingly
          if (error.status === 401 || error.status === 403) {
            // This will force logout in session callback
            token = {
              isAuthenticated: false,
            };
            geinsLog('Token refresh failed with auth error, forcing logout');
            return token;
          } else {
            geinsLogWarn('Token refresh failed with unknown error', error);
          }
        }
      }
      return token;
    },

    session: async ({ session, token }) => {
      geinsLog('Session callback triggered:', {
        hasToken: !!token,
        isAuthenticated: token.isAuthenticated,
      });

      if (token.isAuthenticated && token.accessToken) {
        // If we are authorized and have an access token, update the session
        session = {
          ...session,
          ...geinsAuth.getAuthenticatedSession(token),
          accounts: token.accounts,
        };
        // If we don't have a user object yet, fetch it
        if (
          !session.user?.email &&
          !geinsAuth.isExpired(session.tokenExpires) &&
          session.accountKey
        ) {
          try {
            geinsLog('Fetching user data');
            const user = await geinsAuth.getUser(
              token.accessToken,
              session.accountKey,
            );
            session.user = user;
            geinsLog('User fetched successfully', { hasUser: !!user });
          } catch (error) {
            geinsLogWarn('Error fetching user:', error);
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
        geinsLog('MFA active in session');
      } else {
        // Throw error to force log out
        geinsLogWarn('User unauthorized, logging out');
        throw { status: 401, message: 'AUTH_ERROR' };
      }

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
      async authorize(
        payload: LoginCredentials | AuthTokens | AuthResponse | Session,
      ) {
        geinsLog('Authorize called with payload type:', {
          hasUsername: 'username' in payload,
          hasLoginToken: 'loginToken' in payload,
          hasUser: 'user' in payload,
          hasAccountKey: 'accountKey' in payload,
        });

        let authResponse: AuthResponse | null = null;

        try {
          // Check if we have a login token and MFA code, or a username and password,
          // or an account key, and according to that, fetch or set the auth response accordingly
          // and call the appropriate login method
          if ('username' in payload && payload.username && payload.password) {
            geinsLog('Attempting login with username/password');
            authResponse = await geinsAuth.login(payload);
            geinsLog('Login response received', { success: !!authResponse });
          } else if (
            'loginToken' in payload &&
            payload.loginToken &&
            payload.mfaCode
          ) {
            geinsLog('Attempting MFA verification');
            authResponse = await geinsAuth.verify(payload);
            geinsLog('Verification response received', {
              success: !!authResponse,
            });
          } else if (
            'user' in payload &&
            payload.user &&
            Object.keys(payload.user).length
          ) {
            geinsLog('Processing session with existing user data');
            const session: Session =
              geinsAuth.parseSessionObjectStrings(payload);
            return geinsAuth.getAuthenticatedSession(session);
          } else if ('accountKey' in payload && payload.accountKey) {
            geinsLog('Processing response with account key');
            authResponse = payload as AuthResponse;
          }

          // If we don't have a valid response, return null
          if (!authResponse) {
            geinsLogWarn('No valid auth response generated');
            return null;
          }

          // If we have a valid response, return the session data
          const sessionData = geinsAuth.getSessionFromResponse(authResponse);
          geinsLog('Session data generated', {
            isAuthenticated: sessionData.isAuthenticated,
            hasMfa: sessionData.mfaActive,
          });
          return sessionData;
        } catch (error) {
          geinsLogWarn('Error in authorize callback:', error);
          return null;
        }
      },
    }),
  ],
});
