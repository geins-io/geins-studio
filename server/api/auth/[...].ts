import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import type { LoginCredentials } from '@/types/auth/Auth';

const geinsAuth = auth();

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    /**
     * Callback function for handling JSON Web Tokens (JWT).
     *
     * @param {Object} params - The parameters for the callback.
     * @param {Object} params.token - The current token object.
     * @param {Object} [params.user] - The user object, if available.
     * @param {string} [params.trigger] - The trigger event for the callback.
     *
     * @returns {Promise<Object>} The updated token object.
     *
     * This callback handles the following scenarios:
     * - On sign-in (`trigger === 'signIn'`), it sets the token based on the user's authorization status.
     *   - If the user is authorized, the token is set with the user's data.
     *   - If the user requires two-factor authentication (TFA), the token is set with TFA information.
     * - If the token needs to be refreshed (`trigger === undefined` and `user === undefined`), it attempts to refresh the token.
     *   - If the refresh is successful, the token is updated with the new token data.
     *   - If the refresh fails with a 401 or 403 status, the token is set to unauthorized to force a logout.
     *   - Other errors are logged for further decision-making.
     */
    jwt: async ({ token, user, trigger }) => {
      if (trigger === 'signIn' && user) {
        // Set the token
        if (user.isAuthorized) {
          token = {
            ...user,
          };
        } else if (user.tfa) {
          token = {
            isAuthorized: false,
            tfa: user.tfa,
          };
        }
      } else if (
        trigger === undefined &&
        user === undefined &&
        geinsAuth.shouldRefresh(token)
      ) {
        try {
          // Refresh the token
          const newTokens = await geinsAuth.refresh(token.refreshToken);
          if (newTokens) {
            const tokenData = geinsAuth.getTokenData(newTokens);
            token = {
              ...tokenData,
            };
            return token;
          }
        } catch (error) {
          if (error.status === 401 || error.status === 403) {
            // This will force logout in session callback
            token = {
              isAuthorized: false,
            };
            return token;
          } else {
            // TODO: Decide if we should try to refresh the token again, or just log the user out
          }
        }
      }

      return token;
    },

    /**
     * Callback function for handling sessions.
     *
     * @param {Object} params - The parameters for the callback.
     * @param {Object} params.session - The current session object.
     * @param {Object} params.token - The current token object.
     *
     * @returns {Promise<Object>} The updated session object.
     *
     * This callback function updates the session object with the user's data if the user is authorized.
     * If the user requires two-factor authentication (TFA), the session object is updated with TFA information.
     * If the token is expired, the session object is updated to force a logout.
     * If the user's data cannot be fetched, the session object is kept as is.
     */
    session: async ({ session, token }) => {
      if (token.isAuthorized && token.accessToken) {
        session = {
          ...session,
          isAuthorized: token.isAuthorized,
          accessToken: token.accessToken,
          refreshedAt: token.refreshedAt,
        };
        if (!session.user?.email && !geinsAuth.isExpired(token.tokenExpires)) {
          try {
            const user = await geinsAuth.getUser(token.accessToken);
            session.user = user;
          } catch (error) {
            console.warn('Error fetching user:', error);
            // Keep session as is if we can't fetch the user, maybe there is a network error..
          }
        }
      } else {
        // Throw error to force log out
        throw new Error('Unauthorized');
      }
      if (token.tfa) {
        return { ...session, tfa: token.tfa };
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
      async authorize(credentials: LoginCredentials) {
        const geinsAuth = auth();

        if (credentials.username && credentials.password) {
          const authResponse = await geinsAuth.login(credentials);

          if (!authResponse) {
            return null;
          }

          return geinsAuth.getTokenData(authResponse);
        }

        return null;
      },
    }),
  ],
});
