import type {
  StorefrontSchema,
  StorefrontSettings,
  SchemaFormField,
} from '#shared/types';
import { getContrastWarning } from '#shared/utils/contrast';

/**
 * Settings are stored as a nested object. Field `key` values are deep
 * dot-notation paths (e.g. `theme.colors.buttonBackground`).
 */

/** Walk every field and materialize defaults into a nested settings object. */
export function getDefaultSettings(
  schema: StorefrontSchema,
): StorefrontSettings {
  let settings: StorefrontSettings = {};

  function collectDefaults(fields: SchemaFormField[]) {
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
  fields: SchemaFormField[],
): { columns: number; fields: SchemaFormField[] }[] {
  const rows: { columns: number; fields: SchemaFormField[] }[] = [];

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

const gridClassMap: Record<number, string> = {
  2: 'grid grid-cols-2',
  3: 'grid grid-cols-3',
  4: 'grid grid-cols-4',
};

export function gridClass(cols: number, sub = false): string | undefined {
  if (cols <= 1) return undefined;
  return `${gridClassMap[cols]} ${sub ? '@max-2xl/schema:grid-cols-1' : '@max-xl/schema:grid-cols-1'} gap-x-6 gap-y-2`;
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

/**
 * Inspects a sub-section's children for a `role: 'background'` + `role: 'foreground'`
 * color pair and computes contrast against the current settings. Returns a map keyed
 * by failing field keys with the failing ratio. Empty map when no pair, invalid hex,
 * or ratio passes WCAG AA.
 */
export function getSubSectionContrastWarnings(
  field: SchemaFormField,
  settings: StorefrontSettings,
): Record<string, number> {
  if (field.type !== 'sub-section' || !field.children) return {};

  const bg = field.children.find(
    (c) => c.type === 'color' && c.role === 'background',
  );
  const fg = field.children.find(
    (c) => c.type === 'color' && c.role === 'foreground',
  );
  if (!bg || !fg) return {};

  const bgHex = getSettingValue(settings, bg.key) as string | undefined;
  const fgHex = getSettingValue(settings, fg.key) as string | undefined;
  if (!bgHex || !fgHex) return {};

  const warning = getContrastWarning(bgHex, fgHex);
  if (!warning) return {};

  return { [bg.key]: warning.ratio, [fg.key]: warning.ratio };
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
