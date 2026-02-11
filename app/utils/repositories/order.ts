import type {
  Order,
  OrderBatchQuery,
  BatchQueryResult,
  Quotation,
  QuotationApiOptions,
  QuotationStatus,
} from '#shared/types';
import { entityGetRepo } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/order';

/**
 * Dummy quotation data generator
 * TODO: Replace with real API endpoint when available
 */
function generateDummyQuotations(): Quotation[] {
  const statuses: QuotationStatus[] = [
    'draft',
    'pending',
    'sent',
    'accepted',
    'rejected',
    'expired',
  ];
  const accounts = [
    { id: 'acc-001', name: 'Acme Corporation' },
    { id: 'acc-002', name: 'TechStart AB' },
    { id: 'acc-003', name: 'Global Trading Ltd' },
    { id: 'acc-004', name: 'Nordic Solutions' },
    { id: 'acc-005', name: 'Modern Retail Co' },
  ];
  const channels = ['web', 'retail', 'wholesale', 'mobile'];
  const currencies = ['SEK', 'EUR', 'USD', 'NOK'];
  const creators = ['John Doe', 'Jane Smith', 'Alex Johnson', 'Maria Garcia'];

  return Array.from({ length: 25 }, (_, i) => {
    const account = accounts[i % accounts.length]!;
    const status = statuses[i % statuses.length]!;
    const itemCount = Math.floor(Math.random() * 10) + 1;
    const sumAmount = Math.floor(Math.random() * 50000) + 1000;
    const currency = currencies[i % currencies.length]!;
    const daysAgo = Math.floor(Math.random() * 90);
    const expirationDays = Math.floor(Math.random() * 60) + 1;
    const dateCreated = new Date(
      Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    ).toISOString();
    const dateModified = new Date(
      Date.now() - Math.floor(daysAgo / 2) * 24 * 60 * 60 * 1000,
    ).toISOString();
    const expirationDate = new Date(
      new Date(dateCreated).getTime() + expirationDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
      _id: `quote-${String(i + 1).padStart(3, '0')}`,
      _type: 'quotation',
      name: `Quote ${String(i + 1).padStart(4, '0')}`,
      status,
      accountId: account.id,
      accountName: account.name,
      dateCreated,
      dateModified,
      sum: {
        price: sumAmount.toString(),
        currency,
      },
      expirationDate,
      itemCount,
      createdBy: creators[i % creators.length],
      channel: channels[i % channels.length],
      currency,
      notes: i % 3 === 0 ? 'Urgent delivery required' : undefined,
    } as Quotation;
  });
}

/**
 * Repository for managing order operations
 */
export function orderRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const orderEndpoint = BASE_ENDPOINT;

  // Use entityGetRepo as base for single order retrieval
  const baseRepo = entityGetRepo<Order, OrderApiOptions>(orderEndpoint, fetch);

  return {
    ...baseRepo,

    /**
     * Query orders with batch filtering
     */
    async query(
      batchQuery: OrderBatchQuery,
      options?: OrderApiOptions,
    ): Promise<BatchQueryResult<Order>> {
      return await fetch<BatchQueryResult<Order>>(`${orderEndpoint}/query`, {
        method: 'POST',
        body: batchQuery,
        query: buildQueryObject(options),
      });
    },

    /**
     * Ping endpoint to check service availability
     */
    async ping(): Promise<void> {
      await fetch<null>(`${orderEndpoint}/ping`);
    },

    /**
     * Quotation repository with dummy data
     * TODO: Replace with real API endpoint when available
     */
    quotation: {
      /**
       * List all quotations
       * Returns dummy data until real endpoint is available
       */
      async list(options?: QuotationApiOptions): Promise<Quotation[]> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 300));
        return generateDummyQuotations();
      },

      /**
       * Get single quotation by ID
       * Returns dummy data until real endpoint is available
       */
      async get(id: string, options?: QuotationApiOptions): Promise<Quotation> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 200));
        const quotations = generateDummyQuotations();
        const quotation = quotations.find((q) => q._id === id);
        if (!quotation) {
          throw new Error(`Quotation with ID ${id} not found`);
        }
        return quotation;
      },
    },
  };
}
