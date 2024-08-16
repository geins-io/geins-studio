import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import { auth } from '../../../server/utils/auth';
import type { Session, LoginCredentials } from '../../../types/auth/Auth';

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
            sessionId: user.sessionId,
            user: user.user,
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
        return {
          ...session,
          isAuthorized: token.isAuthorized,
          accessToken: token.accessToken,
          sessionId: token.sessionId,
          user: token.user,
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
      name: 'Credentials',
      async authorize(credentials: LoginCredentials) {
        const geinsAuth = auth();

        try {
          if (credentials.username && credentials.password) {
            const authResponse = await geinsAuth.login(credentials);

            if (!authResponse) {
              return null;
            }

            // tfa is always true for now
            const isTfa = true;
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
            } else {
              // if user is not tfa (only tfa for now)
              return null;
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
              sessionId: verifyData.sessionId,
              user: {
                id: verifyUser.id,
                firstname: userInfo.firstName,
                lastname: userInfo.lastName,
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
