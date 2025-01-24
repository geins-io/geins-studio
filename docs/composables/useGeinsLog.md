# `useGeinsLog`

The `useGeinsLog` composable provides utility functions for logging messages with a Geins tag. It integrates with the `log` utility to offer scoped logging capabilities.

## Features

- Log general messages with a Geins tag (only when debug is true)
- Log error messages with a Geins tag.
- Log info messages with a Geins tag.
- Log warning messages with a Geins tag.

## Usage

Here is how you can use the `useGeinsLog` composable in your project:

```ts
import { useGeinsLog } from '@/composables/useGeinsLog';

const { geinsLog, geinsLogError, geinsLogInfo, geinsLogWarn } =
  useGeinsLog('pages/index.vue');
const someVariable = ['some value'];

geinsLog('My value', someValue); // Will not log anything if env GEINS_DEBUG is false
geinsLogError('This is an error message'); // Will always log
geinsLogInfo('This is an info message'); // Will always log
geinsLogWarn('This is a warning message'); // Will always log
```

## Output

The `geinsLog` from the example above will log the following message:

```
[geins] pages/index.vue ::: My value ['some value']
```

## Parameters

### `scope: string`

The scope of the log messages, normally used to enter the file path of where the message is sent from. This is an optional parameter that defaults to an empty string.

## Returned Methods

### `geinsLog(message: any, ...args: any[]): void`

Logs a general message with a Geins tag.

- **Parameters:**
  - `message`: The message to log.
  - `...args`: Additional arguments to log.

### `geinsLogError(message: any, ...args: any[]): void`

Logs an error message with a Geins tag.

- **Parameters:**
  - `message`: The error message to log.
  - `...args`: Additional arguments to log.

### `geinsLogInfo(message: any, ...args: any[]): void`

Logs an info message with a Geins tag.

- **Parameters:**
  - `message`: The info message to log.
  - `...args`: Additional arguments to log.

### `geinsLogWarn(message: any, ...args: any[]): void`

Logs a warning message with a Geins tag.

- **Parameters:**
  - `message`: The warning message to log.
  - `...args`: Additional arguments to log.

```

```
