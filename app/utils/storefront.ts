import type {
  SchemaApplyOptions,
  SchemaChangeAnalysis,
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

/**
 * Recursively merge two settings objects with right-hand values winning.
 * Plain objects are merged key-by-key; arrays and primitives are replaced as
 * leaves. Used to backfill schema defaults under partial API responses.
 */
export function deepMerge(
  base: StorefrontSettings,
  override: StorefrontSettings,
): StorefrontSettings {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const baseValue = result[key];
    const overrideValue = override[key];
    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMerge(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  }
  return result;
}

/** Every field that holds a value. Sub-sections only group, so they're skipped. */
function collectValueFields(schema: StorefrontSchema): SchemaFormField[] {
  const result: SchemaFormField[] = [];
  function walk(fields: SchemaFormField[]) {
    for (const field of fields) {
      if (field.type === 'sub-section') walk(field.children ?? []);
      else result.push(field);
    }
  }
  for (const tab of Object.values(schema)) {
    for (const section of tab.sections) walk(section.fields);
  }
  return result;
}

function isOption(options: { value: string }[] | undefined, value: unknown) {
  return (
    typeof value === 'string' &&
    (!options?.length || options.some((o) => o.value === value))
  );
}

/** Whether a stored value can still be rendered and edited by `field`. */
export function isValueValidForField(
  field: SchemaFormField,
  value: unknown,
): boolean {
  switch (field.type) {
    case 'string':
    case 'textarea':
    case 'color':
    case 'font':
    case 'image':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && Number.isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'select':
    case 'radio':
    case 'radio-cards':
      return isOption(field.options, value);
    case 'boolean-choice': {
      if (!isPlainObject(value)) return false;
      if (value.enabled !== undefined && typeof value.enabled !== 'boolean') {
        return false;
      }
      const choiceValue = field.choice ? value[field.choice.key] : undefined;
      return (
        choiceValue === undefined ||
        isOption(field.choice?.options, choiceValue)
      );
    }
    default:
      return true;
  }
}

/** Signature of what a field accepts — two fields with the same one hold the same values. */
function fieldShape(field: SchemaFormField): string {
  return JSON.stringify([
    field.type,
    field.options?.map((o) => o.value) ?? [],
    field.choice?.key ?? null,
    field.choice?.options.map((o) => o.value) ?? [],
  ]);
}

/**
 * Compares a schema edit against the current settings. Only fields that are
 * new or whose type/options changed are looked at, so untouched fields keep
 * whatever they hold. Orphans are settings no field in `next` covers — a
 * field key covers its whole subtree (e.g. a `boolean-choice` object).
 */
export function analyzeSchemaChange(
  previous: StorefrontSchema,
  next: StorefrontSchema,
  current: StorefrontSettings,
): SchemaChangeAnalysis {
  const previousShapes = new Map(
    collectValueFields(previous).map((f) => [f.key, fieldShape(f)]),
  );
  const analysis: SchemaChangeAnalysis = {
    added: [],
    typeReset: [],
    orphaned: [],
  };

  const fieldKeys = new Set<string>();
  const ancestorKeys = new Set<string>();
  for (const field of collectValueFields(next)) {
    fieldKeys.add(field.key);
    const segments = field.key.split('.');
    for (let i = 1; i < segments.length; i++) {
      ancestorKeys.add(segments.slice(0, i).join('.'));
    }

    const previousShape = previousShapes.get(field.key);
    if (previousShape === fieldShape(field)) continue;

    const value = getSettingValue(current, field.key);
    // `null` is how the API reports an unset value, so it counts as missing
    if (value === undefined || value === null) {
      if (previousShape === undefined && field.default !== undefined) {
        analysis.added.push({ key: field.key, value: field.default });
      }
    } else if (!isValueValidForField(field, value)) {
      analysis.typeReset.push({ key: field.key, value });
    }
  }

  function walk(settings: Record<string, unknown>, prefix: string) {
    for (const [segment, value] of Object.entries(settings)) {
      const key = prefix ? `${prefix}.${segment}` : segment;
      if (fieldKeys.has(key)) continue;
      if (isPlainObject(value) && Object.keys(value).length > 0) {
        walk(value, key);
      } else if (!ancestorKeys.has(key) || !isPlainObject(value)) {
        analysis.orphaned.push({ key, value });
      }
    }
  }
  walk(current, '');

  return analysis;
}

/**
 * Settings to use after replacing `previous` with `next`. `reset` replaces
 * everything with the defaults of `next`. `changes` touches only what the
 * edit changed: new fields get their default, values that no longer fit a
 * changed field fall back to its default (or are removed without one), and
 * settings without a field are kept unless `removeOrphans` is set.
 */
export function applySchemaChange(
  previous: StorefrontSchema,
  next: StorefrontSchema,
  current: StorefrontSettings,
  options: SchemaApplyOptions,
): StorefrontSettings {
  if (options.mode === 'reset') return getDefaultSettings(next);

  const { added, typeReset, orphaned } = analyzeSchemaChange(
    previous,
    next,
    current,
  );
  const defaultsByKey = new Map(
    collectValueFields(next).map((f) => [f.key, f.default]),
  );

  let result = current;
  // Orphans go first: a removed one may be the value blocking a new default.
  if (options.removeOrphans) {
    for (const { key } of orphaned) result = deleteSettingValue(result, key);
  }
  for (const { key, value } of added) {
    if (!isPathBlocked(result, key)) {
      result = setSettingValue(result, key, value);
    }
  }
  for (const { key } of typeReset) {
    const fallback = defaultsByKey.get(key);
    result =
      fallback === undefined
        ? deleteSettingValue(result, key)
        : setSettingValue(result, key, fallback);
  }
  return result;
}

/**
 * Whether an ancestor of `key` holds a non-object value. Writing `key` would
 * then replace that value, so a kept setting would be silently overwritten.
 */
function isPathBlocked(settings: StorefrontSettings, key: string): boolean {
  const segments = key.split('.');
  let current: unknown = settings;
  for (const segment of segments.slice(0, -1)) {
    if (!isPlainObject(current)) return true;
    current = current[segment];
    if (current === undefined) return false;
  }
  return current !== undefined && !isPlainObject(current);
}

/** Immutable deep delete — drops parent objects left empty by the removal. */
export function deleteSettingValue(
  settings: StorefrontSettings,
  key: string,
): StorefrontSettings {
  const [head, ...rest] = key.split('.');
  if (!head || !(head in settings)) return settings;
  const without = () =>
    Object.fromEntries(Object.entries(settings).filter(([k]) => k !== head));
  if (rest.length === 0) return without();
  const child = settings[head];
  if (!isPlainObject(child)) return settings;
  const next = deleteSettingValue(child, rest.join('.'));
  if (next === child) return settings;
  return Object.keys(next).length === 0
    ? without()
    : { ...settings, [head]: next };
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
