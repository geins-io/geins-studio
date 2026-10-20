# `AppLoader`

`AppLoader` is the app's loading indicator — the same 4×4 dot-grid "gemini-pulse" animation the SPA boot screen uses (`app/app-skeleton.html`), packaged as a reusable component with a configurable message. Use it for in-flight states such as the upload wizard's "uploading…" step.

The dots are drawn with `currentColor`, so the component follows the surrounding text colour (defaults to `text-foreground`). Wrap it in a `text-*` context to tint.

## Usage

```vue
<AppLoader :text="$t('asset_library.uploading_files', { count }, count)" />
```

## Props

### `text`

```ts
text?: string;
```

Optional message shown under the animation. Omit it for a bare spinner.
