---
title: 'Add mail types and repository endpoints for Mails tab'
project: 'Self Service (Channels)'
milestone: 'M6 — Mails Tab'
priority: 2
estimate: 2
labels:
  - feature
  - confidence-high
  - risk-low
depends_on:
  - '../M1-foundation/002-channel-api-repository.md'
model: sonnet
mode: claude-code agent
---

## Context

The Mails tab is the fifth tab on the channel edit page. Before any UI can be built, the required TypeScript types and repository methods must be in place. Mail general/layout settings and the list of mail types live on the channel object (updated via channel PATCH). Text editing and preview use dedicated endpoints outside the channel PATCH surface.

## Expected Outcome

- `shared/types/Channel.ts` contains all mail-related types.
- `ChannelResponse.mailSettings` and `ChannelResponse.mailTypes` are typed.
- `ChannelUpdate.mailSettings` is typed (general + layout fields only — not text overrides).
- The channel repository exposes `getMailTexts`, `updateMailTexts`, and `previewMail`.

## Implementation Notes

### Types (`shared/types/Channel.ts`)

```ts
// The 15 canonical mail type identifiers
type MailTypeId =
  | 'OrderConfirmation'
  | 'OrderProcessing'
  | 'OrderDelivered'
  | 'OrderCancelled'
  | 'OrderRowRemoved'
  | 'OrderRowReturned'
  | 'CustomerWishlist'
  | 'CustomerRefunded'
  | 'CustomerRegistered'
  | 'CustomerUnregistered'
  | 'CustomerMessageNotification'
  | 'CustomerPasswordReset'
  | 'ProductTellAFriend'
  | 'ProductSizeAvailable'
  | 'ProductMonitorNotification';

// One entry in the mailTypes array on the channel response (extend EntityBaseWithName)
interface ChannelMailType extends EntityBaseWithName {
  _id: string;
  _type: string;
  typeId: MailTypeId;
  name: string; // human-readable name
  description?: string; // optional description shown in the list
}

// General mail settings (shared across all templates)
interface MailGeneralSettings {
  displayName?: string;
  fromEmailAddress?: string;
  loginUrl?: string;
  passwordResetUrl?: string;
  orderConfirmationBccEmail?: string;
  smtpHost?: string;
  smtpPort?: number | null;
  smtpUser?: string;
  smtpPassword?: string;
  disabled?: boolean; // global master toggle
}

// Layout mail settings (shared visual styling)
interface MailLayoutSettings {
  logoUri?: string | null;
  headerImgUri?: string | null;
  backgroundColor?: string | null;
  bodyColor?: string | null;
  headerColor?: string | null;
  footerColor?: string | null;
  headerTextColor?: string | null;
  footerTextColor?: string | null;
  buttonBackgroundColor?: string | null;
  buttonTextColor?: string | null;
  textColor?: string | null;
  linkColor?: string | null;
  priceColor?: string | null;
  fontLink?: string | null;
  fontFamily?: string | null;
  fontSizeSmall?: string | null;
  fontSizeMedium?: string | null;
  fontSizeLarge?: string | null;
  lineHeight?: string | null;
  borderRadius?: string | null;
  prodImgSize?: string | null;
}

interface ChannelMailSettings {
  general: MailGeneralSettings;
  layout: MailLayoutSettings;
}

// Text key entry returned by GetMailTexts
interface MailTextEntry {
  key: string; // e.g. "ORDER_DELIVERY_TITLE"
  value: string; // current override (empty if not overridden)
  defaultValue: string; // system default (shown as placeholder)
  hasOverride: boolean;
}

interface MailTextsResponse {
  mailType: MailTypeId;
  language: string;
  texts: MailTextEntry[];
}

// Flat key-value request body for UpdateMailTexts
// Backend expects: { language: string, [textKey: string]: string }
interface MailTextsUpdateRequest {
  language: string;
  [key: string]: string;
}

interface MailPreviewRequest {
  language: string;
}

interface MailPreviewResponse {
  html: string;
}
```

- Extend `ChannelResponse` with `mailSettings: ChannelMailSettings` and `mailTypes: ChannelMailType[]`.
- Extend `ChannelUpdate` with `mailSettings?: Partial<ChannelMailSettings>` (general + layout only — file uploads for logoUri/headerImgUri travel as multipart file parts named by property key, not as strings in this object).

### Repository (`app/utils/repositories/channel.ts`)

Add three mail methods following the established payment endpoint pattern in the same file:

- `getMailTexts(channelId: string, mailType: MailTypeId, language: string)` → `GET /account/channel/{channelId}/mail/{mailType}?language={lang}` → `MailTextsResponse`
- `updateMailTexts(channelId: string, mailType: MailTypeId, data: MailTextsUpdateRequest)` → `PATCH /account/channel/{channelId}/mail/{mailType}` → `void`
- `previewMail(channelId: string, mailType: MailTypeId, data: MailPreviewRequest)` → `POST /account/channel/{channelId}/mail/{mailType}/preview` → `MailPreviewResponse`

All three follow the `/account/` prefix convention established for channel API calls.

## Acceptance Criteria

- All types above are defined in `shared/types/Channel.ts` and exported.
- `ChannelResponse.mailSettings` is `ChannelMailSettings` and `ChannelResponse.mailTypes` is `ChannelMailType[]`.
- `ChannelUpdate.mailSettings` accepts `Partial<ChannelMailSettings>`.
- `channelApi.getMailTexts(channelId, mailType, language)`, `channelApi.updateMailTexts(channelId, mailType, data)`, and `channelApi.previewMail(channelId, mailType, data)` are callable.
- `pnpm typecheck` and `pnpm lint:check` pass with no new errors.
- Vitest: test that `ChannelMailSettings` accepts valid general + layout objects; test that `MailTextsUpdateRequest` is assignable with dynamic string keys alongside the required `language` field; test that `MailTypeId` only allows the 15 canonical type strings (assignment of an invalid string should produce a type error).

## Agent Execution

- **Model**: sonnet
- **Mode**: claude-code agent
- **Why**: Type definitions and repository additions are well-scoped and follow established patterns in the file — no architectural risk.
