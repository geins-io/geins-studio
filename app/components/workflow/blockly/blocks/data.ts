import type { BlocklyContext } from '../useBlocklyBlocks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerDataBlocks(Blockly: any, ctx: BlocklyContext) {
  function getPathOptions(namespace: string): [string, string][] {
    const items = ctx.completions.value
      .filter((c) => c.expression.startsWith(`{{${namespace}.`))
      .map((c) => {
        const path = c.expression
          .replace(/^\{\{|\}\}$/g, '')
          .slice(namespace.length + 1);
        const label = c.label || path;
        return [label, path] as [string, string];
      });
    return items.length > 0 ? items : [['(no data available)', '']];
  }

  // FieldDropdown subclass that accepts any value during deserialization.
  // Standard FieldDropdown rejects values not in the options list, which
  // breaks loading expressions whose paths aren't in the current completions.
  class PathDropdown extends Blockly.FieldDropdown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    doClassValidation_(newValue: any) {
      const result = super.doClassValidation_(newValue);
      if (result === null && typeof newValue === 'string' && newValue) {
        return newValue;
      }
      return result;
    }

    getOptions(useCache?: boolean) {
      const options = super.getOptions(useCache) as [string, string][];
      const current = this.getValue?.();
      if (
        current &&
        !options.some(([, val]: [string, string]) => val === current)
      ) {
        options.push([current, current]);
      }
      return options;
    }
  }

  const createPathDropdown = (namespace: string) => {
    const dropdown = new PathDropdown();
    (dropdown as unknown as { menuGenerator_: () => [string, string][] }).menuGenerator_ =
      () => getPathOptions(namespace);
    return dropdown;
  };

  Blockly.Blocks['ncalc_output_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('output')
        .appendField(createPathDropdown('output'), 'PATH');
      this.setOutput(true);
      this.setStyle('data_blocks');
      this.setTooltip('Reference output data from upstream nodes');
    },
  };

  Blockly.Blocks['ncalc_input_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('input')
        .appendField(createPathDropdown('input'), 'PATH');
      this.setOutput(true);
      this.setStyle('data_blocks');
      this.setTooltip('Reference workflow input variables');
    },
  };

  Blockly.Blocks['ncalc_vars_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('vars')
        .appendField(createPathDropdown('vars'), 'PATH');
      this.setOutput(true);
      this.setStyle('data_blocks');
      this.setTooltip('Reference workflow variables and secrets');
    },
  };

  // Keep the generic data ref for the parser fallback and manual paths
  Blockly.Blocks['ncalc_data_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['output', 'output'],
            ['input', 'input'],
            ['vars', 'vars'],
          ]),
          'NAMESPACE',
        )
        .appendField(new Blockly.FieldTextInput(''), 'PATH');
      this.setOutput(true);
      this.setStyle('data_blocks');
      this.setTooltip('Reference data from nodes, inputs, or variables');
    },
  };

  Blockly.Blocks['ncalc_iterator_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField(
          new Blockly.FieldDropdown([
            ['$current', '$current'],
            ['$index', '$index'],
          ]),
          'REF',
        )
        .appendField(new Blockly.FieldTextInput(''), 'PATH');
      this.setOutput(true);
      this.setStyle('data_blocks');
      this.setTooltip('Iterator context variable');
    },
  };
}
