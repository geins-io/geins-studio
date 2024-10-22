import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import type { LoginCredentials, User } from '@/types/auth/Auth';
import type { Session } from 'next-auth';

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      if (trigger === 'signIn' && user) {
        if (user.isAuthorized) {
          token = {
            isAuthorized: user.isAuthorized,
            accessToken: user.accessToken,
            refreshToken: user.refreshToken,
          };
        } else if (user.tfa) {
          token = {
            isAuthorized: false,
            tfa: user.tfa,
          };
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.isAuthorized) {
        session = {
          ...session,
          ...token,
        };
        if (!session.user?.email) {
          try {
            const apiUrl = useRuntimeConfig().public.apiBase as string;
            const accountKey = useRuntimeConfig().public.accountKey as string;
            const user: User = await $fetch(`${apiUrl}/user/me`, {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token.accessToken}`,
                'x-account-key': accountKey,
              },
            });
            session.user = user;
          } catch (error) {
            console.error('Error fetching user:', error);
          }
        }
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
      name: 'Credentials',
      async authorize(credentials: LoginCredentials) {
        console.log('🚀 ~ authorize ~ credentials:', credentials);
        const geinsAuth = auth();

        try {
          if (credentials.username && credentials.password) {
            const authResponse = await geinsAuth.login(credentials);
            console.log('🚀 ~ authorize ~ authResponse:', authResponse);

            if (!authResponse) {
              return null;
            }

            // tfa is always true for now
            const isTfa = false;
            if (isTfa) {
              const data = authResponse.data;
              return {
                isAuthorized: false,
                tfa: {
                  sentTo: data.sentTo,
                  token: data.token,
                  username: data.user,
                },
              } as Session;
            } else if (authResponse.accessToken) {
              return {
                isAuthorized: true,
                accessToken: authResponse.accessToken,
                refreshToken: authResponse.refreshToken,
              } as Session;
            }
          } else if (credentials.token && credentials.code) {
            const verifyResponse = await geinsAuth.verify(credentials);

            if (!verifyResponse || !verifyResponse.data.authenticated)
              return null;

            const verifyData = verifyResponse.data;
            const verifyUser = verifyData.user;
            const userInfo = verifyUser.info;
            return {
              isAuthorized: true,
              accessToken: verifyData.key,
              refreshToken: verifyData.refreshToken,
              user: {
                id: verifyUser.id,
                firstName: userInfo.firstName,
                lastName: userInfo.lastName,
                email: userInfo.email,
                phone: userInfo.note.phone,
                roles: ['authed', ...verifyUser.roles],
              },
            } as Session;
          }
        } catch (error) {
          console.error('Authorization error:', error);
          return null;
        }

        return null;
      },
    }),
  ],
});
