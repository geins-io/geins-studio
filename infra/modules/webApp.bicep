// =============================================================================
// GEINS STUDIO - Web App Module
// =============================================================================
// Creates a Linux Web App configured for container deployment from GHCR.
// Includes managed identity, health checks, and application settings.
//
// App settings use a merge strategy: Bicep-managed settings always win,
// but manually-added settings in the Azure portal are preserved.
// =============================================================================

// -----------------------------------------------------------------------------
// Parameters
// -----------------------------------------------------------------------------

@description('Name of the Web App')
param name string

@description('Azure region for the resource')
param location string

@description('App Service Plan resource ID')
param appServicePlanId string

@description('Container image to deploy')
param containerImage string

@description('GitHub Container Registry username')
@secure()
param ghcrUsername string

@description('GitHub Container Registry token')
@secure()
param ghcrToken string

@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Resource tags')
param tags object = {}

// Application settings
@description('Geins API URL')
param geinsApiUrl string

@description('NextAuth secret')
@secure()
param authSecret string

@description('Base URL of the application')
param baseUrl string

@description('Auth server function path')
param authPath string = ''

@description('Enable debug mode')
param geinsDebug string = 'false'

@description('Sales Portal webhook secret (STU-216 hotfix)')
@secure()
param salesPortalWebhookSecret string = ''

@description('Log level')
param logLevel string

// Monitoring settings
@description('Application Insights connection string')
param appInsightsConnectionString string = ''

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string = ''

// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

var registryServer = 'ghcr.io'

var nodeEnv = environment == 'prod' ? 'production' : environment == 'staging' ? 'production' : 'development'

// Bicep-managed app settings (object form for union/merge)
var managedSettings = {
  // Container Registry
  DOCKER_REGISTRY_SERVER_URL: 'https://${registryServer}'
  DOCKER_REGISTRY_SERVER_USERNAME: ghcrUsername
  DOCKER_REGISTRY_SERVER_PASSWORD: ghcrToken
  // Azure Web App
  WEBSITES_ENABLE_APP_SERVICE_STORAGE: 'false'
  WEBSITES_PORT: '3000'
  WEBSITES_CONTAINER_START_TIME_LIMIT: '600'
  // Nitro/Nuxt server binding
  NITRO_HOST: '0.0.0.0'
  NITRO_PORT: '3000'
  NODE_ENV: nodeEnv
  // Nuxt runtime config overrides
  GEINS_API_URL: geinsApiUrl
  NUXT_PUBLIC_API_URL: geinsApiUrl
  NUXT_PRIVATE_AUTH_SECRET: authSecret
  BASE_URL: baseUrl
  AUTH_ORIGIN: baseUrl
  AUTH_PATH: authPath
  GEINS_DEBUG: geinsDebug
  SALES_PORTAL_WEBHOOK_SECRET: salesPortalWebhookSecret
  LOG_LEVEL: logLevel
  // Application Insights
  APPLICATIONINSIGHTS_CONNECTION_STRING: appInsightsConnectionString
  APPINSIGHTS_INSTRUMENTATIONKEY: appInsightsInstrumentationKey
  ApplicationInsightsAgent_EXTENSION_VERSION: '~0'
}

// Staging slot overrides (NODE_ENV and GEINS_DEBUG are always production/false)
var managedSettingsStaging = union(managedSettings, {
  NODE_ENV: 'production'
  GEINS_DEBUG: 'false'
})

// -----------------------------------------------------------------------------
// Resources
// -----------------------------------------------------------------------------

resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: name
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: environment != 'dev'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/api/health'
    }
  }
}

// Merge existing app settings with Bicep-managed ones (preserves portal-set vars)
resource appSettings 'Microsoft.Web/sites/config@2023-12-01' = {
  parent: webApp
  name: 'appsettings'
  properties: union(
    list('${webApp.id}/config/appsettings', '2023-12-01').properties,
    managedSettings
  )
}

// Staging slot for prod environment (blue-green deployment)
resource stagingSlot 'Microsoft.Web/sites/slots@2023-12-01' = if (environment == 'prod') {
  parent: webApp
  name: 'staging'
  location: location
  tags: tags
  kind: 'app,linux,container'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: appServicePlanId
    httpsOnly: true
    clientAffinityEnabled: false
    siteConfig: {
      linuxFxVersion: 'DOCKER|${containerImage}'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      healthCheckPath: '/api/health'
    }
  }
}

// Merge existing staging slot settings with Bicep-managed ones
resource stagingSlotSettings 'Microsoft.Web/sites/slots/config@2023-12-01' = if (environment == 'prod') {
  parent: stagingSlot
  name: 'appsettings'
  properties: union(environment == 'prod' ? list('${webApp.id}/slots/staging/config/appsettings', '2023-12-01').properties : {}, managedSettingsStaging)
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------

@description('Web App resource ID')
output id string = webApp.id

@description('Web App name')
output name string = webApp.name

@description('Web App default hostname')
output defaultHostname string = webApp.properties.defaultHostName

@description('Web App Managed Identity Principal ID')
output principalId string = webApp.identity.principalId
