import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import type { LoginCredentials } from '@/types/auth/Auth';
import type { Session } from 'next-auth';

let justSignedIn = false;

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (trigger === 'signIn' && user) {
        // Set the token
        if (user.isAuthorized) {
          token = {
            isAuthorized: user.isAuthorized,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
          };
          justSignedIn = true;
        } else if (user.tfa) {
          token = {
            isAuthorized: false,
            tfa: user.tfa,
          };
        }
      } else if (justSignedIn) {
        justSignedIn = false;
      } else if (
        token.isAuthorized &&
        trigger === undefined &&
        user === undefined
      ) {
        try {
          // Refresh the token
          const geinsAuth = auth();
          const newTokens = await geinsAuth.refresh(token.refreshToken);

          if (newTokens) {
            token = {
              isAuthorized: true,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
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
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.isAuthorized && token.accessToken) {
        session = {
          ...session,
          ...token,
        };
        if (!session.user?.email) {
          try {
            const geinsAuth = auth();
            const user = await geinsAuth.getUser(token.accessToken);
            session.user = user;
          } catch (error) {
            console.error('Error fetching user:', error);
            session = {
              ...session,
              isAuthorized: false,
            };
          }
        }
      } else {
        session = {
          ...session,
          isAuthorized: false,
        };
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

          return {
            isAuthorized: true,
            accessToken: authResponse.accessToken,
            refreshToken: authResponse.refreshToken,
          } as Session;
        }

        return null;
      },
    }),
  ],
});
