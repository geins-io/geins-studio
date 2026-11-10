import { createError, defineEventHandler, readBody } from 'h3';
import type { LoginCredentials } from '#shared/types';
import { auth } from '../../utils/auth';
import { authRouteError } from '../../utils/auth-route-error';
import { storeAuthResponse } from '../../utils/geins-session';

/** Password step: answers what the login page does next, never a token. */
export default defineEventHandler(async (event) => {
  const { username, password } =
    (await readBody<Partial<LoginCredentials>>(event)) ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing credentials',
    });
  }
  let response;
  try {
    response = await auth().login({ username, password });
  } catch (error) {
    throw authRouteError(error);
  }
  return storeAuthResponse(event, response);
});
