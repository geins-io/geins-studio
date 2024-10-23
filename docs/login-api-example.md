---
outline: deep
---

# Login using the API

## Overview

This guide provides instructions on how to log in using the endpoints defined in the API. The login process involves sending user credentials to the API and receiving a JSON Web Token (JWT) for authentication in response.

Authentication tokens are only valid for a number of minutes. When they expire, a new authentication token should be retrieved via the **Refresh Token** endpoint to keep the user authenticated. This will create a new access and refresh token, and will also invalidate the previous refresh token.

Refresh tokens also have a duration to their validity. However, their duration is signifcantly longer, spanning several days.

::: danger
Please note that access tokens and refresh tokens are sensitive information. Care should be taken to ensure they are not exposed.
:::

## API Endpoints

### 1. Authentication Endpoint

- **URL**: `/v2/auth`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request

To log in, send a POST request to the authentication endpoint with the following JSON body:

```json
{
  "username": "your_user_name",
  "password": "your_password"
}
```

#### Request Example

Here’s an example of how to make a login request using `fetch` in JavaScript:

```javascript
fetch('/api/auth', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-account-key': 'your_account_key', // Required header
  },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password',
  }),
})
  .then((response) => response.json())
  .then((data) => {
    if (response.ok) {
      // Securely handle the tokens
    } else {
      console.error('Login failed:', data);
    }
  })
  .catch((error) => {
    console.error('Error logging in:', error);
  });
```

### 2. Refresh Token Endpoint

- **URL**: `/v2/refresh`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request

To refresh your token, send a POST request to the refresh endpoint with the following JSON body:

```json
{
  "refreshToken": "your_refresh_token"
}
```

#### Request Example

Here’s an example of how to make a refresh token request using `fetch` in JavaScript:

```javascript
fetch('/api/refresh', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-account-key': 'your_account_key', // Required header
  },
  body: JSON.stringify({
    refreshToken: 'your_refresh_token',
  }),
})
  .then((response) => response.json())
  .then((data) => {
    if (response.ok) {
      // Securely handle the tokens
    } else {
      console.error('Token refresh failed:', data);
    }
  })
  .catch((error) => {
    console.error('Error refreshing token:', error);
  });
```

## Response

### Successful Login Response

Upon a successful login, the server will respond with a JSON object containing an access token and a refresh token.

```json
{
  "accessToken": "your_access_token",
  "refreshToken": "your_refresh_token"
}
```

### Successful Refresh Response

Upon a successful token refresh, the server will respond with new access and refresh tokens.

```json
{
  "accessToken": "your_new_access_token",
  "refreshToken": "your_new_refresh_token"
}
```

### Error Responses

If the login or refresh fails, the server will return an error code.
