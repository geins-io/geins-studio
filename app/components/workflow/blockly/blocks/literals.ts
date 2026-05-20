// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerLiteralBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_string_literal'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('"')
        .appendField(new Blockly.FieldTextInput(''), 'TEXT')
        .appendField('"');
      this.setOutput(true);
      this.setStyle('default_blocks');
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
