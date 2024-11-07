---
outline: deep
---

# Login using the API

## Overview

This guide provides instructions on how to authenticate (log in) using the endpoints defined in the API. The authentication process involves sending user credentials to the API and receiving a JSON Web Token (JWT) for authentication in the response.

::: danger
Please note that tokens should be considered sensitive information. Care should be taken to ensure they are not exposed.
:::

## Single-factor authentication (SFA)

The first step to authenticate a user is making a request to the **Authentication** endpoint with a pair of user credentials; a `username` and a `password`.  

If the credentials are valid, the user is authenticated and an **access token** is provided.  

This is the first step of the authentication process, but most likely not the only step. Please read more about **MFA** below.

## Multi-factor authentication (MFA)

MFA provides increased security by requiring external credentials in addition to the `username` and `password`. While highly recommended, MFA is still *optional* and can be toggled on a per-user basis.

If a user requires MFA, the authentication process will look a bit different and involve an additional step; **Verification**.  

Instead of receiving an **access token** from the **Authentication** endpoint, you will instead receive a **login token**.  


::: info
The **login token** is very short-lived and should *not* be persisted.  
It only acts as an *intermediary* credential for MFA and does not grant any access to the API.
:::

Depending on which MFA method is used, a special **MFA code** must be received or generated externally by the user.  

The **MFA code**, together with the login token, makes up the payload for a request to the **Verification** endpoint which, if successful, will return the **access token**.

## Refreshing Tokens

The **access token** has a limited lifetime. When it expires, it can no longer be used, and a new **access token** is required.  

In order to retrieve a new **access token**, the user would either need to re-authenticate again via the **Authentication** endpoint *or* retrieve a new **access token** with the help of a **refresh token** (recommended).  

By making a request to the **Refresh token** endpoint and providing a valid **refresh token**, you can retrieve a new (valid) **access token**.  
Any **refresh token** can be used once (and only once) for generating a new **access token** (and a new refresh token as well).

This is the preferred way of retrieving new access tokens for previously authenticated users, as it can be done without any user interaction.  

::: tip
There is no guarantee that the call to the **Refresh token** endpoint succeeds. If it fails, the user would need to re-authenticate from the beginning.  

Also note that the **Refresh token** endpoint does not require MFA.
:::

## API Endpoints

### Endpoints Overview

1. [Authentication](#_1-authentication) (`/auth`)
2. [Verification (MFA)](#_2-verification-mfa) (`/auth/verify`)
3. [Refresh token](#_3-refresh-token) (`/auth/refresh`)

### 1. Authentication

- **URL**: `/auth`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request

To log in, send a POST request to the authentication endpoint with the following JSON body:

```json
{
  "username": "your_username",
  "password": "your_password"
}
```

#### Request Example

Here’s an example of how to make an authentication request using `fetch` in JavaScript:

```javascript
fetch('/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-account-key': 'your_account_key' // Required header
  },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password'
  })
})
.then(response => response.json())
.then(data => {
  if (response.ok) {
    // Securely handle the access and refresh tokens and/or handle MFA
  } else {
    console.error('Authentication failed:', data);
  }
})
.catch(error => {
  console.error('Error authenticating:', error);
});
```

#### Successful response

Upon a successful authentication, the API will respond with a JSON object. This object will vary depending on if MFA is required or not for the user.  

If MFA **is required**, the response will contain a **login token** and MFA details:  
```json
{
  "mfaRequired": true,
  "mfaMethod": "email",
  "loginToken": "your_login_token"
}
```

If MFA is **not** required, the response will contain **access and refresh tokens**:  
```json
{
  "mfaRequired": false,
  "accessToken": "your_access_token",
  "refreshToken": "your_refresh_token"
}
```

::: tip
Use the `mfaRequired` property to evaluate which type of response it is.
:::


### 2. Verification (MFA)

- **URL**: `/auth/verify`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request

To verify authentication, send a POST request to the verify endpoint with the following JSON body:

```json
{
  "loginToken": "your_login_token",
  "mfaCode": "your_mfa_code"
}
```

#### Request Example

Here’s an example of how to make a verification request using `fetch` in JavaScript:

```javascript
fetch('/auth/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-account-key': 'your_account_key' // Required header
  },
  body: JSON.stringify({
    loginToken: 'your_login_token',
    mfaCode: 'your_mfa_code'
  })
})
.then(response => response.json())
.then(data => {
  if (response.ok) {
    // Securely handle the access and refresh tokens
  } else {
    console.error('Verification failed:', data);
  }
})
.catch(error => {
  console.error('Error verifying authentication:', error);
});
```

#### Successful response

Upon a successful authentication verification, the API will respond with a JSON object containing the access and refresh tokens.

```json
{
  "mfaRequired": false,
  "accessToken": "your_access_token",
  "refreshToken": "your_refresh_token"
}
```

### 3. Refresh token

- **URL**: `/auth/refresh`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request

To refresh your tokens, send a POST request to the refresh endpoint with the following JSON body:

```json
{
  "refreshToken": "your_refresh_token"
}
```

#### Request Example

Here’s an example of how to make a refresh token request using `fetch` in JavaScript:

```javascript
fetch('/auth/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-account-key': 'your_account_key' // Required header
  },
  body: JSON.stringify({
    refreshToken: 'your_refresh_token'
  })
})
.then(response => response.json())
.then(data => {
  if (response.ok) {
    // Securely handle the tokens
  } else {
    console.error('Token refresh failed:', data);
  }
})
.catch(error => {
  console.error('Error refreshing token:', error);
});
```

#### Successful response

Upon a successful token refresh, the API will respond with new access and refresh tokens.

```json
{
  "accessToken": "your_new_access_token",
  "refreshToken": "your_new_refresh_token"
}
```

### Error Responses

If any authentication request fails for any reason, the API will return `401 Unauthorized`.