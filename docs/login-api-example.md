---
outline: deep
---

# Login using the API

## Overview

This guide provides instructions on how to authenticate (log in) using the endpoints defined in the API. The authentication process involves sending user credentials to the API and receiving a JSON Web Token (JWT) for authentication in the response.

::: danger
Please note that tokens should be considered sensitive information. Care should be taken to ensure they are not exposed.
:::

## Regular authentication (SFA)

The first step to authenticate is done by making a request to the **Authentication** endpoint with a pair of user credentials; a `username` and a `password`.  

If the credentials are valid, the user is authenticated and an **access token** is provided.

## Multi-factor Authentication (MFA)

MFA provides increased security by requiring external credentials in addition to the `username` and `password`. While highly recommended, MFA is still *optional* and can be toggled on a per-user basis.

If a user requires MFA, the authentication process will look a bit different and involve an additional step; **Verification**.  

Instead of receiving an **access token** from the **Authentication** endpoint, you will instead receive a **login token**.  
The **login token** acts as an *intermediary secret used only for MFA*. It does not grant access to the API.

::: caution
The **login token** is very short-lived and should *not* be persisted. It is only used for MFA.
:::

Depending on which MFA method is used, a special **MFA code** must be received or generated externally.  
The **MFA code**, together with the login token, then makes up the payload for a request to the **Verification** endpoint which, if successful, will return the **access token**.

::: tip
The **MFA code** is usually a short numeric string. It is commonly sent via email or generated via a dedicated authenticator app.
:::

## Refreshing Tokens

The **access token** has a limited lifetime. When it expires, it can no longer be used, and a new **access token** is required.  

::: tip
Analyze the token details to see when it expires.
:::

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

1. [Authentication](#authentication) (`/auth`)
2. [Verification (MFA)](#verification-mfa) (`/auth/verify`)
3. [Refresh token](#refresh-token-endpoint) (`/auth/refresh`)

### 1. Authentication

- **URL**: `/v2/auth`
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
fetch('/api/auth', {
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

### 2. Verification (MFA)

- **URL**: `/v2/auth/verify`
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
fetch('/api/auth/verify', {
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

### 3. Refresh token

- **URL**: `/v2/auth/refresh`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request

To refresh your access token, send a POST request to the refresh endpoint with the following JSON body:

```json
{
  "refreshToken": "your_refresh_token"
}
```

#### Request Example

Here’s an example of how to make a refresh token request using `fetch` in JavaScript:

```javascript
fetch('/api/auth/refresh', {
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

## Response

### Successful Authentication response

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
Use the `mfaRequired` property to decide which type of response it is.
:::

### Successful Authentication verification response

Upon a successful authentication verification, the API will respond with a JSON object containing access and refresh tokens.

```json
{
  "mfaRequired": false,
  "accessToken": "your_access_token",
  "refreshToken": "your_refresh_token"
}
```

### Successful Refresh token response

Upon a successful token refresh, the API will respond with new access and refresh tokens.

```json
{
  "accessToken": "your_new_access_token",
  "refreshToken": "your_new_refresh_token"
}
```

### Error Responses

If authentication fails for any reason, the API will return `401 Unauthorized`.