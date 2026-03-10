/**
 * Parsed shape of a single change recorded in a ChangelogEntry's `changes` field.
 * p = property name, c = change values (e.g. [fromValue, toValue] for transitions)
 */
export interface ChangelogChange {
  p: string;
  c: string[];
}

/**
 * A single entry returned by GET /changelog/{entity}/{entityId}
 */
export interface ChangelogEntry {
  id: string;
  changeDate: string;
  action: string;
  entity: string;
  entityId: string;
  subEntity?: string | null;
  identity?: string | null;
  changes?: string | null;
  source?: string | null;
  correlationId?: string | null;
  channel?: string | null;
  environment?: string | null;
}
