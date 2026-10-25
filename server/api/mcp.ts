import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import {
  createError,
  defineEventHandler,
  getRequestURL,
  toWebRequest,
} from 'h3';
import { createGeinsFetch, readGeinsCredentials } from '../mcp/geins-fetch';
import { registerStudioTools } from '../mcp/tools';
import { registerWorkflowTools } from '../mcp/workflow-tools';
import { useRuntimeConfig } from '#imports';

/**
 * Studio as an MCP server (Streamable HTTP). Stateless on purpose: the App
 * Service plan runs several instances with client affinity off, so an MCP
 * session could land on an instance that never saw it. Every POST builds a
 * fresh server; the GET/SSE stream for server-initiated messages is not
 * offered. Takes precedence over the `[...].ts` proxy catch-all.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  // Same switch as the agent panel.
  if (!import.meta.dev && !config.public.agentPoc) {
    throw createError({ statusCode: 404, statusMessage: 'Not found' });
  }
  if (event.method !== 'POST') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }
  const { geinsLog } = log('server/api/mcp.ts');
  const credentials = readGeinsCredentials(event);

  const server = new McpServer({
    name: 'geins-studio',
    version: config.public.appVersion as string,
  });
  const geinsFetch = createGeinsFetch(event, credentials);
  registerStudioTools(server, geinsFetch, {
    accountKey: credentials.accountKey,
    // App Service ends TLS in front of the app; without the forwarded headers
    // record links would be `http://` and the tab would refuse to open them.
    studioOrigin: getRequestURL(event, {
      xForwardedHost: true,
      xForwardedProto: true,
    }).origin,
  });
  registerWorkflowTools(server, geinsFetch);

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  try {
    const response = await transport.handleRequest(toWebRequest(event));
    geinsLog(`mcp ${response.status}`);
    return response;
  } finally {
    await server.close();
  }
});
