import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import { auth } from '@/server/utils/auth';
import type { Session, LoginCredentials } from '@/types/auth/Auth';

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user: session, trigger }) => {
      const isSignIn = trigger === 'signIn';

      if (isSignIn && session) {
        if (!session.isAuthorized && session.tfa) {
          token = {
            isAuthorized: false,
            roles: [],
            accsessToken: '',
            sessionId: '',
            user: undefined,
            tfa: session.tfa,
          };
        } else if (session.isAuthorized) {
          token = {
            isAuthorized: true,
            accsessToken: session.accessToken,
            sessionId: session.sessionId,
            user: session.user,
            tfa: undefined,
          };
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.isAuthorized) {
        session = {
          isAuthorized: true,
          accessToken: token.accessToken,
          sessionId: token.sessionId,
          user: token.user,
        };
      }

      if (token.tfa) {
        session.tfa = token.tfa;
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

        if (credentials.username && credentials.password) {
          const authResponse = await geinsAuth.login(credentials);

          if (!authResponse) {
            return null;
          }
          // tfa is always true for now
          const isTfa = true;
          if (isTfa) {
            const data = authResponse.data;
            const session: Session = {
              isAuthorized: false,
              tfa: {
                sentTo: data.sentTo,
                token: data.token,
                username: data.user,
              },
            };
            return session;
          } else {
            // if user is not tfa (only tfa for now)
            return null;
          }
        } else if (credentials.token && credentials.code) {
          // use geinsAuth to get user data and set authorized to true
          try {
            const verifyResponse = await geinsAuth.verify(credentials);

            if (!verifyResponse) {
              return null;
            }

            const verifyData = verifyResponse.data;
            if (!verifyData.authenticated) {
              return null;
            }

            const verifyUser = verifyData.user;
            const userInfo = verifyUser.info;
            const session: Session = {
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
            };
            return session;
          } catch (e) {
            return null;
          }
        }
        return null;
      },
    }),
  ],
});
