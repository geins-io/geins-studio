import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Updater } from '@tanstack/vue-table';
import type { Ref } from 'vue';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 *
 * @param updaterOrValue
 * @param ref
 */
export function valueUpdater<T extends Updater<unknown>>(
  updaterOrValue: T,
  ref: Ref,
) {
  ref.value =
    typeof updaterOrValue === 'function'
      ? updaterOrValue(ref.value)
      : updaterOrValue;
}

/**
 * Generates a unique internal ID for tracking UI elements
 * @returns A unique string identifier
 */
export function generateInternalId(): string {
  return `internal_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Returns a person's full name from an entity with firstName/lastName fields.
 * Handles null/undefined entity and missing name parts gracefully.
 */
export function fullName(
  entity?: { _id?: string; firstName?: string; lastName?: string } | null,
): string {
  return (
    `${entity?.firstName || ''} ${entity?.lastName || ''}`.trim() ||
    entity?._id ||
    ''
  );
}

/**
 * Returns the name of an entity given its ID from a list of entities.
 * @returns {string}
 */
export function getEntityNameById(
  id: string,
  all: EntityBaseWithName[],
): string {
  const entity = all.find((pl) => pl._id === id);
  return entity?.displayName || entity?.name || id;
}
