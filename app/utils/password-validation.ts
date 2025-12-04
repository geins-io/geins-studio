import * as z from 'zod';

/**
 * Configuration options for password validation
 */
export interface PasswordValidationConfig {
  minLength?: number;
  requireUppercase?: boolean;
  requireNumber?: boolean;
  requireSpecialChar?: boolean;
}

/**
 * Default password validation configuration
 */
export const DEFAULT_PASSWORD_CONFIG: PasswordValidationConfig = {
  minLength: 8,
  requireUppercase: true,
  requireNumber: true,
  requireSpecialChar: false,
};

/**
 * Creates a Zod schema for password validation with custom rules
 * @param t - i18n translation function
 * @param config - Optional configuration to override defaults
 * @returns Zod string schema with validation rules
 */
export function createPasswordSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  config: PasswordValidationConfig = DEFAULT_PASSWORD_CONFIG,
) {
  const { minLength, requireUppercase, requireNumber, requireSpecialChar } = {
    ...DEFAULT_PASSWORD_CONFIG,
    ...config,
  };

  let schema = z.string();

  // Add minimum length validation
  if (minLength && minLength > 0) {
    schema = schema.refine((val) => val.length >= minLength, {
      message: t('auth.password_min_length', { length: minLength }),
    });
  }

  // Add uppercase letter validation
  if (requireUppercase) {
    schema = schema.refine((val) => /[A-Z]/.test(val), {
      message: t('auth.password_uppercase_required'),
    });
  }

  // Add number validation
  if (requireNumber) {
    schema = schema.refine((val) => /[0-9]/.test(val), {
      message: t('auth.password_number_required'),
    });
  }

  // Add special character validation
  if (requireSpecialChar) {
    schema = schema.refine((val) => /[!@#$%^&*(),.?":{}|<>]/.test(val), {
      message: t('auth.password_special_char_required'),
    });
  }

  return schema;
}

/**
 * Creates a password change validation schema with current and new password fields
 * @param t - i18n translation function
 * @param config - Optional configuration to override defaults
 * @returns Zod object schema for password change form
 */
export function createPasswordChangeSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  config: PasswordValidationConfig = DEFAULT_PASSWORD_CONFIG,
) {
  const passwordSchema = createPasswordSchema(t, config);

  return z
    .object({
      currentPassword: z.string().optional(),
      newPassword: z.string().optional(),
      confirmNewPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        // If any password field is filled, all must be filled
        const anyFilled = data.newPassword || data.confirmNewPassword;
        if (!anyFilled) return true;
        return !!data.currentPassword;
      },
      {
        message: t('form.field_required'),
        path: ['currentPassword'],
      },
    )
    .refine(
      (data) => {
        // If confirm is filled, new password must be filled
        if (!data.newPassword && !data.confirmNewPassword) return true;
        return !!data.newPassword;
      },
      {
        message: t('form.field_required'),
        path: ['newPassword'],
      },
    )
    .refine(
      (data) => {
        // Validate new password against rules if provided
        if (!data.newPassword) return true;
        const result = passwordSchema.safeParse(data.newPassword);
        return result.success;
      },
      {
        error: (issue) => {
          // Get the actual password validation error
          const testData = issue.input as {
            newPassword?: string;
            currentPassword?: string;
            confirmNewPassword?: string;
          };
          if (!testData.newPassword) return '';
          const result = passwordSchema.safeParse(testData.newPassword);
          return result.success ? '' : result.error.issues[0]?.message || '';
        },
        path: ['newPassword'],
      },
    )
    .refine(
      (data) => {
        // If new password is filled, confirm must be filled
        if (!data.newPassword && !data.confirmNewPassword) return true;
        return !!data.confirmNewPassword;
      },
      {
        message: t('form.field_required'),
        path: ['confirmNewPassword'],
      },
    )
    .refine(
      (data) => {
        // Passwords must match if both are provided
        if (!data.newPassword || !data.confirmNewPassword) return true;
        return data.newPassword === data.confirmNewPassword;
      },
      {
        message: t('auth.passwords_must_match'),
        path: ['confirmNewPassword'],
      },
    );
}

/**
 * Creates a password reset validation schema (new password + confirmation)
 * @param t - i18n translation function
 * @param config - Optional configuration to override defaults
 * @returns Zod object schema for password reset form
 */
export function createPasswordResetSchema(
  t: (key: string, params?: Record<string, unknown>) => string,
  config: PasswordValidationConfig = DEFAULT_PASSWORD_CONFIG,
) {
  const passwordSchema = createPasswordSchema(t, config);

  return z
    .object({
      newPassword: passwordSchema,
      passwordRepeat: passwordSchema,
    })
    .refine((data) => data.newPassword === data.passwordRepeat, {
      message: t('auth.passwords_not_matching'),
      path: ['passwordRepeat'],
    });
}
