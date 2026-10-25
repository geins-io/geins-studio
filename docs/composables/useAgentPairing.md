# `useAgentPairing`

`useAgentPairing` holds this browser's pairing with the local agent helper: a secret token and the helper's port, kept in `localStorage` under `geins-agent-pairing`. [`useAgentCompanion`](/composables/useAgentCompanion) connects with it.

## How a browser pairs

1. `geins studio connect`, `/studio connect` in the terminal app, or Connect in the Studio panel (through Synapse's `geins://connect` link and its confirmation) opens `<studio>/#geins-agent=<token>:<port>`. The fragment never reaches Studio's server.
2. The `agent-pairing.client.ts` plugin reads the fragment, removes it from the address bar and holds the pairing as pending. Nothing is stored yet.
3. The agent panel asks "Connect to the Geins agent?" before storing it, because anyone can send such a link and the panel sends the Studio session to that port. A pairing with the token this browser already has (the helper restarted on another port) is accepted without asking, since only the user's own helper knows the token.

## Usage

```ts
const { pairing, forget } = useAgentPairing();

if (pairing.value) agentCompanionUrl(pairing.value); // ws://127.0.0.1:<port>/agent?token=…
forget(); // unpair this browser
```

## Returns

| Name      | Type                        | Description                               |
| --------- | --------------------------- | ----------------------------------------- |
| `pairing` | `Ref<AgentPairing \| null>` | `{ token, port }`, or `null` until paired |
| `forget`  | `() => void`                | Clears the pairing                        |

If storage is blocked (private mode, policies), the pairing lasts for the page only and the user pairs again next time.
