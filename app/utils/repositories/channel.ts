import type {
  Channel,
  ChannelCreate,
  ChannelUpdate,
  ChannelListItem,
  Market,
  Language,
  ChannelPaymentMethod,
  ChannelMailType,
  ChannelMailSettings,
} from '#shared/types';
import { entityBaseRepo } from './entity-base';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/account';
const CHANNEL_ENDPOINT = `${BASE_ENDPOINT}/channel`;

/**
 * Repository for managing channel operations.
 *
 * Provides full CRUD for channels, activate/deactivate actions,
 * and sub-resources scoped to a specific channel (markets, payments, mail).
 *
 * The update endpoint uses multipart/form-data to support file uploads
 * for storefront settings (logos, etc.) alongside JSON data.
 */
export function channelRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const channelBase = entityBaseRepo<ChannelListItem>(CHANNEL_ENDPOINT, fetch);

  return {
    channel: {
      list: channelBase.list,

      async get(id: string): Promise<Channel> {
        return await fetch<Channel>(`${CHANNEL_ENDPOINT}/${id}`);
      },

      async create(data: ChannelCreate): Promise<Channel> {
        return await fetch<Channel>(CHANNEL_ENDPOINT, {
          method: 'POST',
          body: data,
        });
      },

      async update(id: string, data: ChannelUpdate): Promise<Channel> {
        const formData = new FormData();

        // Separate file values from JSON data
        const jsonData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
          if (value instanceof File || value instanceof Blob) {
            formData.append(key, value);
          } else {
            jsonData[key] = value;
          }
        }

        formData.append('channel', JSON.stringify(jsonData));

        return await fetch<Channel>(`${CHANNEL_ENDPOINT}/${id}`, {
          method: 'PATCH',
          body: formData,
        });
      },

      async activate(id: string): Promise<void> {
        await fetch<null>(`${CHANNEL_ENDPOINT}/${id}/activate`, {
          method: 'PUT',
        });
      },

      async deactivate(id: string): Promise<void> {
        await fetch<null>(`${CHANNEL_ENDPOINT}/${id}/deactivate`, {
          method: 'PUT',
        });
      },

      /**
       * Scoped sub-resources for a specific channel.
       */
      id: (channelId: string) => ({
        market: {
          async list(): Promise<Market[]> {
            return await fetch<Market[]>(
              `${CHANNEL_ENDPOINT}/${channelId}/market/list`,
            );
          },
        },
        payment: {
          async list(): Promise<ChannelPaymentMethod[]> {
            return await fetch<ChannelPaymentMethod[]>(
              `${CHANNEL_ENDPOINT}/${channelId}/payment/list`,
            );
          },
          async get(paymentId: string): Promise<ChannelPaymentMethod> {
            return await fetch<ChannelPaymentMethod>(
              `${CHANNEL_ENDPOINT}/${channelId}/payment/${paymentId}`,
            );
          },
        },
        mail: {
          async getTexts(
            mailType: string,
            language: string,
          ): Promise<ChannelMailType> {
            return await fetch<ChannelMailType>(
              `${CHANNEL_ENDPOINT}/${channelId}/mail/${mailType}`,
              { query: { language } },
            );
          },
          async updateTexts(
            mailType: string,
            data: Partial<ChannelMailSettings>,
          ): Promise<ChannelMailType> {
            return await fetch<ChannelMailType>(
              `${CHANNEL_ENDPOINT}/${channelId}/mail/${mailType}`,
              { method: 'PATCH', body: data },
            );
          },
          async preview(mailType: string, language: string): Promise<unknown> {
            return await fetch<unknown>(
              `${CHANNEL_ENDPOINT}/${channelId}/mail/${mailType}/preview`,
              { method: 'POST', body: { language } },
            );
          },
        },
      }),
    },

    // Top-level sub-resources (not scoped to a channel)
    market: {
      async list(): Promise<Market[]> {
        return await fetch<Market[]>(`${BASE_ENDPOINT}/market/list`);
      },
    },
    language: {
      async list(): Promise<Language[]> {
        return await fetch<Language[]>(`${BASE_ENDPOINT}/language/list`);
      },
      async get(id: string): Promise<Language> {
        return await fetch<Language>(`${BASE_ENDPOINT}/language/${id}`);
      },
    },
    payment: {
      async list(): Promise<ChannelPaymentMethod[]> {
        return await fetch<ChannelPaymentMethod[]>(
          `${BASE_ENDPOINT}/payment/list`,
        );
      },
    },
  };
}
