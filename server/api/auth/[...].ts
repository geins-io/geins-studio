import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import type { LoginCredentials } from '@/types/auth/Auth';

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      const geinsAuth = auth();
      const inRefresh = await geinsAuth.inRefresh();
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
        token.isAuthorized &&
        !inRefresh &&
        (geinsAuth.isExpired(token.tokenExpires) ||
          geinsAuth.expiresSoon(token.tokenExpires))
      ) {
        try {
          await geinsAuth.setInRefresh(true);
          // Refresh the token
          const newTokens = await geinsAuth.refresh(token.refreshToken);
          if (newTokens) {
            const session = geinsAuth.getSession(newTokens);
            token = {
              ...session,
            };
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          if (error === 'Unauthorized') {
            token = {
              isAuthorized: false,
            };
          } else {
            // TODO: Decide if we should try to refresh the token again, or just log the user out
          }
        } finally {
          await geinsAuth.setInRefresh(false);
        }
      }
      console.log('🚀 ~ jwt: ~ token RETURNED:', token);

      return token;
    },
    session: async ({ session, token }) => {
      const geinsAuth = auth();
      if (token.isAuthorized && token.accessToken) {
        session = {
          ...session,
          ...token,
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
      console.log('🚀 ~ session: ~ session RETURNED:', session);

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

          return geinsAuth.getSession(authResponse);
        }

        return null;
      },
    }),
  ],
});
