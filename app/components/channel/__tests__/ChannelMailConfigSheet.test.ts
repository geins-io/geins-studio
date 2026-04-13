/* eslint-disable import/order, import/first */
import { mockNuxtImport } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  buildMailType,
  buildMailTextEntry,
} from '../../../../test/fixtures';
import { mountWithContext } from '../../../../test/helpers';

const { mailApi } = vi.hoisted(() => ({
  mailApi: {
    getTexts: vi.fn(),
    updateTexts: vi.fn(),
    preview: vi.fn(),
  },
}));

mockNuxtImport('useGeinsRepository', () => () => ({
  accountApi: {
    channel: {
      id: () => ({ mail: mailApi }),
    },
  },
}));

import ChannelMailConfigSheet from '../ChannelMailConfigSheet.vue';

const baseProps = {
  channelId: 'ch-1',
  mailType: buildMailType(),
  languages: [{ _id: 'en', _type: 'language', name: 'English', active: true }],
  defaultLanguage: 'en',
  open: true,
};

beforeEach(() => {
  mailApi.getTexts.mockReset();
  mailApi.updateTexts.mockReset();
  mailApi.preview.mockReset();
});

async function flush() {
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));
}

describe('ChannelMailConfigSheet', () => {
  it('fetches texts when opened', async () => {
    mailApi.getTexts.mockResolvedValue({
      mailType: 'OrderConfirmation',
      language: 'en',
      texts: [buildMailTextEntry()],
    });
    await mountWithContext(ChannelMailConfigSheet, {
      props: baseProps as Record<string, unknown>,
    });
    await flush();
    expect(mailApi.getTexts).toHaveBeenCalledWith('OrderConfirmation', 'en');
  });

  it('save payload includes only changed keys plus language', async () => {
    mailApi.getTexts.mockResolvedValue({
      mailType: 'OrderConfirmation',
      language: 'en',
      texts: [
        buildMailTextEntry({
          key: 'SUBJECT',
          overrideValue: 'Old',
          isOverridden: true,
        }),
        buildMailTextEntry({
          key: 'BODY',
          overrideValue: null,
          isOverridden: false,
        }),
      ],
    });
    mailApi.updateTexts.mockResolvedValue({
      mailType: 'OrderConfirmation',
      language: 'en',
      texts: [],
    });

    await mountWithContext(ChannelMailConfigSheet, {
      props: baseProps as Record<string, unknown>,
    });
    await flush();

    // Sheet content is teleported to document.body via DialogPortal.
    const textareas = document.body.querySelectorAll('textarea');
    const subjectTextarea = textareas[0] as HTMLTextAreaElement;
    subjectTextarea.value = 'New';
    subjectTextarea.dispatchEvent(new Event('input', { bubbles: true }));
    await flush();

    const buttons = Array.from(document.body.querySelectorAll('button'));
    const saveBtn = buttons.find((b) => b.textContent?.trim() === 'save');
    saveBtn!.click();
    await flush();

    expect(mailApi.updateTexts).toHaveBeenCalledWith('OrderConfirmation', {
      language: 'en',
      texts: { SUBJECT: 'New' },
    });
  });

  it('restore-to-default sends an empty string for every overridden key', async () => {
    mailApi.getTexts.mockResolvedValue({
      mailType: 'OrderConfirmation',
      language: 'en',
      texts: [
        buildMailTextEntry({
          key: 'SUBJECT',
          overrideValue: 'Custom',
          isOverridden: true,
        }),
        buildMailTextEntry({
          key: 'FOOTER',
          overrideValue: null,
          isOverridden: false,
        }),
      ],
    });
    mailApi.updateTexts.mockResolvedValue({
      mailType: 'OrderConfirmation',
      language: 'en',
      texts: [],
    });

    await mountWithContext(ChannelMailConfigSheet, {
      props: baseProps as Record<string, unknown>,
    });
    await flush();

    const buttons = Array.from(document.body.querySelectorAll('button'));
    const restoreBtn = buttons.find(
      (b) => b.textContent?.includes('restore_defaults'),
    );
    restoreBtn!.click();
    await flush();

    expect(mailApi.updateTexts).toHaveBeenCalled();
    const [, payload] = mailApi.updateTexts.mock.calls[0]!;
    expect(payload.language).toBe('en');
    expect(payload.texts.SUBJECT).toBe('');
    expect(payload.texts.FOOTER).toBeUndefined();
  });
});
