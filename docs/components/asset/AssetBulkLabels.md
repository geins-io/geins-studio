# `AssetBulkLabels`

`AssetBulkLabels` is the properties pane of the library's bulk **Add tags**, **Add channels** and **Add content languages** actions in [`ListBulkActionSheet`](/components/list/bulk/ListBulkActionSheet). It reuses the inputs of [`AssetDetailPanel`](/components/asset/AssetDetailPanel) so tags, channels and content languages are picked the same way everywhere.

## Features

- A hint that the values are **added** to every selected asset and existing ones are kept — all three bulk routes add and never remove.
- `kind="tags"`: [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch) with suggestions from `assetApi.listTags()` (`GET media/tags`, the shared `asset-tags` key) and custom tags allowed, since sending a new tag creates it.
- `kind="channels"`: [`FormInputChannels`](/components/form/input/FormInputChannels), fed from the account's channels.
- `kind="languages"`: [`FormInputLanguages`](/components/form/input/FormInputLanguages), fed from the account's languages.
- An inline error when the list breaks a backend limit (`assetLabelLimitError` on the normalized values: 100 tags ≤ 64 chars, 50 channels ≤ 50 chars, 50 languages ≤ 50 chars). The action's `isValid` checks the same thing, so Run stays disabled.

## Usage

```ts
const tagsAction = computed<BulkAction<string[]>>(() => ({
  key: 'add-tags',
  label: t('add_entity', { entityKey: 'tag' }, 2),
  icon: 'Tag',
  component: AssetBulkLabels,
  componentProps: { kind: 'tags' },
  initialValue: () => [],
  isValid: (value) =>
    normalizeAssetLabels(value).length > 0 &&
    !assetLabelLimitError(value, 'tags'),
  run: (ids, value, options) =>
    assetApi.bulkTag(ids, normalizeAssetLabels(value), options),
  // …
}));
```

## Props

| Prop   | Type                                  | Notes                     |
| ------ | ------------------------------------- | ------------------------- |
| `kind` | `'tags' \| 'channels' \| 'languages'` | Which input and limit set |

## Models

| Model     | Type       | Notes                                                        |
| --------- | ---------- | ------------------------------------------------------------ |
| `v-model` | `string[]` | Tags, channel ids or language codes. Normalized by the page. |

## Dependencies

- [`FormInputTagsSearch`](/components/form/input/FormInputTagsSearch), [`FormInputChannels`](/components/form/input/FormInputChannels), [`FormInputLanguages`](/components/form/input/FormInputLanguages)
- `assetApi.listTags`, `assetLabelLimitError` / `ASSET_LABEL_LIMITS` (`#shared/utils/asset`)
