# Authentication

The Geins Merchant Center uses a JWT-based authentication system that is built upon [
`@sidebase/nuxt-auth`](https://auth.sidebase.io/). The authentication logic is handled in a series of server and application files, which are described below.

## Server

The files you will find in the `server` directory that are handling authentication are:

- `server/api/auth/[...].ts` - The catch-all for auth requests containing the [NuxtAuthHandler](https://auth.sidebase.io/guide/authjs/nuxt-auth-handler)
- `server/utils/auth.ts` - A utility file with all Geins-specific authentication logic

## Application

The files you will find in the `app` directory that are handling authentication are:

- `app/middleware/auth.global.ts` - A global middleware that protects all routes from being accessed by unauthenticated users, and redirects them to the login page
- `app/plugins/auth-state.ts` - A plugin that watches the auth state
