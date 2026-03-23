import { config } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import {
  createNavigateToMock,
  createRouteMock,
  createOnBeforeRouteLeaveMock,
  createI18nMock,
  createLoggerMock,
  createToastMock,
  createMockRepository,
} from './mocks';

const i18n = createI18n({});
config.global.plugins = [i18n];

// Expose mock factories as globals so vi.hoisted() blocks can use them
// (vi.hoisted runs before ES imports are resolved, but after setup files)
Object.assign(globalThis, {
  createNavigateToMock,
  createRouteMock,
  createOnBeforeRouteLeaveMock,
  createI18nMock,
  createLoggerMock,
  createToastMock,
  createMockRepository,
});
