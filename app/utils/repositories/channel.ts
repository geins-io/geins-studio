import type {
  Channel,
  ChannelUpdate,
  ChannelApiOptions,
  Market,
  Language,
  ChannelPaymentMethod,
  ChannelMailType,
  ChannelMailSettings,
} from '#shared/types';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/account';
const CHANNEL_ENDPOINT = `${BASE_ENDPOINT}/channel`;

/**
 * Repository for managing channel operations.
 *
 * Provides full CRUD for channels, activate/deactivate actions,
 * and sub-resources scoped to a specific channel (markets, payments, mail).
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

      async update(id: string, data: ChannelUpdate): Promise<Channel> {
        // File upload: each file part's name matches its dot-notation schema path
        // (e.g. "baseSettings.logotype"). Backend detects file parts by Content-Type,
        // writes to blob storage, and sets the field to the resulting URL.
        const formData = new FormData();
        const nonFileSettings: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(
          data.storefrontSettings ?? {},
        )) {
          if (value instanceof File) {
            formData.append(key, value, value.name);
          } else {
            nonFileSettings[key] = value;
          }
        }

        // Non-file fields alongside file parts — confirm exact format with backend
        // once the file upload endpoint is live (see STU-147).
        const jsonPayload: ChannelUpdate = {
          ...data,
          storefrontSettings: nonFileSettings,
        };
        formData.append('channel', JSON.stringify(jsonPayload));

        return await fetch<Channel>(`${CHANNEL_ENDPOINT}/${id}`, {
          method: 'PATCH',
          body: formData,
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
