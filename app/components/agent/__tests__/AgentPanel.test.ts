/* eslint-disable import/order, import/first */
import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, it, expect, vi } from 'vitest';
import { computed, ref } from 'vue';
import type { AgentChatItem } from '#shared/types';

const { items } = vi.hoisted(() => ({ items: { value: [] as unknown[] } }));

mockNuxtImport('useAgentCompanion', () => () => ({
  status: computed(() => 'ready'),
  items: ref(items.value),
  pendingApproval: ref(),
  pendingQuestion: ref(),
  connect: vi.fn(),
  send: vi.fn(),
  interrupt: vi.fn(),
  respondApproval: vi.fn(),
  answerQuestion: vi.fn(),
  permissionMode: ref('default'),
  setPermissionMode: vi.fn(),
  models: ref([]),
  model: ref(),
  setModel: vi.fn(),
  providers: ref([]),
  provider: ref('claude'),
  setProvider: vi.fn(),
  signingIn: ref(),
  signIn: vi.fn(),
  reset: vi.fn(),
}));

import AgentPanel from '../AgentPanel.vue';

const conversation: AgentChatItem[] = [
  { kind: 'user', id: 'u1', text: 'i want to edit my default channel' },
  {
    kind: 'tool',
    id: 't1',
    name: 'ToolSearch',
    input: {},
    status: 'done',
    summary: '[tool_reference]',
  },
  {
    kind: 'tool',
    id: 't2',
    name: 'mcp__studio__list_entities',
    input: { entity: 'channel' },
    status: 'done',
    summary:
      '{ "entity": "channel", "total": 2, "items": [ { "_id": "1", "name": "sales-portal-a", "url": "http://localhost:3000/settings/channels/1" }',
  },
  {
    kind: 'tool',
    id: 't3',
    name: 'mcp__ui__navigate',
    input: { path: '/settings/channels/1' },
    status: 'done',
    summary: '{"path":"/settings/channels/1"}',
  },
  { kind: 'assistant', id: 'a1', text: 'Opened **sales-portal-a** for you.' },
];

describe('AgentPanel', () => {
  it('shows the conversation with tool calls folded into steps', async () => {
    items.value = conversation;
    const wrapper = await mountSuspended(AgentPanel);
    await wrapper.find('[data-test="agent-toggle"]').trigger('click');

    // The test app has no locale messages loaded, so texts render as keys.
    const text = wrapper.text();
    expect(text).toContain('i want to edit my default channel');
    expect(wrapper.findAll('[data-test="agent-steps"]')).toHaveLength(1);
    expect(text).toContain('agent.steps_done');
    expect(text).toContain('Opened sales-portal-a for you.');
    expect(text).not.toContain('tool_reference');
  });
});
