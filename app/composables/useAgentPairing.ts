import { StorageSerializers, useLocalStorage } from '@vueuse/core';
import type { AgentPairing } from '#shared/types';

export interface UseAgentPairingReturnType {
  /** This browser's pairing with the local agent helper; `null` until paired. */
  pairing: Ref<AgentPairing | null>;
  forget: () => void;
}

/**
 * The pairing `geins studio connect` hands over (see `agent-pairing.client.ts`).
 * Kept per browser: it lets this Studio site drive the user's local agent.
 */
export function useAgentPairing(): UseAgentPairingReturnType {
  const pairing = useLocalStorage<AgentPairing | null>(
    'geins-agent-pairing',
    null,
    {
      serializer: StorageSerializers.object,
      // Storage can be blocked (private mode, policies); then the user simply
      // pairs again next time.
      onError: () => {},
    },
  );
  return { pairing, forget: () => (pairing.value = null) };
}
