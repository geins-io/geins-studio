import type {
  Channel,
  ChannelCreate,
  ChannelUpdate,
  ChannelApiOptions,
  Market,
  Language,
  ChannelPaymentMethod,
  ChannelMailType,
  ChannelMailSettings,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/account';
const CHANNEL_ENDPOINT = `${BASE_ENDPOINT}/channel`;

/**
 * Repository for managing channel operations.
 *
 * Provides full CRUD for channels and sub-resources scoped to a specific channel (markets, payments, mail).
 *
 * File uploads (storefront logos etc.) use uploadStorefrontFiles() — a separate
 * multipart method where each file part's name matches its dot-notation schema path.
 */
export function channelRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const channelRepo = repo.entity<
    Channel,
    ChannelCreate,
    ChannelUpdate,
    ChannelApiOptions
  >(CHANNEL_ENDPOINT, fetch);

  return {
    channel: {
      ...channelRepo,

      async update(
        id: string,
        data: ChannelUpdate,
        options?: ChannelApiOptions,
      ): Promise<Channel> {
        const fileEntries = Object.entries(
          data.storefrontSettings ?? {},
        ).filter((entry): entry is [string, File] => entry[1] instanceof File);

        // File part name must be the full JSON path: "storefrontSettings.{fieldKey}"
        // The field must also exist in the JSON payload's storefrontSettings as "" so
        // the backend knows where to write the blob URL back.
        const formData = new FormData();
        const settingsPayload: Record<string, unknown> = {
          ...(data.storefrontSettings ?? {}),
        };

        for (const [key, file] of fileEntries) {
          formData.append(`storefrontSettings.${key}`, file, file.name);
          settingsPayload[key] = '';
        }

        const jsonPayload: ChannelUpdate = {
          ...data,
          storefrontSettings: settingsPayload,
        };
        formData.append('channel', JSON.stringify(jsonPayload));

        return await fetch<Channel>(`${CHANNEL_ENDPOINT}/${id}`, {
          method: 'PATCH',
          body: formData,
          query: buildQueryObject(options),
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
        async resetStorefrontSchema(): Promise<Channel> {
          return await fetch<Channel>(
            `${CHANNEL_ENDPOINT}/${channelId}/resetStorefrontSchema`,
            { method: 'POST' },
          );
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
