# Environment Variables Reference

This document is the **single source of truth** for all environment variables and secrets used in the Geins Studio application.

## Quick Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        WHERE TO SET VARIABLES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LOCAL DEVELOPMENT        → .env file (copy from .env.example)             │
│                                                                             │
│   GITHUB SECRETS           → Repository Settings → Secrets → Actions       │
│   (sensitive values)         Used during CI/CD, passed to Bicep             │
│                                                                             │
│   GITHUB VARIABLES         → Repository Settings → Variables → Actions     │
│   (non-sensitive config)     Used during CI/CD, passed to Bicep             │
│                                                                             │
│   AZURE APP SERVICE        → DO NOT SET MANUALLY!                           │
│                              Bicep templates set these automatically        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## GitHub Secrets (Required)

> **Location:** Repository → Settings → Secrets and variables → Actions → Secrets

These are **sensitive values** that must be kept secret. They are encrypted by GitHub.

| Secret                  | Required | Description                       | How to Get             |
| ----------------------- | :------: | --------------------------------- | ---------------------- |
| `AZURE_CLIENT_ID`       |    ✅    | Service Principal App (Client) ID | Run `pnpm infra:setup` |
| `AZURE_TENANT_ID`       |    ✅    | Azure AD Tenant ID                | Run `pnpm infra:setup` |
| `AZURE_SUBSCRIPTION_ID` |    ✅    | Target Azure Subscription ID      | Run `pnpm infra:setup` |
| `AUTH_SECRET`            |    ✅    | NextAuth.js secret key            | Generate with openssl  |
| `GEINS_API_URL`          |    ✅    | Geins Management API URL          | Geins admin portal     |

### Notes on Secrets

- **AZURE\_\*** secrets are created by running `pnpm infra:setup` - the script outputs the values
- **AUTH_SECRET** can be generated with `openssl rand -base64 32`

---

## GitHub Variables (Optional)

> **Location:** Repository → Settings → Secrets and variables → Actions → Variables

These are **non-sensitive configuration values** visible in the repository settings.

| Variable     | Default   | Description              | Options                                    |
| ------------ | --------- | ------------------------ | ------------------------------------------ |
| `BASE_URL`   | _(empty)_ | Application base URL     | Any valid URL                              |
| `AUTH_PATH`  | _(empty)_ | Auth server function path| Custom auth path                           |
| `GEINS_DEBUG`| `false`   | Enable debug mode        | `true`, `false`                            |
| `LOG_LEVEL`  | `info`    | Server log verbosity     | `debug`, `info`, `warn`, `error`, `silent` |

### Notes on Variables

- All variables have sensible defaults - only set if you need to override
- The deploy workflow passes these to Bicep, which sets them in Azure

---

## Azure App Service Settings

> ⚠️ **DO NOT SET THESE MANUALLY** - They are configured automatically by the Bicep deployment.

The `deploy.yml` workflow passes GitHub variables to Bicep, which sets these in Azure App Service:

| Azure App Setting              | Source                       | Maps to nuxt.config.ts                |
| ------------------------------ | ---------------------------- | ------------------------------------- |
| `NODE_ENV`                     | Set by Bicep per environment | `process.env.NODE_ENV`                |
| `GEINS_API_URL`                | `secrets.GEINS_API_URL`      | `runtimeConfig.public.apiUrl`         |
| `AUTH_SECRET`                  | `secrets.AUTH_SECRET`        | `runtimeConfig.private.authSecret`    |
| `BASE_URL`                     | `vars.BASE_URL`              | `runtimeConfig.public.baseUrl`        |
| `AUTH_PATH`                    | `vars.AUTH_PATH`             | Auth server function path             |
| `GEINS_DEBUG`                  | `vars.GEINS_DEBUG`           | `runtimeConfig.public.debug`          |
| `SALES_PORTAL_WEBHOOK_SECRET`  | `secrets.*`                  | `runtimeConfig.private.*` (STU-216)   |
| `NITRO_HOST`                   | Hardcoded `0.0.0.0`         | Required for Azure containers         |
| `NITRO_PORT`                   | Hardcoded `3000`             | Container port                        |
| `WEBSITES_PORT`                | Hardcoded `3000`             | Azure port mapping                    |

---

## Build-Time vs Runtime Variables

| Variable      | Build-Time | Runtime | Where to Set               |
| ------------- | :--------: | :-----: | -------------------------- |
| `GEINS_API_URL`|    ❌     |   ✅    | GitHub Secrets → Azure     |
| `AUTH_SECRET`  |    ❌     |   ✅    | GitHub Secrets → Azure     |
| `BASE_URL`     |    ❌     |   ✅    | GitHub Variables → Azure   |
| `GEINS_DEBUG`  |    ❌     |   ✅    | GitHub Variables → Azure   |

**Build-time** = Used during `docker build` in GitHub Actions
**Runtime** = Used when the app runs in Azure

---

## Environment-Specific Configuration

You can set different values per GitHub Environment (dev, staging, prod):

> **Location:** Repository → Settings → Environments → [environment name] → Environment secrets/variables

### Required Production Secrets

| Environment | `AUTH_SECRET` | `GEINS_API_URL` | Notes          |
| ----------- | :-----------: | :--------------: | -------------- |
| prod        |      ✅       |       ✅         | Production API |

---

## Complete Setup Checklist

### 1. Azure Setup (One-time)

```bash
# Creates resource groups, service principal, and federated credentials
pnpm infra:setup
```

Copy the output values for the next step.

### 2. GitHub Secrets (Required)

- [ ] `AZURE_CLIENT_ID` - From setup script output
- [ ] `AZURE_TENANT_ID` - From setup script output
- [ ] `AZURE_SUBSCRIPTION_ID` - From setup script output
- [ ] `AUTH_SECRET` - Generated NextAuth secret
- [ ] `GEINS_API_URL` - Geins Management API URL

### 3. GitHub Variables (Optional)

- [ ] `BASE_URL` - If different from Azure default hostname
- [ ] `AUTH_PATH` - If using custom auth path
- [ ] `GEINS_DEBUG` - Set to `true` for debugging
- [ ] `LOG_LEVEL` - Adjust as needed

### 4. GitHub Environments

- [ ] Create `prod` environment (with required reviewers)
- [ ] Create `prod-swap` environment (with required reviewers)

---

## Verification

After deploying, verify your configuration is correct:

```bash
# Check Azure app settings
az webapp config appsettings list \
  --resource-group rg-studio-prod \
  --name studio-prod-app \
  --output table
```

---

## Troubleshooting

### Variables not working in Azure?

1. **Restart the app** - Azure may cache old environment values
2. **Check the Bicep output** - Ensure deploy workflow completed successfully
3. **View app settings** - Use `az webapp config appsettings list` to see actual values

### Values showing defaults instead of Azure values?

1. Check GitHub Variables/Secrets are set correctly
2. Re-run the deploy workflow
3. Verify the Bicep deployment succeeded
