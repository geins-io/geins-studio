// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerLiteralBlocks(Blockly: any) {
  class WideTextInput extends Blockly.FieldTextInput {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(value: any) {
      super(value);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateSize_(margin?: any) {
      super.updateSize_(margin);
      const minWidth = 150;
      if (this.borderRect_) {
        const cur = Number(this.borderRect_.getAttribute('width'));
        if (cur < minWidth) {
          this.borderRect_.setAttribute('width', String(minWidth));
          this.size_.width += minWidth - cur;
        }
      }
    }
  }

  Blockly.Blocks['ncalc_string_literal'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('text')
        .appendField(new WideTextInput(''), 'TEXT');
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('String literal value');
    },
  };

  Blockly.Blocks['ncalc_number_literal'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('number')
        .appendField(new Blockly.FieldNumber(0), 'NUM');
      this.setOutput(true);
      this.setStyle('math_blocks');
      this.setTooltip('Number literal value');
    },
  };

  Blockly.Blocks['ncalc_boolean_literal'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ['true', 'true'],
          ['false', 'false'],
        ]),
        'BOOL',
      );
      this.setOutput(true);
      this.setStyle('logic_blocks');
      this.setTooltip('Boolean literal value');
    },
  };

  Blockly.Blocks['ncalc_null_literal'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput().appendField('null');
      this.setOutput(true);
      this.setStyle('default_blocks');
      this.setTooltip('Null value');
    },
  };
}
