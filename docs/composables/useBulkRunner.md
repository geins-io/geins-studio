# `useBulkRunner`

`useBulkRunner` runs a `BulkAction` over a selection in chunks and toasts the outcome. The bulk routes take at most 100 ids per call and are all or nothing per call.

## Features

- Drops duplicate ids and splits them into chunks of 100 (`chunkIds`, `#shared/utils/bulk`), then runs them **one after another** (`runInChunks`). A rejected call fails every id in its chunk, and the run moves on.
- **One chunk:** a failure is left to the global API error toast (`$geinsApi`), so it carries the backend's message and `errorContext`.
- **Several chunks:** each call gets `suppressErrorToast: true`, and the run ends with one toast: the action's `successMessage`, or "X of N … updated" with the first error's title and "The rest are still selected."
- Errors are logged with `useGeinsLog`. Returns `{ succeeded, failed, errors }` so the caller can keep the failed ids selected.

## Usage

```ts
const { run } = useBulkRunner();
const result = await run(action, selectedIds.value, value, 'asset');
selectedIds.value = result.failed;
```

## Returns

| Name  | Type                                                                                                              |
| ----- | ----------------------------------------------------------------------------------------------------------------- |
| `run` | `<TValue>(action: BulkAction<TValue>, ids: string[], value: TValue, entityKey: string) => Promise<BulkRunResult>` |

`entityKey` is the raw entity key for the partial-failure toast.

## Type

```ts
interface UseBulkRunnerReturnType {
  run: <TValue>(
    action: BulkAction<TValue>,
    ids: string[],
    value: TValue,
    entityKey: string,
  ) => Promise<BulkRunResult>;
}
```

## Dependencies

- `chunkIds`, `runInChunks` from `#shared/utils/bulk`
- `useToast`, `useGeinsLog`, `useI18n`
