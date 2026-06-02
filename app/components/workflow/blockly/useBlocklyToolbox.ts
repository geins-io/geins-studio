import type { ManifestExpressionFunction } from '#shared/types';
import { BESPOKE_FUNCTION_NAMES } from './useBlocklyParser';

interface ToolboxBlock {
  kind: 'block';
  type: string;
}
interface ToolboxCategory {
  kind: 'category';
  name: string;
  categorystyle: string;
  contents: ToolboxBlock[];
}

/** Manifest category → toolbox categorystyle (mirrors useBlocklyTheme). */
function categoryStyleFor(category: string): string {
  const c = category.toLowerCase();
  const known = [
    'data',
    'logic',
    'math',
    'array',
    'string',
    'datetime',
    'conversion',
    'object',
  ];
  return known.includes(c) ? `${c}_category` : 'other_category';
}

/**
 * Groups manifest functions NOT covered by a bespoke block into
 * `ncalc_fn_<Name>` toolbox blocks keyed by their category name.
 */
function genericBlocksByCategory(
  functions: ManifestExpressionFunction[],
): Map<string, ToolboxBlock[]> {
  const groups = new Map<string, ToolboxBlock[]>();
  for (const fn of functions) {
    if (!fn?.name) continue;
    const aliases = fn.aliases ?? [];
    if (
      BESPOKE_FUNCTION_NAMES.has(fn.name) ||
      aliases.some((a) => BESPOKE_FUNCTION_NAMES.has(a))
    )
      continue;
    const category = fn.category || 'Other';
    const list = groups.get(category) ?? [];
    list.push({ kind: 'block', type: `ncalc_fn_${fn.name}` });
    groups.set(category, list);
  }
  return groups;
}

export function buildToolbox(
  expressionFunctions: ManifestExpressionFunction[] = [],
) {
  const toolbox = {
    kind: 'categoryToolbox',
    contents: [
      {
        kind: 'category',
        name: 'Data',
        categorystyle: 'data_category',
        contents: [
          { kind: 'block', type: 'ncalc_output_ref' },
          { kind: 'block', type: 'ncalc_input_ref' },
          { kind: 'block', type: 'ncalc_vars_ref' },
          { kind: 'block', type: 'ncalc_iterator_ref' },
          { kind: 'block', type: 'ncalc_data_ref' },
        ],
      },
      {
        kind: 'category',
        name: 'Logic',
        categorystyle: 'logic_category',
        contents: [
          { kind: 'block', type: 'ncalc_if' },
          { kind: 'block', type: 'ncalc_comparison' },
          { kind: 'block', type: 'ncalc_logic_op' },
          { kind: 'block', type: 'ncalc_not' },
          { kind: 'block', type: 'ncalc_is_empty' },
          { kind: 'block', type: 'ncalc_is_null' },
          { kind: 'block', type: 'ncalc_boolean_literal' },
        ],
      },
      {
        kind: 'category',
        name: 'Math',
        categorystyle: 'math_category',
        contents: [
          { kind: 'block', type: 'ncalc_number_literal' },
          { kind: 'block', type: 'ncalc_math_binary' },
          { kind: 'block', type: 'ncalc_round' },
          { kind: 'block', type: 'ncalc_math_unary' },
          { kind: 'block', type: 'ncalc_min_max' },
          { kind: 'block', type: 'ncalc_pow' },
        ],
      },
      {
        kind: 'category',
        name: 'String',
        categorystyle: 'string_category',
        contents: [
          { kind: 'block', type: 'ncalc_string_literal' },
          { kind: 'block', type: 'ncalc_len' },
          { kind: 'block', type: 'ncalc_concat' },
          { kind: 'block', type: 'ncalc_replace' },
          { kind: 'block', type: 'ncalc_contains' },
          { kind: 'block', type: 'ncalc_starts_ends' },
          { kind: 'block', type: 'ncalc_case' },
          { kind: 'block', type: 'ncalc_substring' },
          { kind: 'block', type: 'ncalc_base64' },
        ],
      },
      {
        kind: 'category',
        name: 'Array',
        categorystyle: 'array_category',
        contents: [
          { kind: 'block', type: 'ncalc_filter' },
          { kind: 'block', type: 'ncalc_map_extract' },
          { kind: 'block', type: 'ncalc_sum' },
          { kind: 'block', type: 'ncalc_count' },
          { kind: 'block', type: 'ncalc_first_last' },
          { kind: 'block', type: 'ncalc_join' },
          { kind: 'block', type: 'ncalc_sort' },
          { kind: 'block', type: 'ncalc_sort_by' },
          { kind: 'block', type: 'ncalc_groupby' },
          { kind: 'block', type: 'ncalc_lookup' },
          { kind: 'block', type: 'ncalc_lookup_closest' },
          { kind: 'block', type: 'ncalc_any_all' },
          { kind: 'block', type: 'ncalc_union_except' },
        ],
      },
      {
        kind: 'category',
        name: 'DateTime',
        categorystyle: 'datetime_category',
        contents: [
          { kind: 'block', type: 'ncalc_now' },
          { kind: 'block', type: 'ncalc_today' },
          { kind: 'block', type: 'ncalc_format_date' },
          { kind: 'block', type: 'ncalc_add_time' },
          { kind: 'block', type: 'ncalc_date_diff' },
          { kind: 'block', type: 'ncalc_date_part' },
        ],
      },
      {
        kind: 'category',
        name: 'Conversion',
        categorystyle: 'conversion_category',
        contents: [
          { kind: 'block', type: 'ncalc_to_int' },
          { kind: 'block', type: 'ncalc_to_string' },
          { kind: 'block', type: 'ncalc_to_string_fmt' },
        ],
      },
      {
        kind: 'category',
        name: 'Other',
        categorystyle: 'other_category',
        contents: [
          { kind: 'block', type: 'ncalc_coalesce' },
          { kind: 'block', type: 'ncalc_json_path' },
          { kind: 'block', type: 'ncalc_new_guid' },
          { kind: 'block', type: 'ncalc_null_literal' },
          { kind: 'block', type: 'ncalc_raw_expression' },
        ],
      },
    ] as ToolboxCategory[],
  };

  // Merge manifest-driven generic functions into their category. Append to an
  // existing category when the name matches; otherwise insert a new category
  // (e.g. "Object") just before "Other".
  const groups = genericBlocksByCategory(expressionFunctions);
  for (const [category, blocks] of groups) {
    const existing = toolbox.contents.find((c) => c.name === category);
    if (existing) {
      existing.contents.push(...blocks);
      continue;
    }
    const newCategory: ToolboxCategory = {
      kind: 'category',
      name: category,
      categorystyle: categoryStyleFor(category),
      contents: blocks,
    };
    const otherIndex = toolbox.contents.findIndex((c) => c.name === 'Other');
    if (otherIndex === -1) toolbox.contents.push(newCategory);
    else toolbox.contents.splice(otherIndex, 0, newCategory);
  }

  return toolbox;
}
