# `AssetReviewRow`

One read-only row in the upload wizard's [review step](/components/asset/AssetWizardReview.md): a type-tinted icon, the name, resolved metadata (folder / tags / channels), size and a type badge.

Presentational only — the review step passes already-resolved values, so the same row renders identically across its flat, folder and product ("group by products") views.

## Props

| Prop           | Type       | Meaning                                                  |
| -------------- | ---------- | -------------------------------------------------------- |
| `name`         | `string`   | Display name (settings override or the file's own name). |
| `file`         | `File`     | The native upload file — drives the icon, type and size. |
| `folderName`   | `string?`  | Resolved folder name; falls back to "No folder".         |
| `tags`         | `string[]` | Resolved tags.                                           |
| `channelNames` | `string[]` | Resolved channel names.                                  |

## Usage

```vue
<AssetReviewRow
  :name="row.name"
  :file="row.file"
  :folder-name="row.folderId ? folderName(row.folderId) : undefined"
  :tags="row.tags"
  :channel-names="row.channelNames"
/>
```
