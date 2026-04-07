// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildChannel,
  buildChannelCreate,
  buildChannelLanguage,
  buildChannelListItem,
  buildChannelMarket,
  buildChannelPaymentMethod,
  buildChannelUpdate,
  buildMailType,
  resetIdCounter,
} from '../../../../test/fixtures';
import { channelRepo } from '../channel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockFetch: any = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  resetIdCounter();
});

describe('channelRepo', () => {
  const api = channelRepo(mockFetch);

  // ===========================================================================
  // Channel CRUD
  // ===========================================================================
  describe('channel CRUD', () => {
    it('channel.list() calls GET /account/channel/list', async () => {
      const items = [buildChannelListItem()];
      mockFetch.mockResolvedValue(items);
      const result = await api.channel.list();
      expect(mockFetch).toHaveBeenCalledWith('/account/channel/list', {
        query: undefined,
      });
      expect(result).toEqual(items);
    });

    it('channel.get() calls GET /account/channel/:id', async () => {
      const channel = buildChannel();
      mockFetch.mockResolvedValue(channel);
      const result = await api.channel.get('123');
      expect(mockFetch).toHaveBeenCalledWith('/account/channel/123', {
        query: undefined,
      });
      expect(result).toEqual(channel);
    });

    it('channel.list() passes fields as query params', async () => {
      mockFetch.mockResolvedValue([buildChannelListItem()]);
      await api.channel.list({ fields: ['languages', 'markets'] });
      expect(mockFetch).toHaveBeenCalledWith('/account/channel/list', {
        query: { fields: 'languages,markets' },
      });
    });

    it('channel.get() passes fields as query params', async () => {
      mockFetch.mockResolvedValue(buildChannel());
      await api.channel.get('123', { fields: ['languages', 'markets'] });
      expect(mockFetch).toHaveBeenCalledWith('/account/channel/123', {
        query: { fields: 'languages,markets' },
      });
    });

    it('channel.create() calls POST /account/channel with body', async () => {
      const data = buildChannelCreate();
      const response = buildChannel();
      mockFetch.mockResolvedValue(response);
      const result = await api.channel.create(data);
      expect(mockFetch).toHaveBeenCalledWith('/account/channel', {
        method: 'POST',
        body: data,
      });
      expect(result).toEqual(response);
    });

    it('channel.update() calls PATCH /account/channel/:id with multipart/form-data', async () => {
      const data = buildChannelUpdate();
      const response = buildChannel();
      mockFetch.mockResolvedValue(response);
      await api.channel.update('123', data);

      expect(mockFetch).toHaveBeenCalledWith('/account/channel/123', {
        method: 'PATCH',
        body: expect.any(FormData),
      });
    });

  });

  // ===========================================================================
  // Multipart/form-data (update)
  // ===========================================================================
  describe('multipart/form-data update', () => {
    it('wraps JSON payload in a part named "channel"', async () => {
      const data = buildChannelUpdate({ name: 'updated' });
      mockFetch.mockResolvedValue(buildChannel());
      await api.channel.update('123', data);

      const formData: FormData = mockFetch.mock.calls[0][1].body;
      const channelPart = formData.get('channel');
      expect(channelPart).toBeDefined();
      const parsed = JSON.parse(channelPart as string);
      expect(parsed.name).toBe('updated');
    });

    it('attaches File values as separate parts', async () => {
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const data = buildChannelUpdate({
        name: 'updated',
        storefrontSettings: { logotype: file as unknown as string },
      });
      mockFetch.mockResolvedValue(buildChannel());
      await api.channel.update('123', data);

      const formData: FormData = mockFetch.mock.calls[0][1].body;
      // File should be a separate part keyed by storefrontSettings.{fieldKey}
      expect(formData.get('storefrontSettings.logotype')).toBeInstanceOf(File);
      // JSON part should have the field cleared to empty string
      const parsed = JSON.parse(formData.get('channel') as string);
      expect(parsed.storefrontSettings.logotype).toBe('');
      expect(parsed.name).toBe('updated');
    });

    it('non-file fields are serialized into the "channel" JSON part', async () => {
      const data = buildChannelUpdate({
        name: 'Test Name',
        active: false,
      });
      mockFetch.mockResolvedValue(buildChannel());
      await api.channel.update('123', data);

      const formData: FormData = mockFetch.mock.calls[0][1].body;
      const parsed = JSON.parse(formData.get('channel') as string);
      expect(parsed.name).toBe('Test Name');
      expect(parsed.active).toBe(false);
    });
  });

  // ===========================================================================
  // Sub-resources (top-level)
  // ===========================================================================
  describe('top-level sub-resources', () => {
    it('market.list() calls GET /account/market/list', async () => {
      const markets = [buildChannelMarket()];
      mockFetch.mockResolvedValue(markets);
      const result = await api.market.list();
      expect(mockFetch).toHaveBeenCalledWith('/account/market/list');
      expect(result).toEqual(markets);
    });

    it('language.list() calls GET /account/language/list', async () => {
      const languages = [buildChannelLanguage()];
      mockFetch.mockResolvedValue(languages);
      const result = await api.language.list();
      expect(mockFetch).toHaveBeenCalledWith('/account/language/list');
      expect(result).toEqual(languages);
    });

    it('language.get() calls GET /account/language/:id', async () => {
      const language = buildChannelLanguage();
      mockFetch.mockResolvedValue(language);
      const result = await api.language.get('456');
      expect(mockFetch).toHaveBeenCalledWith('/account/language/456');
      expect(result).toEqual(language);
    });

    it('payment.list() calls GET /account/payment/list', async () => {
      const payments = [buildChannelPaymentMethod()];
      mockFetch.mockResolvedValue(payments);
      const result = await api.payment.list();
      expect(mockFetch).toHaveBeenCalledWith('/account/payment/list');
      expect(result).toEqual(payments);
    });
  });

  // ===========================================================================
  // Channel-scoped sub-resources
  // ===========================================================================
  describe('channel-scoped sub-resources', () => {
    it('channel.id().market.list() calls GET /account/channel/:id/market/list', async () => {
      const markets = [buildChannelMarket()];
      mockFetch.mockResolvedValue(markets);
      const result = await api.channel.id('123').market.list();
      expect(mockFetch).toHaveBeenCalledWith(
        '/account/channel/123/market/list',
      );
      expect(result).toEqual(markets);
    });

    it('channel.id().payment.list() calls GET /account/channel/:id/payment/list', async () => {
      const payments = [buildChannelPaymentMethod()];
      mockFetch.mockResolvedValue(payments);
      const result = await api.channel.id('123').payment.list();
      expect(mockFetch).toHaveBeenCalledWith(
        '/account/channel/123/payment/list',
      );
      expect(result).toEqual(payments);
    });

    it('channel.id().payment.get() calls GET /account/channel/:id/payment/:paymentId', async () => {
      const payment = buildChannelPaymentMethod();
      mockFetch.mockResolvedValue(payment);
      const result = await api.channel.id('123').payment.get('789');
      expect(mockFetch).toHaveBeenCalledWith(
        '/account/channel/123/payment/789',
      );
      expect(result).toEqual(payment);
    });
  });

  // ===========================================================================
  // Mail endpoints
  // ===========================================================================
  describe('mail endpoints', () => {
    it('channel.id().mail.getTexts() calls GET with language query', async () => {
      const mailType = buildMailType();
      mockFetch.mockResolvedValue(mailType);
      const result = await api.channel
        .id('123')
        .mail.getTexts('OrderConfirmation', 'sv');
      expect(mockFetch).toHaveBeenCalledWith(
        '/account/channel/123/mail/OrderConfirmation',
        { query: { language: 'sv' } },
      );
      expect(result).toEqual(mailType);
    });

    it('channel.id().mail.updateTexts() calls PATCH with body', async () => {
      const mailType = buildMailType();
      const updateData = { displayName: 'Updated Store' };
      mockFetch.mockResolvedValue(mailType);
      const result = await api.channel
        .id('123')
        .mail.updateTexts('OrderConfirmation', updateData);
      expect(mockFetch).toHaveBeenCalledWith(
        '/account/channel/123/mail/OrderConfirmation',
        { method: 'PATCH', body: updateData },
      );
      expect(result).toEqual(mailType);
    });

    it('channel.id().mail.preview() calls POST with language body', async () => {
      mockFetch.mockResolvedValue({ html: '<p>preview</p>' });
      await api.channel.id('123').mail.preview('OrderConfirmation', 'sv');
      expect(mockFetch).toHaveBeenCalledWith(
        '/account/channel/123/mail/OrderConfirmation/preview',
        { method: 'POST', body: { language: 'sv' } },
      );
    });
  });

  // ===========================================================================
  // Error propagation
  // ===========================================================================
  describe('error propagation', () => {
    it('channel.get propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Not found'));
      await expect(api.channel.get('999')).rejects.toThrow('Not found');
    });

    it('channel.update propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Validation failed'));
      const data = buildChannelUpdate();
      await expect(api.channel.update('123', data)).rejects.toThrow(
        'Validation failed',
      );
    });

    it('channel.id().mail.getTexts propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Server error'));
      await expect(
        api.channel.id('123').mail.getTexts('OrderConfirmation', 'sv'),
      ).rejects.toThrow('Server error');
    });

    it('channel.create propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Conflict'));
      await expect(api.channel.create(buildChannelCreate())).rejects.toThrow(
        'Conflict',
      );
    });

    it('market.list propagates fetch errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      await expect(api.market.list()).rejects.toThrow('Network error');
    });
  });
});
