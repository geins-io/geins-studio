import type { ResponseEntity } from './Global';

export interface AccountUrl {
  name: string;
  url: string;
}

export interface AccountBase {
  accountKey: string;
  identifier: string;
  name: string;
  defaultCurrency: string;
  status: string;
  createdDate: string;
  modifiedDate: string;
  ownerUserName: string;
  urls: AccountUrl[];
}

export type Account = ResponseEntity<AccountBase>;
