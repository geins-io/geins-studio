import type { StatusBadgeKnownStatus, StatusBadgeStatus } from '#shared/types';
import type { BadgeVariants } from '@/components/ui/badge';

export type StatusBadgeVariant = NonNullable<BadgeVariants['variant']>;

/**
 * Status → tone, from the prototypes' color schema. Seen from the seller:
 * info is the seller's turn, warning needs attention, neutral is idle.
 * A `Record` so a new known status fails typecheck until it gets a tone.
 */
const STATUS_VARIANTS: Record<StatusBadgeKnownStatus, StatusBadgeVariant> = {
  completed: 'positive',
  confirmed: 'positive',
  accepted: 'success',
  enabled: 'success',
  healthy: 'success',
  finalized: 'success-solid',
  pending: 'info',
  sent: 'info',
  partial: 'info',
  'in-progress': 'info',
  requested: 'info-solid',
  expired: 'warning',
  'on-hold': 'warning',
  backorder: 'warning',
  degraded: 'warning',
  canceled: 'danger',
  cancelled: 'danger',
  rejected: 'danger',
  unhealthy: 'danger',
  inactive: 'neutral',
  refunded: 'neutral',
  revised: 'neutral',
  idle: 'neutral',
  draft: 'draft',
};

const isKnownStatus = (status: string): status is StatusBadgeKnownStatus =>
  Object.hasOwn(STATUS_VARIANTS, status);

/** The `Badge` variant for a status; unknown strings render neutral. */
export function statusBadgeVariant(
  status: StatusBadgeStatus,
): StatusBadgeVariant {
  if (typeof status === 'boolean') return status ? 'positive' : 'neutral';
  return isKnownStatus(status) ? STATUS_VARIANTS[status] : 'neutral';
}
