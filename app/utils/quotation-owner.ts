import type {
  EntityBaseWithName,
  QuotationOwner,
  QuotationUpdate,
} from '#shared/types';

/** The owner fields of a create or update request; at most one is set. */
export type QuotationOwnerRequest = Pick<
  QuotationUpdate,
  'ownerId' | 'ownerName'
>;

/**
 * The owner suggestions: the company's sales reps, plus a saved linked owner
 * who isn't one of them (the API takes any user on the account). Left out,
 * that owner's name would resolve as free text and unlink the user on save.
 */
export function quotationOwnerOptions(
  reps: EntityBaseWithName[],
  saved?: QuotationOwner | null,
): EntityBaseWithName[] {
  if (!saved?._id || reps.some((rep) => rep._id === saved._id)) return reps;
  return [...reps, { _id: saved._id, name: saved.name }];
}

/**
 * The saved owner as the field shows it: a listed user's current name, else
 * the snapshot's name.
 */
export function quotationOwnerText(
  saved: QuotationOwner | null | undefined,
  options: readonly EntityBaseWithName[],
): string {
  if (!saved) return '';
  const listed = saved._id
    ? options.find((option) => option._id === saved._id)
    : undefined;
  return listed?.name ?? saved.name ?? '';
}

/** The request fields that keep the saved owner as it is. */
export function savedQuotationOwnerRequest(
  saved?: QuotationOwner | null,
): QuotationOwnerRequest {
  return saved?._id
    ? { ownerId: saved._id, ownerName: undefined }
    : { ownerId: undefined, ownerName: saved?.name || undefined };
}

/**
 * The request fields for the owner field's text. A suggestion picked by hand
 * wins while the text still shows it. Text still showing the saved owner keeps
 * it, so a user or free-text name that shares it can't take over. Otherwise an
 * exact suggestion name is that user, and other text is a free-text name.
 * Blank sends neither: the API can't remove an owner.
 */
export function quotationOwnerRequest(
  text: string | null | undefined,
  options: readonly EntityBaseWithName[],
  saved?: QuotationOwner | null,
  picked?: EntityBaseWithName | null,
): QuotationOwnerRequest {
  const value = text?.trim() ?? '';
  if (picked && value === picked.name.trim()) {
    return { ownerId: picked._id, ownerName: undefined };
  }
  if (value === quotationOwnerText(saved, options).trim()) {
    return savedQuotationOwnerRequest(saved);
  }
  if (!value) return { ownerId: undefined, ownerName: undefined };
  const user = findEntityByName(value, options);
  return user
    ? { ownerId: user._id, ownerName: undefined }
    : { ownerId: undefined, ownerName: value };
}
