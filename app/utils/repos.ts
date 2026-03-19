import { changelogRepo } from './repositories/changelog';
import { customerRepo } from './repositories/customer';
import { entityRepo } from './repositories/entity';
import { entityBaseRepo } from './repositories/entity-base';
import { globalRepo } from './repositories/global';
import { orderRepo } from './repositories/order';
import { productRepo } from './repositories/product';
import { userRepo } from './repositories/user';
import { workflowRepo } from './repositories/workflow';

export const repo = {
  global: globalRepo,
  entityBase: entityBaseRepo,
  entity: entityRepo,
  product: productRepo,
  user: userRepo,
  customer: customerRepo,
  order: orderRepo,
  changelog: changelogRepo,
  workflow: workflowRepo,
};
