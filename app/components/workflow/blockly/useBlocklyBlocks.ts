import type { ManifestExpressionFunction } from '#shared/types';
import { registerArrayBlocks } from './blocks/array';
import { registerConversionBlocks } from './blocks/conversion';
import { registerDataBlocks } from './blocks/data';
import { registerDateTimeBlocks } from './blocks/datetime';
import { registerGenericFunctionBlocks } from './blocks/generic';
import { registerLiteralBlocks } from './blocks/literals';
import { registerLogicBlocks } from './blocks/logic';
import { registerMathBlocks } from './blocks/math';
import { registerOtherBlocks } from './blocks/other';
import { registerStringBlocks } from './blocks/string';
import { BESPOKE_FUNCTION_NAMES } from './useBlocklyParser';
import type { ExpressionCompletion } from '../shared/ExpressionInput.vue';
import type { Ref } from 'vue';

export interface BlocklyContext {
  completions: Ref<ExpressionCompletion[]>;
  expressionFunctions?: ManifestExpressionFunction[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerAllBlocks(Blockly: any, ctx: BlocklyContext) {
  registerDataBlocks(Blockly, ctx);
  registerLiteralBlocks(Blockly);
  registerLogicBlocks(Blockly);
  registerMathBlocks(Blockly);
  registerStringBlocks(Blockly);
  registerArrayBlocks(Blockly);
  registerDateTimeBlocks(Blockly);
  registerConversionBlocks(Blockly);
  registerOtherBlocks(Blockly);
  registerGenericFunctionBlocks(
    Blockly,
    ctx.expressionFunctions ?? [],
    BESPOKE_FUNCTION_NAMES,
  );
}
