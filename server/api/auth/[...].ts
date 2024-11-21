import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import type { LoginCredentials } from '@/types/auth/Auth';
import type { Session } from 'next-auth';

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      const geinsAuth = auth();
      if (trigger === 'signIn' && user) {
        // Set the token
        if (user.isAuthorized) {
          const parsedToken = geinsAuth.parseToken(user.accessToken);
          console.log('🚀 ~ jwt: ~ parsedToken:', parsedToken);
          token = {
            isAuthorized: user.isAuthorized,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
            tokenExpires: parsedToken.exp,
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
        (geinsAuth.isExpired(token.tokenExpires) ||
          geinsAuth.expiresSoon(token.tokenExpires))
      ) {
        console.log('🚀 ~ jwt: ~ token in """refresh""":', token.refreshToken);
        console.log('🚀 ~ jwt: ~ token:', token);
        try {
          // Refresh the token
          const newTokens = await geinsAuth.refresh(token.refreshToken);

          if (newTokens) {
            const parsedToken = geinsAuth.parseToken(newTokens.accessToken);

            token = {
              isAuthorized: true,
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken,
              tokenExpires: parsedToken.exp,
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
        if (!session.user?.email) {
          try {
            const user = await geinsAuth.getUser(token.accessToken);
            session.user = user;
          } catch (error) {
            console.error('Error fetching user:', error);
            // TODO: type errors
            if (error.message === 'Unauthorized') {
              console.log('🚀 ~ fetching user ~ unathorized - try again');
              try {
                const newTokens = await geinsAuth.refresh(token.refreshToken);
                if (newTokens?.accessToken) {
                  const user = await geinsAuth.getUser(newTokens.accessToken);
                  const parsedToken = geinsAuth.parseToken(
                    newTokens.accessToken,
                  );
                  session = {
                    ...session,
                    ...newTokens,
                    tokenExpires: parsedToken.exp,
                    user,
                  };
                }
              } catch (error) {
                console.error('Error refreshing unauthorized user:', error);
                // Throw error to force log out
                throw new Error('Unauthorized');
              }
            }
            session = {
              ...session,
              isAuthorized: false,
            };
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
