import { accountRepo } from './repositories/account';
import { changelogRepo } from './repositories/changelog';
import { customerRepo } from './repositories/customer';
import { entityRepo, entityRepoFor } from './repositories/entity';
import { entityBaseRepo } from './repositories/entity-base';
import { orchestratorRepo } from './repositories/orchestrator';
import { orderRepo } from './repositories/order';
import { productRepo } from './repositories/product';
import { userRepo } from './repositories/user';
import { workflowRepo } from './repositories/workflow';

export const repo = {
  account: accountRepo,
  entityBase: entityBaseRepo,
  entity: entityRepo,
  entityFor: entityRepoFor,
  product: productRepo,
  user: userRepo,
  customer: customerRepo,
  order: orderRepo,
  changelog: changelogRepo,
  orchestrator: orchestratorRepo,
  workflow: workflowRepo,
};
