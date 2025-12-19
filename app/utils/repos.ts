import { entityBaseRepo } from './repositories/entity-base';
import { entityRepo } from './repositories/entity';
import { wholesaleRepo } from './repositories/wholesale';
import { customersRepo } from './repositories/customers';
import { pricingRepo } from './repositories/pricing';
import { productRepo } from './repositories/product';
import { globalRepo } from './repositories/global';
import { userRepo } from './repositories/user';
import { customerRepo } from './repositories/customer';
import { orderRepo } from './repositories/order';

export const repo = {
  global: globalRepo,
  entityBase: entityBaseRepo,
  entity: entityRepo,
  wholesale: wholesaleRepo,
  customers: customersRepo,
  pricing: pricingRepo,
  product: productRepo,
  user: userRepo,
  customer: customerRepo,
  order: orderRepo,
};
