# `useAgentCompanion`

`useAgentCompanion` connects the tab to the local agent helper: `geins serve`, which the Synapse desktop app runs, at `ws://127.0.0.1:<port>/agent`. The helper runs the agent (Claude or Codex). This side sends the Studio session, renders the stream and answers the agent's in-tab `ui` tool calls, approval prompts and questions. `AgentPanel` is its only consumer. The panel and this composable are on in dev and when `NUXT_PUBLIC_AGENT_POC` is set.

## Usage

```ts
const { status, items, connect, send, interrupt } = useAgentCompanion();

connect(); // no-op until this browser is paired (see useAgentPairing)
send('Which quotations are pending?');
```

## Connection

- It connects only when `connect()` is called, which the panel does when it opens. A pairing that syncs in from another tab doesn't connect tabs where the panel was never opened.
- On connect it sends `auth` (access token, account key, account name), and again whenever the token refreshes.
- Re-pairing (a new port or secret) replaces a live connection after the old socket has closed.
- Messages are not buffered: anything sent while disconnected is dropped, since a new helper session doesn't know the ids an old message refers to.

## The agent's `ui` tools

The helper calls these in the tab; each answer goes back as a `ui_result`.

| Tool                 | What it does in the tab                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------- |
| `navigate`           | `router.push` within Studio; reports `blocked` when the unsaved-changes guard stops it    |
| `refresh`            | `refreshNuxtData()`                                                                       |
| `get_page_context`   | Path, title, the open entity's state and the registered lists (see the `agentPage` store) |
| `fill_form`          | Sets form fields on the open entity page, one at a time, then validates. Never saves      |
| `switch_tab`         | Switches the entity page's tab                                                            |
| `highlight`          | Reveals and flashes list rows by id                                                       |
| `set_workflow_graph` | Replaces the workflow canvas, or holds the graph until Create on `/new`                   |
| `notify`             | Shows a toast                                                                             |

## Returns

| Name                                     | Type                                 | Description                                                     |
| ---------------------------------------- | ------------------------------------ | --------------------------------------------------------------- |
| `status`                                 | `ComputedRef<AgentConnectionStatus>` | `unpaired`, `disconnected`, `connecting`, `ready` or `busy`     |
| `items`                                  | `Ref<AgentChatItem[]>`               | The conversation: user and assistant text, tool calls, errors   |
| `pendingApproval` / `pendingQuestion`    | `Ref<…>`                             | The open approval card or question card                         |
| `respondApproval` / `answerQuestion`     | `(…) => void`                        | Answer them                                                     |
| `permissionMode` / `setPermissionMode`   | `Ref<AgentPermissionMode>` / setter  | `default` or `auto`; the helper can leave `auto` on its own     |
| `models` / `model` / `setModel`          | model list, current, setter          | Empty until the session has started                             |
| `providers` / `provider` / `setProvider` | provider list, current, setter       | Switching provider starts a new conversation                    |
| `signingIn` / `signIn`                   | `Ref<AgentProvider>` / action        | Runs the provider's own browser sign-in on the helper's machine |
| `connect` / `disconnect`                 | `() => void`                         |                                                                 |
| `send` / `interrupt` / `reset`           | actions                              | `reset` clears the conversation and starts a fresh session      |

The wire protocol is typed in `shared/types/Agent.ts`. How the panel describes tool calls is in `describeAgentStep` (`shared/utils/agent.ts`).
