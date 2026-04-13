import type {
  Account,
  Channel,
  ChannelCreate,
  ChannelUpdate,
  ChannelApiOptions,
  ChannelListItem,
  ChannelMarket,
  ChannelPaymentMethod,
  Currency,
  Market,
  Language,
  MailTypeId,
  MailTextsResponse,
  MailTextsUpdateRequest,
  MailPreviewRequest,
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
        const formData = new FormData();

        // Scan a settings object for File values; append each as a multipart
        // part keyed `<prefix>.<fieldName>` and blank the matching value in
        // the JSON payload so the API substitutes it with the uploaded blob.
        function extractFiles<T extends Record<string, unknown> | undefined>(
          settings: T,
          prefix: string,
        ): Record<string, unknown> | undefined {
          if (!settings) return settings;
          const sanitized: Record<string, unknown> = { ...settings };
          for (const [key, value] of Object.entries(settings)) {
            if (value instanceof File) {
              formData.append(`${prefix}.${key}`, value, value.name);
              sanitized[key] = '';
            }
          }
          return sanitized;
        }

        const storefrontSettings = extractFiles(
          data.storefrontSettings as Record<string, unknown> | undefined,
          'storefrontSettings',
        );
        const mailSettings = extractFiles(
          data.mailSettings as Record<string, unknown> | undefined,
          'mailSettings',
        );

        const jsonPayload: ChannelUpdate = {
          ...data,
          ...(storefrontSettings !== undefined
            ? { storefrontSettings: storefrontSettings as ChannelUpdate['storefrontSettings'] }
            : {}),
          ...(mailSettings !== undefined
            ? { mailSettings: mailSettings as ChannelUpdate['mailSettings'] }
            : {}),
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
            mailType: MailTypeId,
            language: string,
          ): Promise<MailTextsResponse> {
            return await fetch<MailTextsResponse>(
              `${CHANNEL_ENDPOINT}/${channelId}/mail/${mailType}`,
              { query: { language } },
            );
          },
          async updateTexts(
            mailType: MailTypeId,
            data: MailTextsUpdateRequest,
          ): Promise<MailTextsResponse> {
            return await fetch<MailTextsResponse>(
              `${CHANNEL_ENDPOINT}/${channelId}/mail/${mailType}`,
              { method: 'PATCH', body: data },
            );
          },
          /**
           * Preview endpoint returns rendered HTML as `text/html` — caller
           * receives the raw HTML string to inject into a sandboxed iframe.
           */
          async preview(
            mailType: MailTypeId,
            data: MailPreviewRequest,
          ): Promise<string> {
            return await fetch<string>(
              `${CHANNEL_ENDPOINT}/${channelId}/mail/${mailType}/preview`,
              { method: 'POST', body: data },
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
