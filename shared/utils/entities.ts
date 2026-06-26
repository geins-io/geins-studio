/**
 * Canonical entity-name keys.
 *
 * Each value is the i18n key for an entity's localized name (resolved via
 * `@.lower:{entityName}` / `@:{entityName}` links and the `entity_*` action
 * keys). The SAME key is consumed in multiple places that must agree — repo
 * factories (`entityRepo`'s `entityKey` → global error toast), page
 * `usePageError({ entityName })`, table empty states, validation messages.
 *
 * Reference `ENTITY.x` instead of a bare string so the value lives in one place
 * and a rename can't silently drift between a repo and its page. The
 * `entities.test.ts` suite asserts every value exists in both locale files.
 */
export const ENTITY = {
  product: 'product',
  category: 'category',
  brand: 'brand',
  price_list: 'price_list',
  order: 'order',
  company: 'company',
  company_group: 'company_group',
  user_account: 'user_account',
  user: 'user',
  customer: 'customer',
  customer_type: 'customer_type',
  channel: 'channel',
  market: 'market',
  language: 'language',
  country: 'country',
  currency: 'currency',
  stock: 'stock',
  import: 'import',
  price: 'price',
  item: 'item',
  profile: 'profile',
  buyer: 'buyer',
  billing_address: 'billing_address',
  shipping_address: 'shipping_address',
  address_entity: 'address_entity',
  sales_rep: 'sales_rep',
  name: 'name',
  number: 'number',
  margin: 'margin',
  discount: 'discount',
  quotation: 'quotation',
  workflow: 'workflow',
  input: 'input',
  variable: 'variable',
  execution: 'execution',
  group: 'group',
  tag: 'tag',
  communication: 'communication',
  entity: 'entity',
  owner: 'owner',
  draft: 'draft',
  account: 'account',
  message: 'message',
  mail: 'mail',
  payment: 'payment',
  payment_method: 'payment_method',
  changelog_entry: 'changelog_entry',
} as const;

/** Union of all valid entity-name keys (e.g. 'price_list' | 'quotation' | …). */
export type EntityKey = (typeof ENTITY)[keyof typeof ENTITY];
