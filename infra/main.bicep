// =============================================================================
// GEINS STUDIO - Main Infrastructure Template
// =============================================================================
// Orchestrates deployment of Azure resources for the Geins Studio application.
// Uses modular Bicep templates for App Service Plan, Web App, and Monitoring.
// =============================================================================

// -----------------------------------------------------------------------------
// Target Scope
// -----------------------------------------------------------------------------
targetScope = 'resourceGroup'

// -----------------------------------------------------------------------------
// Parameters
// -----------------------------------------------------------------------------

@description('Environment name (dev, staging, prod)')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for resources')
param location string = resourceGroup().location

@description('Base name for resources')
param appName string = 'studio'

@description('Container image to deploy (e.g., ghcr.io/org/repo:tag)')
param containerImage string

@description('GitHub Container Registry credentials - username')
@secure()
param ghcrUsername string = ''

@description('GitHub Container Registry credentials - token')
@secure()
param ghcrToken string = ''

// Application configuration
@description('Geins API URL')
param geinsApiUrl string = ''

@description('NextAuth secret')
@secure()
param authSecret string = ''

@description('Base URL of the application')
param baseUrl string = ''

@description('Auth server function path')
param authPath string = ''

@description('Enable debug mode')
param geinsDebug string = 'false'

@description('Sales Portal webhook secret (STU-216 hotfix)')
@secure()
param salesPortalWebhookSecret string = ''

@description('Log level')
param logLevel string = 'info'

// Monitoring configuration
@description('Enable Application Insights monitoring')
param enableMonitoring bool = true

@description('Email addresses for alert notifications (comma-separated)')
param alertEmails array = []

@description('Daily data cap for logging in GB (0 = no cap)')
param logDataCapGb int = 0

@description('Log retention period in days')
param logRetentionDays int = 30

// -----------------------------------------------------------------------------
// Variables
// -----------------------------------------------------------------------------

// Resource naming convention: {appName}-{environment}-{resourceType}
var resourcePrefix = '${appName}-${environment}'

// SKU configuration per environment
var skuConfig = {
  dev: {
    name: 'B1'
    tier: 'Basic'
    capacity: 1
  }
  staging: {
    name: 'S1'
    tier: 'Standard'
    capacity: 1
  }
  prod: {
    name: 'S1'
    tier: 'Standard'
    capacity: 1
  }
}

// Get SKU for current environment
var currentSku = skuConfig[environment]

// Tags for all resources
var tags = {
  Environment: environment
  Application: appName
  ManagedBy: 'Bicep'
  Repository: 'geins-studio'
}

// -----------------------------------------------------------------------------
// Modules
// -----------------------------------------------------------------------------

// App Service Plan
module appServicePlan 'modules/appServicePlan.bicep' = {
  name: '${resourcePrefix}-asp-deployment'
  params: {
    name: '${resourcePrefix}-asp'
    location: location
    skuName: currentSku.name
    skuTier: currentSku.tier
    skuCapacity: currentSku.capacity
    tags: tags
  }
}

// Application Insights & Log Analytics (Monitoring)
module monitoring 'modules/applicationInsights.bicep' = if (enableMonitoring) {
  name: '${resourcePrefix}-monitoring-deployment'
  params: {
    name: '${resourcePrefix}-ai'
    workspaceName: '${resourcePrefix}-logs'
    location: location
    environment: environment
    tags: tags
    dailyCapGb: logDataCapGb > 0 ? logDataCapGb : (environment == 'prod' ? 10 : 1)
    retentionDays: logRetentionDays > 0 ? logRetentionDays : (environment == 'prod' ? 90 : 30)
  }
}

// Web App
module webApp 'modules/webApp.bicep' = {
  name: '${resourcePrefix}-app-deployment'
  params: {
    name: '${resourcePrefix}-app'
    location: location
    appServicePlanId: appServicePlan.outputs.id
    containerImage: containerImage
    ghcrUsername: ghcrUsername
    ghcrToken: ghcrToken
    environment: environment
    tags: tags
    // Application settings
    geinsApiUrl: geinsApiUrl
    authSecret: authSecret
    baseUrl: baseUrl
    authPath: authPath
    geinsDebug: geinsDebug
    salesPortalWebhookSecret: salesPortalWebhookSecret
    logLevel: logLevel
    // Application Insights connection (suppress BCP318 - condition matches module condition)
    #disable-next-line BCP318
    appInsightsConnectionString: enableMonitoring ? monitoring.outputs.connectionString : ''
    #disable-next-line BCP318
    appInsightsInstrumentationKey: enableMonitoring ? monitoring.outputs.instrumentationKey : ''
  }
}

// Alert Rules (only for staging and prod with monitoring enabled)
#disable-next-line BCP318
module alertRules 'modules/alertRules.bicep' = if (enableMonitoring && environment != 'dev') {
  name: '${resourcePrefix}-alerts-deployment'
  params: {
    namePrefix: resourcePrefix
    environment: environment
    tags: tags
    #disable-next-line BCP318
    applicationInsightsId: monitoring.outputs.id
    appServicePlanId: appServicePlan.outputs.id
    alertEmails: alertEmails
  }
}

// -----------------------------------------------------------------------------
// Outputs
// -----------------------------------------------------------------------------

@description('App Service Plan resource ID')
output appServicePlanId string = appServicePlan.outputs.id

@description('App Service Plan name')
output appServicePlanName string = appServicePlan.outputs.name

@description('Web App resource ID')
output webAppId string = webApp.outputs.id

@description('Web App name')
output webAppName string = webApp.outputs.name

@description('Web App default hostname')
output webAppHostname string = webApp.outputs.defaultHostname

@description('Web App URL')
output webAppUrl string = 'https://${webApp.outputs.defaultHostname}'

@description('Web App Managed Identity Principal ID')
output webAppPrincipalId string = webApp.outputs.principalId

// Monitoring Outputs (suppress BCP318 - condition matches module condition)
@description('Application Insights resource ID')
#disable-next-line BCP318
output appInsightsId string = enableMonitoring ? monitoring.outputs.id : ''

@description('Application Insights name')
#disable-next-line BCP318
output appInsightsName string = enableMonitoring ? monitoring.outputs.name : ''

@description('Application Insights connection string')
#disable-next-line BCP318
output appInsightsConnectionString string = enableMonitoring ? monitoring.outputs.connectionString : ''

@description('Log Analytics workspace ID')
#disable-next-line BCP318
output logAnalyticsWorkspaceId string = enableMonitoring ? monitoring.outputs.workspaceId : ''

@description('Log Analytics workspace name')
#disable-next-line BCP318
output logAnalyticsWorkspaceName string = enableMonitoring ? monitoring.outputs.workspaceNameOutput : ''
