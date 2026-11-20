// =============================================================================
// GEINS STUDIO - Production Environment Parameters
// =============================================================================
using '../main.bicep'

// Environment configuration
param environment = 'prod'
param location = 'westeurope'
param appName = 'studio'

// Container image (set at deployment time via GitHub Actions)
param containerImage = 'ghcr.io/geins-io/geins-studio:latest'

// GitHub Container Registry credentials (set via GitHub Actions)
param ghcrUsername = ''
param ghcrToken = ''

// Seals the session cookie (at least 32 characters). Required: export
// NUXT_APP_SECRET before a manual deploy or what-if, or validation fails.
param appSecret = readEnvironmentVariable('NUXT_APP_SECRET', '')

// Application settings - Production configuration
param geinsApiUrl = ''
param geinsDebug = 'false'
param logLevel = 'warn'
