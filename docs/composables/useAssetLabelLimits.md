# `useAssetLabelLimits`

The `useAssetLabelLimits` composable words a backend limit breach on an asset's tags, channels or content languages. Every surface that checks the limits shows the same copy: the bulk "Add tags / channels / content languages" actions ([`AssetBulkLabels`](/components/asset/AssetBulkLabels)) and the upload wizard ([`AssetWizardManage`](/components/asset/AssetWizardManage), [`AssetWizardBulkPane`](/components/asset/AssetWizardBulkPane)). The detail panel uses the same keys inside its Zod schema.

## Usage

```ts
const { limitMessage } = useAssetLabelLimits();

limitMessage(assetLabelLimitError(values, 'tags'), 'tags');
// 'count'  → "Add at most 100 tags" (max_count_entity)
// 'length' → "Each tag can be at most 64 characters" (max_length_entity)
// null     → undefined
```

The breach itself comes from `assetLabelLimitError` (`#shared/utils/asset`) for a single list, or from `labelLimitError(ids, kind)` on [`useUploadWizard`](/composables/useUploadWizard) across files.

## Returns

### `limitMessage`

```ts
limitMessage(
  breach: AssetLabelLimitBreach | null,
  kind: AssetLabelKind,
): string | undefined
```

The localized message for a breach, or `undefined` when there is none. The entity name comes from `ASSET_LABEL_ENTITY_KEYS` and the limit from `ASSET_LABEL_LIMITS`:

| `kind`      | Entity key         | Max count | Max length |
| ----------- | ------------------ | --------- | ---------- |
| `tags`      | `tag`              | 100       | 64         |
| `channels`  | `channel`          | 50        | 50         |
| `languages` | `content_language` | 50        | 50         |
