# `OrchestratorExecutionErrorDetails`

Renders one orchestrator `ExecutionError` as a destructive `Alert`. It shows the message (whitespace preserved, since HTTP errors include a response-body excerpt), the exception type, a Fail node's code, and child-workflow details with a link to the child execution. A copy button copies the type and message.

Used on the execution detail page (error banner and expanded failed steps) and in the workflow editor's output pane.

## Props

| Prop      | Type             | Default | Description                                                    |
| --------- | ---------------- | ------- | -------------------------------------------------------------- |
| `error`   | `ExecutionError` | —       | The error to render.                                           |
| `title`   | `string \| null` | `null`  | Heading, e.g. `$t('executions.failed_at_node', { node })`.     |
| `compact` | `boolean`        | `false` | Smaller padding; hides the type badge and child-workflow link. |

## Slots

| Slot      | Description                                          |
| --------- | ---------------------------------------------------- |
| `actions` | Rendered under the message, e.g. a "Show step" link. |

## Usage

```vue
<OrchestratorExecutionErrorDetails
  v-for="err in executionErrors(execution)"
  :key="err.failedNodeId ?? err.message"
  :error="err"
  :title="errorTitle(err)"
>
  <template #actions>
    <Button size="sm" variant="link" @click="focusNode(err.failedNodeId)">
      {{ $t('executions.show_step') }}
    </Button>
  </template>
</OrchestratorExecutionErrorDetails>
```

## Related

- [`useExecutionErrors`](/composables/useExecutionErrors.md) reads the error objects from an execution.
