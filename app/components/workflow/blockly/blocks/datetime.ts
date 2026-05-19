// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerDateTimeBlocks(Blockly: any) {
  Blockly.Blocks['ncalc_now'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput().appendField('Now()')
      this.setOutput(true)
      this.setStyle('datetime_blocks')
      this.setTooltip('Current date and time')
    },
  }

  Blockly.Blocks['ncalc_today'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendDummyInput().appendField('Today()')
      this.setOutput(true)
      this.setStyle('datetime_blocks')
      this.setTooltip('Current date (midnight)')
    },
  }

  Blockly.Blocks['ncalc_format_date'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE').appendField('Format')
      this.appendDummyInput()
        .appendField('as')
        .appendField(new Blockly.FieldTextInput('yyyy-MM-dd'), 'FORMAT')
      this.setOutput(true)
      this.setStyle('datetime_blocks')
      this.setTooltip('Format a date as string')
    },
  }

  Blockly.Blocks['ncalc_add_time'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('DATE')
        .appendField(new Blockly.FieldDropdown([
          ['AddDays', 'AddDays'],
          ['AddHours', 'AddHours'],
          ['AddMinutes', 'AddMinutes'],
          ['AddSeconds', 'AddSeconds'],
          ['AddMonths', 'AddMonths'],
        ]), 'OP')
      this.appendValueInput('AMOUNT')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('datetime_blocks')
      this.setTooltip('Add time to a date')
    },
  }

  Blockly.Blocks['ncalc_date_diff'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('DATE1').appendField('DateDiff')
      this.appendValueInput('DATE2')
      this.appendDummyInput()
        .appendField('in')
        .appendField(new Blockly.FieldDropdown([
          ['days', 'days'],
          ['hours', 'hours'],
          ['minutes', 'minutes'],
          ['seconds', 'seconds'],
        ]), 'UNIT')
      this.setInputsInline(true)
      this.setOutput(true)
      this.setStyle('datetime_blocks')
      this.setTooltip('Calculate difference between two dates')
    },
  }

  Blockly.Blocks['ncalc_date_part'] = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    init(this: any) {
      this.appendValueInput('VALUE')
        .appendField(new Blockly.FieldDropdown([
          ['Year', 'Year'],
          ['Month', 'Month'],
          ['Day', 'Day'],
          ['Hour', 'Hour'],
          ['Minute', 'Minute'],
          ['Second', 'Second'],
        ]), 'PART')
      this.setOutput(true)
      this.setStyle('datetime_blocks')
      this.setTooltip('Extract part of a date')
    },
  }
}
