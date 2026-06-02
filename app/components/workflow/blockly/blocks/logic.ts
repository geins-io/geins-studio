// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerLogicBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_if'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('CONDITION').appendField('if')
      this.appendValueInput('THEN').appendField('then')
      this.appendValueInput('ELSE').appendField('else')
      this.setOutput(true)
      this.setStyle('logic_blocks')
      this.setTooltip('Conditional: if condition then value else other')
    },
  }

  Blockly.Blocks['ncalc_comparison'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('LEFT')
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['==', '=='],
          ['!=', '!='],
          ['>', '>'],
          ['<', '<'],
          ['>=', '>='],
          ['<=', '<='],
        ]), 'OP')
      this.appendValueInput('RIGHT')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('logic_blocks')
      this.setTooltip('Compare two values')
    },
  }

  Blockly.Blocks['ncalc_logic_op'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('LEFT')
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['&&', '&&'],
          ['||', '||'],
        ]), 'OP')
      this.appendValueInput('RIGHT')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('logic_blocks')
      this.setTooltip('Logical AND / OR')
    },
  }

  Blockly.Blocks['ncalc_not'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('not')
      this.setOutput(true)
      this.setStyle('logic_blocks')
      this.setTooltip('Logical NOT')
    },
  }

  Blockly.Blocks['ncalc_is_empty'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('IsEmpty')
      this.setOutput(true)
      this.setStyle('logic_blocks')
      this.setTooltip('Check if value is empty')
    },
  }

  Blockly.Blocks['ncalc_is_null'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('IsNull')
      this.setOutput(true)
      this.setStyle('logic_blocks')
      this.setTooltip('Check if value is null')
    },
  }
}
