/* eslint-disable @typescript-eslint/no-explicit-any */
import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import { auth } from '~~/server/utils/auth';

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user, trigger }) => {
      const isSingin = trigger === 'signIn';
      if (isSingin) {
        // make sure user is not null
        if (user) {
          // TODO: fix type
          const userObj: any = user as any;

          if (userObj.isAuthorized === false && userObj.isDfa === true) {
            // reset token
            token = {};
            token.isAuthorized = false;
            token.id = '';
            token.roles = [];
            token.isDfa = false;
            token.dfa = {};
            if (userObj.dfa) {
              token.dfa = userObj.dfa || {};
              token.isDfa = true;
            }
          } else if (userObj.isAuthorized === true) {
            // user is authorized
            token.isAuthorized = true;
            token.id = userObj.id;
            token.roles = userObj.roles;
            token.access_token = userObj.access_token;
            token.session_id = userObj.session_id;
            token.user = userObj.info;

            //reset dfa
            token.isDfa = undefined;
            token.dfa = undefined;
          }
          // return token updated
          return Promise.resolve(token);
        }
      }
      // return token as is
      return Promise.resolve(token);
    },
    // TODO: fix types
    session: async ({ session, token }) => {
      // check if dfa is true
      if (token.isDfa && token.isDfa === true) {
        (session as any).isDfa = true;
        (session as any).dfa = token.dfa;
      }
      // check if user is authorized
      if (token.isAuthorized && token.isAuthorized === true) {
        (session as any).isAuthorized = true;
        (session as any).uid = token.id;
        (session as any).roles = token.roles;
        (session as any).type = 'session';
        (session as any).access_token = token.access_token;
        (session as any).session_id = token.session_id;
        (session as any).user = token.user;

        //reset dfa
        (session as any).isDfa = undefined;
        (session as any).dfa = undefined;
      }
      return Promise.resolve(session);
    },
  },
  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
    CredentialsProvider.default({
      name: 'Credentials',
      async authorize(credentials: any) {
        const geinsAuth = auth();
        if (credentials.username && credentials.password) {
          const authResponse = await geinsAuth.login(
            credentials.username,
            credentials.password,
          );

          if (!authResponse) {
            return null;
          }
          // dfa is always true for now
          const isDfa = true;
          if (isDfa) {
            const data = authResponse.data;
            const user = {
              isAuthorized: false,
              isDfa: true,
              dfa: {
                username: data.user,
                sentTo: data.sentTo,
                active: true,
                token: data.token,
              },
            };
            return user;
          } else {
            // if user is not dfa (only dfa for now)
            return null;
          }
        } else if (credentials.dfa) {
          // use geinsAuth to get user data and set authorized to true
          try {
            const verifyResponse = await geinsAuth.verify(
              credentials.username,
              credentials.dfaToken,
              credentials.dfaCode,
            );

            if (!verifyResponse) {
              return null;
            }

            const verifyData = verifyResponse.data;
            if (!verifyData.authenticated) {
              return null;
            }

            const verifyUser = verifyData.user;
            const userInfo = verifyUser.info;
            const user = {
              isAuthorized: true,
              id: verifyUser.id,
              roles: ['authed', ...verifyUser.roles],
              access_token: verifyData.key,
              session_id: verifyData.sessionId,
              info: {
                firstname: userInfo.firstName,
                lastname: userInfo.lastName,
                email: userInfo.email,
                phone: userInfo.note.phone,
              },
            };
            return user;
          } catch (e) {
            return null;
          }
        }
        return null;
      },
    }),
  ],
});
