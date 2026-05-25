// =============================================================================
// GEINS STUDIO - Staging Environment Parameters
// =============================================================================
using '../main.bicep'

// Environment configuration
param environment = 'staging'
param location = 'westeurope'
param appName = 'studio'

// Container image (set at deployment time via GitHub Actions)
param containerImage = 'ghcr.io/geins-io/geins-studio:main'

// GitHub Container Registry credentials (set via GitHub Actions)
param ghcrUsername = ''
param ghcrToken = ''

// Application settings - Staging configuration
param geinsApiUrl = ''
param geinsDebug = 'false'
param logLevel = 'info'
