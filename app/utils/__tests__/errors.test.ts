// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  getErrorStatus,
  getFallbackErrorMessage,
  getErrorType,
} from '../errors';

describe('getErrorMessage', () => {
  it('returns the string when error is a non-empty string', () => {
    expect(getErrorMessage('something went wrong')).toBe(
      'something went wrong',
    );
  });

  it('returns message property from Error instance', () => {
    expect(getErrorMessage(new Error('test error'))).toBe('test error');
  });

  it('returns message property from plain object', () => {
    expect(getErrorMessage({ message: 'obj message' })).toBe('obj message');
  });

  it('returns error property when no message property exists', () => {
    expect(getErrorMessage({ error: 'error prop' })).toBe('error prop');
  });

  it('prefers message over error property', () => {
    expect(getErrorMessage({ message: 'msg', error: 'err' })).toBe('msg');
  });

  it('JSON-stringifies numbers', () => {
    expect(getErrorMessage(42)).toBe('42');
  });

  it('JSON-stringifies null', () => {
    expect(getErrorMessage(null)).toBe('null');
  });

  it('JSON-stringifies false', () => {
    expect(getErrorMessage(false)).toBe('false');
  });

  it('JSON-stringifies objects without message or error props', () => {
    expect(getErrorMessage({ code: 500 })).toBe('{"code":500}');
  });

  it('JSON-stringifies empty string (falsy, bypasses string check)', () => {
    expect(getErrorMessage('')).toBe('""');
  });
});

describe('getErrorStatus', () => {
  it('extracts status from object with status property', () => {
    expect(getErrorStatus({ status: 404 })).toBe(404);
  });

  it('extracts statusCode from object', () => {
    expect(getErrorStatus({ statusCode: 500 })).toBe(500);
  });

  it('extracts code from object', () => {
    expect(getErrorStatus({ code: 403 })).toBe(403);
  });

  it('extracts status from nested response object', () => {
    expect(getErrorStatus({ response: { status: 502 } })).toBe(502);
  });

  it('prefers status over statusCode and code', () => {
    expect(getErrorStatus({ status: 400, statusCode: 500, code: 403 })).toBe(
      400,
    );
  });

  it('returns the number directly when error is a number', () => {
    expect(getErrorStatus(401)).toBe(401);
  });

  it('parses JSON string to extract status', () => {
    expect(getErrorStatus(JSON.stringify({ status: 429 }))).toBe(429);
  });

  it('returns 0 for null', () => {
    expect(getErrorStatus(null)).toBe(0);
  });

  it('returns 0 for undefined', () => {
    expect(getErrorStatus(undefined)).toBe(0);
  });

  it('returns 0 for object without status-like properties', () => {
    expect(getErrorStatus({ message: 'error' })).toBe(0);
  });

  it('returns 0 for empty object', () => {
    expect(getErrorStatus({})).toBe(0);
  });
});

describe('getFallbackErrorMessage', () => {
  it('returns server message from data.message', () => {
    expect(getFallbackErrorMessage(500, { message: 'DB down' })).toBe(
      'DB down',
    );
  });

  it('returns server message from data.error', () => {
    expect(getFallbackErrorMessage(500, { error: 'Custom error' })).toBe(
      'Custom error',
    );
  });

  it('prefers data.message over data.error', () => {
    expect(
      getFallbackErrorMessage(500, { message: 'msg', error: 'err' }),
    ).toBe('msg');
  });

  it('ignores non-string message values in data', () => {
    expect(getFallbackErrorMessage(404, { message: 123 })).toBe(
      'Resource not found',
    );
  });

  it.each([
    [400, 'Bad request'],
    [401, 'Authentication required'],
    [403, 'Insufficient permissions'],
    [404, 'Resource not found'],
    [408, 'Request timeout'],
    [409, 'Resource conflict'],
    [429, 'Too many requests'],
    [500, 'Server error'],
    [502, 'Bad gateway'],
    [503, 'Service unavailable'],
    [504, 'Gateway timeout'],
  ])('returns "%s" for status %i', (status, expected) => {
    expect(getFallbackErrorMessage(status, null)).toBe(expected);
  });

  it('returns "Unknown error" for unmapped status codes', () => {
    expect(getFallbackErrorMessage(418, null)).toBe('Unknown error');
  });
});

describe('getErrorType', () => {
  it('returns AUTH_ERROR for 401', () => {
    expect(getErrorType(401)).toBe('AUTH_ERROR');
  });

  it('returns PERMISSION_ERROR for 403', () => {
    expect(getErrorType(403)).toBe('PERMISSION_ERROR');
  });

  it('returns NOT_FOUND_ERROR for 404', () => {
    expect(getErrorType(404)).toBe('NOT_FOUND_ERROR');
  });

  it('returns RATE_LIMIT_ERROR for 429', () => {
    expect(getErrorType(429)).toBe('RATE_LIMIT_ERROR');
  });

  it('returns SERVER_ERROR for 500', () => {
    expect(getErrorType(500)).toBe('SERVER_ERROR');
  });

  it('returns SERVER_ERROR for 502', () => {
    expect(getErrorType(502)).toBe('SERVER_ERROR');
  });

  it('returns SERVER_ERROR for 503', () => {
    expect(getErrorType(503)).toBe('SERVER_ERROR');
  });

  it('returns API_ERROR for 400 (client error fallback)', () => {
    expect(getErrorType(400)).toBe('API_ERROR');
  });

  it('returns API_ERROR for 422', () => {
    expect(getErrorType(422)).toBe('API_ERROR');
  });
});
