// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerConversionBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_to_int'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('ToInt')
      this.setOutput(true)
      this.setStyle('conversion_blocks')
      this.setTooltip('Convert value to integer')
    },
  }

  Blockly.Blocks['ncalc_to_string'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('ToString')
      this.appendDummyInput()
        .appendField('format')
        .appendField(new Blockly.FieldTextInput(''), 'FORMAT')
      this.setOutput(true)
      this.setStyle('conversion_blocks')
      this.setTooltip('Convert value to string with optional format')
    },
  }
}
