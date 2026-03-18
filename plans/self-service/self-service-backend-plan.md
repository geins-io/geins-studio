# Self Service Backend — Implementation Plan

## Problem Statement

Build the backend API for the Self Service project, enabling merchants to manage their channel settings, markets, payments, transactional mail configuration, and storefront settings through a new UI. All backend work lives in the **Account service** (`mgmtapi/src/account`).

The Figma design ("self service") defines 11 screens plus 5 dialog sheets. Search configuration has been **removed from scope**. The "Transactional mails: Enabled" master toggle **already exists** in the legacy `MailSettings.Disabled` property (global per customer-environment, not per-type).

---

## Existing Codebase State

### Types & Services (Account service — `mgmtapi/src/account`)

| Layer            | Existing                                                                        | Notes                                             |
| ---------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Functions**    | `AccountFunctions.cs` — account/user/role CRUD; channel & market read endpoints | No write ops for channels/markets today           |
| **Services**     | `ChannelService` / `IChannelService` — read-only                                | `MarketService` / `IMarketService` — read-only    |
| **Repositories** | `LegacySiteRepository` (SQL, read-only for channels)                            | `LegacyMarketRepository` (reads `tblSiteCountry`) |
| **Models**       | Response models for `Channel`, `Market`, `Country`, `Currency`, `Language`      | No request models for channel/market writes       |

### API (current endpoints)

| Endpoint         | Verb | Route                                             | Store                    |
| ---------------- | ---- | ------------------------------------------------- | ------------------------ |
| `GetChannel`     | GET  | `/account/channel/{id}`                           | SQL `tblSite`            |
| `ListChannels`   | GET  | `/account/channels`                               | SQL `tblSite`            |
| `GetMarket`      | GET  | `/account/market/{id}`                            | SQL `tblSiteCountry`     |
| `ListMarkets`    | GET  | `/account/channel/{id}/markets`                   | SQL `tblSiteCountry`     |
| `ListAllMarkets` | GET  | `/account/markets`                                | SQL `tblSiteCountry`     |
| Reference data   | GET  | `/account/countries`, `/currencies`, `/languages` | SQL (legacy Carismar DB) |

### Storage

| Store               | Technology          | Tables / Containers                                                                                                       | Access Pattern                                               |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Merchant SQL DB     | SQL Server + Dapper | `tblSite`, `tblSiteLanguage`, `tblSettings`, `tblSiteCountry`, `tblCountry`, `tblCurrency`, `tblPayment`, `tblPaymentRow` | `LegacyBaseSqlRepository` + embedded `.sql`                  |
| Cosmos DB           | Azure Cosmos DB     | `Settings` container (per-merchant DB)                                                                                    | `CosmosClientFactory` (exists, currently `ApiSettings` only) |
| Azure Table Storage | Azure Tables SDK    | `MailSettings` (PK=environment, RK=customer), `MailBlobLogReferences{yyyyMM}` (monthly log index)                         | `Geins.MgmtApi.Util.Table` — **direct access** (decided)     |

### External Dependencies

| Dependency                      | Usage                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Legacy Mail Service**         | Mail preview rendering (HTML) via preview HTTP POST endpoints; `MailSettings` Table Storage for config. Preview works by POSTing `MailRequestModel<T>` — the mail service fetches data from mgmt API via Broker and renders with RazorLight. Per-customer SMTP overrides and Razor template overrides (via `override` blob container) are also stored here. |
| **AccountProvisioning Service** | Consumes channel deactivation events → deletes product docs from Cosmos                                                                                                                                                                                                                                                                                     |
| **MgmtAPI Databridge**          | Consumes channel activation events → creates product docs; consumes market activation events → partial-updates product docs                                                                                                                                                                                                                                 |
| **Event Grid**                  | Publish channel/market activation/deactivation events                                                                                                                                                                                                                                                                                                       |
| **Blob Storage**                | File uploads for logos/header images (shared by mail layout + storefront layout)                                                                                                                                                                                                                                                                            |

---

## Decisions Made

| #   | Decision                          | Answer                                                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Where do all features live?       | **Account service**                                                                                                                                                                                                                                                                                                                                                                  |
| 2   | tblSiteCountry refactoring?       | **No refactor** — `tblMarket` is a template for which markets _can_ be added. Actual assignment stays in `tblSiteCountry`, fully backward-compatible                                                                                                                                                                                                                                 |
| 3   | Pre-populate markets?             | **Yes** — auto-populate `tblMarket` with data matching an existing customer (Kayo), minus Asian markets                                                                                                                                                                                                                                                                              |
| 4   | Channel/market activation events? | **Yes** — publish events. Consuming services (AccountProvisioning, Databridge) handle heavy background work. Must restrict free toggling (lockout timer / confirmation)                                                                                                                                                                                                              |
| 5   | "Transactional mails: Enabled"?   | **Already exists** — legacy `MailSettings.Disabled` bool is a global master toggle per customer-environment. No per-type toggle exists in legacy.                                                                                                                                                                                                                                    |
| 6   | Mail config access pattern?       | **Direct** — edit Azure Table Storage directly from Account service using `Geins.MgmtApi.Util.Table`                                                                                                                                                                                                                                                                                 |
| 7   | Mail layout options?              | **Flat properties on `MailSettings` TableEntity** — colors, fonts, border-radius, logo/header URIs are all stored as properties on the same entity (not a separate table or hard-coded model)                                                                                                                                                                                        |
| 8   | Mail text override tracking?      | **Already implemented** in legacy — `MailSettings.Texts` is a JSON string: `Dict<textKey, Dict<langCode, overrideValue>>`. Keys omit the `MAIL_V2_` prefix. Falls back to embedded `.resx` resources when no override exists.                                                                                                                                                        |
| 9   | Payment data source?              | `tblPayment` + `tblPaymentRow` (active payments connected to channel)                                                                                                                                                                                                                                                                                                                |
| 10  | Storefront settings endpoints?    | **Two endpoints** under Account service: 1 for schema, 1 for setting values                                                                                                                                                                                                                                                                                                          |
| 11  | Storefront template defaults?     | Customer-agnostic default schema + default values docs in Cosmos `Settings` container. API auto-falls back to defaults if merchant-specific doc not found. Frontend team to supply default docs                                                                                                                                                                                      |
| 12  | Existing Cosmos settings doc?     | **Not used** — Frontend team provides new documents                                                                                                                                                                                                                                                                                                                                  |
| 13  | Default language on channel?      | Hooked to `tblSiteLanguage` — 1st in sort order is the default                                                                                                                                                                                                                                                                                                                       |
| 14  | Channel URL?                      | Stored in `tblSite.strUrl`. Backend host-binding changes needed later (separate from just setting the value)                                                                                                                                                                                                                                                                         |
| 15  | Mail preview without entity?      | Legacy mail service preview endpoints (e.g. `OrderConfirmationPreview`) are HTTP POST, receive `MailRequestModel<T>`, and fetch real data from mgmt API via Service Broker. The "dummy values" concern is about the **mgmt API's** `Mail/*` endpoints needing to handle `orderid=0` etc., not the mail service itself.                                                               |
| 16  | File upload approach?             | **Inline on settings endpoints** — no separate upload endpoints or gallery. Settings endpoints accept `multipart/form-data` with file uploads whose field names must match settings property names. Files uploaded to customer blob storage with static names; blob URL written to matching field. Limited validation (max size only, no image processing). Gallery is out of scope. |
| 17  | Mail layout image URLs?           | **Change mail service to accept absolute URLs** — currently `LogoUri`/`HeaderImgUri` must be relative to shop URL. Mail service URL resolution will be updated to also allow absolute blob storage URLs.                                                                                                                                                                             |

## Remaining Open Questions

1. **Mail text override flag format** — **Resolved** — Legacy service already implements this: `MailSettings.Texts` JSON property with `Dict<textKey, Dict<langCode, override>>`. Keys strip the `MAIL_V2_` prefix. The self-service API can detect which texts are overridden by checking which keys exist in this JSON.
2. **Channel URL host bindings** — Additional backend processing for URL changes (host bindings, validation, status reporting) needs research; deferred to later milestones.
3. **Channel/market activation UX restrictions** — Exact mechanism (lockout timer, confirmation dialog, or both) to prevent free toggling.
4. **Default Cosmos documents** — Frontend team to supply customer-agnostic default schema and default values docs.
5. **Channel ID → Customer/Environment mapping** — The legacy `MailSettings` table uses customer domain + environment as keys. Need to determine how channel IDs in the new API map to these identifiers.

---

## Milestones

### Milestone 0: Integration Test Infrastructure

> **Goal:** Set up the `Geins.Account.Test` project with shared fixtures and utilities that all milestone integration tests build on. Follows the same patterns as `Geins.Workflow.Test` — emulated dependencies, assembly-level fixtures, fluent test builders, and full E2E via `FuncHostFixture`.

**Reference project:** `mgmtapi/src/workflow/Geins.Workflow.Test/` — integration tests with Cosmos DB Emulator, Azurite, `IntegrationTestFixture` (DI host), `FuncHostFixture` (func host process), and `CosmosDbFixture` (emulator lifecycle).

**Dependencies to emulate:**

| Dependency                 | Technology                               | Used By            | Emulation Strategy                          |
| -------------------------- | ---------------------------------------- | ------------------ | ------------------------------------------- |
| SQL Server (new tables)    | Dapper + `BaseSqlRepository`             | M1, M2, M3         | Testcontainers.MsSql or LocalDB             |
| SQL Server (legacy tables) | Dapper + `LegacyBaseSqlRepository`       | M1, M2, M3         | Same SQL emulation + Key Vault mock         |
| Cosmos DB                  | `CosmosClient` via `CosmosClientFactory` | M5                 | Cosmos DB Emulator (same as Workflow)       |
| Azure Table Storage        | `Geins.MgmtApi.Util.Table`               | M4                 | Azurite                                     |
| Azure Blob Storage         | Blob SDK                                 | M4, M5             | Azurite                                     |
| Event Grid                 | `Geins.MgmtApi.Util.EventGrid`           | M6                 | In-memory event collector                   |
| Key Vault                  | `LegacySqlConnectionStringService`       | All SQL milestones | Mock/stub returning test connection strings |

**SQL Server emulation options (decision deferred):**

| Option                   | Pros                                                              | Cons                                               |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------------------------- |
| **Testcontainers.MsSql** | Most realistic; identical SQL behavior; works in CI with Docker   | Requires Docker Desktop locally; ~15s startup      |
| **SQL Server LocalDB**   | No Docker needed; fast startup; available on dev machines with VS | Not available in all CI environments; Windows-only |

Recommended: support both — Testcontainers in CI, LocalDB for fast local dev. The fixture checks for Docker and falls back.

**Two test SQL databases needed:**

1. **Account DB** — new system tables (`dbo.Account`, `dbo.User`, `dbo.Role`, etc.) — DDL from `Geins.Account.Sql/Tables/`
2. **Legacy Customer DB** — legacy tables (`tblSite`, `tblSiteCountry`, `tblSiteLanguage`, `tblCountry`, `tblCurrency`, `tblLanguage`, `tblPayment`, `tblPaymentRow`, etc.) — new test DDL scripts with seed data

**Test project structure:**

```
Geins.Account.Test/
├── Geins.Account.Test.csproj
├── test.settings.json                          # Emulator connection config
├── Integration/
│   ├── IntegrationTestFixture.cs               # Assembly-level: boots SQL, Cosmos, Azurite → builds IHost
│   ├── SqlDbFixture.cs                         # SQL Server lifecycle (Testcontainers or LocalDB)
│   ├── CosmosDbFixture.cs                      # Cosmos emulator lifecycle (reuse Workflow pattern)
│   ├── AzuriteFixture.cs                       # Azurite lifecycle for Table/Blob storage
│   ├── FuncHostFixture.cs                      # Full E2E: starts func host process on port 7172
│   ├── Schema/                                 # Legacy table DDL + seed scripts for test DB
│   ├── Builders/
│   │   ├── TestChannelBuilder.cs               # Fluent builder for channel test data
│   │   ├── TestMarketBuilder.cs                # Fluent builder for market test data
│   │   └── TestAccountBuilder.cs               # Fluent builder for account/user test data
│   ├── Data/                                   # Repository integration tests (per milestone)
│   ├── Api/                                    # Service integration tests (per milestone)
│   └── E2E/                                    # FuncHost E2E tests (per milestone)
├── Unit/
│   └── Api/                                    # Unit tests (per milestone)
```

**Tasks:**

1. **Create test project** — `Geins.Account.Test.csproj` with MSTest + Moq + Shouldly + Testcontainers.MsSql + Cosmos SDK + Extensions.Hosting; add to solution and solution filter
2. **Create `SqlDbFixture`** — SQL Server lifecycle management; creates Account DB (from `Geins.Account.Sql/` DDL) and Legacy Customer DB; provides connection strings; `ResetDataAsync()` / `CleanupAsync()`
3. **Create legacy table DDL scripts** — `Integration/Schema/` with CREATE TABLE scripts for `tblSite`, `tblSiteCountry`, `tblSiteLanguage`, `tblCountry`, `tblCurrency`, `tblLanguage`, `tblPayment`, `tblPaymentRow`, etc. with reference data seed (countries, currencies, languages)
4. **Create `CosmosDbFixture`** — Cosmos emulator lifecycle for `Settings` container (`/account` partition key); same pattern as Workflow; `ResetDataAsync()` / `CleanupAsync()`
5. **Create `AzuriteFixture`** — Azurite lifecycle for Table Storage and Blob Storage; creates test tables/containers
6. **Create `IntegrationTestFixture`** — Assembly-level fixture: boots all emulators → builds `IHost` → registers real services with test connection strings; mocks `LegacySqlConnectionStringService` to return test legacy DB connection string; provides `IServiceProvider`
7. **Create `FuncHostFixture`** — Full E2E: starts Account func host on port 7172; sets environment variables for test SQL connections, Cosmos emulator, Azurite; polls health check; HTTP helper methods for Account API endpoints
8. **Add `E2E_NO_AUTH` support** — Add `E2ENoAuth` property to `Geins.Account.csproj`; add `E2EFakeIdentityMiddleware` and conditional auth in `Program.cs` (same pattern as Workflow)
9. **Create fluent test builders** — `TestChannelBuilder`, `TestMarketBuilder`, `TestAccountBuilder` with fluent APIs and static presets (`CreateMinimal`, etc.)
10. **Smoke test** — verify infrastructure: connect to SQL, create table, insert/query; connect to Cosmos emulator; connect to Azurite

---

### Milestone 1: Channel CRUD & Language Management

> **Goal:** Enable creating, updating, and activating/deactivating channels with full language management. This is the foundation all other milestones build on.

**Figma screens:**

- `Channels list` (node `43:19845`)
- `Channel - edit - general` (node `43:19846`)

**Data sources:** `tblSite`, `tblSiteLanguage`, `tblSettings`

**New endpoints:**

| Endpoint              | Method | Route                                                | Description                                                                               |
| --------------------- | ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| CreateChannel         | POST   | `/account/channel`                                   | Create a new channel                                                                      |
| UpdateChannel         | PATCH  | `/account/channel/{channelId}`                       | Update channel properties (name, display name, URL via `tblSite.strUrl`)                  |
| ActivateChannel       | PUT    | `/account/channel/{channelId}/activate`              | Set channel active (publishes event; must enforce lockout/confirmation)                   |
| DeactivateChannel     | PUT    | `/account/channel/{channelId}/deactivate`            | Set channel inactive (publishes event; triggers product deletion via AccountProvisioning) |
| AddChannelLanguage    | POST   | `/account/channel/{channelId}/language`              | Add language to channel                                                                   |
| UpdateChannelLanguage | PATCH  | `/account/channel/{channelId}/language/{languageId}` | Update language settings (active)                                                         |
| RemoveChannelLanguage | DELETE | `/account/channel/{channelId}/language/{languageId}` | Remove language from channel                                                              |

**Existing endpoints to enhance:**

- `GetChannel` — add summary counts (markets, languages, payments)
- `ListChannels` — add markets count, status in list response

**Tasks:**

1. **SQL scripts for channel & language write operations**
   - 1a. INSERT/UPDATE on `tblSite`
   - 1b. INSERT/UPDATE/DELETE on `tblSiteLanguage` (1st in sort order = default language)
2. **Request & response models**
   - 2a. Request models: `CreateChannelRequest`, `UpdateChannelRequest`, `AddChannelLanguageRequest`, `UpdateChannelLanguageRequest`
   - 2b. Enhanced response models with summary counts (markets, languages, payments)
3. **Service & repository write methods**
   - 3a. Extend `ChannelService` / `IChannelService` with write methods
   - 3b. Extend `LegacySiteRepository` / `ILegacySiteRepository` with write operations
4. **Endpoints** — new write endpoints in `AccountFunctions.cs` (or split to `ChannelFunctions.cs`)
5. **Validation** — unique channel names, valid language IDs, URL format
6. **Unit tests** for all new service methods
7. **Integration tests** — repository tests (`LegacySiteRepositoryIntegrationTests`, `SiteLanguageRepositoryIntegrationTests`): CRUD round-trips against test SQL Server. Service tests (`ChannelServiceIntegrationTests`): create→get, update→get, activate/deactivate round-trips with real dependencies. E2E tests (`ChannelE2ETests`): full HTTP endpoint tests — create channel → list channels → update → activate → add/remove language → verify via GET.

---

### Milestone 2: Market Management

> **Goal:** Introduce market definitions (`tblMarket`) and channel-market assignments (via existing `tblSiteCountry`). Enable the UI to list, add, edit, and remove markets per channel.

**Figma screens:**

- `Channel - edit - markets` (node `91:2365`)
- `Sheet - add market - step 1` (node `173:6826`)
- `Sheet - add market - step 2` (node `174:4292`)
- `Sheet - edit existing market` (node `174:4375`)

**New SQL table:**

```sql
CREATE TABLE dbo.tblMarket (
    intId           INT IDENTITY(1,1) PRIMARY KEY,
    intCountryId    INT NOT NULL REFERENCES dbo.tblCountry(intId),
    intCurrencyId   INT NOT NULL REFERENCES dbo.tblCurrency(intId),
    floStandardVatRate FLOAT NOT NULL DEFAULT 0,
    bitActive       BIT NOT NULL DEFAULT 1,
    UNIQUE (intCountryId, intCurrencyId)
);
```

**Existing assignment table:** `tblSiteCountry` (already exists — no DDL needed)

Assigning a market to a channel INSERTs into `tblSiteCountry` using properties from the `tblMarket` definition. Key column mapping:

- `tblSiteCountry.intSiteId` ← channel ID
- `tblSiteCountry.intCountryId` ← `tblMarket.intCountryId`
- `tblSiteCountry.intCurrencyId` ← `tblMarket.intCurrencyId`
- `tblSiteCountry.floStandardVatRate` ← `tblMarket.floStandardVatRate`
- `tblSiteCountry.bitActive` ← assignment active flag

**New endpoints:**

| Endpoint               | Method | Route                                                              | Description                                |
| ---------------------- | ------ | ------------------------------------------------------------------ | ------------------------------------------ |
| ListMarketDefinitions  | GET    | `/account/market-definitions`                                      | List all defined markets (dropdown source) |
| CreateMarketDefinition | POST   | `/account/market-definition`                                       | Create a new market definition             |
| AddChannelMarket       | POST   | `/account/channel/{channelId}/market`                              | Assign market to channel                   |
| UpdateChannelMarket    | PATCH  | `/account/channel/{channelId}/market/{marketAssignmentId}`         | Update assignment (active/default)         |
| RemoveChannelMarket    | DELETE | `/account/channel/{channelId}/market/{marketAssignmentId}`         | Remove market from channel                 |
| SetDefaultMarket       | PUT    | `/account/channel/{channelId}/market/{marketAssignmentId}/default` | Set as default market                      |

**Tasks:**

1. **DDL & seed scripts for `tblMarket`**
   - 1a. DDL script for `tblMarket` (market definitions); assignment uses existing `tblSiteCountry`
   - 1b. Seed script to auto-populate `tblMarket` from existing customer data (Kayo, minus Asian markets)
2. **Request & response models**
   - 2a. Request models: `CreateMarketDefinitionRequest`, `AddChannelMarketRequest`, `UpdateChannelMarketRequest`
   - 2b. Response models: `MarketDefinition`, `ChannelMarket`
3. **Service & repository methods for market definition and assignment**
   - 3a. Extend `LegacyMarketRepository` with `tblMarket` CRUD and write operations on `tblSiteCountry` for channel-market assignment
   - 3b. Extend `MarketService` with market definition and assignment methods
4. **Endpoints** — new endpoints in `AccountFunctions.cs` (or market-specific Functions file)
5. **Market activation/deactivation events** — publishes event; triggers product partial-updates via Databridge. Must enforce lockout/confirmation like channels
6. **Validation** — prevent duplicate assignments, ensure at least one default market per channel
7. **Unit tests**
8. **Integration tests** — repository tests (`MarketDefinitionRepositoryIntegrationTests`, `ChannelMarketRepositoryIntegrationTests`): CRUD round-trips for `tblMarket` and `tblSiteCountry`. Service tests (`MarketServiceIntegrationTests`): create definition → assign → set default → verify only-one-default. E2E tests (`MarketE2ETests`): full lifecycle — create market definition → assign to channel → activate → deactivate → remove. Multi-request scenario: `E2E_ChannelWithMarketsAndLanguages` — create channel → add languages → add markets → verify summary counts.

---

### Milestone 3: Payment Assignment (Read-Only)

> **Goal:** Expose payment methods configured for a channel. Read-only — no write operations.

**Figma screens:**

- `Channel - edit - payments` (node `84:1865`)

**Data sources:** `tblPayment` + `tblPaymentRow` (active payments connected to channel)

**New endpoints:**

| Endpoint            | Method | Route                                   | Description                      |
| ------------------- | ------ | --------------------------------------- | -------------------------------- |
| ListChannelPayments | GET    | `/account/channel/{channelId}/payments` | List payment methods for channel |

**Tasks:**

1. **SQL script & data access** — SQL joining `tblPayment` + `tblPaymentRow` with site/market data; new `LegacyPaymentRepository` (read-only)
2. **Service & response model** — `PaymentService` for mapping; `ChannelPayment` response model with nested market/customer type info
3. **Endpoint** — `ListChannelPayments` in `AccountFunctions.cs` (or payment-specific Functions file)
4. **Unit tests**
5. **Integration tests** — repository tests (`PaymentRepositoryIntegrationTests`): verify SQL joins against seeded `tblPayment`/`tblPaymentRow` data; test with/without payments, inactive payments excluded. E2E tests (`PaymentE2ETests`): `ListChannelPayments` returns correct data, 404 for non-existent channel.

---

### Milestone 4: Mail Configuration

> **Goal:** Full mail settings management — general settings (including layout/styling), per-type configuration with language-aware text overrides, and preview rendering. Access Azure Table Storage directly.

**Figma screens:**

- `Channel - edit - mails` (node `99:21317`)
- `Channel - edit - mails - general` (node `175:4240`)
- `Channel - edit - mails - layout settings` (node `179:6151`)
- `Sheet - configure mail` (node `184:6761`)
- `Sheet - preview mail` (node `188:4756`)

**Data store:** Azure Table Storage (direct access via `Geins.MgmtApi.Util.Table`)

#### Legacy Mail Service Reference

Source: `carismar-mail` repo. Azure Functions v3 app (in-process, `Carismar.Mail.FunctionApp`).

**Azure Table Storage structure:**

| Table                           | PartitionKey                    | RowKey                            | Purpose                                                          |
| ------------------------------- | ------------------------------- | --------------------------------- | ---------------------------------------------------------------- |
| `MailSettings`                  | Environment (e.g. `production`) | Customer (e.g. `shop.example.se`) | Single flat entity with ALL mail config per customer-environment |
| `MailBlobLogReferences{yyyyMM}` | (monthly tables)                | —                                 | Tracks rendered mail output blobs for audit logging              |

The `MailSettings` entity is a **single `TableEntity`** (one row per customer-environment combination) with all settings as flat properties — there are no separate per-mail-type config rows. Properties:

- **General:** `FromEmailAddress`, `DisplayName`, `Locale`, `Disabled` (bool — master toggle that already exists), `ExternalSourceVerificationTag`
- **Per-customer SMTP overrides:** `SmtpHost`, `SmtpPort`, `SmtpUser`, `SmtpPassword` — falls back to global app settings (`Settings` class) if empty
- **Layout/styling (flat properties on `MailSettings`, not a separate entity):**
  - Colors: `BackgroundColor` (#333333), `BodyColor` (#FFFFFF), `SecondBodyColor` (#EEEEEE), `HeaderColor` (#FFFFFF), `FooterColor` (#EEEEEE), `FooterTextColor` (#000000), `TextColor` (#000000), `SaleTextColor` (#C80000), `NotIncludedTextColor` (#C80000), `PreviouslyShippedTextColor` (#009e00), `BackOrderedTextColor` (#e87f00), `ButtonColor` (#333333), `ButtonTextColor` (#FFFFFF)
  - Typography: `FontLink` (Google Fonts URL), `FontFamily` (Open Sans), `FontSizeSmall` (13px), `FontSizeMedium` (15px), `FontSizeLarge` (18px), `LineHeight` (20px)
  - Shape/images: `BorderRadius` (5px), `LogoUri` (relative path), `HeaderImgUri` (relative path), `ProdImgSize` (180w)
- **Order-specific:** `ShowBrand`, `ProductParameters`, `OrderConfirmationBCCEmail`, `EmailReplyToCustomer`, `HideArticleNumber`, `OrderConfirmationExternalSource`
- **Customer-specific:** `LoginUrl`, `PasswordResetUrl`
- **Text overrides:** `Texts` — a JSON string containing `Dictionary<string, Dictionary<string, string>>` where outer key = text key (WITHOUT `MAIL_V2_` prefix, e.g. `ORDER_CONFIRM_TITLE`), inner key = 2-letter language code (e.g. `sv`, `da`), value = override text. Falls back to embedded `.resx` resources when no override exists.

**Text/localization system:**

- Embedded `.resx` resource files for 5 languages: English (default), Swedish (`sv`), Finnish (`fi`), Danish (`da`), Norwegian (`nn`)
- All text keys prefixed with `MAIL_V2_` in resource files (stripped when checking overrides)
- Locale resolution chain: explicit locale param → `MailSettings.Locale` → parsed from shop URL domain → parsed from customer name
- Placeholder substitution: `{placeholderKey}` tokens in text values replaced with runtime values from `PlaceholderValues` dictionary

**Template rendering:**

- Uses **RazorLight** engine with embedded `.cshtml` templates
- Templates can be **overridden via Blob Storage** (`override` container) — `CombinedBlobAndEmbeddedProject` checks blob first, falls back to embedded
- Templates per category: `Mail/Order/Order.cshtml`, `Mail/Customer/Customer.cshtml`, `Mail/Customer/Credentials.cshtml`, `Mail/Product/Product.cshtml`, `Mail/Generic/GenericMail.cshtml`
- Shared layout: `Mail/MailLayout.cshtml`

**Architecture pattern (per mail type — 3 Azure Functions each):**

1. `{Type}Preview` — HTTP POST → calls `Generate{Type}()` → returns rendered HTML as `ContentResult`
2. `{Type}` — HTTP POST → enqueues `MailRequestModel<T>` to Azure Storage Queue
3. `{Type}Worker` — QueueTrigger → reads `MailSettings` via Table binding `[Table("MailSettings", "{Environment}", "{Customer}")]` → calls `Send{Type}()` → sends email via MailKit

Preview endpoints receive the same `MailRequestModel<T>` payload as send endpoints. They fetch real data from the legacy mgmt API via Service Broker (`_brokerClient.GetManagementApiClient`), render with Razor, and return HTML. The "dummy values" concern (Decision #15) is about the **mgmt API endpoints** that supply data models (e.g. order details at `Mail/{endpoint}/{id}`), not the mail service itself.

**All mail types (15 total):**

| Category     | Mail Type                   | Payload                               | Queue                         |
| ------------ | --------------------------- | ------------------------------------- | ----------------------------- |
| **Order**    | OrderConfirmation           | `OrderModel` (OrderId, PublicOrderId) | `orderconfirmation`           |
| **Order**    | OrderProcessing             | `int` (parcelId)                      | `orderprocessing`             |
| **Order**    | OrderDelivered              | `int` (parcelId)                      | `orderdelivered`              |
| **Order**    | OrderCancelled              | `int` (orderId)                       | `ordercancelled`              |
| **Order**    | OrderRowRemoved             | `int` (orderId)                       | `orderrowremoved`             |
| **Order**    | OrderRowReturned            | `int` (returnId)                      | `orderrowreturned`            |
| **Customer** | CustomerWishlist            | `CustomerWishlistModel`               | `customerwishlist`            |
| **Customer** | CustomerRefunded            | `CustomerRefundedModel`               | `customerrefunded`            |
| **Customer** | CustomerRegistered          | `CustomerRegisteredModel`             | `customerregistered`          |
| **Customer** | CustomerUnregistered        | `CustomerUnregisteredModel`           | `customerunregistered`        |
| **Customer** | CustomerMessageNotification | `CustomerMessageNotificationModel`    | `customermessagenotification` |
| **Customer** | CustomerPasswordReset       | `CustomerPasswordResetModel`          | `customerpasswordreset`       |
| **Product**  | ProductTellAFriend          | `ProductTellAFriendModel`             | `producttellafriend`          |
| **Product**  | ProductSizeAvailable        | `ProductSizeAvailableModel`           | `productsizeavailable`        |
| **Product**  | ProductMonitorNotification  | `ProductMonitorNotificationModel`     | `productmonitornotification`  |

#### What Self Service Needs to Expose

The self-service UI manages a subset of these settings. The `MailSettings` entity's flat structure means "general settings", "layout", and "text overrides" are all properties on the same Table Storage row.

**New endpoints:**

| Endpoint            | Method | Route                                                                       | Description                                                                                                                                     |
| ------------------- | ------ | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| GetMailSettings     | GET    | `/account/channel/{channelId}/mail/setting`                                 | All mail settings: general (from, display name, SMTP overrides, disabled flag) and layout/styling (colors, fonts, images)                       |
| UpdateMailSettings  | PUT    | `/account/channel/{channelId}/mail/setting`                                 | Update mail settings (multipart/form-data: settings JSON + optional file uploads for LogoUri/HeaderImgUri)                                      |
| ListMailTypes       | GET    | `/account/channel/{channelId}/mail/type/list`                               | List all 15 mail types with all text keys, default values, and override status per language                                                     |
| GetMailTypeTexts    | GET    | `/account/channel/{channelId}/mail/type/{mailType}`                         | All text keys for a mail type with default values and override status per language                                                              |
| UpdateMailTypeTexts | PATCH  | `/account/channel/{channelId}/mail/type/{mailType}`                         | Update text overrides for a mail type. Omitted/null texts are left untouched; providing an empty string reverts that text to its default value. |
| PreviewMail         | POST   | `/account/channel/{channelId}/mail/type/{mailType}/preview?language={lang}` | Proxy to legacy mail service preview endpoint (POST, not GET)                                                                                   |

**Tasks:**

1. **Infrastructure setup** — add `Geins.MgmtApi.Util.Table` dependency to Account service; register new services/repositories in `Program.cs`
2. **Repository & channel-to-customer mapping**
   - 2a. Create `MailConfigRepository` for Azure Table Storage — reads/writes the `MailSettings` entity (PartitionKey=environment, RowKey=customer identifier)
   - 2b. Map channel ID → customer/environment identifiers (needed to look up the correct `MailSettings` row)
3. **Request/response models & mail type enum**
   - 3a. Request models: `UpdateMailSettingsRequest` (general + SMTP + layout/styling), `UpdateMailTypeTextsRequest` (text overrides per language)
   - 3b. Response models: `MailSettingsResponse` (general + layout combined), `MailTypeInfo` (type name, category, all text keys with default values and override status per language), `MailTypeTexts` (text key → language → {default value, override value, isOverridden flag}), `MailPreviewResponse`
   - 3c. Mail type enum with all **15** types (6 order + 6 customer + 3 product)
4. **Text override logic**
   - 4a. Read/write: parse/serialize the `Texts` JSON property on `MailSettings` — structure is `Dictionary<string, Dictionary<string, string>>` (text key without `MAIL_V2_` prefix → 2-letter language code → override value). Providing an empty string for a text key removes the override, reverting to the default value.
5. **Legacy Mail service text-key endpoints** — Two new endpoints must be created in the legacy Mail service (`carismar-mail`):
   - 5a. **GetMailTypeTextKeys** — returns all text keys with their default values for a given mail type + language. Accepts a `skipOverrides` query parameter (bool).
   - 5b. **GetAllMailTypeTextKeys** — returns all text keys with their default values for all mail types + language. Accepts a `skipOverrides` query parameter (bool).
   - 5c. `GetMailTypeTexts` and `ListMailTypes` in the Account service call these legacy endpoints with `skipOverrides=true` (getting raw defaults), then apply overrides from the `MailSettings.Texts` JSON themselves. This allows the Account service to distinguish which texts have been overridden vs which are using defaults.
6. **Mail preview proxy** — POST proxy to legacy mail service preview endpoint via Service Broker (or direct HTTP). Preview already renders HTML from real data — the Account service acts as a proxy.
   - 6a. **Default preview mode (reference ID = 0):** When the reference ID is `0` (or missing), the mail service must generate a **dummy model** instead of fetching real data from the legacy mgmtapi. This applies to all 15 preview endpoints:
     - **Order previews** (OrderConfirmation, OrderProcessing, OrderDelivered, OrderCancelled, OrderRowRemoved, OrderRowReturned): generate a dummy `MailV2OrderModel` with plausible fake data — sample order rows, formatted prices, placeholder addresses ("Jane Doe, 123 Example Street…"), a realistic order date, tracking link, etc.
     - **Customer previews** (Wishlist, Refunded, Registered, Unregistered, MessageNotification, PasswordReset): generate a dummy `MailV2Model` / `MailV2CredentialsModel` with placeholder recipient, site name/URL, and any model-specific fields (e.g. wishlist URL, refund amount).
     - **Product previews** (TellAFriend, SizeAvailable, MonitorNotification): generate a dummy `MailV2ProductModel` with a placeholder product name, brand, price, and image URL.
   - 6b. **Implementation in `Carismar.Mail` service** (`D:\source\repos\carismar-mail\`): Each service class (`OrderService`, `CustomerService`, `ProductService`) needs a factory method (e.g., `CreateDummyOrderModel(MailSettings, string language)`) that builds a fully populated model using context-appropriate placeholder strings (respecting the requested language) and standard text placeholder tokens (e.g., `{name}`, `{orderid}`). The existing `GenerateX()` methods should branch: if reference ID == 0 → call the dummy factory; otherwise → call the legacy mgmtapi as today.
   - 6c. **Dummy data guidelines:** Use plausible, obviously-fake values — e.g., Order #10001, "Acme Store", product "Example T-Shirt", price "$49.99", 2–3 order rows with varied quantities. Dates should be relative to `DateTime.UtcNow`. Text fields that normally come from .resx or text overrides should still go through the normal text-resolution pipeline so the preview accurately reflects configured overrides.
7. **File upload handling** for `LogoUri` / `HeaderImgUri` — `UpdateMailSettings` accepts `multipart/form-data`; file upload field names must match a property in the settings model (e.g., `LogoUri`). Uploaded files go to customer blob storage with static names. Blob URL written to matching field. Return 400 if field name doesn't match a setting property. Max file size validation only.
   - 7a. **Mail service change** — Update URL resolution in the legacy mail service (`carismar-mail`) to accept absolute URLs for `LogoUri`/`HeaderImgUri` in addition to current relative-to-shop-URL format
8. **Unit tests**
9. **Integration tests** — repository tests (`MailConfigRepositoryIntegrationTests`): read/write `MailSettings` entity via Azurite Table Storage; test layout property persistence, text override JSON round-trips, empty-string-reverts-to-default behavior. Service tests (`MailConfigServiceIntegrationTests`): get→update→get round-trip, text override set-then-clear lifecycle, list all 15 mail types with override status. E2E tests (`MailConfigE2ETests`): full HTTP endpoint tests — get defaults → update general settings → update layout → override texts → verify via GET. File upload test: upload logo via multipart → verify blob URL written to settings via Azurite Blob Storage.

---

### Milestone 5: Storefront Settings

> **Goal:** Manage storefront configuration per channel — mode (Commerce/Catalogue), access requirements, and layout — stored in Cosmos DB. Two endpoints: one for schema, one for values. Auto-fallback to customer-agnostic defaults.

**Figma screens:**

- `Channel - edit - storefront settings - commerce` (node `115:12835`)
- `Channel - edit - storefront settings - catalogue` (node `191:5002`)
- `Channel - edit - storefront settings - layout` (node `132:4185`)

**Data store:** Cosmos DB `Settings` container

**Cosmos document structure** (proposed — final defaults from frontend team):

```json
{
  "id": "storefront-settings-{channelId}",
  "channelId": 123,
  "account": "merchant-account-key",
  "mode": "Commerce",
  "accessRequirements": {
    "enabled": true,
    "priceVisibility": true,
    "orderPlacement": true,
    "stockStatus": false
  },
  "layout": {
    "logoUrl": "https://...",
    "cornerStyle": "Round",
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "themeColors": {
      "primary": "#171717",
      "secondary": "#737373",
      "accent": "#..."
    }
  }
}
```

**New endpoints:**

| Endpoint                       | Method | Route                                                     | Description                                                                                                           |
| ------------------------------ | ------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| GetStorefrontSchema            | GET    | `/account/channel/{channelId}/storefront/settings/schema` | Get the settings schema (field definitions, allowed values)                                                           |
| GetStorefrontSettings          | GET    | `/account/channel/{channelId}/storefront/settings`        | Get setting values (falls back to default doc if merchant-specific not found)                                         |
| UpdateStorefrontSettings       | PUT    | `/account/channel/{channelId}/storefront/settings`        | Update storefront settings (multipart/form-data: settings JSON + optional file uploads for image fields like logoUrl) |
| UpdateStorefrontSettingsSchema | PUT    | `/account/channel/{channelId}/storefront/settings/schema` | Update the settings schema                                                                                            |

**Tasks:**

1. **Cosmos repository & DI setup** — extend Cosmos DB `Settings` container access; new `StorefrontSettingsRepository` using Cosmos SDK; register in `Program.cs`
2. **Default-document fallback & schema endpoint**
   - 2a. Implement default-document fallback: if merchant-specific doc not found, return customer-agnostic default
   - 2b. Schema endpoint returning field definitions and allowed values
3. **Request & response models** — `UpdateStorefrontSettingsRequest`, `StorefrontSettings`, `StorefrontSchema`
4. **Validation** — valid JSON only (no schema-level validation of field values)
5. **File upload handling** — `UpdateStorefrontSettings` endpoint accepts `multipart/form-data`; file upload field names must match a property in the settings document (e.g., `logoUrl`). Uploaded files go to customer blob storage with static names. Blob URL written to matching field. Return 400 if field name doesn't match a settings property. Max file size validation only.
6. **Unit tests**
7. **Integration tests** — repository tests (`StorefrontSettingsRepositoryIntegrationTests`): save→get round-trip against Cosmos emulator; test default-document fallback when merchant doc not found; schema persistence. Service tests (`StorefrontSettingsServiceIntegrationTests`): get with no merchant doc → returns defaults; update → get reflects changes; file upload stores blob URL in Cosmos. E2E tests (`StorefrontE2ETests`): full HTTP endpoint tests — get defaults → update mode → update layout → upload logo → verify final state in Cosmos.

---

### Milestone 6: Event Handling & Background Processing

> **Goal:** Implement event publishing and consumption for channel/market activation changes. This is intentionally last — it involves heavy background work (Cosmos product doc creation/deletion/update) and cross-service coordination.

**Figma screens:** None (backend-only)

**Tasks:**

1. **Event Grid publishing** — publish events on channel and market activate/deactivate
2. **Activation restrictions** — enforce lockout timer, confirmation, or combination to prevent free toggling
3. **Event handlers in AccountProvisioning & Databridge**
   - 3a. AccountProvisioning: channel deactivation → delete all product docs from Cosmos for that channel
   - 3b. AccountProvisioning / Databridge: channel activation → construct and insert all product docs into Cosmos for that channel
   - 3c. Databridge: market activation/deactivation → partial-update all product docs for affected market
4. **Channel URL backend processing** — host binding changes, external validation, status reporting (needs further research)
5. **Integration tests** for event flow — event publishing tests (`EventPublishingIntegrationTests`): verify events published on channel/market activate/deactivate using in-memory event collector (mock `IEventGridPublisher`). Activation restriction tests (`ActivationRestrictionIntegrationTests`): activate → immediate deactivate rejected; wait lockout → deactivate allowed. E2E tests (`EventE2ETests`): activate channel via HTTP → verify event shape captured by mock consumer; full market activation flow.

---

## Cross-Cutting Concerns

### File Uploads (Mail Settings & Storefront Settings)

Both Mail settings (M4) and Storefront settings (M5) support file uploads. No separate upload endpoints or file/image gallery — uploads are handled inline on the existing settings endpoints.

**Convention:**

- Settings endpoints (`UpdateMailSettings`, `UpdateStorefrontSettings`) accept `multipart/form-data` containing both the settings JSON model and optional file uploads
- Each file upload's form-data field name **must match** a property name in the corresponding settings model (e.g., a file upload named `LogoUri` maps to the `LogoUri` field in the mail layout settings)
- The API uploads the file to the customer's own Blob Storage container using a **static blob name** derived from the form-data field name (deterministic, overwrites on re-upload)
- The resulting blob URL is written into the settings field that matches the file upload name
- **Bad Request (400)** is returned if a file upload's field name does not match any property in the settings model
- Only **limited validation** is performed: max file size check. No image processing, format conversion, or resizing
- Future: a file/image gallery is out of scope for this project

**Mail service change required:**

- `LogoUri` and `HeaderImgUri` in `MailSettings` currently expect URLs **relative to the shop URL**. The mail service's URL resolution must be updated to also accept **absolute URLs** (i.e., full blob storage URLs). This allows the self-service API to store absolute blob URLs directly in these fields.

### Authorization / ACL

- New ACL entities may be needed: `Channel:Write`, `Market:Write`, `MailConfig:Read/Write`, `StorefrontSettings:Read/Write`
- Or extend existing `Channel` entity permissions

### Backward Compatibility

- Existing read-only channel/market endpoints must continue to work unchanged
- `tblMarket` is a new definition table; channel-market assignments write directly to existing `tblSiteCountry` — fully backward-compatible with all legacy consumers
- No migration or fallback logic needed — `tblSiteCountry` remains the single source of truth for market assignments

### Testing

#### Unit Tests

- Unit tests for all new service methods and validators (Moq + Shouldly)
- Unit tests for Cosmos document mapping and fallback logic
- Unit tests for text override parsing/serialization logic

#### Integration Tests (following `Geins.Workflow.Test` patterns)

Three test layers, matching Workflow's architecture:

| Layer      | Location            | Dependencies                | Description                                    |
| ---------- | ------------------- | --------------------------- | ---------------------------------------------- |
| Repository | `Integration/Data/` | Real SQL / Cosmos / Azurite | CRUD round-trips against emulated data stores  |
| Service    | `Integration/Api/`  | Real services via DI host   | Business logic with real persistence           |
| E2E        | `Integration/E2E/`  | Full func host process      | HTTP endpoint tests spanning multiple requests |

**Emulated infrastructure:**

- **SQL Server** — Testcontainers.MsSql or LocalDB; two databases (Account + Legacy Customer)
- **Cosmos DB** — Emulator on `localhost:8081`; `Settings` container for storefront settings (M5)
- **Azure Table Storage** — Azurite; `MailSettings` table for mail config (M4)
- **Azure Blob Storage** — Azurite; file uploads for mail layout images and storefront logos (M4, M5)
- **Event Grid** — In-memory event collector for event publishing verification (M6)

**Test isolation:**

- All data partitioned by test account key (Cosmos: `/account` partition; SQL: test-specific rows)
- `[TestCleanup]` calls `ResetDataAsync()` to clear test data between tests
- `[AssemblyInitialize]` creates emulators once; `[AssemblyCleanup]` tears down
- Tests marked `[TestCategory("Integration")]` or `[TestCategory("E2E")]` — can be filtered in CI

**Auth bypass:**

- `E2E_NO_AUTH` compile directive disables JWT validation
- `E2EFakeIdentityMiddleware` injects SuperAdmin claims from `x-account-key` header
- Build with `dotnet test -p:E2ENoAuth=true --filter "TestCategory=E2E"`

---

## Files to Create/Modify (Estimated)

### New Files

- `~15 SQL scripts` (channel CRUD, market DDL, market CRUD, payment read)
- `~7 request models` (create/update channel, market, mail settings, mail texts, storefront)
- `~9 response models` (channel detail, market definition, channel market, payment, mail settings, mail types, mail texts, storefront)
- `~5 repository classes` (channel write, market definition, channel market, payment, storefront settings, mail config)
- `~3-5 service classes` (extend existing + new: PaymentService, MailConfigService, StorefrontSettingsService)
- `~3 Functions files` (extend/split existing, new: PaymentFunctions, MailConfigFunctions, StorefrontFunctions)
- `~1 Cosmos settings record` (StorefrontSettings container config)
- `~1 error titles extension` (new domain-specific errors)
- `~5+ unit test files`
- `~1 test project` (`Geins.Account.Test` with `Unit/` and `Integration/` structure)
- `~4 test fixtures` (`SqlDbFixture`, `CosmosDbFixture`, `AzuriteFixture`, `FuncHostFixture`)
- `~1 assembly-level fixture` (`IntegrationTestFixture`)
- `~3 fluent test builders` (`TestChannelBuilder`, `TestMarketBuilder`, `TestAccountBuilder`)
- `~6 repository integration test classes` (one per milestone)
- `~6 service integration test classes` (one per milestone)
- `~6 E2E test classes` (one per milestone)
- `~1 test schema directory` with legacy table DDL + seed scripts
- `~1 test.settings.json`

### Modified Files

- `AccountFunctions.cs` or split into feature-specific Functions files
- `ChannelService.cs` / `IChannelService.cs` — add write methods
- `MarketService.cs` / `IMarketService.cs` — add write methods, new market model
- `LegacySiteRepository.cs` / `ILegacySiteRepository.cs` — add write operations
- `Program.cs` — register new services, repositories, settings, Table Storage; add `E2E_NO_AUTH` conditional auth support
- `Geins.Account.csproj` — new embedded SQL resources, `Geins.MgmtApi.Util.Table` ref, `E2ENoAuth` compile constant
- `Core/ErrorTitles.cs` — new error constants
- `Core/AccountServiceLog.cs` — new log methods

---

## Dependencies & Risks

| Risk                                                     | Impact                                                                                                                            | Mitigation                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Channel/market activation triggers massive Cosmos writes | **High** — can degrade system performance                                                                                         | Enforce lockout timer / confirmation; defer to Milestone 6                       |
| Legacy SQL write operations on production tables         | **High** — data integrity risk                                                                                                    | Thorough testing, consider feature flags                                         |
| Default Cosmos docs not yet provided (Frontend team)     | **Blocks** Milestone 5 schema/values                                                                                              | Start with proposed structure, adapt when docs arrive                            |
| Mail text override flag format TBD                       | **Resolved** — legacy already uses `MailSettings.Texts` JSON                                                                      | No longer blocking                                                               |
| Channel ID → customer/environment mapping                | **Medium** — `MailSettings` uses customer domain + environment as keys, not channel IDs                                           | Research mapping early in M4; may need lookup table or convention                |
| Channel URL host-binding changes                         | **Unknown scope** — deferred research                                                                                             | Set the value in M1; backend processing in M6                                    |
| File upload infrastructure                               | **Resolved** — inline on settings endpoints via multipart/form-data; files to customer blob storage with static names; no gallery | Decision #16                                                                     |
| ACL entity additions                                     | Requires auth service coordination                                                                                                | Coordinate ACL seed data early                                                   |
| Docker required for SQL integration tests                | **Medium** — Testcontainers.MsSql needs Docker Desktop                                                                            | Support LocalDB fallback for dev machines without Docker; CI runners have Docker |
| Cosmos DB Emulator availability                          | **Low** — required for M5 integration tests                                                                                       | Tests gracefully skip with `Assert.Inconclusive` when emulator unavailable       |
| Legacy table DDL maintenance                             | **Medium** — test schema scripts must stay in sync with production schema                                                         | Keep test DDL minimal (only columns referenced by Account service SQL scripts)   |

---

## Suggested Linear Project Structure

**Project:** `Self Service Backend`

### Labels

| Label                | Usage                                          |
| -------------------- | ---------------------------------------------- |
| `feature:channel`    | Channel CRUD, language management              |
| `feature:market`     | Market definitions, channel-market assignments |
| `feature:payment`    | Payment read endpoints                         |
| `feature:mail`       | Mail settings, types, layout, preview          |
| `feature:storefront` | Storefront settings (Cosmos)                   |
| `feature:events`     | Event publishing & background processing       |
| `infra`              | Cross-cutting (Blob uploads, ACL, DI)          |
| `testing`            | Integration test infrastructure, fixtures, E2E |
| `blocked`            | Waiting on external input (docs, research)     |
| `backend`            | All backend issues                             |
| `legacy-service`     | Changes needed in legacy mail service          |

### Milestones → Linear Sub-Projects or Cycles

| Linear Milestone             | Issues (suggested breakdown)                                                                                                                                                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **M0 — Test Infra**          | `test-project-setup` · `sql-fixture` · `legacy-ddl-scripts` · `cosmos-fixture` · `azurite-fixture` · `integration-fixture` · `func-host-fixture` · `e2e-auth-bypass` · `test-builders` · `infra-smoke-test`                       |
| **M1 — Channel CRUD**        | `channel-sql-scripts` · `channel-models` · `channel-service-repo` · `channel-endpoints` · `channel-validation` · `channel-unit-tests` · `channel-integration-tests`                                                               |
| **M2 — Market Management**   | `market-ddl-and-seed` · `market-models` · `market-service-repo` · `market-endpoints` · `market-activation-events` · `market-validation` · `market-unit-tests` · `market-integration-tests`                                        |
| **M3 — Payments**            | `payment-sql-and-repo` · `payment-service-and-model` · `payment-endpoint` · `payment-unit-tests` · `payment-integration-tests`                                                                                                    |
| **M4 — Mail Config**         | `mail-infra-setup` · `mail-repo-and-mapping` · `mail-models-and-enum` · `mail-text-override-logic` · `mail-legacy-text-key-endpoints` · `mail-preview-proxy` · `mail-file-uploads` · `mail-unit-tests` · `mail-integration-tests` |
| **M5 — Storefront**          | `storefront-cosmos-repo-and-di` · `storefront-fallback-and-schema` · `storefront-models` · `storefront-validation` · `storefront-file-uploads` · `storefront-unit-tests` · `storefront-integration-tests`                         |
| **M6 — Events & Background** | `event-grid-publishing` · `activation-restrictions` · `event-handlers-provisioning-databridge` · `channel-url-host-bindings` · `event-integration-tests`                                                                          |
