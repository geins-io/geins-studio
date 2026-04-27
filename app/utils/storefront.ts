import type {
  StorefrontSchema,
  StorefrontSettings,
  SchemaField,
} from '#shared/types';

/**
 * Settings are stored as a nested object. Field `key` values are deep
 * dot-notation paths (e.g. `theme.colors.buttonBackground`).
 */

/** Walk every field and materialize defaults into a nested settings object. */
export function getDefaultSettings(
  schema: StorefrontSchema,
): StorefrontSettings {
  let settings: StorefrontSettings = {};

  function collectDefaults(fields: SchemaField[]) {
    for (const field of fields) {
      if (field.default !== undefined) {
        settings = setSettingValue(settings, field.key, field.default);
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

export function gridClass(cols: number, gap = 'gap-6'): string | undefined {
  if (cols <= 1) return undefined;
  return `${gridClassMap[cols]} ${gap}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}

/** Read a deep dot-notation path. Returns `undefined` on any missing segment. */
export function getSettingValue(
  settings: StorefrontSettings,
  key: string,
): unknown {
  const segments = key.split('.');
  let current: unknown = settings;
  for (const segment of segments) {
    if (!isPlainObject(current)) return undefined;
    current = current[segment];
  }
  return current;
}

/** Immutable deep set — clones along the path, leaves untouched branches shared. */
export function setSettingValue(
  settings: StorefrontSettings,
  key: string,
  value: unknown,
): StorefrontSettings {
  const segments = key.split('.');
  const root: Record<string, unknown> = { ...settings };
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i++) {
    const segment = segments[i]!;
    const existing = cursor[segment];
    const next = isPlainObject(existing) ? { ...existing } : {};
    cursor[segment] = next;
    cursor = next;
  }
  cursor[segments[segments.length - 1]!] = value;
  return root;
}
