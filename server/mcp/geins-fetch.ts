import { createError, getHeader, getRequestHost } from 'h3';
import { resolveAppId } from '#shared/utils/app';
import type { H3Event } from 'h3';
import { useRuntimeConfig } from '#imports';

export interface GeinsCredentials {
  authorization: string;
  accountKey: string;
}

/**
 * MCP clients call the Management API as the Studio user who connected them:
 * the same bearer token + account key the SPA sends through the proxy.
 */
export function readGeinsCredentials(event: H3Event): GeinsCredentials {
  const authorization = getHeader(event, 'authorization');
  const accountKey = getHeader(event, 'x-account-key');
  if (!authorization?.startsWith('Bearer ') || !accountKey) {
    throw createError({
      statusCode: 401,
      statusMessage:
        'Studio MCP needs an "Authorization: Bearer <access token>" and an "x-account-key" header',
    });
  }
  return { authorization, accountKey };
}

export function createGeinsFetch(
  event: H3Event,
  { authorization, accountKey }: GeinsCredentials,
) {
  const config = useRuntimeConfig(event);
  return $fetch.create({
    baseURL: config.public.apiUrl,
    headers: {
      authorization,
      'x-account-key': accountKey,
      'x-app': resolveAppId(
        config.public.appId as string,
        getRequestHost(event, { xForwardedHost: true }),
      ),
    },
  });
}

export type GeinsFetch = ReturnType<typeof createGeinsFetch>;
