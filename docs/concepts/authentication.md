# Authentication

The Geins Merchant Center uses a JWT-based authentication system that is built upon [
`@sidebase/nuxt-auth`](https://auth.sidebase.io/). The authentication logic is handled in a series of server and application files, which are described below.

## Server Files

The files you will find in the `server` directory that are handling authentication are:

- `server/api/auth/[...].ts` - The catch-all for auth requests containing the [NuxtAuthHandler](https://auth.sidebase.io/guide/authjs/nuxt-auth-handler)
- `server/utils/auth.ts` - A utility file with all Geins-specific authentication logic

## Application Files

The files you will find in the `app` directory that are handling authentication are:

- `app/middleware/auth.global.ts` - A global middleware that protects all routes from being accessed by unauthenticated users, and redirects them to the login page
- `app/composables/useGeinsAuth.ts` - A composable that sits on top of the `useAuth` composable from NuxtAuth and adds Geins-specific functionality
- `app/stores/user.ts` - A Pinia store that holds the user data and computed properties related to the user
- `app/plugins/auth-state.ts` - A plugin that watches the auth state and makes sure the NuxtAuth and Geins auth states are in sync, and logs out the user if one of them is not authenticated

::: tip

Read the full documentation of the `useGeinsAuth` composable here: [useGeinsAuth](/composables/useGeinsAuth.md)

:::

## Authentication Flow

1. The user logs in with their credentials using the `login` method found in `useGeinsAuth.ts`
2. The `login` method calls the `signIn` method from NuxtAuth, which sends the credentials to the `NuxtAuthHandler`
3. The `authorize` method in the `NuxtAuthHandler` calls the `login` method in server utility `auth.ts`, which sends the credentials to the Geins API for validation
4. The Geins API validates the credentials and returns an authentication response containing either access and refresh tokens (skip to step 8) or a login token if MFA is required.
5. Upon successfully receiving a login token, the user is redirected to the MFA page, where they enter their MFA code.
6. On submitting, the login token and MFA code is sent with the `verify` method in `useGeinsAuth.ts`, which calls the `signIn` method from NuxtAuth again but this time with the code and the login token.
7. In the `authorize` method of the `NuxtAuthHandler` The `verify` method from server utility `auth.ts` validates the MFA code and login token, and returns an authentication response containing access and refresh tokens.
8. In the NuxtAuth `jwt` callback, the access and refresh tokens are stored in the NuxtAuth JWT together with expiration time, which is shorter than the NuxtAuth expiration time.
9. In the NuxtAuth `session` callback, the user data is fetched from the Geins API and stored to the session togehter with the access token.
10. The user is now authenticated and can access the application.

## Refresh Flow

A refresh check can be triggered manually by the `refresh` method in `useGeinsAuth.ts`. This will not force a refresh but only refresh the token if it's expired or it is soon to be expired, where "soon" by default means within 5 minutes.

This check of the token is done automatically on page load and on every request towards the Geins API, and if the token is expired or soon to be expired, the token is refreshed before the request is sent.
