import * as z from 'zod';

const emailSchema = z.email();

/**
 * Creates a Zod schema for a comma-separated list of email addresses.
 * Whitespace around each address is ignored; an empty string means no addresses.
 * @param message - Error message shown when any address is invalid
 * @returns Zod string schema that validates every address in the list
 */
export function createEmailListSchema(message: string) {
  return z
    .string()
    .refine(
      (value) =>
        value.trim() === '' ||
        value
          .split(',')
          .every((email) => emailSchema.safeParse(email.trim()).success),
      { message },
    );
}
