# Password Validation Utilities

This module provides reusable password validation schemas for consistent password requirements across the application.

## Overview

The password validation utilities are located in `/app/utils/password-validation.ts` and provide three main functions for creating Zod validation schemas:

1. **`createPasswordSchema`** - Basic password validation
2. **`createPasswordChangeSchema`** - Password change form (current + new + confirm)
3. **`createPasswordResetSchema`** - Password reset form (new + confirm)

## Configuration

All functions accept an optional configuration object:

```typescript
interface PasswordValidationConfig {
  minLength?: number; // Default: 8
  requireUppercase?: boolean; // Default: true
  requireNumber?: boolean; // Default: true
  requireSpecialChar?: boolean; // Default: false
}
```

## Usage Examples

### Basic Password Schema

For validating a single password field:

```typescript
import { createPasswordSchema } from '@/utils/password-validation';

const { t } = useI18n();

const formSchema = toTypedSchema(
  z.object({
    password: createPasswordSchema(t),
  }),
);
```

### Password Change Schema

For user profile pages where users change their password:

```typescript
import { createPasswordChangeSchema } from '@/utils/password-validation';

const { t } = useI18n();

const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      // ... other fields
    }),
    password: createPasswordChangeSchema(t),
  }),
);
```

This creates a schema with three fields:

- `currentPassword` (required when changing password)
- `newPassword` (required when changing password, validated against rules)
- `confirmNewPassword` (required when changing password, must match newPassword)

### Password Reset Schema

For password reset flows:

```typescript
import { createPasswordResetSchema } from '@/utils/password-validation';

const { t } = useI18n();

const formSchema = toTypedSchema(createPasswordResetSchema(t));
```

This creates a schema with two fields:

- `newPassword` (required, validated against rules)
- `passwordRepeat` (required, must match newPassword)

### Custom Configuration

Override default password requirements:

```typescript
const formSchema = toTypedSchema(
  createPasswordResetSchema(t, {
    minLength: 12,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: true,
  }),
);
```

## Default Password Requirements

By default, passwords must:

- Be at least 8 characters long
- Contain at least one uppercase letter (A-Z)
- Contain at least one number (0-9)

## Translation Keys Required

The validation functions use the following i18n translation keys:

```json
{
  "auth.password_min_length": "Password must be at least {length} characters",
  "auth.password_uppercase_required": "Password must contain at least one uppercase letter",
  "auth.password_number_required": "Password must contain at least one number",
  "auth.password_special_char_required": "Password must contain at least one special character",
  "auth.passwords_must_match": "Passwords must match",
  "auth.passwords_not_matching": "Passwords do not match",
  "form.field_required": "This field is required"
}
```

## Implementation Examples

### Profile Page

See: `/app/pages/account/profile/index.vue`

```typescript
import { createPasswordChangeSchema } from '@/utils/password-validation';

const formSchema = toTypedSchema(
  z.object({
    details: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.email().min(1),
    }),
    password: createPasswordChangeSchema(t),
  }),
);
```

### Auth Form (Password Reset)

See: `/app/components/auth/AuthForm.vue`

```typescript
import { createPasswordResetSchema } from '@/utils/password-validation';

if (resetPasswordMode.value) {
  return toTypedSchema(createPasswordResetSchema(t));
}
```

## Benefits

- **Consistency**: Same password rules across all forms
- **Maintainability**: Update rules in one place
- **Flexibility**: Easy to customize per use case
- **Type Safety**: Full TypeScript support
- **i18n Ready**: Supports internationalized error messages
