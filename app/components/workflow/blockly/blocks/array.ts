// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerArrayBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_filter'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('Filter')
      this.appendDummyInput()
        .appendField('where')
        .appendField(new Blockly.FieldTextInput(''), 'CONDITION')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Filter array by condition')
    },
  }

  Blockly.Blocks['ncalc_map_extract'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('Map')
      this.appendDummyInput()
        .appendField('get')
        .appendField(new Blockly.FieldTextInput(''), 'PROPERTY')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Map array by extracting a property')
    },
  }

  Blockly.Blocks['ncalc_sum'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('Sum')
      this.appendDummyInput()
        .appendField('by')
        .appendField(new Blockly.FieldTextInput(''), 'PROPERTY')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Sum array values, optionally by property')
    },
  }

  Blockly.Blocks['ncalc_count'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('Count')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Count items in array')
    },
  }

  Blockly.Blocks['ncalc_first_last'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY')
        .appendField(new Blockly.FieldDropdown([
          ['First', 'First'],
          ['Last', 'Last'],
        ]), 'OP')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Get first or last item from array')
    },
  }

  Blockly.Blocks['ncalc_join'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('Join')
      this.appendDummyInput()
        .appendField('with')
        .appendField(new Blockly.FieldTextInput(','), 'SEPARATOR')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Join array elements with separator')
    },
  }

  Blockly.Blocks['ncalc_sort'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY')
        .appendField(new Blockly.FieldDropdown([
          ['Sort', 'Sort'],
          ['Distinct', 'Distinct'],
        ]), 'OP')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Sort or deduplicate array')
    },
  }

  Blockly.Blocks['ncalc_sort_by'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('SortBy')
      this.appendDummyInput()
        .appendField('by')
        .appendField(new Blockly.FieldTextInput(''), 'PROPERTY')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Sort array by property')
    },
  }

  Blockly.Blocks['ncalc_groupby'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('GroupBy')
      this.appendDummyInput()
        .appendField('by')
        .appendField(new Blockly.FieldTextInput(''), 'KEY')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Group array by key')
    },
  }

  Blockly.Blocks['ncalc_lookup'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('Lookup')
      this.appendDummyInput()
        .appendField('key')
        .appendField(new Blockly.FieldTextInput(''), 'KEY_PROP')
      this.appendValueInput('MATCH_VALUE').appendField('=')
      this.appendDummyInput()
        .appendField('get')
        .appendField(new Blockly.FieldTextInput(''), 'RETURN_PROP')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Look up value in array by key match')
    },
  }

  Blockly.Blocks['ncalc_lookup_closest'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY').appendField('LookupClosest')
      this.appendDummyInput()
        .appendField('key')
        .appendField(new Blockly.FieldTextInput(''), 'KEY_PROP')
      this.appendValueInput('MATCH_VALUE').appendField('≈')
      this.appendValueInput('TOLERANCE').appendField('±')
      this.appendDummyInput()
        .appendField('get')
        .appendField(new Blockly.FieldTextInput(''), 'RETURN_PROP')
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Look up closest matching value in array')
    },
  }

  Blockly.Blocks['ncalc_any_all'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('ARRAY')
        .appendField(new Blockly.FieldDropdown([
          ['Any', 'Any'],
          ['All', 'All'],
        ]), 'OP')
      this.appendDummyInput()
        .appendField(new Blockly.FieldTextInput(''), 'CONDITION')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Check if any or all items match condition')
    },
  }

  Blockly.Blocks['ncalc_union_except'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('A')
        .appendField(new Blockly.FieldDropdown([
          ['Union', 'Union'],
          ['Except', 'Except'],
        ]), 'OP')
      this.appendValueInput('B')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('array_blocks')
      this.setTooltip('Combine or subtract arrays')
    },
  }
}
