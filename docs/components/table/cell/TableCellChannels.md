# `TableCellChannels`

`TableCellChannels` renders a comma-separated list of channel names from a list of channel ids — looks each one up via `useAccountStore.getChannelNameById`.

## Features

- Resolves channel ids to display names from `accountStore`
- Empty input renders nothing

## Usage

```ts
{
  id: 'channels',
  cell: ({ row }) => h(TableCellChannels, { channelIds: row.original.channelIds }),
}
```

## Props

### `channelIds`

```ts
channelIds: string[]
```

Channel `_id`s to render.

## Dependencies

- `useAccountStore` — source of `getChannelNameById`
