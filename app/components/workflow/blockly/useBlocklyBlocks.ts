import { registerArrayBlocks } from './blocks/array'
import { registerConversionBlocks } from './blocks/conversion'
import { registerDataBlocks } from './blocks/data'
import { registerDateTimeBlocks } from './blocks/datetime'
import { registerLiteralBlocks } from './blocks/literals'
import { registerLogicBlocks } from './blocks/logic'
import { registerMathBlocks } from './blocks/math'
import { registerOtherBlocks } from './blocks/other'
import { registerStringBlocks } from './blocks/string'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAllBlocks(Blockly: any) {
  registerDataBlocks(Blockly)
  registerLiteralBlocks(Blockly)
  registerLogicBlocks(Blockly)
  registerMathBlocks(Blockly)
  registerStringBlocks(Blockly)
  registerArrayBlocks(Blockly)
  registerDateTimeBlocks(Blockly)
  registerConversionBlocks(Blockly)
  registerOtherBlocks(Blockly)
}
