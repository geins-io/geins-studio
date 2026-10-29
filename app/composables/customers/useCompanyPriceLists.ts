import type {
  CompanyPriceListEntry,
  CustomerCompanyBase,
  CustomerPriceList,
  ProductPriceList,
  ProductPriceListApiOptions,
  ProductPriceListCreate,
} from '#shared/types';
import {
  companyPriceListCreateBody,
  companyPriceListUpdateBody,
  getCompanyPriceListSaveAction,
  isCompanyPriceListEntryDirty,
  type CompanyPriceListSaveAction,
} from '#shared/utils/price-list';

export type CompanyPriceListSlot = Pick<
  CompanyPriceListEntry,
  'channel' | 'currency'
>;

export interface UseCompanyPriceListsOptions {
  companyId: MaybeRefOrGetter<string>;
  /** The saved company: its name, external id and channels name new lists. */
  company: MaybeRefOrGetter<
    Partial<Pick<CustomerCompanyBase, 'name' | 'externalId' | 'channels'>>
  >;
  /** Runs after each list saves, before the next one, e.g. to re-seed its editor. */
  onSaved?: (
    entry: CompanyPriceListEntry,
    saved: ProductPriceList,
    action: CompanyPriceListSaveAction,
  ) => Promise<void> | void;
}

export interface UseCompanyPriceListsReturnType {
  // State
  entries: Ref<CompanyPriceListEntry[]>;
  hasChanges: ComputedRef<boolean>;

  // Methods
  merge: (lists: CustomerPriceList[]) => string[];
  addDraft: (slot: CompanyPriceListSlot, active?: boolean) => string;
  removeDraft: (key: string) => void;
  seedFor: (slot: CompanyPriceListSlot) => ProductPriceListCreate;
  save: () => Promise<boolean>;
}

// Rules and the selection come back, so an editor can re-seed rule `_id`s.
const SAVE_OPTIONS: ProductPriceListApiOptions = {
  fields: ['rules', 'selectionquery'],
};

const serverFields = (list: CustomerPriceList) => ({
  saved: list,
  channel: String(list.channel),
  currency: list.currency,
  active: list.active,
  readOnly: list.readOnly,
  productCount: list.productCount,
});

/**
 * The company's own price lists on its Pricing tab — saved ones and unsaved
 * drafts — and the "Save company" step that saves them before the company.
 */
export function useCompanyPriceLists({
  companyId,
  company,
  onSaved,
}: UseCompanyPriceListsOptions): UseCompanyPriceListsReturnType {
  const { productApi } = useGeinsRepository();
  const accountStore = useAccountStore();
  const { geinsLogError } = useGeinsLog(
    'composables/customers/useCompanyPriceLists',
  );

  const entries = ref<CompanyPriceListEntry[]>([]);
  const hasChanges = computed(() =>
    entries.value.some(isCompanyPriceListEntryDirty),
  );

  /**
   * Takes in the company's own lists after a load or reload. Entries keep their
   * unsaved switch change and content; drafts stay. Returns the keys of entries
   * whose list is gone (e.g. taken over by an ERP import), so their sub view
   * can close.
   */
  const merge = (lists: CustomerPriceList[]): string[] => {
    const removed = entries.value
      .filter(
        (entry) =>
          entry.saved && !lists.some((list) => list._id === entry.saved?._id),
      )
      .map((entry) => entry.key);
    const saved = lists.map((list) => {
      const entry = entries.value.find((e) => e.saved?._id === list._id);
      if (!entry) {
        return { key: list._id, ...serverFields(list), contentDirty: false };
      }
      const toggled = entry.active !== entry.saved?.active;
      const active = entry.active;
      Object.assign(entry, serverFields(list));
      if (toggled && !list.readOnly) entry.active = active;
      return entry;
    });
    entries.value = [...saved, ...entries.value.filter((e) => !e.saved)];
    return removed;
  };

  const addDraft = (
    { channel, currency }: CompanyPriceListSlot,
    active = true,
  ): string => {
    const key = `draft-${generateInternalId()}`;
    entries.value.push({
      key,
      channel,
      currency,
      active,
      readOnly: false,
      productCount: 0,
      contentDirty: false,
    });
    return key;
  };

  const removeDraft = (key: string) => {
    entries.value = entries.value.filter((e) => e.saved || e.key !== key);
  };

  const createOptions = ({ channel, currency }: CompanyPriceListSlot) => {
    const { name, externalId, channels = [] } = toValue(company);
    return {
      companyId: toValue(companyId),
      companyName: name ?? '',
      externalId,
      channel,
      // Lists in two channels would otherwise share a name and identifier.
      channelName:
        channels.length > 1
          ? accountStore.getChannelNameById(channel)
          : undefined,
      currency,
    };
  };

  const seedFor = (slot: CompanyPriceListSlot) =>
    companyPriceListCreateBody(createOptions(slot));

  const saveEntry = async (entry: CompanyPriceListEntry) => {
    const { saved: list, active, contentDirty } = entry;
    const action = list
      ? getCompanyPriceListSaveAction(list, active, contentDirty)
      : 'create';
    if (action === 'none') return;
    const content = contentDirty ? entry.content : undefined;
    const saved = list
      ? ((await productApi.priceList.update(
          list._id,
          companyPriceListUpdateBody(list, active, content),
          SAVE_OPTIONS,
        )) ?? (await productApi.priceList.get(list._id, SAVE_OPTIONS)))
      : await productApi.priceList.create(
          companyPriceListCreateBody({
            ...createOptions(entry),
            active,
            content,
          }),
          SAVE_OPTIONS,
        );
    Object.assign(entry, serverFields(saved), { contentDirty: false });
    // The list is saved either way, so a failing follow-up (an editor re-seed,
    // a counts refresh) mustn't stop the rest of the save.
    try {
      await onSaved?.(entry, saved, action);
    } catch (error) {
      geinsLogError('error after saving company price list:', error);
    }
  };

  /**
   * Saves the dirty lists one at a time, in table order. Stops at the first
   * failure (the global API error toast says why); the lists saved before it
   * are clean, so a retry only re-sends the rest.
   */
  const save = async (): Promise<boolean> => {
    for (const entry of entries.value) {
      if (!isCompanyPriceListEntryDirty(entry)) continue;
      try {
        await saveEntry(entry);
      } catch (error) {
        geinsLogError('error saving company price list:', error);
        return false;
      }
    }
    return true;
  };

  return {
    entries,
    hasChanges,
    merge,
    addDraft,
    removeDraft,
    seedFor,
    save,
  };
}
