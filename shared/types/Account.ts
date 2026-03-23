import type { EntityBase } from './Global';

export interface Account extends EntityBase {
  accountKey: string;
  name: string;
  defaultCurrency: string;
}
