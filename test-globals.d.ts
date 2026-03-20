import type * as MockFactories from './test/mocks/index';

declare global {
  var createNavigateToMock: typeof MockFactories.createNavigateToMock;

  var createRouteMock: typeof MockFactories.createRouteMock;

  var createOnBeforeRouteLeaveMock: typeof MockFactories.createOnBeforeRouteLeaveMock;

  var createI18nMock: typeof MockFactories.createI18nMock;

  var createLoggerMock: typeof MockFactories.createLoggerMock;

  var createToastMock: typeof MockFactories.createToastMock;
}

export {};
