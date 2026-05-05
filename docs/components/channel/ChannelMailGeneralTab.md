# `ChannelMailGeneralTab`

`ChannelMailGeneralTab` is the **General** sub-tab of the Mails tab on a channel — display name, locked from-email, BCC, the master "disable all transaction emails" switch, and an advanced collapsible block with login + password-reset URL slugs.

## Features

- Master `mail.disabled` switch at the top — when on, hides the rest of the form (kept mounted via `v-show` so VeeValidate doesn't clear the values)
- Read-only `from email` rendered through [`FormInputLocked`](/components/form/input/FormInputLocked) (set by Geins, not editable)
- Login + password-reset URL fields use the storefront URL as a left addon — the user only types the slug
- "Advanced" group hidden behind a [`ContentSwitch`](/components/content/ContentSwitch) toggle
- Reads field values from the parent VeeValidate form via `useFieldValue`

## Usage

This component reads from the parent form scope — it must be mounted under a `useForm` provider and the parent must register the relevant fields (`mail.disabled`, `mail.displayName`, `mail.orderConfirmationBCCEmail`, `mail.loginUrl`, `mail.passwordResetUrl`).

```vue
<template>
  <ChannelMailGeneralTab
    :storefront-url="channel.storefrontUrl"
    :from-email="channel.mailFromEmail"
  />
</template>
```

## Props

### `storefrontUrl`

```ts
storefrontUrl?: string
```

Used as the left addon for the URL slug fields. Falls back to `'https://your-channel.com'` when missing. Trailing slashes are stripped for clean concatenation with the slug.

### `fromEmail`

```ts
fromEmail?: string
```

Pre-set Geins-managed value shown in the locked from-email field.

## Dependencies

- shadcn-vue `Switch`, `Input`, `InputGroup`, `Item` family, `Form` family, `Label`
- [`ContentSection`](/components/content/ContentSection), [`ContentSwitch`](/components/content/ContentSwitch)
- [`FormInputLocked`](/components/form/input/FormInputLocked)
- vee-validate's `useFieldValue` — reads `mail.disabled` from parent form
