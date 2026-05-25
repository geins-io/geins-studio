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

// Application settings - Development defaults
param geinsApiUrl = ''
param geinsDebug = 'true'
param logLevel = 'debug'
