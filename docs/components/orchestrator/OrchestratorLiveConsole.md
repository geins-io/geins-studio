# `OrchestratorLiveConsole`

A dark console panel for an orchestrator execution. It shows the seed lines the parent passes in, and while `active` is true it streams new lines from `streamUrl` and appends them. A streamed line that is a JSON object takes its message, source, level and timestamp from that object; any other line is shown as is, with a level guessed from its text. The clear button drops the streamed lines but keeps the seed lines.

Used on the execution detail page.

## Props

| Prop        | Type                | Default                           | Description                                                                                        |
| ----------- | ------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `streamUrl` | `string \| null`    | `null`                            | A `$geinsApi` path, without the `/api` prefix, e.g. `/orchestrator/executions/{id}/stream`.        |
| `active`    | `boolean`           | `false`                           | Streams while true; turning it false aborts the stream.                                            |
| `seedLines` | `LiveConsoleLine[]` | `[]`                              | Lines from the execution's own state, shown before the streamed ones. Replaced whole on a refetch. |
| `title`     | `string`            | `orchestrator.console.title`      | Heading while inactive.                                                                            |
| `liveTitle` | `string`            | `orchestrator.console.live_title` | Heading while streaming.                                                                           |

## Auth

The stream goes through `$geinsApi` with `responseType: 'stream'`, so it gets the same token handling as any other call: a due token is refreshed before the stream opens, and a `401` when it opens refreshes the token under the auth lock and reconnects once (see [When the API rejects a token](/concepts/authentication#when-the-api-rejects-a-token)). The API proxy never refreshes, so a raw `fetch` to `/api/…` would get that `401` and give up. A stream that is already open isn't cut when the token expires.

## Usage

```vue
<OrchestratorLiveConsole
  :stream-url="`/orchestrator/executions/${encodeURIComponent(id)}/stream`"
  :active="isRunning"
  :seed-lines="consoleSeedLines"
/>
```
