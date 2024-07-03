import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import { auth } from '~~/server/utils/auth';
// import type { Session } from '~~/types/auth/Auth';

export default NuxtAuthHandler({
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      // console.log('[jwt] callback - token:', token);
      // console.log('[jwt] callback - user:', user);
      const isSignIn = user ? true : false;
      if (isSignIn) {
        token.id = user ? user.id || '' : '';
        token.jwt = user ? (user as any).access_token || '' : '';
        token.roles = user ? (user as any).roles || [] : [];
        token.type = 'jwt';
        if ((user as any).dfa) {
          token.dfa = user ? (user as any).dfa || {} : {};
        }
      }
      return Promise.resolve(token);
    },

    session: async ({ session, token }) => {
      // console.log('[session] callback - session:', session);
      // console.log('[session] callback - token:', token);
      (session as Session).uid = token.id;
      (session as any).roles = token.roles;
      (session as any).type = 'session';
      if (token.dfa) {
        (session as any).dfa = token.dfa;
      }
      session.jwt = token.jwt;

      return Promise.resolve(session);
    },
  },
  providers: [
    // @ts-expect-error You need to use .default here for it to work during SSR. May be fixed via Vite at some point
    CredentialsProvider.default({
      name: 'Credentials',
      async authorize(credentials: any) {
        const geinsAuth = auth();
        // console.log('credentials start, ', credentials);

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
            console.log('authorize() -- authResponse.data', data);
            const user = {
              dfa: {
                username: data.user,
                sentTo: data.sentTo,
                active: true,
                token: data.token,
              },
            };
            // console.log('authorize() -- RETRUNING --> ', user);
            return user;
          } else {
            // if user is not dfa (only dfa for now)
            return null;
          }
        } else if (credentials.dfa) {
          // use geinsAuth to get user data and set authorized to true
          try {
            console.log(
              '**** authorize() -- credentials username',
              credentials.username,
            );
            console.log(
              '**** authorize() -- credentials user',
              credentials.user,
            );
            const verifyResponse = await geinsAuth.verify(
              credentials.username,
              credentials.dfaToken,
              credentials.dfaCode,
            );
            console.log('**** authorize() -- verifyResponse', verifyResponse);

            if (!verifyResponse) {
              return null;
            }
            const verifyData = verifyResponse.data;
            if (!verifyData.authenticated) {
              return null;
            }

            const verifyUser = verifyData.user;
            const userInfo = verifyUser.info;
            const data = {
              id: verifyUser.id,
              roles: ['authed', ...verifyUser.roles],
              access_token: verifyData.key,
              session_id: verifyData.sessionId,
              user: {
                firstname: userInfo.firstName,
                lastname: userInfo.lastName,
                email: userInfo.email,
                phone: userInfo.note.phone,
              },
            };
            return data;
          } catch (e) {
            console.log('authorize() -- ERROR --> ', e);
            return null;
          }
        }
        return null;
      },
    }),
  ],
});
