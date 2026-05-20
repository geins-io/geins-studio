// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerStringBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_len'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Len');
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Get length of a string or array');
    },
  };

  Blockly.Blocks['ncalc_concat'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('A').appendField('Concat');
      this.appendValueInput('B');
      this.setInputsInline(true);
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Concatenate two strings');
    },
  };

  Blockly.Blocks['ncalc_replace'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Replace in');
      this.appendValueInput('FIND').appendField('find');
      this.appendValueInput('WITH').appendField('with');
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Replace occurrences in a string');
    },
  };

  Blockly.Blocks['ncalc_contains'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Contains');
      this.appendValueInput('SEARCH');
      this.setInputsInline(true);
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Check if string contains substring');
    },
  };

  Blockly.Blocks['ncalc_starts_ends'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE');
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ['StartsWith', 'StartsWith'],
          ['EndsWith', 'EndsWith'],
        ]),
        'OP',
      );
      this.appendValueInput('SEARCH');
      this.setInputsInline(true);
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Check if string starts or ends with value');
    },
  };

  Blockly.Blocks['ncalc_case'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField(
        new Blockly.FieldDropdown([
          ['Upper', 'Upper'],
          ['Lower', 'Lower'],
          ['Trim', 'Trim'],
        ]),
        'OP',
      );
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Transform string case or trim whitespace');
    },
  };

  Blockly.Blocks['ncalc_substring'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Substring');
      this.appendValueInput('START').appendField('from');
      this.appendValueInput('LENGTH').appendField('length');
      this.setInputsInline(true);
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Extract substring from start position with length');
    },
  };

  Blockly.Blocks['ncalc_base64'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Base64');
      this.setOutput(true);
      this.setStyle('string_blocks');
      this.setTooltip('Base64 encode a value');
    },
  };
}
