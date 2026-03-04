// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  createPasswordSchema,
  createPasswordChangeSchema,
  createPasswordResetSchema,
  DEFAULT_PASSWORD_CONFIG,
} from '../password-validation';

const t = (key: string, _params?: Record<string, unknown>) => key;

describe('DEFAULT_PASSWORD_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_PASSWORD_CONFIG).toEqual({
      minLength: 8,
      requireUppercase: true,
      requireNumber: true,
      requireSpecialChar: false,
    });
  });
});

describe('createPasswordSchema', () => {
  const schema = createPasswordSchema(t);

  it('accepts a valid password with defaults', () => {
    expect(schema.safeParse('Password1').success).toBe(true);
  });

  it('rejects password shorter than min length', () => {
    expect(schema.safeParse('Pass1').success).toBe(false);
  });

  it('rejects password without uppercase letter', () => {
    expect(schema.safeParse('password1').success).toBe(false);
  });

  it('rejects password without number', () => {
    expect(schema.safeParse('Passwordx').success).toBe(false);
  });

  it('does not require special char by default', () => {
    expect(schema.safeParse('Password1').success).toBe(true);
  });

  describe('with special char required', () => {
    const strictSchema = createPasswordSchema(t, {
      requireSpecialChar: true,
    });

    it('rejects password without special char', () => {
      expect(strictSchema.safeParse('Password1').success).toBe(false);
    });

    it('accepts password with special char', () => {
      expect(strictSchema.safeParse('Password1!').success).toBe(true);
    });
  });

  describe('with custom min length', () => {
    const longSchema = createPasswordSchema(t, { minLength: 12 });

    it('rejects password shorter than custom min', () => {
      expect(longSchema.safeParse('Password1').success).toBe(false);
    });

    it('accepts password meeting custom min', () => {
      expect(longSchema.safeParse('Password1234').success).toBe(true);
    });
  });

  describe('with relaxed config', () => {
    const relaxed = createPasswordSchema(t, {
      minLength: 1,
      requireUppercase: false,
      requireNumber: false,
      requireSpecialChar: false,
    });

    it('accepts a single character password', () => {
      expect(relaxed.safeParse('a').success).toBe(true);
    });
  });

  it('passes the correct translation key for min length error', () => {
    const keys: string[] = [];
    const trackingT = (key: string, _params?: Record<string, unknown>) => {
      keys.push(key);
      return key;
    };
    const tracked = createPasswordSchema(trackingT);
    tracked.safeParse('Ab1');
    expect(keys).toContain('auth.password_min_length');
  });
});

describe('createPasswordChangeSchema', () => {
  const schema = createPasswordChangeSchema(t);

  it('accepts empty form (no fields filled)', () => {
    expect(schema.safeParse({}).success).toBe(true);
  });

  it('requires currentPassword when newPassword is provided', () => {
    const result = schema.safeParse({ newPassword: 'NewPass1' });
    expect(result.success).toBe(false);
  });

  it('requires newPassword when confirmNewPassword is provided', () => {
    const result = schema.safeParse({ confirmNewPassword: 'NewPass1' });
    expect(result.success).toBe(false);
  });

  it('requires passwords to match', () => {
    const result = schema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmNewPassword: 'Different1',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid complete password change', () => {
    const result = schema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
      confirmNewPassword: 'NewPass1',
    });
    expect(result.success).toBe(true);
  });

  it('validates new password against password strength rules', () => {
    const result = schema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'weak',
      confirmNewPassword: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('requires confirmNewPassword when newPassword is provided', () => {
    const result = schema.safeParse({
      currentPassword: 'OldPass1',
      newPassword: 'NewPass1',
    });
    expect(result.success).toBe(false);
  });
});

describe('createPasswordResetSchema', () => {
  const schema = createPasswordResetSchema(t);

  it('accepts matching valid passwords', () => {
    const result = schema.safeParse({
      newPassword: 'NewPass1',
      passwordRepeat: 'NewPass1',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-matching passwords', () => {
    const result = schema.safeParse({
      newPassword: 'NewPass1',
      passwordRepeat: 'NewPass2',
    });
    expect(result.success).toBe(false);
  });

  it('validates password strength on newPassword', () => {
    const result = schema.safeParse({
      newPassword: 'weak',
      passwordRepeat: 'weak',
    });
    expect(result.success).toBe(false);
  });

  it('validates password strength on passwordRepeat', () => {
    const result = schema.safeParse({
      newPassword: 'ValidPass1',
      passwordRepeat: 'x',
    });
    expect(result.success).toBe(false);
  });
});
