# `useGeinsImage`

The `useGeinsImage` composable provides utilities for generating Geins image URLs and handling image operations. It automatically uses the current account context to generate properly formatted image URLs with fallback support.

## Features

- **Product thumbnail generation** with placeholder fallback
- **Image error handling** with automatic placeholder substitution

## Usage

### Basic Usage

```ts
const { getProductThumbnail } = useGeinsImage();

// Get thumbnail URL for a product
const productThumbnailUrl = getProductThumbnail('image.png');
// "https://{account-name}.commerce.services/product/100x100/image.png"
```

## Properties and Methods

### `getProductThumbnail`

```ts
getProductThumbnail(slug?: string): string
```

Generates a product thumbnail URL using the Geins commerce services infrastructure.

- **Parameters**:
  - `slug` (optional): The product slug/identifier for the image

- **Returns**: A string containing either:
  - A full URL to the product thumbnail (if slug is provided and account is available)
  - A fallback placeholder image path (`/placeholder.svg`) if no slug or account

- **URL Format**: `https://{account-name}.commerce.services/product/100x100/{slug}`

### `handleImageError`

```ts
handleImageError(event: Event): void
```

Handles image load errors by replacing the broken image with the placeholder. Prevents infinite error loops by checking if the image source is already the placeholder.

- **Parameters**:
  - `event`: The error `Event` from the `<img>` element

- **Usage**: Attach to `@error` on `<img>` elements to gracefully handle missing images.

```vue
<img :src="thumbnailUrl" @error="handleImageError" />
```

## Image Sizing

The composable currently generates images with a fixed size of **100x100 pixels**. This size is optimized for:

- **Table thumbnails** in data grids
- **Product list previews** in compact layouts
- **Quick reference images** in forms and dialogs

For different image sizes, you may need to extend the composable or use the Geins image service directly with different size parameters.

## Type Definitions

```ts
function useGeinsImage(): UseGeinsImageReturnType;

interface UseGeinsImageReturnType {
  getProductThumbnail: (slug?: string) => string;
  handleImageError: (event: Event) => void;
}
```
