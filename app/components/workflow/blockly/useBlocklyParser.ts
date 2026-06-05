// ---------- Tokenizer ----------

type TokenType =
  | 'IDENT'
  | 'NUMBER'
  | 'STRING'
  | 'LPAREN'
  | 'RPAREN'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'DOT'
  | 'COMMA'
  | 'EQ'
  | 'NEQ'
  | 'GT'
  | 'LT'
  | 'GTE'
  | 'LTE'
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'PLUS'
  | 'MINUS'
  | 'STAR'
  | 'SLASH'
  | 'PERCENT'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input.charAt(i);

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Two-char operators
    const twoChar = input.slice(i, i + 2);
    if (twoChar === '==') {
      tokens.push({ type: 'EQ', value: '==' });
      i += 2;
      continue;
    }
    if (twoChar === '!=') {
      tokens.push({ type: 'NEQ', value: '!=' });
      i += 2;
      continue;
    }
    if (twoChar === '>=') {
      tokens.push({ type: 'GTE', value: '>=' });
      i += 2;
      continue;
    }
    if (twoChar === '<=') {
      tokens.push({ type: 'LTE', value: '<=' });
      i += 2;
      continue;
    }
    if (twoChar === '&&') {
      tokens.push({ type: 'AND', value: '&&' });
      i += 2;
      continue;
    }
    if (twoChar === '||') {
      tokens.push({ type: 'OR', value: '||' });
      i += 2;
      continue;
    }

    // Single-char operators
    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }
    if (ch === '[') {
      tokens.push({ type: 'LBRACKET', value: '[' });
      i++;
      continue;
    }
    if (ch === ']') {
      tokens.push({ type: 'RBRACKET', value: ']' });
      i++;
      continue;
    }
    if (ch === '.') {
      tokens.push({ type: 'DOT', value: '.' });
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',' });
      i++;
      continue;
    }
    if (ch === '>') {
      tokens.push({ type: 'GT', value: '>' });
      i++;
      continue;
    }
    if (ch === '<') {
      tokens.push({ type: 'LT', value: '<' });
      i++;
      continue;
    }
    if (ch === '!') {
      tokens.push({ type: 'NOT', value: '!' });
      i++;
      continue;
    }
    if (ch === '+') {
      tokens.push({ type: 'PLUS', value: '+' });
      i++;
      continue;
    }
    if (ch === '-') {
      tokens.push({ type: 'MINUS', value: '-' });
      i++;
      continue;
    }
    if (ch === '*') {
      tokens.push({ type: 'STAR', value: '*' });
      i++;
      continue;
    }
    if (ch === '/') {
      tokens.push({ type: 'SLASH', value: '/' });
      i++;
      continue;
    }
    if (ch === '%') {
      tokens.push({ type: 'PERCENT', value: '%' });
      i++;
      continue;
    }

    // String literal (single-quoted)
    if (ch === "'") {
      let str = '';
      i++; // skip opening quote
      while (i < input.length && input.charAt(i) !== "'") {
        if (input.charAt(i) === '\\' && i + 1 < input.length) {
          str += input.charAt(i + 1);
          i += 2;
        } else {
          str += input.charAt(i);
          i++;
        }
      }
      i++; // skip closing quote
      tokens.push({ type: 'STRING', value: str });
      continue;
    }

    // Number
    if (/\d/.test(ch)) {
      let num = '';
      while (i < input.length && /\d/.test(input.charAt(i))) {
        num += input.charAt(i);
        i++;
        if (input.charAt(i) === '.' && /\d/.test(input.charAt(i + 1) ?? '')) {
          num += '.';
          i++;
        }
      }
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // Identifier (includes $current, $index)
    if (/[a-zA-Z_$]/.test(ch)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_$]/.test(input.charAt(i))) {
        ident += input.charAt(i);
        i++;
      }
      tokens.push({ type: 'IDENT', value: ident });
      continue;
    }

    // Unknown character — skip
    i++;
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

// ---------- AST ----------

type ASTNode =
  | { type: 'function'; name: string; args: ASTNode[] }
  | { type: 'dataRef'; path: string }
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null' }
  | { type: 'comparison'; left: ASTNode; op: string; right: ASTNode }
  | { type: 'logic'; left: ASTNode; op: string; right: ASTNode }
  | { type: 'not'; operand: ASTNode }
  | { type: 'arithmetic'; left: ASTNode; op: string; right: ASTNode };

// ---------- Parser ----------

function parse(tokens: Token[]): ASTNode {
  let pos = 0;

  function peek(): Token {
    return tokens[pos] || { type: 'EOF', value: '' };
  }

  function advance(): Token {
    return tokens[pos++] ?? { type: 'EOF', value: '' };
  }

  function expect(type: TokenType): Token {
    const t = advance();
    if (t.type !== type) {
      throw new Error(`Expected ${type} but got ${t.type} (${t.value})`);
    }
    return t;
  }

  function expression(): ASTNode {
    return logicalOr();
  }

  function logicalOr(): ASTNode {
    let left = logicalAnd();
    while (peek().type === 'OR') {
      advance();
      const right = logicalAnd();
      left = { type: 'logic', left, op: '||', right };
    }
    return left;
  }

  function logicalAnd(): ASTNode {
    let left = comparison();
    while (peek().type === 'AND') {
      advance();
      const right = comparison();
      left = { type: 'logic', left, op: '&&', right };
    }
    return left;
  }

  function comparison(): ASTNode {
    let left = additive();
    const t = peek();
    if (
      t.type === 'EQ' ||
      t.type === 'NEQ' ||
      t.type === 'GT' ||
      t.type === 'LT' ||
      t.type === 'GTE' ||
      t.type === 'LTE'
    ) {
      const op = advance().value;
      const right = additive();
      left = { type: 'comparison', left, op, right };
    }
    return left;
  }

  function additive(): ASTNode {
    let left = multiplicative();
    while (peek().type === 'PLUS' || peek().type === 'MINUS') {
      const op = advance().value;
      const right = multiplicative();
      left = { type: 'arithmetic', left, op, right };
    }
    return left;
  }

  function multiplicative(): ASTNode {
    let left = unary();
    while (
      peek().type === 'STAR' ||
      peek().type === 'SLASH' ||
      peek().type === 'PERCENT'
    ) {
      const op = advance().value;
      const right = unary();
      left = { type: 'arithmetic', left, op, right };
    }
    return left;
  }

  function unary(): ASTNode {
    if (peek().type === 'NOT') {
      advance();
      const operand = unary();
      return { type: 'not', operand };
    }
    return primary();
  }

  function primary(): ASTNode {
    const t = peek();

    // Parenthesized expression
    if (t.type === 'LPAREN') {
      advance();
      const expr = expression();
      expect('RPAREN');
      return expr;
    }

    // String literal
    if (t.type === 'STRING') {
      advance();
      return { type: 'string', value: t.value };
    }

    // Number literal
    if (t.type === 'NUMBER') {
      advance();
      return { type: 'number', value: Number(t.value) };
    }

    // Identifier — could be function call, keyword, or data ref
    if (t.type === 'IDENT') {
      // Keywords
      if (t.value === 'true') {
        advance();
        return { type: 'boolean', value: true };
      }
      if (t.value === 'false') {
        advance();
        return { type: 'boolean', value: false };
      }
      if (t.value === 'null') {
        advance();
        return { type: 'null' };
      }

      // Lookahead: function call?
      const nextToken = tokens[pos + 1];
      if (nextToken && nextToken.type === 'LPAREN') {
        return functionCall();
      }

      // Data reference
      return dataRef();
    }

    throw new Error(`Unexpected token: ${t.type} (${t.value})`);
  }

  function functionCall(): ASTNode {
    const nameToken = advance(); // IDENT
    expect('LPAREN');
    const args: ASTNode[] = [];
    if (peek().type !== 'RPAREN') {
      args.push(expression());
      while (peek().type === 'COMMA') {
        advance();
        args.push(expression());
      }
    }
    expect('RPAREN');
    return { type: 'function', name: nameToken.value, args };
  }

  function consumePathSegment(): string {
    let segment = expect('IDENT').value;
    // Merge hyphenated identifiers: net-httpRequest-01
    while (
      peek().type === 'MINUS' &&
      pos + 1 < tokens.length &&
      (tokens[pos + 1]!.type === 'IDENT' || tokens[pos + 1]!.type === 'NUMBER')
    ) {
      advance(); // MINUS
      segment += `-${advance().value}`;
    }
    return segment;
  }

  function dataRef(): ASTNode {
    let path = advance().value; // First IDENT
    // Merge hyphenated first segment (rare but possible)
    while (
      peek().type === 'MINUS' &&
      pos + 1 < tokens.length &&
      (tokens[pos + 1]!.type === 'IDENT' || tokens[pos + 1]!.type === 'NUMBER')
    ) {
      advance();
      path += `-${advance().value}`;
    }

    while (peek().type === 'DOT' || peek().type === 'LBRACKET') {
      if (peek().type === 'DOT') {
        advance();
        path += `.${consumePathSegment()}`;
      } else {
        advance(); // [
        if (peek().type === 'NUMBER') {
          path += `[${advance().value}]`;
        } else if (peek().type === 'STAR') {
          advance();
          path += '[*]';
        }
        expect('RBRACKET');
      }
    }

    return { type: 'dataRef', path };
  }

  const result = expression();
  return result;
}

// ---------- AST to Blockly JSON ----------

const FUNCTION_TO_BLOCK: Record<string, string> = {
  if: 'ncalc_if',
  Round: 'ncalc_round',
  Floor: 'ncalc_math_unary',
  Ceil: 'ncalc_math_unary',
  Abs: 'ncalc_math_unary',
  Sqrt: 'ncalc_math_unary',
  Add: 'ncalc_math_binary',
  Subtract: 'ncalc_math_binary',
  Multiply: 'ncalc_math_binary',
  Divide: 'ncalc_math_binary',
  Mod: 'ncalc_math_binary',
  Min: 'ncalc_min_max',
  Max: 'ncalc_min_max',
  Pow: 'ncalc_pow',
  Len: 'ncalc_len',
  Length: 'ncalc_len',
  Concat: 'ncalc_concat',
  Replace: 'ncalc_replace',
  Contains: 'ncalc_contains',
  StartsWith: 'ncalc_starts_ends',
  EndsWith: 'ncalc_starts_ends',
  Upper: 'ncalc_case',
  Lower: 'ncalc_case',
  Trim: 'ncalc_case',
  Substring: 'ncalc_substring',
  Base64: 'ncalc_base64',
  Base64Encode: 'ncalc_base64',
  Filter: 'ncalc_filter',
  Map: 'ncalc_map_extract',
  Sum: 'ncalc_sum',
  Count: 'ncalc_count',
  First: 'ncalc_first_last',
  Last: 'ncalc_first_last',
  Join: 'ncalc_join',
  Sort: 'ncalc_sort',
  Distinct: 'ncalc_sort',
  SortBy: 'ncalc_sort_by',
  GroupBy: 'ncalc_groupby',
  Lookup: 'ncalc_lookup',
  LookupClosest: 'ncalc_lookup_closest',
  Any: 'ncalc_any_all',
  All: 'ncalc_any_all',
  Union: 'ncalc_union_except',
  Except: 'ncalc_union_except',
  Now: 'ncalc_now',
  UtcNow: 'ncalc_now',
  Today: 'ncalc_today',
  Format: 'ncalc_format_date',
  FormatDate: 'ncalc_format_date',
  AddDays: 'ncalc_add_time',
  AddHours: 'ncalc_add_time',
  AddMinutes: 'ncalc_add_time',
  AddSeconds: 'ncalc_add_time',
  AddMonths: 'ncalc_add_time',
  DateDiff: 'ncalc_date_diff',
  Year: 'ncalc_date_part',
  Month: 'ncalc_date_part',
  Day: 'ncalc_date_part',
  Hour: 'ncalc_date_part',
  Minute: 'ncalc_date_part',
  Second: 'ncalc_date_part',
  ToInt: 'ncalc_to_int',
  ToString: 'ncalc_to_string',
  Coalesce: 'ncalc_coalesce',
  NewGuid: 'ncalc_new_guid',
  JsonPath: 'ncalc_json_path',
  IsEmpty: 'ncalc_is_empty',
  IsNull: 'ncalc_is_null',
};

/** Function names (and aliases) that have a hand-built bespoke block. */
export const BESPOKE_FUNCTION_NAMES = new Set(Object.keys(FUNCTION_TO_BLOCK));

// Manifest-driven generic functions: canonical names not covered by a bespoke
// block, plus an alias→canonical map so aliased calls route to the same block.
const genericFunctionNames = new Set<string>();
const aliasToCanonical = new Map<string, string>();

/**
 * Registers the manifest's expression functions for generic-block routing.
 * Bespoke functions are skipped (they keep their hand-built blocks). Called
 * from the editor whenever the manifest resolves.
 */
function setManifestFunctions(
  functions: { name: string; aliases?: string[] }[],
): void {
  genericFunctionNames.clear();
  aliasToCanonical.clear();
  for (const fn of functions) {
    if (!fn?.name) continue;
    const aliases = fn.aliases ?? [];
    const isBespoke =
      BESPOKE_FUNCTION_NAMES.has(fn.name) ||
      aliases.some((a) => BESPOKE_FUNCTION_NAMES.has(a));
    if (isBespoke) continue;
    genericFunctionNames.add(fn.name);
    aliasToCanonical.set(fn.name, fn.name);
    for (const a of aliases) aliasToCanonical.set(a, fn.name);
  }
}

// Known data reference namespaces
const DATA_NAMESPACES = new Set(['output', 'input', 'vars']);
const ITERATOR_REFS = new Set(['$current', '$index']);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function astToBlocklyJson(node: ASTNode): Record<string, any> {
  switch (node.type) {
    case 'string':
      return {
        type: 'ncalc_string_literal',
        fields: { TEXT: node.value },
      };

    case 'number':
      return {
        type: 'ncalc_number_literal',
        fields: { NUM: node.value },
      };

    case 'boolean':
      return {
        type: 'ncalc_boolean_literal',
        fields: { BOOL: String(node.value) },
      };

    case 'null':
      return { type: 'ncalc_null_literal' };

    case 'dataRef':
      return dataRefToBlock(node.path);

    case 'not':
      return {
        type: 'ncalc_not',
        inputs: { VALUE: { block: astToBlocklyJson(node.operand) } },
      };

    case 'comparison':
      return {
        type: 'ncalc_comparison',
        fields: { OP: node.op },
        inputs: {
          LEFT: { block: astToBlocklyJson(node.left) },
          RIGHT: { block: astToBlocklyJson(node.right) },
        },
      };

    case 'logic':
      return {
        type: 'ncalc_logic_op',
        fields: { OP: node.op },
        inputs: {
          LEFT: { block: astToBlocklyJson(node.left) },
          RIGHT: { block: astToBlocklyJson(node.right) },
        },
      };

    case 'arithmetic':
      return arithmeticToBlock(node);

    case 'function':
      return functionToBlock(node);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dataRefToBlock(path: string): Record<string, any> {
  const parts = path.split('.');
  const first = parts[0] ?? '';

  // Iterator references: $current, $index
  if (ITERATOR_REFS.has(first)) {
    return {
      type: 'ncalc_iterator_ref',
      fields: {
        REF: first,
        PATH: parts.slice(1).join('.'),
      },
    };
  }

  // Known namespaces: output, input, vars → use specific blocks
  const namespaceBlockMap: Record<string, string> = {
    output: 'ncalc_output_ref',
    input: 'ncalc_input_ref',
    vars: 'ncalc_vars_ref',
  };
  if (DATA_NAMESPACES.has(first)) {
    return {
      type: namespaceBlockMap[first] ?? 'ncalc_data_ref',
      fields: namespaceBlockMap[first]
        ? { PATH: parts.slice(1).join('.') }
        : { NAMESPACE: first, PATH: parts.slice(1).join('.') },
    };
  }

  // Unknown — use raw expression
  return {
    type: 'ncalc_raw_expression',
    fields: { EXPR: path },
  };
}

function arithmeticToBlock(
  node: ASTNode & { type: 'arithmetic' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // Map arithmetic operators to NCalc function names
  const opMap: Record<string, string> = {
    '+': 'Add',
    '-': 'Subtract',
    '*': 'Multiply',
    '/': 'Divide',
    '%': 'Mod',
  };
  const funcName = opMap[node.op];
  if (funcName) {
    return {
      type: 'ncalc_math_binary',
      fields: { OP: funcName },
      inputs: {
        A: { block: astToBlocklyJson(node.left) },
        B: { block: astToBlocklyJson(node.right) },
      },
    };
  }
  // Fallback
  return {
    type: 'ncalc_raw_expression',
    fields: {
      EXPR: `${nodeToString(node.left)} ${node.op} ${nodeToString(node.right)}`,
    },
  };
}

function nodeToString(node: ASTNode): string {
  switch (node.type) {
    case 'string':
      return `'${node.value}'`;
    case 'number':
      return String(node.value);
    case 'boolean':
      return String(node.value);
    case 'null':
      return 'null';
    case 'dataRef':
      return node.path;
    default:
      return '...';
  }
}

function getStringArg(args: ASTNode[], index: number): string {
  const arg = args[index];
  if (!arg) return '';
  if (arg.type === 'string') return arg.value;
  return nodeToString(arg);
}

function functionToBlock(
  node: ASTNode & { type: 'function' },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  const blockType = FUNCTION_TO_BLOCK[node.name];

  if (!blockType) {
    // Manifest-driven generic function block (one value input per argument)
    const canonical = aliasToCanonical.get(node.name);
    if (canonical && genericFunctionNames.has(canonical)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const inputs: Record<string, { block: Record<string, any> }> = {};
      node.args.forEach((arg, i) => {
        if (arg) inputs[`ARG${i}`] = { block: astToBlocklyJson(arg) };
      });
      return { type: `ncalc_fn_${canonical}`, inputs };
    }

    // Unknown function — raw expression fallback
    const argsStr = node.args.map((a) => nodeToString(a)).join(', ');
    return {
      type: 'ncalc_raw_expression',
      fields: { EXPR: `${node.name}(${argsStr})` },
    };
  }

  switch (blockType) {
    case 'ncalc_if':
      return {
        type: 'ncalc_if',
        inputs: {
          CONDITION: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          THEN: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
          ELSE: node.args[2]
            ? { block: astToBlocklyJson(node.args[2]) }
            : undefined,
        },
      };

    case 'ncalc_round':
      return {
        type: 'ncalc_round',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          DECIMALS: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_math_unary':
      return {
        type: 'ncalc_math_unary',
        fields: { OP: node.name },
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_math_binary':
      return {
        type: 'ncalc_math_binary',
        fields: { OP: node.name },
        inputs: {
          A: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          B: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_min_max':
      return {
        type: 'ncalc_min_max',
        fields: { OP: node.name },
        inputs: {
          A: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          B: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_pow':
      return {
        type: 'ncalc_pow',
        inputs: {
          BASE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          EXPONENT: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_len':
      return {
        type: 'ncalc_len',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_concat':
      return {
        type: 'ncalc_concat',
        inputs: {
          A: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          B: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_replace':
      return {
        type: 'ncalc_replace',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          FIND: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
          WITH: node.args[2]
            ? { block: astToBlocklyJson(node.args[2]) }
            : undefined,
        },
      };

    case 'ncalc_contains':
      return {
        type: 'ncalc_contains',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          SEARCH: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_starts_ends':
      return {
        type: 'ncalc_starts_ends',
        fields: { OP: node.name },
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          SEARCH: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_case':
      return {
        type: 'ncalc_case',
        fields: { OP: node.name },
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_substring':
      return {
        type: 'ncalc_substring',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          START: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
          LENGTH: node.args[2]
            ? { block: astToBlocklyJson(node.args[2]) }
            : undefined,
        },
      };

    case 'ncalc_base64':
      return {
        type: 'ncalc_base64',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_filter':
      return {
        type: 'ncalc_filter',
        fields: { CONDITION: getStringArg(node.args, 1) },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_map_extract':
      return {
        type: 'ncalc_map_extract',
        fields: { PROPERTY: getStringArg(node.args, 1) },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_sum':
      return {
        type: 'ncalc_sum',
        fields: { PROPERTY: node.args[1] ? getStringArg(node.args, 1) : '' },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_count':
      return {
        type: 'ncalc_count',
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_first_last':
      return {
        type: 'ncalc_first_last',
        fields: { OP: node.name },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_join':
      return {
        type: 'ncalc_join',
        fields: { SEPARATOR: getStringArg(node.args, 1) },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_sort':
      return {
        type: 'ncalc_sort',
        fields: { OP: node.name },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_sort_by':
      return {
        type: 'ncalc_sort_by',
        fields: { PROPERTY: getStringArg(node.args, 1) },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_groupby':
      return {
        type: 'ncalc_groupby',
        fields: { KEY: getStringArg(node.args, 1) },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_lookup':
      return {
        type: 'ncalc_lookup',
        fields: {
          KEY_PROP: getStringArg(node.args, 1),
          RETURN_PROP: getStringArg(node.args, 3),
        },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          MATCH_VALUE: node.args[2]
            ? { block: astToBlocklyJson(node.args[2]) }
            : undefined,
        },
      };

    case 'ncalc_lookup_closest':
      return {
        type: 'ncalc_lookup_closest',
        fields: {
          KEY_PROP: getStringArg(node.args, 1),
          RETURN_PROP: getStringArg(node.args, 4),
        },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          MATCH_VALUE: node.args[2]
            ? { block: astToBlocklyJson(node.args[2]) }
            : undefined,
          TOLERANCE: node.args[3]
            ? { block: astToBlocklyJson(node.args[3]) }
            : undefined,
        },
      };

    case 'ncalc_any_all':
      return {
        type: 'ncalc_any_all',
        fields: { OP: node.name, CONDITION: getStringArg(node.args, 1) },
        inputs: {
          ARRAY: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_union_except':
      return {
        type: 'ncalc_union_except',
        fields: { OP: node.name },
        inputs: {
          A: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          B: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_now':
      return { type: 'ncalc_now' };

    case 'ncalc_today':
      return { type: 'ncalc_today' };

    case 'ncalc_format_date':
      return {
        type: 'ncalc_format_date',
        fields: { FORMAT: getStringArg(node.args, 1) },
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_add_time':
      return {
        type: 'ncalc_add_time',
        fields: { OP: node.name },
        inputs: {
          DATE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          AMOUNT: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_date_diff':
      return {
        type: 'ncalc_date_diff',
        fields: { UNIT: getStringArg(node.args, 2) },
        inputs: {
          DATE1: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          DATE2: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_date_part':
      return {
        type: 'ncalc_date_part',
        fields: { PART: node.name },
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_to_int':
      return {
        type: 'ncalc_to_int',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_to_string': {
      const fmt = node.args[1] ? getStringArg(node.args, 1) : '';
      if (fmt) {
        return {
          type: 'ncalc_to_string_fmt',
          fields: { FORMAT: fmt },
          inputs: {
            VALUE: node.args[0]
              ? { block: astToBlocklyJson(node.args[0]) }
              : undefined,
          },
        };
      }
      return {
        type: 'ncalc_to_string',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };
    }

    case 'ncalc_coalesce':
      return {
        type: 'ncalc_coalesce',
        inputs: {
          A: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
          B: node.args[1]
            ? { block: astToBlocklyJson(node.args[1]) }
            : undefined,
        },
      };

    case 'ncalc_new_guid':
      return { type: 'ncalc_new_guid' };

    case 'ncalc_json_path':
      return {
        type: 'ncalc_json_path',
        fields: { PATH: getStringArg(node.args, 1) },
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_is_empty':
      return {
        type: 'ncalc_is_empty',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    case 'ncalc_is_null':
      return {
        type: 'ncalc_is_null',
        inputs: {
          VALUE: node.args[0]
            ? { block: astToBlocklyJson(node.args[0]) }
            : undefined,
        },
      };

    default:
      return {
        type: 'ncalc_raw_expression',
        fields: {
          EXPR: `${node.name}(${node.args.map((a) => nodeToString(a)).join(', ')})`,
        },
      };
  }
}

// ---------- Export ----------

export function useBlocklyParser() {
  const { geinsLog, geinsLogError } = useGeinsLog('BlocklyParser');

  function parseSingleExpression(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspace: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Blockly: any,
    inner: string,
    x: number,
    y: number,
  ): boolean {
    try {
      const tokens = tokenize(inner);
      const ast = parse(tokens);
      const blockJson = { ...astToBlocklyJson(ast), x, y } as Record<
        string,
        unknown
      >;
      geinsLog('Parsed expression into blocks', {
        expression: inner,
        blockType:
          typeof blockJson.type === 'string' ? blockJson.type : 'unknown',
      });
      Blockly.serialization.blocks.append(blockJson, workspace);
      return true;
    } catch (err) {
      geinsLogError('Failed to parse expression, using raw block', {
        expression: inner,
        error: err,
      });
      Blockly.serialization.blocks.append(
        {
          type: 'ncalc_raw_expression',
          fields: { EXPR: inner },
          x,
          y,
        },
        workspace,
      );
      return false;
    }
  }

  function loadExpression(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workspace: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Blockly: any,
    expression: string,
  ): boolean {
    if (!expression.trim()) return false;

    // Extract all {{...}} expressions
    const exprPattern = /\{\{([^}]+)\}\}/g;
    const matches = [...expression.matchAll(exprPattern)];

    if (matches.length === 0) return false;

    let allSuccess = true;
    let xOffset = 50;
    for (const match of matches) {
      const inner = match[1]!.trim();
      if (!inner) continue;
      if (!parseSingleExpression(workspace, Blockly, inner, xOffset, 50)) {
        allSuccess = false;
      }
      xOffset += 250;
    }
    return allSuccess;
  }

  return { loadExpression, tokenize, parse, setManifestFunctions };
}
