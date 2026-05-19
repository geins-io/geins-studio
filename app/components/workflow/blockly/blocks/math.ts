// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerMathBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_math_binary'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['Add', 'Add'],
          ['Subtract', 'Subtract'],
          ['Multiply', 'Multiply'],
          ['Divide', 'Divide'],
          ['Mod', 'Mod'],
        ]), 'OP')
      this.appendValueInput('A')
      this.appendValueInput('B')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('math_blocks')
      this.setTooltip('Binary math operation')
    },
  }

  Blockly.Blocks['ncalc_round'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Round')
      this.appendValueInput('DECIMALS').appendField('to')
      this.appendDummyInput().appendField('decimals')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('math_blocks')
      this.setTooltip('Round a number to specified decimals')
    },
  }

  Blockly.Blocks['ncalc_math_unary'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE')
        .appendField(new Blockly.FieldDropdown([
          ['Floor', 'Floor'],
          ['Ceil', 'Ceil'],
          ['Abs', 'Abs'],
          ['Sqrt', 'Sqrt'],
        ]), 'OP')
      this.setOutput(true)
      this.setStyle('math_blocks')
      this.setTooltip('Unary math operation')
    },
  }

  Blockly.Blocks['ncalc_min_max'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('A')
        .appendField(new Blockly.FieldDropdown([
          ['Min', 'Min'],
          ['Max', 'Max'],
        ]), 'OP')
      this.appendValueInput('B')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('math_blocks')
      this.setTooltip('Min or Max of two values')
    },
  }

  Blockly.Blocks['ncalc_pow'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('BASE').appendField('Pow')
      this.appendValueInput('EXPONENT').appendField('^')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('math_blocks')
      this.setTooltip('Raise to power')
    },
  }
}
