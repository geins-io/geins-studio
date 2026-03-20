import { vi } from 'vitest';
import type { RouteLocationNormalized } from 'vue-router';

export function createNavigateToMock() {
  const navigateTo = vi.fn();
  return { navigateTo };
}

export function createRouteMock(overrides?: Partial<RouteLocationNormalized>) {
  const route = {
    params: {},
    query: {},
    path: '/',
    name: 'index',
    fullPath: '/',
    hash: '',
    matched: [],
    redirectedFrom: undefined,
    meta: {},
    ...overrides,
  };
  return { route };
}

export function createOnBeforeRouteLeaveMock() {
  const onBeforeRouteLeave = vi.fn();
  return { onBeforeRouteLeave };
}
