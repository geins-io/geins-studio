# `usePrice`

The `usePrice` composable provides utilities for price conversion and formatting. It standardizes price data into a consistent `Price` object format with currency information and placeholder support. It's mainly used for displaying prices in tables and input forms.

## Features

- **Price object standardization** with consistent structure
- **Placeholder value support** for fallback displays

## Usage

### Basic Usage

```ts
const { convertToPrice } = usePrice();

// Convert number to Price object
const price = convertToPrice(29.99, 'SEK');
// Returns: { price: "29.99", currency: "SEK", placeholder: undefined }

// Placeholder can be used for editable price fields in tables or forms
const priceWithPlaceholder = convertToPrice(undefined, 'USD', product.price);
// Returns: { price: undefined, currency: "USD", placeholder: "10" }
```

### Integration with Table Columns

```ts
// Use with useColumns for consistent price display
const { getColumns } = useColumns<Product>();
const { convertToPrice } = usePrice();

const transformedProducts = computed(() => {
  return products.value.map((product) => ({
    ...product,
    displayPrice: convertToPrice(product.price, 'EUR'),
    listPrice: convertToPrice(product.listPrice, 'EUR'),
  }));
});

const columns = getColumns(transformedProducts.value, {
  columnTypes: {
    displayPrice: 'currency',
    listPrice: 'currency',
  },
});
```

## Properties and Methods

### `convertToPrice`

```ts
convertToPrice(
  price: string | number | undefined,
  currency: string,
  placeholder?: string | number
): Price
```

Converts various price formats into a standardized `Price` object.

- **Parameters**:
  - `price`: The price value to convert (can be string, number, or undefined)
  - `currency`: The currency code (e.g., 'USD', 'EUR', 'SEK')
  - `placeholder` (optional): Used with input fields to show a fallback value when `price` is undefined

- **Returns**: A `Price` object with standardized structure

## Type Definitions

```ts
function usePrice(): UsePriceReturnType;

interface UsePriceReturnType {
  convertToPrice: (
    price: string | number | undefined,
    currency: string,
    placeholder?: string | number,
  ) => Price;
}

interface Price {
  price: string | undefined;
  currency: string;
  placeholder: string | undefined;
}
```
