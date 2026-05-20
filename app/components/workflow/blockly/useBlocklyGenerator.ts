// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useBlocklyGenerator(Blockly: any) {
  const ORDER_ATOMIC = 0;
  const ORDER_FUNCTION_CALL = 1;
  const ORDER_UNARY = 2;
  const ORDER_MULTIPLICATIVE = 3;
  const ORDER_ADDITIVE = 4;
  const ORDER_COMPARISON = 5;
  const ORDER_LOGICAL_AND = 6;
  const ORDER_LOGICAL_OR = 7;
  const ORDER_NONE = 99;

  const ncalc = new Blockly.Generator('NCalc');

  ncalc.ORDER_ATOMIC = ORDER_ATOMIC;
  ncalc.ORDER_NONE = ORDER_NONE;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function valueToCode(block: any, name: string, order: number): string {
    return ncalc.valueToCode(block, name, order) || '';
  }

  // --- Data blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_data_ref'] = (block: any) => {
    const ns = block.getFieldValue('NAMESPACE');
    const path = block.getFieldValue('PATH');
    const code = path ? `${ns}.${path}` : ns;
    return [code, ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_output_ref'] = (block: any) => {
    const path = block.getFieldValue('PATH');
    return [path ? `output.${path}` : 'output', ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_input_ref'] = (block: any) => {
    const path = block.getFieldValue('PATH');
    return [path ? `input.${path}` : 'input', ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_vars_ref'] = (block: any) => {
    const path = block.getFieldValue('PATH');
    return [path ? `vars.${path}` : 'vars', ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_iterator_ref'] = (block: any) => {
    const ref = block.getFieldValue('REF');
    const path = block.getFieldValue('PATH');
    return [path ? `${ref}.${path}` : ref, ORDER_ATOMIC];
  };

  // --- Literal blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_number_literal'] = (block: any) => {
    return [String(block.getFieldValue('NUM')), ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_string_literal'] = (block: any) => {
    const val = block.getFieldValue('TEXT') || '';
    return [`'${val.replace(/'/g, "\\'")}'`, ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_boolean_literal'] = (block: any) => {
    return [block.getFieldValue('BOOL'), ORDER_ATOMIC];
  };

  ncalc.forBlock['ncalc_null_literal'] = () => {
    return ['null', ORDER_ATOMIC];
  };

  // --- Logic blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_if'] = (block: any) => {
    const cond = valueToCode(block, 'CONDITION', ORDER_NONE);
    const then_ = valueToCode(block, 'THEN', ORDER_NONE);
    const else_ = valueToCode(block, 'ELSE', ORDER_NONE);
    return [`if(${cond}, ${then_}, ${else_})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_comparison'] = (block: any) => {
    const left = valueToCode(block, 'LEFT', ORDER_COMPARISON);
    const op = block.getFieldValue('OP');
    const right = valueToCode(block, 'RIGHT', ORDER_COMPARISON);
    return [`${left} ${op} ${right}`, ORDER_COMPARISON];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_logic_op'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const order = op === '&&' ? ORDER_LOGICAL_AND : ORDER_LOGICAL_OR;
    const left = valueToCode(block, 'LEFT', order);
    const right = valueToCode(block, 'RIGHT', order);
    return [`${left} ${op} ${right}`, order];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_not'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_UNARY);
    return [`!${val}`, ORDER_UNARY];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_is_empty'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`IsEmpty(${val})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_is_null'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`IsNull(${val})`, ORDER_FUNCTION_CALL];
  };

  // --- Math blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_math_binary'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const a = valueToCode(block, 'A', ORDER_NONE);
    const b = valueToCode(block, 'B', ORDER_NONE);
    return [`${op}(${a}, ${b})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_round'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const dec = valueToCode(block, 'DECIMALS', ORDER_NONE);
    return [`Round(${val}, ${dec})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_math_unary'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`${op}(${val})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_min_max'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const a = valueToCode(block, 'A', ORDER_NONE);
    const b = valueToCode(block, 'B', ORDER_NONE);
    return [`${op}(${a}, ${b})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_pow'] = (block: any) => {
    const base = valueToCode(block, 'BASE', ORDER_NONE);
    const exp = valueToCode(block, 'EXPONENT', ORDER_NONE);
    return [`Pow(${base}, ${exp})`, ORDER_FUNCTION_CALL];
  };

  // --- String blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_len'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`Len(${val})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_concat'] = (block: any) => {
    const a = valueToCode(block, 'A', ORDER_NONE);
    const b = valueToCode(block, 'B', ORDER_NONE);
    return [`Concat(${a}, ${b})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_replace'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const find = valueToCode(block, 'FIND', ORDER_NONE);
    const with_ = valueToCode(block, 'WITH', ORDER_NONE);
    return [`Replace(${val}, ${find}, ${with_})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_contains'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const search = valueToCode(block, 'SEARCH', ORDER_NONE);
    return [`Contains(${val}, ${search})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_starts_ends'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const search = valueToCode(block, 'SEARCH', ORDER_NONE);
    return [`${op}(${val}, ${search})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_case'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`${op}(${val})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_substring'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const start = valueToCode(block, 'START', ORDER_NONE);
    const len = valueToCode(block, 'LENGTH', ORDER_NONE);
    return [`Substring(${val}, ${start}, ${len})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_base64'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`Base64(${val})`, ORDER_FUNCTION_CALL];
  };

  // --- Array blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_filter'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const cond = block.getFieldValue('CONDITION') || '';
    return [`Filter(${arr}, '${cond}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_map_extract'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const prop = block.getFieldValue('PROPERTY') || '';
    return [`Map(${arr}, '${prop}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_sum'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const prop = block.getFieldValue('PROPERTY') || '';
    if (prop) {
      return [`Sum(${arr}, '${prop}')`, ORDER_FUNCTION_CALL];
    }
    return [`Sum(${arr})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_count'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    return [`Count(${arr})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_first_last'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    return [`${op}(${arr})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_join'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const sep = block.getFieldValue('SEPARATOR') || ',';
    return [`Join(${arr}, '${sep}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_sort'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    return [`${op}(${arr})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_sort_by'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const prop = block.getFieldValue('PROPERTY') || '';
    return [`SortBy(${arr}, '${prop}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_groupby'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const key = block.getFieldValue('KEY') || '';
    return [`GroupBy(${arr}, '${key}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_lookup'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const keyProp = block.getFieldValue('KEY_PROP') || '';
    const matchVal = valueToCode(block, 'MATCH_VALUE', ORDER_NONE);
    const returnProp = block.getFieldValue('RETURN_PROP') || '';
    return [
      `Lookup(${arr}, '${keyProp}', ${matchVal}, '${returnProp}')`,
      ORDER_FUNCTION_CALL,
    ];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_lookup_closest'] = (block: any) => {
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const keyProp = block.getFieldValue('KEY_PROP') || '';
    const matchVal = valueToCode(block, 'MATCH_VALUE', ORDER_NONE);
    const tolerance = valueToCode(block, 'TOLERANCE', ORDER_NONE);
    const returnProp = block.getFieldValue('RETURN_PROP') || '';
    return [
      `LookupClosest(${arr}, '${keyProp}', ${matchVal}, ${tolerance}, '${returnProp}')`,
      ORDER_FUNCTION_CALL,
    ];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_any_all'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const arr = valueToCode(block, 'ARRAY', ORDER_NONE);
    const cond = block.getFieldValue('CONDITION') || '';
    return [`${op}(${arr}, '${cond}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_union_except'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const a = valueToCode(block, 'A', ORDER_NONE);
    const b = valueToCode(block, 'B', ORDER_NONE);
    return [`${op}(${a}, ${b})`, ORDER_FUNCTION_CALL];
  };

  // --- DateTime blocks ---

  ncalc.forBlock['ncalc_now'] = () => {
    return ['Now()', ORDER_FUNCTION_CALL];
  };

  ncalc.forBlock['ncalc_today'] = () => {
    return ['Today()', ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_format_date'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const fmt = block.getFieldValue('FORMAT') || '';
    return [`Format(${val}, '${fmt}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_add_time'] = (block: any) => {
    const op = block.getFieldValue('OP');
    const date = valueToCode(block, 'DATE', ORDER_NONE);
    const amount = valueToCode(block, 'AMOUNT', ORDER_NONE);
    return [`${op}(${date}, ${amount})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_date_diff'] = (block: any) => {
    const d1 = valueToCode(block, 'DATE1', ORDER_NONE);
    const d2 = valueToCode(block, 'DATE2', ORDER_NONE);
    const unit = block.getFieldValue('UNIT') || 'days';
    return [`DateDiff(${d1}, ${d2}, '${unit}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_date_part'] = (block: any) => {
    const part = block.getFieldValue('PART');
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`${part}(${val})`, ORDER_FUNCTION_CALL];
  };

  // --- Conversion blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_to_int'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`ToInt(${val})`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_to_string'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    return [`ToString(${val})`, ORDER_FUNCTION_CALL];
  };

  ncalc.forBlock['ncalc_to_string_fmt'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const fmt = block.getFieldValue('FORMAT') || '';
    return [`ToString(${val}, '${fmt}')`, ORDER_FUNCTION_CALL];
  };

  // --- Other blocks ---

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_coalesce'] = (block: any) => {
    const a = valueToCode(block, 'A', ORDER_NONE);
    const b = valueToCode(block, 'B', ORDER_NONE);
    return [`Coalesce(${a}, ${b})`, ORDER_FUNCTION_CALL];
  };

  ncalc.forBlock['ncalc_new_guid'] = () => {
    return ['NewGuid()', ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_json_path'] = (block: any) => {
    const val = valueToCode(block, 'VALUE', ORDER_NONE);
    const path = block.getFieldValue('PATH') || '';
    return [`JsonPath(${val}, '${path}')`, ORDER_FUNCTION_CALL];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ncalc.forBlock['ncalc_raw_expression'] = (block: any) => {
    return [block.getFieldValue('EXPR') || '', ORDER_ATOMIC];
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function generateCode(workspace: any): string {
    const code = ncalc.workspaceToCode(workspace).trim();
    return code ? `{{${code}}}` : '';
  }

  return {
    generator: ncalc,
    generateCode,
    ORDER_ATOMIC,
    ORDER_NONE,
    ORDER_FUNCTION_CALL,
    ORDER_UNARY,
    ORDER_MULTIPLICATIVE,
    ORDER_ADDITIVE,
    ORDER_COMPARISON,
    ORDER_LOGICAL_AND,
    ORDER_LOGICAL_OR,
  };
}
