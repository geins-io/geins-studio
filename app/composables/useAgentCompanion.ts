import { until, useWebSocket } from '@vueuse/core';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import type {
  AgentApprovalRequest,
  AgentChatItem,
  AgentClientMessage,
  AgentConnectionStatus,
  AgentModel,
  AgentPageRef,
  AgentPermissionMode,
  AgentProvider,
  AgentProviderInfo,
  AgentQuestionRequest,
  AgentServerMessage,
  AgentUiTool,
  AgentWorkflowGraph,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

const HIGHLIGHT_CLASS = 'agent-highlight';
const HIGHLIGHT_MS = 2400;
const PAGE_LOAD_TIMEOUT_MS = 8000;
/** List pages fetch after mounting; give their rows this long to appear. */
const ROWS_WAIT_MS = 4000;
const ROWS_POLL_MS = 200;

/** Restarts the highlight animation on an element the agent just touched. */
function flash(element: Element | null | undefined) {
  if (!element) return;
  element.classList.remove(HIGHLIGHT_CLASS);
  // Force a reflow so re-adding the class replays the animation.
  void (element as HTMLElement).offsetWidth;
  element.classList.add(HIGHLIGHT_CLASS);
  setTimeout(() => element.classList.remove(HIGHLIGHT_CLASS), HIGHLIGHT_MS);
}

export interface UseAgentCompanionReturnType {
  status: ComputedRef<AgentConnectionStatus>;
  items: Ref<AgentChatItem[]>;
  pendingApproval: Ref<AgentApprovalRequest | undefined>;
  pendingQuestion: Ref<AgentQuestionRequest | undefined>;
  /** The helper's current mode; it can drop out of `auto` on its own. */
  permissionMode: Ref<AgentPermissionMode>;
  setPermissionMode: (mode: AgentPermissionMode) => void;
  /** Models the helper's Claude login can use; empty until the session has started. */
  models: Ref<AgentModel[]>;
  model: Ref<string | undefined>;
  setModel: (model: string) => void;
  /** Agent harnesses the helper offers (Claude, Codex); empty until connected. */
  providers: Ref<AgentProviderInfo[]>;
  provider: Ref<AgentProvider | undefined>;
  /** Switches harness, which starts a new conversation. */
  setProvider: (provider: AgentProvider) => void;
  /** The provider whose browser sign-in is running on the helper's machine. */
  signingIn: Ref<AgentProvider | undefined>;
  signIn: (provider: AgentProvider) => void;
  /** Clears the conversation here and starts a fresh agent session. */
  reset: () => void;
  connect: () => void;
  disconnect: () => void;
  send: (text: string) => void;
  interrupt: () => void;
  respondApproval: (allow: boolean) => void;
  /** Answers keyed by question text; `undefined` dismisses the question. */
  answerQuestion: (answers?: Record<string, string>) => void;
}

/**
 * Connects the tab to the local agent helper (`geins serve` → `/agent`). The
 * helper runs the agent; this side hands it the Studio session, renders the
 * stream, answers in-tab `ui` tool calls and approval prompts.
 */
export function useAgentCompanion(): UseAgentCompanionReturnType {
  const { geinsLog, geinsLogWarn } = useGeinsLog('agent');
  const { accessToken, accountKey } = useGeinsAuth();
  const breadcrumbs = useBreadcrumbsStore();
  const agentPage = useAgentPageStore();
  const { currentAccountName } = storeToRefs(useUserStore());
  // Not `useRoute()`: outside the page (this runs from the layout) Nuxt only
  // updates it once the next page has finished loading, so right after a
  // navigation it still shows the previous path.
  const router = useRouter();
  const currentPath = () => router.currentRoute.value.fullPath;
  const nuxtApp = useNuxtApp();

  /** Resolves on Nuxt's next `page:finish`, or after a timeout. */
  const pageLoaded = () => {
    let finish = () => {};
    const promise = new Promise<void>((resolve) => {
      const timer = setTimeout(() => finish(), PAGE_LOAD_TIMEOUT_MS);
      const off = nuxtApp.hook('page:finish', () => finish());
      finish = () => {
        clearTimeout(timer);
        off();
        resolve();
      };
    });
    return Object.assign(promise, { cancel: () => finish() });
  };
  const { toast } = useToast();
  const { pairing } = useAgentPairing();
  const url = computed(() =>
    pairing.value ? agentCompanionUrl(pairing.value) : undefined,
  );

  const items = ref<AgentChatItem[]>([]);
  const pendingApproval = ref<AgentApprovalRequest>();
  const pendingQuestion = ref<AgentQuestionRequest>();
  const permissionMode = ref<AgentPermissionMode>('default');
  const models = ref<AgentModel[]>([]);
  const model = ref<string>();
  const providers = ref<AgentProviderInfo[]>([]);
  const provider = ref<AgentProvider>();
  const signingIn = ref<AgentProvider>();
  const busy = ref(false);

  const {
    status: socketStatus,
    send: sendRaw,
    open,
    close,
  } = useWebSocket(url, {
    immediate: false,
    // Off: it opens on every URL change, so a pairing synced from another tab
    // would connect (and send the session) where the panel was never opened.
    autoConnect: false,
    autoReconnect: { retries: 3, delay: 2000 },
    onConnected: () => sendAuth(),
    onMessage: (_ws, event) => {
      try {
        handleMessage(JSON.parse(event.data) as AgentServerMessage);
      } catch (error) {
        geinsLogWarn('unreadable agent message', error);
      }
    },
    onDisconnected: () => {
      busy.value = false;
      pendingApproval.value = undefined;
      pendingQuestion.value = undefined;
    },
  });

  // Re-pairing (another port or secret) replaces a live connection. vueuse
  // sets the status from any socket's close event, so wait for the old one's:
  // arriving late, it would mark the new socket closed.
  watch(url, async (next) => {
    if (socketStatus.value === 'CLOSED') return;
    close();
    await until(socketStatus).toBe('CLOSED', { timeout: 2000 });
    if (next) open();
  });

  const status = computed<AgentConnectionStatus>(() => {
    if (!pairing.value) return 'unpaired';
    if (socketStatus.value === 'CONNECTING') return 'connecting';
    if (socketStatus.value !== 'OPEN') return 'disconnected';
    return busy.value ? 'busy' : 'ready';
  });

  // Unbuffered: vueuse would flush queued messages on reconnect before `auth`,
  // to a new helper session that knows none of the ids they refer to.
  const post = (message: AgentClientMessage) =>
    sendRaw(JSON.stringify(message), false);

  function sendAuth() {
    if (!accessToken.value || !accountKey.value) return;
    post({
      type: 'auth',
      accessToken: accessToken.value,
      accountKey: accountKey.value,
      accountName: currentAccountName.value || undefined,
    });
  }
  // The token refreshes during a session; the helper re-points its Studio MCP
  // connection at the new one.
  watch([accessToken, accountKey, currentAccountName], () => {
    if (socketStatus.value === 'OPEN') sendAuth();
  });

  const toPath = (target: string): string => {
    if (target.startsWith('/')) return target;
    const parsed = new URL(target);
    if (parsed.origin !== window.location.origin) {
      throw new Error(`Refusing to navigate away from Studio: ${target}`);
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  };

  const requireEntity = () => {
    const entity = agentPage.entity;
    if (!entity) {
      throw new Error(
        'No entity edit page is open. Navigate to an entity page (or its /new page) first.',
      );
    }
    return entity;
  };

  const uiTools: Record<
    AgentUiTool,
    (input: Record<string, unknown>) => Promise<unknown>
  > = {
    navigate: async (input) => {
      const from = router.currentRoute.value.path;
      const loaded = pageLoaded();
      const failure = await router.push(toPath(String(input.path ?? '')));
      // A new page renders async (top-level awaits); let the agent's next call
      // see it. Query-only changes keep the page, so there's nothing to await.
      if (!failure && router.currentRoute.value.path !== from) await loaded;
      else loaded.cancel();
      // Only a guard abort is a real block: the unsaved-changes guard cancels
      // the navigation and opens its dialog.
      return isNavigationFailure(failure, NavigationFailureType.aborted)
        ? {
            path: currentPath(),
            blocked: true,
            reason:
              'The page has unsaved changes; Studio asked the user to confirm leaving.',
          }
        : { path: currentPath() };
    },
    refresh: async () => {
      await refreshNuxtData();
      return { refreshed: true };
    },
    get_page_context: async () => ({
      path: currentPath(),
      title: breadcrumbs.currentTitle,
      entity: agentPage.entity?.getState(),
      lists: agentPage.lists.map((list) => list.getState()),
    }),
    fill_form: async (input) => {
      const entity = requireEntity();
      const fields = (input.fields ?? {}) as Record<string, unknown>;
      const applied: string[] = [];
      const unknown: string[] = [];
      // One at a time, in the given order: pages react to some fields (a
      // quotation's company resets its owner and buyer), so let each settle.
      for (const [path, value] of Object.entries(fields)) {
        if (!hasFormPath(entity.getState().values, path)) {
          unknown.push(path);
          continue;
        }
        entity.setFieldValue(path, value);
        applied.push(path);
        await nextTick();
        flash(
          document
            .querySelector(`[name="${CSS.escape(path)}"]`)
            ?.closest('[data-slot="form-item"]'),
        );
      }
      const { valid, errors } = await entity.validate();
      return { applied, unknown, valid, errors, saved: false };
    },
    switch_tab: async (input) => {
      requireEntity().setTab(Number(input.tab ?? 0));
      return { tab: Number(input.tab ?? 0) };
    },
    highlight: async (input) => {
      const ids = (Array.isArray(input.ids) ? input.ids : []).map(String);
      const findRows = async () => {
        for (const list of agentPage.lists) await list.reveal(ids);
        await nextTick();
        return ids
          .map((id) =>
            document.querySelector(`[data-row-id="${CSS.escape(id)}"]`),
          )
          .filter((row): row is Element => !!row);
      };
      let rows = await findRows();
      for (
        let waited = 0;
        rows.length < ids.length && waited < ROWS_WAIT_MS;
        waited += ROWS_POLL_MS
      ) {
        await new Promise((resolve) => setTimeout(resolve, ROWS_POLL_MS));
        rows = await findRows();
      }
      rows[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      rows.forEach(flash);
      const shown = new Set(
        rows.map((row) => row.getAttribute('data-row-id') ?? ''),
      );
      return {
        highlighted: [...shown],
        notFound: ids.filter((id) => !shown.has(id)),
      };
    },
    set_workflow_graph: async (input) => {
      const entity = requireEntity();
      if (!entity.setGraph) {
        throw new Error(
          'The open page has no workflow canvas. Open a workflow, or /orchestrator/workflows/new, first.',
        );
      }
      const graph: AgentWorkflowGraph = {
        nodes: Array.isArray(input.nodes) ? input.nodes : [],
        connections: Array.isArray(input.connections) ? input.connections : [],
      };
      const { pending } = await entity.setGraph(graph);
      return pending
        ? {
            applied: false,
            pendingUntilCreate: true,
            note: 'No canvas on the create page: the workflow is created with this graph when the user clicks Create, and opens in the builder.',
          }
        : { applied: true, nodeCount: graph.nodes.length, saved: false };
    },
    notify: async (input) => {
      toast({
        title: String(input.title ?? ''),
        description: input.description ? String(input.description) : undefined,
      });
      return { shown: true };
    },
  };

  const pageRef = (): AgentPageRef => {
    const entity = agentPage.entity?.getState();
    return {
      path: currentPath(),
      title: breadcrumbs.currentTitle || undefined,
      entityKey: entity?.entityKey,
      entityId: entity?.entityId,
      createMode: entity?.createMode,
    };
  };

  async function runUiTool(
    id: string,
    tool: AgentUiTool,
    input: Record<string, unknown>,
  ) {
    try {
      post({ type: 'ui_result', id, result: await uiTools[tool](input) });
    } catch (error) {
      post({
        type: 'ui_result',
        id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  function appendAssistantText(text: string) {
    const last = items.value.at(-1);
    if (last?.kind === 'assistant') {
      last.text += text;
      return;
    }
    items.value.push({ kind: 'assistant', id: crypto.randomUUID(), text });
  }

  function handleMessage(message: AgentServerMessage) {
    switch (message.type) {
      case 'status':
        busy.value = message.state === 'busy';
        break;
      case 'text':
        appendAssistantText(message.text);
        break;
      case 'tool_use':
        items.value.push({
          kind: 'tool',
          id: message.id,
          name: message.name,
          input: message.input,
          status: 'running',
        });
        break;
      case 'tool_result': {
        const item = items.value.find(
          (i) => i.kind === 'tool' && i.id === message.id,
        );
        if (item?.kind === 'tool') {
          item.status = message.isError ? 'error' : 'done';
          item.summary = message.summary;
        }
        break;
      }
      case 'turn_end':
        busy.value = false;
        if (message.error) {
          items.value.push({
            kind: 'error',
            id: crypto.randomUUID(),
            text: message.error,
          });
        }
        geinsLog('turn ended', { costUsd: message.costUsd });
        break;
      case 'ui_call':
        runUiTool(message.id, message.tool, message.input);
        break;
      case 'approval_request':
        pendingApproval.value = {
          id: message.id,
          tool: message.tool,
          input: message.input,
        };
        break;
      case 'permission_mode':
        permissionMode.value = message.mode;
        break;
      case 'models':
        models.value = message.models;
        model.value = message.current;
        break;
      case 'model':
        model.value = message.model;
        break;
      case 'providers':
        providers.value = message.providers;
        provider.value = message.current;
        signingIn.value = undefined;
        break;
      case 'question_request':
        pendingQuestion.value = {
          id: message.id,
          questions: message.questions,
        };
        break;
      case 'error':
        items.value.push({
          kind: 'error',
          id: crypto.randomUUID(),
          text: message.message,
        });
        break;
    }
  }

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || socketStatus.value !== 'OPEN') return;
    items.value.push({ kind: 'user', id: crypto.randomUUID(), text: trimmed });
    busy.value = true;
    post({ type: 'user_message', text: trimmed, page: pageRef() });
  }

  function respondApproval(allow: boolean) {
    if (!pendingApproval.value) return;
    post({ type: 'approval', id: pendingApproval.value.id, allow });
    pendingApproval.value = undefined;
  }

  function answerQuestion(answers?: Record<string, string>) {
    if (!pendingQuestion.value) return;
    post({ type: 'question_answer', id: pendingQuestion.value.id, answers });
    pendingQuestion.value = undefined;
  }

  function clearConversation() {
    items.value = [];
    pendingApproval.value = undefined;
    pendingQuestion.value = undefined;
    busy.value = false;
  }

  return {
    status,
    items,
    pendingApproval,
    connect: () => {
      if (pairing.value) open();
    },
    disconnect: close,
    send,
    interrupt: () => post({ type: 'interrupt' }),
    respondApproval,
    pendingQuestion,
    answerQuestion,
    permissionMode,
    // The helper answers with the mode (and model) it actually switched to.
    setPermissionMode: (mode) => post({ type: 'permission_mode', mode }),
    models,
    model,
    setModel: (value) => post({ type: 'set_model', model: value }),
    reset: () => {
      clearConversation();
      post({ type: 'reset' });
    },
    providers,
    provider,
    setProvider: (value) => {
      if (value === provider.value) return;
      clearConversation();
      // The new harness announces its own model list.
      models.value = [];
      post({ type: 'set_provider', provider: value });
    },
    signingIn,
    signIn: (value) => {
      signingIn.value = value;
      post({ type: 'sign_in', provider: value });
    },
  };
}
