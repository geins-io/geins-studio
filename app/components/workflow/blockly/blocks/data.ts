// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerDataBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_data_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['output', 'output'],
          ['input', 'input'],
          ['vars', 'vars'],
        ]), 'NAMESPACE')
        .appendField(new Blockly.FieldTextInput(''), 'PATH')
      this.setOutput(true)
      this.setStyle('data_blocks')
      this.setTooltip('Reference data from nodes, inputs, or variables')
    },
  }

  Blockly.Blocks['ncalc_iterator_ref'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput()
        .appendField(new Blockly.FieldDropdown([
          ['$current', '$current'],
          ['$index', '$index'],
        ]), 'REF')
        .appendField(new Blockly.FieldTextInput(''), 'PATH')
      this.setOutput(true)
      this.setStyle('data_blocks')
      this.setTooltip('Iterator context variable')
    },
  }
}
