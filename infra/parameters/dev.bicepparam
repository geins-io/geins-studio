// =============================================================================
// GEINS STUDIO - Development Environment Parameters
// =============================================================================
using '../main.bicep'

// Environment configuration
param environment = 'dev'
param location = 'westeurope'
param appName = 'studio'

// Container image (set at deployment time via GitHub Actions)
param containerImage = 'ghcr.io/geins-io/geins-studio:dev'

// GitHub Container Registry credentials (set via GitHub Actions)
param ghcrUsername = ''
param ghcrToken = ''

// Seals the session cookie (at least 32 characters). Required: export
// NUXT_APP_SECRET before a manual deploy or what-if, or validation fails.
param appSecret = readEnvironmentVariable('NUXT_APP_SECRET', '')

// Application settings - Development defaults
param geinsApiUrl = ''
param geinsDebug = 'true'
param logLevel = 'debug'
