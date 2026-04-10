import type {
  Account,
  Channel,
  ChannelCreate,
  ChannelUpdate,
  ChannelApiOptions,
  ChannelListItem,
  ChannelMarket,
  ChannelPaymentMethod,
  ChannelMailType,
  ChannelMailSettings,
  Currency,
  Market,
  Language,
} from '#shared/types';
import { buildQueryObject } from '#shared/utils/api-query';
import type { NitroFetchRequest, $Fetch } from 'nitropack';

const BASE_ENDPOINT = '/account';
const CHANNEL_ENDPOINT = `${BASE_ENDPOINT}/channel`;

/**
 * Unified repository for all account-scoped endpoints.
 *
 * Owns every `/account/...` endpoint: account details, channel CRUD with
 * scoped sub-resources, and global list data (currencies, languages, markets).
 *
 * File uploads (storefront logos etc.) use the custom `channel.update()` —
 * a multipart method where each file part's name matches its dot-notation schema path.
 */
export function accountRepo(fetch: $Fetch<unknown, NitroFetchRequest>) {
  const channelEntityRepo = repo.entity<
    Channel,
    ChannelCreate,
    ChannelUpdate,
    ChannelApiOptions
  >(CHANNEL_ENDPOINT, fetch);

  return {
    account: {
      async get(): Promise<Account> {
        return await fetch<Account>(BASE_ENDPOINT);
      },
    },

    channel: {
      ...channelEntityRepo,

      async list(options?: ChannelApiOptions): Promise<ChannelListItem[]> {
        return await fetch<ChannelListItem[]>(`${CHANNEL_ENDPOINT}/list`, {
          query: buildQueryObject(options),
        });
      },

      async update(
        id: string,
        data: ChannelUpdate,
        options?: ChannelApiOptions,
      ): Promise<Channel> {
        const fileEntries = Object.entries(
          data.storefrontSettings ?? {},
        ).filter((entry): entry is [string, File] => entry[1] instanceof File);

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
          async list(): Promise<ChannelMarket[]> {
            return await fetch<ChannelMarket[]>(
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

    currency: {
      async list(): Promise<Currency[]> {
        return await fetch<Currency[]>(`${BASE_ENDPOINT}/currency/list`);
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

    market: {
      async list(): Promise<Market[]> {
        return await fetch<Market[]>(`${BASE_ENDPOINT}/market/list`);
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
