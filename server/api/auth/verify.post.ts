import { createError, defineEventHandler, readBody } from 'h3';
import { auth } from '../../utils/auth';
import { authRouteError } from '../../utils/auth-route-error';
import { storeAuthResponse } from '../../utils/geins-session';
import { readSealedSession } from '../../utils/sealed-session';

/** MFA step. The login token comes from the sealed session, never the body. */
export default defineEventHandler(async (event) => {
  const { mfaCode } = (await readBody<{ mfaCode?: unknown }>(event)) ?? {};
  if (typeof mfaCode !== 'string' || !mfaCode) {
    throw createError({ statusCode: 400, statusMessage: 'Missing MFA code' });
  }
  const loginToken = (await readSealedSession(event)).secure?.loginToken;
  if (!loginToken) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
  }
  let response;
  try {
    response = await auth().verify({ loginToken, mfaCode });
  } catch (error) {
    throw authRouteError(error);
  }
  return storeAuthResponse(event, response);
});
