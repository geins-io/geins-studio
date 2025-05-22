import { entityBaseRepo } from './repositories/entity-base';
import { entityRepo } from './repositories/entity';
import { wholesaleRepo } from './repositories/wholesale';
import { globalRepo } from './repositories/global';
import { userRepo } from './repositories/user';
import { customerRepo } from './repositories/customer';

export const repo = {
  global: globalRepo,
  entityBase: entityBaseRepo,
  entity: entityRepo,
  wholesale: wholesaleRepo,
  user: userRepo,
  customer: customerRepo,
};
