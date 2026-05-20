// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerConversionBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_to_int'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('ToInt');
      this.setOutput(true);
      this.setStyle('conversion_blocks');
      this.setTooltip('Convert value to integer');
    },
  };

  Blockly.Blocks['ncalc_to_string'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('ToString');
      this.setOutput(true);
      this.setStyle('conversion_blocks');
      this.setTooltip('Convert value to string');
    },
  };

  Blockly.Blocks['ncalc_to_string_fmt'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('ToString');
      this.appendDummyInput()
        .appendField('as')
        .appendField(
          new Blockly.FieldDropdown([
            ['2 decimals (N2)', 'N2'],
            ['no decimals (N0)', 'N0'],
            ['currency (C)', 'C'],
            ['percentage (P)', 'P'],
            ['fixed 2 (F2)', 'F2'],
            ['date (yyyy-MM-dd)', 'yyyy-MM-dd'],
            ['datetime (yyyy-MM-dd HH:mm)', 'yyyy-MM-dd HH:mm'],
            ['ISO 8601 (o)', 'o'],
            ['padded int (D5)', 'D5'],
          ]),
          'FORMAT',
        );
      this.setOutput(true);
      this.setStyle('conversion_blocks');
      this.setTooltip('Convert value to formatted string');
    },
  };
}
