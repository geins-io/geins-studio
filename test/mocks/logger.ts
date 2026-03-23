import { vi } from 'vitest';

export function createLoggerMock() {
  const geinsLog = vi.fn();
  const geinsLogError = vi.fn();
  const geinsLogInfo = vi.fn();
  const geinsLogWarn = vi.fn();
  const logger = { geinsLog, geinsLogError, geinsLogInfo, geinsLogWarn };
  return { logger, useGeinsLog: vi.fn(() => logger) };
}
