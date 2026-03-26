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

/**
 * Groups consecutive fields with the same `columns` value into layout rows.
 * Fields without `columns` (or columns: 1) are placed in their own row.
 * Sub-sections use `columns` for internal layout, not parent grid placement.
 */
export function groupFieldsIntoRows(
  fields: SchemaField[],
): { columns: number; fields: SchemaField[] }[] {
  const rows: { columns: number; fields: SchemaField[] }[] = [];

  for (const field of fields) {
    const cols = field.type === 'sub-section' ? 1 : (field.columns ?? 1);
    const lastRow = rows[rows.length - 1];

    if (lastRow && lastRow.columns === cols && cols > 1) {
      lastRow.fields.push(field);
    } else {
      rows.push({ columns: cols, fields: [field] });
    }
  }

  return rows;
}

/** Static grid class map — avoids dynamic Tailwind class generation */
const gridClassMap: Record<number, string> = {
  2: 'grid grid-cols-2',
  3: 'grid grid-cols-3',
  4: 'grid grid-cols-4',
};

export function gridClass(cols: number, gap = 'gap-4'): string | undefined {
  if (cols <= 1) return undefined;
  return `${gridClassMap[cols]} ${gap}`;
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
