import type {
  StorefrontSchema,
  StorefrontSettings,
  SchemaField,
} from '#shared/types';

/**
 * Walks every field in every section of every tab and collects `default` values
 * into a flat settings object. Used when creating a new channel or resetting to defaults.
 */
export function getDefaultSettings(
  schema: StorefrontSchema,
): StorefrontSettings {
  const settings: StorefrontSettings = {};

  function collectDefaults(fields: SchemaField[]) {
    for (const field of fields) {
      if (field.default !== undefined) {
        settings[field.key] = field.default;
      }
      if (field.children) {
        collectDefaults(field.children);
      }
    }
  }

  for (const tab of Object.values(schema)) {
    for (const section of tab.sections) {
      collectDefaults(section.fields);
    }
  }

  return settings;
}

/** Read a flat dot-notation key from the settings object */
export function getSettingValue(
  settings: StorefrontSettings,
  key: string,
): unknown {
  return settings[key];
}

/** Immutable update — returns a new settings object with the key set to value */
export function setSettingValue(
  settings: StorefrontSettings,
  key: string,
  value: unknown,
): StorefrontSettings {
  return { ...settings, [key]: value };
}
