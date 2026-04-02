import { changelogRepo } from './repositories/changelog';
import { channelRepo } from './repositories/channel';
import { customerRepo } from './repositories/customer';
import { entityRepo } from './repositories/entity';
import { entityBaseRepo } from './repositories/entity-base';
import { globalRepo } from './repositories/global';
import { orchestratorRepo } from './repositories/orchestrator';
import { orderRepo } from './repositories/order';
import { productRepo } from './repositories/product';
import { userRepo } from './repositories/user';
import { workflowRepo } from './repositories/workflow';

export const repo = {
  global: globalRepo,
  entityBase: entityBaseRepo,
  entity: entityRepo,
  channel: channelRepo,
  product: productRepo,
  user: userRepo,
  customer: customerRepo,
  order: orderRepo,
  changelog: changelogRepo,
  orchestrator: orchestratorRepo,
  workflow: workflowRepo,
};
