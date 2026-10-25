import type { AgentPairing } from '#shared/types';

/**
 * Picks up `#geins-agent=<token>:<port>` from the link `geins studio connect`
 * opens and tidies the address bar. Runs before route middleware, so a
 * redirect to the login page can't drop the fragment first. The pairing is
 * only held here: the agent panel asks the user before storing it, since
 * anyone can send such a link and the panel sends the Studio session to it.
 */
export default defineNuxtPlugin(() => {
  if (!import.meta.dev && !useRuntimeConfig().public.agentPoc) return;

  const found = parseAgentPairing(window.location.hash);
  if (!found) return;

  useState<AgentPairing | null>('agent-pending-pairing', () => null).value =
    found;
  const { pathname, search, hash } = window.location;
  window.history.replaceState(
    window.history.state,
    '',
    `${pathname}${search}${stripAgentPairing(hash)}`,
  );
});
