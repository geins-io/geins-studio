import type { ManifestExpressionFunction } from '#shared/types'

/**
 * Maps a manifest function category to its Blockly blockStyle name.
 * Mirrors the styles registered in `useBlocklyTheme.ts`. The "other"
 * category (and any unknown category) falls back to `default_blocks`.
 */
function blockStyleForCategory(category?: string): string {
  const c = (category ?? '').toLowerCase()
  const known = ['data', 'logic', 'math', 'array', 'string', 'datetime', 'conversion', 'object']
  if (!c || c === 'other') return 'default_blocks'
  return known.includes(c) ? `${c}_blocks` : 'default_blocks'
}

/**
 * Registers a generic `ncalc_fn_<Name>` block for every manifest expression
 * function that is NOT already covered by a bespoke block. Each block exposes
 * one value input per declared parameter (`ARG0`, `ARG1`, …), labelled from the
 * parameter name, so the whole function palette stays manifest-driven — new
 * backend functions get first-class blocks without any code change.
 *
 * `bespokeNames` is the set of function names/aliases that already have a
 * hand-built block (derived from the parser's `FUNCTION_TO_BLOCK`); those are
 * skipped so the richer bespoke blocks keep priority.
 */
export function registerGenericFunctionBlocks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Blockly: any,
  functions: ManifestExpressionFunction[],
  bespokeNames: Set<string>,
) {
  for (const fn of functions) {
    if (!fn?.name) continue
    const aliases = fn.aliases ?? []
    if (bespokeNames.has(fn.name) || aliases.some((a) => bespokeNames.has(a))) continue

    const type = `ncalc_fn_${fn.name}`
    const params = fn.parameters ?? []
    const style = blockStyleForCategory(fn.category)
    const tooltip = [fn.description, fn.example].filter(Boolean).join(' — ')

    Blockly.Blocks[type] = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      init(this: any) {
        if (params.length === 0) {
          this.appendDummyInput().appendField(fn.name)
        }
        else {
          params.forEach((p, i) => {
            const input = this.appendValueInput(`ARG${i}`)
            if (i === 0) input.appendField(fn.name)
            input.appendField(p.name)
          })
          this.setInputsInline(params.length <= 3)
        }
        this.setOutput(true)
        this.setStyle(style)
        if (tooltip) this.setTooltip(tooltip)
      },
    }
  }
}
