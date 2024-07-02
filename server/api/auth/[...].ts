import CredentialsProvider from 'next-auth/providers/credentials';
import { NuxtAuthHandler } from '#auth';
import { auth } from '~~/server/utils/auth';

export default NuxtAuthHandler({
  secret: 'your-secret-here-here',
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      const isSignIn = user ? true : false;
      if (isSignIn) {
        token.id = user ? user.id || '' : '';
        token.jwt = user ? (user as any).access_token || '' : '';
        token.roles = user ? (user as any).roles || [] : [];
        if ((user as any).dfa) {
          token.dfa = user ? (user as any).dfa || {} : {};
        }
      }
      return Promise.resolve(token);
    },
    session: async ({ session, token }) => {
      (session as any).uid = token.id;
      (session as any).roles = token.roles;
      if (token.dfa) {
        (session as any).dfa = token.dfa;
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
        console.log('credentials start, ', credentials);

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
            const user = {
              dfa: {
                sentTo: authResponse.sentTo,
                active: true,
                token: authResponse.token,
              },
            };
            return user;
          } else {
            // if user is not dfa
            const user = {
              user: {
                name: 'John Doe',
                email: 'john@email.com',
                id: 1,
                roles: ['authed'],
              },
              roles: ['authed'],
              access_token: 'API-KEY-1234567890',
            };
            return user;
          }
        } else if (credentials.dfa) {
          // dfa call

          console.log('DFA -- credentials', JSON.stringify(credentials.dfa));
          /*
          // use geinsAuth to get user data and set authorized to true
          const verifyResponse = await geinsAuth.verify(
            credentials.username,
            credentials.token,
            credentials.code,
          );
          console.log('verifyResponse', verifyResponse);
          if (!verifyResponse) {
            return null;
          }*/
          const authorized = true;
          if (!authorized) {
            return null;
          }

          const data = {
            user: {
              name: 'John Doe',
              email: '',
            },
            name: 'Doe John',
            email: 'email@email.com',
            id: 1,
            roles: ['authed', 'dfa'],
            access_token: 'API-KEY-1234567890',
          };

          return data;
        }
        return null;
      },
    }),
  ],
});
