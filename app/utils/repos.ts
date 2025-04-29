import { entityRepo } from './repositories/entity';
import { wholesaleRepo } from './repositories/wholesale';
import { globalRepo } from './repositories/global';

export const repo = {
  global: globalRepo,
  entity: entityRepo,
  wholesale: wholesaleRepo,
};
