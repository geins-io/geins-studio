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

// Application settings - Production configuration
param geinsApiUrl = ''
param geinsDebug = 'false'
param logLevel = 'warn'
