// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerOtherBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_coalesce'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('A').appendField('Coalesce')
      this.appendValueInput('B').appendField('or')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('default_blocks')
      this.setTooltip('Return first non-null value')
    },
  }

  Blockly.Blocks['ncalc_new_guid'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput().appendField('NewGuid()')
      this.setOutput(true)
      this.setStyle('default_blocks')
      this.setTooltip('Generate a new GUID')
    },
  }

  Blockly.Blocks['ncalc_json_path'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('JsonPath')
      this.appendDummyInput()
        .appendField('path')
        .appendField(new Blockly.FieldTextInput(''), 'PATH')
      this.setOutput(true)
      this.setStyle('default_blocks')
      this.setTooltip('Extract value using JSON path')
    },
  }

  Blockly.Blocks['ncalc_raw_expression'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField('Expression:')
        .appendField(new Blockly.FieldTextInput(''), 'EXPR')
      this.setOutput(true)
      this.setStyle('default_blocks')
      this.setTooltip('Raw NCalc expression — escape hatch for complex or unparseable expressions')
    },
  }
}
