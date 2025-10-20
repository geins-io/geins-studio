# `useAccountStore`

The `useAccountStore` Pinia store manages the Geins account configuration and localization settings. It handles account data, channels, currencies, and languages with persistent user preferences and provides computed properties for context-aware data access.

## Features

- **Account data management** with initialization and reset
- **Multi-channel support** with channel-specific configurations
- **Currency and language** selection with cookie persistence

## Usage

```ts
import { useAccountStore } from '@/stores/account';

const accountStore = useAccountStore();

// Access reactive state
const {
  account,
  channels,
  currencies,
  languages,
  currentChannelId,
  currentLanguage,
  currentCurrency,
} = storeToRefs(accountStore);

// Initialize store
await accountStore.init();
```

## Properties

### State Properties

#### `account`

A `ref` containing the current account configuration.

- **Type**: `Ref<Account | undefined>`
- **Source**: Fetched from global API

#### `channels`

A `ref` containing available channels for the account.

- **Type**: `Ref<Channel[]>`
- **Default**: Empty array

#### `currencies`

A `ref` containing all available currencies.

- **Type**: `Ref<Currency[]>`
- **Default**: Empty array

#### `languages`

A `ref` containing all available languages.

- **Type**: `Ref<Language[]>`
- **Default**: Empty array

#### `ready`

A `ref` indicating whether all data has been successfully loaded.

- **Type**: `Ref<boolean>`
- **Default**: `false`

### User Preferences (Persistent)

#### `currentChannelId`

A cookie-persisted `ref` for the selected channel ID.

- **Type**: `UseCookieReturn<string>`
- **Default**: Fallback channel from runtime config
- **Persistence**: Cookie `'geins-channel'`

#### `currentLanguage`

A cookie-persisted `ref` for the selected language.

- **Type**: `UseCookieReturn<string>`
- **Default**: Fallback language from runtime config
- **Persistence**: Cookie `'geins-language'`

#### `currentCurrency`

A cookie-persisted `ref` for the selected currency.

- **Type**: `UseCookieReturn<string>`
- **Default**: Fallback currency from runtime config
- **Persistence**: Cookie `'geins-currency'`

## Methods

### Data Fetching

#### `fetchAccount`

```ts
fetchAccount(): Promise<Account>
```

Fetches account configuration from the API.

- **Returns**: Promise resolving to account data

#### `fetchChannels`

```ts
fetchChannels(): Promise<Channel[]>
```

Fetches available channels for the account.

#### `fetchCurrencies`

```ts
fetchCurrencies(): Promise<Currency[]>
```

Fetches all available currencies.

#### `fetchLanguages`

```ts
fetchLanguages(): Promise<Language[]>
```

Fetches all available languages.

#### `init`

```ts
init(): Promise<void>
```

Initializes the store by fetching all required data in parallel.

- **Features**:
  - Parallel API calls for performance
  - Error handling with logging
  - Sets `ready` state based on success
  - Updates `currentCurrency` from account default

#### `reset`

```ts
reset(): void
```

Resets all store state to initial values.

### Utility Methods

#### `getChannelNameById`

```ts
getChannelNameById(id: string): string
```

Gets channel name by ID.

- **Returns**: Channel name or empty string if not found

#### `getCountryNameById`

```ts
getCountryNameById(id: string): string
```

Gets country name by ID from current countries.

#### `getDefaultCountryByChannelId`

```ts
getDefaultCountryByChannelId(channelId: string): string
```

Gets the default country for a specific channel.

- **Logic**: Uses channel's default market country
- **Fallback**: Runtime config fallback country

#### `getCurrenciesByChannelId`

```ts
getCurrenciesByChannelId(channelId: string): string[]
```

Gets available currency IDs for a specific channel.

- **Returns**: Array of currency IDs from non-virtual markets

## Computed Properties

### `currentChannel`

A computed property that returns the currently selected channel object.

- **Type**: `ComputedRef<Channel | undefined>`
- **Logic**: Finds channel matching `currentChannelId`

### `currentCountries`

A computed property that returns countries available in the current channel.

- **Type**: `ComputedRef<Country[]>`
- **Logic**: Extracts countries from non-virtual markets in current channel

### `currentCurrencies`

A computed property that returns currencies available in the current channel.

- **Type**: `ComputedRef<Currency[]>`
- **Logic**: Extracts unique currencies from non-virtual markets in current channel

## Type Definitions

```ts
function useAccountStore(): AccountStoreReturnType;

interface AccountStoreReturnType {
  account: Ref<Account | undefined>;
  channels: Ref<Channel[]>;
  currencies: Ref<Currency[]>;
  languages: Ref<Language[]>;
  ready: Ref<boolean>;
  currentChannelId: UseCookieReturn<string>;
  currentLanguage: UseCookieReturn<string>;
  currentCurrency: UseCookieReturn<string>;
  currentChannel: ComputedRef<Channel | undefined>;
  currentCountries: ComputedRef<Country[]>;
  currentCurrencies: ComputedRef<Currency[]>;
  fetchAccount: () => Promise<Account>;
  fetchChannels: () => Promise<Channel[]>;
  fetchCurrencies: () => Promise<Currency[]>;
  fetchLanguages: () => Promise<Language[]>;
  init: () => Promise<void>;
  reset: () => void;
  getChannelNameById: (id: string) => string;
  getCountryNameById: (id: string) => string;
  getDefaultCountryByChannelId: (channelId: string) => string;
  getCurrenciesByChannelId: (channelId: string) => string[];
}
```

## Dependencies

This store depends on:

1. **Pinia**: For store management
2. **useGeinsRepository**: To access global API endpoints
