# `usePollWhile`

`usePollWhile` runs a function on a fixed interval while a condition holds and the tab is visible. Use it instead of a hand-rolled `setInterval` in a page, component or plugin: it starts and stops with the condition, pauses in a hidden tab, and clears its timer when the calling scope is disposed.

## Usage

```ts
// Poll a running execution until it finishes.
usePollWhile(isRunning, () => refresh(), 3000);

// Pull new rows into a list page once the first load is done.
usePollWhile(() => !loading.value, pollExecutions, 15_000);
```

## Parameters

### `active`

```ts
active: MaybeRefOrGetter<boolean>;
```

Gates the poll. The timer starts when it turns `true` and stops when it turns `false`.

### `fn`

```ts
fn: () => void | Promise<void>;
```

The work for each tick. An error it throws is logged through `useGeinsLog('usePollWhile')` and polling carries on, so one failed request doesn't end it.

### `intervalMs`

```ts
intervalMs: number;
```

The poll cadence in milliseconds. The first tick comes one interval after the poll starts.

## Hidden tabs

The poll runs only while `document.visibilityState` isn't `hidden`. When the tab is hidden, the timer stops; when it is visible again and `active` still holds, the timer restarts, so the first tick comes one interval later. A caller that needs fresh data the moment the tab is visible again listens for that itself, as `auth-state.ts` does for the token.

Why: every request goes through `$geinsApi`, which refreshes a due token first, and a hidden tab's timers still run while a sleeping Mac wakes briefly. A refresh whose response is lost leaves the browser with a revoked refresh token, and the next refresh logs the user out. See [Refresh Flow](/concepts/authentication#refresh-flow).

## Notes

- Works in a plugin as well as a component, as long as it is called inside an effect scope: in a plugin, before its first `await`.
- Consumers: the proactive token refresh (`plugins/auth-state.ts`), the executions list and detail pages (`pages/orchestrator/executions/`), the workflow builder's run status (`WorkflowBuilder.vue`), and finished-row expiry in the background jobs panel (`useBackgroundJobRunner`).
- For a ticking clock, use `useLiveClock`. For a job that answers `202` and lands later, use [`useBackgroundJobs`](/composables/useBackgroundJobs): it backs off and gives up after a limit, and outlives the component that started it.
