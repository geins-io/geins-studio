export interface ChangelogChange {
  p: string;
  c: string[];
}

export interface ChangelogEntry {
  id: string | number;
  changeDate: string;
  action: string;
  entity: string;
  entityId: string;
  subEntity?: string;
  identity?: string;
  changes?: string;
  source?: string;
  correlationId?: string;
  channel?: string;
  environment?: string;
}
