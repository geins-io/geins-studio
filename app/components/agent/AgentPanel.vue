<script setup lang="ts">
import { useTimeoutFn } from '@vueuse/core';
import MarkdownIt from 'markdown-it';
import type {
  AgentChatItem,
  AgentConnectionStatus,
  AgentPairing,
  AgentProvider,
  AgentQuestion,
  AgentStepDescription,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';

// Raw HTML stays escaped (`html: false`) and markdown-it rejects
// `javascript:`-style links, so the rendered agent text is safe for v-html.
const markdown = new MarkdownIt({ html: false, linkify: true, breaks: true });
const HELPER_START_TIMEOUT_MS = 30_000;

const { t, te } = useI18n();
const {
  status,
  items,
  pendingApproval,
  pendingQuestion,
  connect,
  send,
  interrupt,
  respondApproval,
  answerQuestion,
  permissionMode,
  setPermissionMode,
  models,
  model,
  setModel,
  providers,
  provider,
  setProvider,
  signingIn,
  signIn,
  reset,
} = useAgentCompanion();

const currentModelInfo = computed(() =>
  models.value.find((option) => option.value === model.value),
);
const currentProviderInfo = computed(() =>
  providers.value.find((option) => option.id === provider.value),
);
// Signed out or not installed: the panel shows that step instead of the chat.
const providerSetup = computed(() =>
  currentProviderInfo.value?.signedIn === false
    ? currentProviderInfo.value
    : undefined,
);

// Synapse registers `geins://`; the link opens it (starting it if needed),
// and for `connect` it asks the user before pairing this site.
const runtimeConfig = useRuntimeConfig();
const downloadUrl = computed(() => runtimeConfig.public.agentDownloadUrl);
const connectLink = computed(() =>
  import.meta.client
    ? `geins://connect?site=${encodeURIComponent(window.location.origin)}`
    : '',
);

// After "Start Synapse" the helper needs a few seconds to come up.
const waitingForHelper = ref(false);
const { start: stopWaitingLater } = useTimeoutFn(
  () => (waitingForHelper.value = false),
  HELPER_START_TIMEOUT_MS,
  { immediate: false },
);
usePollWhile(
  () => waitingForHelper.value && status.value === 'disconnected',
  () => connect(),
  2000,
);
const startHelper = () => {
  waitingForHelper.value = true;
  stopWaitingLater();
};

// Chosen option labels per question text, for the open question card.
const selections = ref<Record<string, string[]>>({});
watch(pendingQuestion, () => (selections.value = {}));

const isSelected = (question: string, label: string) =>
  selections.value[question]?.includes(label) ?? false;

const toggleOption = (question: AgentQuestion, label: string) => {
  const current = selections.value[question.question] ?? [];
  selections.value[question.question] = question.multiSelect
    ? current.includes(label)
      ? current.filter((l) => l !== label)
      : [...current, label]
    : [label];
};

const allQuestionsAnswered = computed(
  () =>
    pendingQuestion.value?.questions.every(
      (question) => selections.value[question.question]?.length,
    ) ?? false,
);

const submitAnswers = () =>
  answerQuestion(
    Object.fromEntries(
      Object.entries(selections.value).map(([question, labels]) => [
        question,
        labels.join(', '),
      ]),
    ),
  );

// Docked, non-modal on purpose: the agent navigates the page while it works,
// so the page must stay visible and usable behind the panel.
const open = ref(false);
const draft = ref('');
const scroller = ref<HTMLElement>();

watch(open, (isOpen) => {
  if (isOpen && status.value === 'disconnected') connect();
});
// Pairing just arrived (e.g. from a `studio connect` link in another tab).
watch(status, (current, previous) => {
  if (open.value && previous === 'unpaired' && current === 'disconnected') {
    connect();
  }
});

// Set by `agent-pairing.client.ts` when this load came from a pairing link.
// Anyone can send such a link, so the user confirms it before this tab hands
// its session to that port. The same secret on a new port is the user's own
// helper restarting: only it knows the secret, so that needs no question.
const { pairing } = useAgentPairing();
const pendingPairing = useState<AgentPairing | null>(
  'agent-pending-pairing',
  () => null,
);
const confirmingPairing = ref(false);
const { toast } = useToast();

const acceptPairing = () => {
  if (!pendingPairing.value) return;
  pairing.value = pendingPairing.value;
  pendingPairing.value = null;
  confirmingPairing.value = false;
  open.value = true;
  toast({
    title: t('agent.paired'),
    description: t('agent.paired_description'),
    variant: 'positive',
  });
};
const declinePairing = () => (pendingPairing.value = null);

onMounted(() => {
  if (!pendingPairing.value) return;
  if (pendingPairing.value.token === pairing.value?.token) acceptPairing();
  else confirmingPairing.value = true;
});

const connected = computed(
  () => status.value !== 'disconnected' && status.value !== 'unpaired',
);

const statusBadge = computed(() => {
  const variants: Record<
    AgentConnectionStatus,
    'positive-light' | 'warning-light' | 'inactive'
  > = {
    ready: 'positive-light',
    busy: 'warning-light',
    connecting: 'inactive',
    disconnected: 'inactive',
    unpaired: 'inactive',
  };
  return {
    variant: variants[status.value],
    label: t(`agent.status_${status.value}`),
  };
});

const submit = () => {
  if (status.value !== 'ready') return;
  send(draft.value);
  draft.value = '';
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    submit();
  }
};

const toolLabel = (name: string) => {
  const { server, tool } = agentToolName(name);
  return server ? `${server}: ${tool}` : tool;
};

type AgentToolItem = Extract<AgentChatItem, { kind: 'tool' }>;
interface AgentStep {
  item: AgentToolItem;
  description: AgentStepDescription;
}
type ChatBlock =
  | { kind: 'message'; id: string; item: Exclude<AgentChatItem, AgentToolItem> }
  | { kind: 'steps'; id: string; steps: AgentStep[] };

// Consecutive tool calls fold into one "Worked through n steps" line; the
// agent's groundwork is left out unless it failed.
const blocks = computed(() => {
  const pageNames = agentPageNames(
    items.value.map((item) =>
      item.kind === 'tool' ? item.summary : undefined,
    ),
  );
  const result: ChatBlock[] = [];
  for (const item of items.value) {
    if (item.kind !== 'tool') {
      result.push({ kind: 'message', id: item.id, item });
      continue;
    }
    const description =
      describeAgentStep(item.name, item.input, item.summary, pageNames) ??
      (item.status === 'error'
        ? { key: 'tool', params: { tool: toolLabel(item.name) } }
        : undefined);
    if (!description) continue;
    const last = result.at(-1);
    if (last?.kind === 'steps') last.steps.push({ item, description });
    else
      result.push({
        kind: 'steps',
        id: item.id,
        steps: [{ item, description }],
      });
  }
  return result;
});

// Each streamed chunk re-renders the panel; only the message that changed
// needs markdown-it again.
const renderedMarkdown = new Map<string, { text: string; html: string }>();
const renderMarkdown = (id: string, text: string) => {
  const cached = renderedMarkdown.get(id);
  if (cached?.text === text) return cached.html;
  const html = markdown.render(text);
  renderedMarkdown.set(id, { text, html });
  return html;
};
watch(
  () => items.value.length,
  (length) => {
    if (length === 0) renderedMarkdown.clear();
  },
);

const expandedSteps = ref<Record<string, boolean>>({});
// Raw tool input and result, for debugging only.
const showStepDetails = import.meta.dev;

const stepText = ({ item, description }: AgentStep) => {
  const running = item.status === 'running';
  const entityKey = description.params.entityKey;
  // An entity the registry doesn't know can't resolve its linked name.
  const { key, params, plural } =
    entityKey !== undefined && !te(String(entityKey))
      ? {
          key: 'tool',
          params: { tool: toolLabel(item.name) },
          plural: undefined,
        }
      : description;
  const path = `agent.step.${key}${running ? '_running' : ''}`;
  return plural === undefined ? t(path, params) : t(path, params, plural);
};

const runningStep = (steps: AgentStep[]) =>
  steps.find((step) => step.item.status === 'running');
const failedSteps = (steps: AgentStep[]) =>
  steps.filter((step) => step.item.status === 'error').length;

const formatInput = (input: unknown) => JSON.stringify(input, null, 2);
const formatStep = ({ item }: AgentStep) =>
  `${formatInput(item.input)}${
    item.summary
      ? `

${item.summary}`
      : ''
  }`;

// Studio links (the tools return record URLs) stay in the SPA; others open
// in a new tab so the conversation survives.
const onMarkdownClick = (event: MouseEvent) => {
  const link = (event.target as HTMLElement).closest('a');
  if (!link) return;
  event.preventDefault();
  const url = new URL(link.href, window.location.origin);
  if (url.origin === window.location.origin) {
    navigateTo(`${url.pathname}${url.search}${url.hash}`);
  } else {
    window.open(url.href, '_blank', 'noopener');
  }
};

watch(
  () =>
    items.value
      .map((item) => (item.kind === 'assistant' ? item.text.length : item.id))
      .join(),
  async () => {
    await nextTick();
    scroller.value?.scrollTo({ top: scroller.value.scrollHeight });
  },
);
</script>

<template>
  <div class="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
    <Card
      v-if="open"
      class="flex h-[min(640px,80vh)] w-[min(420px,92vw)] flex-col gap-0 overflow-hidden p-0 shadow-lg"
      data-test="agent-panel"
    >
      <div class="flex items-center gap-2 border-b px-4 py-3">
        <LucideSparkles class="size-4" aria-hidden="true" />
        <span class="text-sm font-semibold">{{ t('agent.title') }}</span>
        <Badge :variant="statusBadge.variant" size="sm">
          {{ statusBadge.label }}
        </Badge>
        <Button
          variant="ghost"
          size="icon-xs"
          class="ml-auto"
          :aria-label="t('close')"
          @click="open = false"
        >
          <LucideX class="size-4" aria-hidden="true" />
        </Button>
      </div>

      <TooltipProvider v-if="connected" :delay-duration="100">
        <div
          class="flex items-center gap-2 border-b px-4 py-2"
          data-test="agent-toolbar"
        >
          <Select
            v-if="providers.length > 1"
            :model-value="provider"
            :disabled="status === 'busy'"
            @update:model-value="setProvider($event as AgentProvider)"
          >
            <SelectTrigger
              size="sm"
              class="w-auto min-w-0"
              :aria-label="t('agent.provider')"
              data-test="agent-provider"
            >
              <SelectValue :placeholder="t('agent.provider')" />
            </SelectTrigger>
            <SelectContent>
              <!-- Not installed: listed so users know it's an option. -->
              <SelectItem
                v-for="option in providers"
                :key="option.id"
                :value="option.id"
                :disabled="!option.available"
              >
                {{ option.name }}
                <span
                  v-if="!option.available"
                  class="text-muted-foreground text-xs"
                >
                  {{ t('agent.not_installed') }}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            v-if="models.length"
            :model-value="model"
            :disabled="status === 'busy'"
            @update:model-value="setModel(String($event))"
          >
            <SelectTrigger
              size="sm"
              class="w-auto max-w-48 min-w-0"
              :aria-label="t('agent.model')"
              data-test="agent-model"
            >
              <!-- Name only: the items also carry a description line. -->
              <SelectValue :placeholder="t('agent.model')">
                {{ currentModelInfo?.displayName }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in models"
                :key="option.value"
                :value="option.value"
              >
                <span class="flex flex-col">
                  <span>{{ option.displayName }}</span>
                  <span
                    v-if="option.description"
                    class="text-muted-foreground text-xs"
                  >
                    {{ option.description }}
                  </span>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <div class="flex-1" />
          <Tooltip
            v-if="currentProviderInfo?.supportsPermissionModes !== false"
          >
            <TooltipTrigger as-child>
              <label class="flex items-center gap-1.5 text-xs">
                <Switch
                  :model-value="permissionMode === 'auto'"
                  :disabled="currentModelInfo?.supportsAutoMode === false"
                  :aria-label="t('agent.auto_mode')"
                  data-test="agent-auto-mode"
                  @update:model-value="
                    setPermissionMode($event ? 'auto' : 'default')
                  "
                />
                {{ t('agent.auto_mode') }}
              </label>
            </TooltipTrigger>
            <TooltipContent side="bottom" class="max-w-64">
              {{
                currentModelInfo?.supportsAutoMode === false
                  ? t('agent.auto_mode_unsupported')
                  : t('agent.auto_mode_description')
              }}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                variant="ghost"
                size="icon-xs"
                :aria-label="t('agent.new_conversation')"
                :disabled="items.length === 0 && !pendingApproval"
                data-test="agent-reset"
                @click="reset()"
              >
                <LucideSquarePen class="size-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {{ t('agent.new_conversation') }}
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <Empty v-if="status === 'unpaired'" class="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideLink class="size-5" />
          </EmptyMedia>
          <EmptyTitle>{{ t('agent.not_paired') }}</EmptyTitle>
          <EmptyDescription>
            {{ t('agent.not_paired_description') }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div class="flex gap-2">
            <Button as-child>
              <a :href="connectLink" data-test="agent-connect">
                {{ t('agent.connect') }}
              </a>
            </Button>
            <Button as-child variant="secondary">
              <a :href="downloadUrl" target="_blank" rel="noopener">
                {{ t('agent.download_helper') }}
              </a>
            </Button>
          </div>
          <p class="text-muted-foreground text-xs">
            {{ t('agent.helper_installed_hint') }}
          </p>
        </EmptyContent>
      </Empty>

      <Empty v-else-if="status === 'disconnected'" class="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucidePlugZap class="size-5" />
          </EmptyMedia>
          <EmptyTitle>{{ t('agent.not_connected') }}</EmptyTitle>
          <EmptyDescription>
            {{ t('agent.not_connected_description') }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div class="flex gap-2">
            <Button as-child data-test="agent-start-helper">
              <a href="geins://start" @click="startHelper">
                {{ t('agent.start_helper') }}
              </a>
            </Button>
            <ButtonIcon icon="retry" variant="secondary" @click="connect()">
              {{ t('retry') }}
            </ButtonIcon>
          </div>
          <a
            :href="downloadUrl"
            target="_blank"
            rel="noopener"
            class="text-muted-foreground text-xs underline"
          >
            {{ t('agent.download_helper') }}
          </a>
        </EmptyContent>
      </Empty>

      <Empty v-else-if="providerSetup" class="flex-1">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LucideKeyRound v-if="providerSetup.available" class="size-5" />
            <LucideDownload v-else class="size-5" />
          </EmptyMedia>
          <EmptyTitle>
            {{
              providerSetup.available
                ? t('agent.sign_in_title', { provider: providerSetup.name })
                : t('agent.install_title', { provider: providerSetup.name })
            }}
          </EmptyTitle>
          <EmptyDescription>
            {{
              providerSetup.available
                ? t('agent.sign_in_description', {
                    provider: providerSetup.name,
                  })
                : t('agent.install_description', {
                    provider: providerSetup.name,
                  })
            }}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            v-if="providerSetup.available"
            :disabled="signingIn === providerSetup.id"
            data-test="agent-sign-in"
            @click="signIn(providerSetup.id)"
          >
            {{
              signingIn === providerSetup.id
                ? t('agent.signing_in')
                : t('agent.sign_in')
            }}
          </Button>
          <Button v-else as-child variant="secondary">
            <a :href="providerSetup.installUrl" target="_blank" rel="noopener">
              {{ t('agent.install', { provider: providerSetup.name }) }}
            </a>
          </Button>
        </EmptyContent>
      </Empty>

      <div
        v-else
        ref="scroller"
        class="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 text-sm"
      >
        <p
          v-if="items.length === 0"
          class="text-muted-foreground m-auto max-w-[260px] text-center"
        >
          {{ t('agent.intro') }}
        </p>
        <!-- eslint-disable vue/no-v-html -- markdown-it output, raw HTML disabled -->
        <template v-for="block in blocks" :key="block.id">
          <template v-if="block.kind === 'message'">
            <div
              v-if="block.item.kind === 'user'"
              class="bg-secondary ml-8 self-end rounded-lg px-3 py-2 whitespace-pre-wrap"
            >
              {{ block.item.text }}
            </div>
            <div
              v-else-if="block.item.kind === 'assistant'"
              class="agent-markdown"
              @click="onMarkdownClick"
              v-html="renderMarkdown(block.item.id, block.item.text)"
            />
            <p v-else class="text-negative">{{ block.item.text }}</p>
          </template>

          <Collapsible
            v-else
            v-model:open="expandedSteps[block.id]"
            class="text-muted-foreground text-xs"
            data-test="agent-steps"
          >
            <CollapsibleTrigger
              class="hover:text-foreground flex w-full items-center gap-2 text-left"
            >
              <LucideLoaderCircle
                v-if="runningStep(block.steps)"
                class="size-3.5 shrink-0 animate-spin"
                aria-hidden="true"
              />
              <LucideX
                v-else-if="failedSteps(block.steps)"
                class="text-negative size-3.5 shrink-0"
                aria-hidden="true"
              />
              <LucideCheck
                v-else
                class="text-positive size-3.5 shrink-0"
                aria-hidden="true"
              />
              <span v-if="runningStep(block.steps)" class="truncate">
                {{ stepText(runningStep(block.steps)!) }}
                <template v-if="runningStep(block.steps)!.description.target">
                  {{ runningStep(block.steps)!.description.target!.label }}
                </template>
                …
              </span>
              <span v-else class="truncate">
                {{
                  t(
                    'agent.steps_done',
                    { count: block.steps.length },
                    block.steps.length,
                  )
                }}
                <span v-if="failedSteps(block.steps)" class="text-negative">
                  ·
                  {{
                    t('agent.steps_failed', { count: failedSteps(block.steps) })
                  }}
                </span>
              </span>
              <LucideChevronRight
                class="ml-auto size-3.5 shrink-0 transition-transform"
                :class="{ 'rotate-90': expandedSteps[block.id] }"
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul class="mt-1.5 ml-1.5 flex flex-col gap-1.5 border-l pl-3">
                <li
                  v-for="step in block.steps"
                  :key="step.item.id"
                  class="flex items-start gap-2"
                >
                  <LucideLoaderCircle
                    v-if="step.item.status === 'running'"
                    class="mt-0.5 size-3 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                  <LucideCheck
                    v-else-if="step.item.status === 'done'"
                    class="text-positive mt-0.5 size-3 shrink-0"
                    aria-hidden="true"
                  />
                  <LucideX
                    v-else
                    class="text-negative mt-0.5 size-3 shrink-0"
                    aria-hidden="true"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-foreground">
                      {{ stepText(step) }}
                      <template v-if="step.description.target">
                        <NuxtLink
                          v-if="step.description.target.path"
                          :to="step.description.target.path"
                          class="font-medium underline-offset-2 hover:underline"
                        >
                          {{ step.description.target.label }}
                        </NuxtLink>
                        <span v-else class="font-medium">
                          {{ step.description.target.label }}
                        </span>
                      </template>
                      <template v-if="step.description.count !== undefined">
                        ({{ step.description.count }})
                      </template>
                      <template v-if="step.item.status === 'running'">
                        …
                      </template>
                    </p>
                    <p
                      v-if="step.item.status === 'error' && step.item.summary"
                      class="text-negative line-clamp-2 break-words"
                    >
                      {{ step.item.summary }}
                    </p>
                    <details v-if="showStepDetails" class="mt-0.5">
                      <summary class="cursor-pointer">
                        {{ t('agent.step_details') }}
                      </summary>
                      <pre
                        class="bg-muted mt-1 max-h-40 overflow-auto rounded-md p-2 break-all whitespace-pre-wrap"
                        >{{ formatStep(step) }}</pre
                      >
                    </details>
                  </div>
                </li>
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </template>
        <!-- eslint-enable vue/no-v-html -->

        <div
          v-if="pendingApproval"
          class="flex flex-col gap-2 rounded-lg border p-3"
          data-test="agent-approval"
        >
          <p class="font-medium">
            {{
              t('agent.approval_title', {
                tool: toolLabel(pendingApproval.tool),
              })
            }}
          </p>
          <pre class="bg-muted max-h-40 overflow-auto rounded-md p-2 text-xs">{{
            formatInput(pendingApproval.input)
          }}</pre>
          <div class="flex justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              @click="respondApproval(false)"
            >
              {{ t('agent.deny') }}
            </Button>
            <Button size="sm" @click="respondApproval(true)">
              {{ t('agent.allow') }}
            </Button>
          </div>
        </div>

        <div
          v-if="pendingQuestion"
          class="flex flex-col gap-3 rounded-lg border p-3"
          data-test="agent-question"
        >
          <div
            v-for="question in pendingQuestion.questions"
            :key="question.question"
            class="flex flex-col gap-1.5"
          >
            <p class="font-medium">{{ question.question }}</p>
            <div class="flex flex-col gap-1">
              <Button
                v-for="option in question.options"
                :key="option.label"
                :variant="
                  isSelected(question.question, option.label)
                    ? 'default'
                    : 'secondary'
                "
                size="sm"
                class="h-auto justify-start py-1.5 text-left whitespace-normal"
                :aria-pressed="isSelected(question.question, option.label)"
                @click="toggleOption(question, option.label)"
              >
                <span class="flex flex-col">
                  <span class="font-medium">{{ option.label }}</span>
                  <span v-if="option.description" class="opacity-70">
                    {{ option.description }}
                  </span>
                </span>
              </Button>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <Button variant="secondary" size="sm" @click="answerQuestion()">
              {{ t('agent.skip') }}
            </Button>
            <Button
              size="sm"
              :disabled="!allQuestionsAnswered"
              @click="submitAnswers"
            >
              {{ t('agent.answer') }}
            </Button>
          </div>
        </div>
      </div>

      <div v-if="connected" class="flex items-end gap-2 border-t p-3">
        <Textarea
          v-model="draft"
          rows="2"
          class="min-h-0 resize-none"
          :placeholder="t('agent.placeholder')"
          :aria-label="t('agent.placeholder')"
          @keydown="onKeydown"
        />
        <Button
          v-if="status === 'busy'"
          variant="secondary"
          :aria-label="t('agent.stop')"
          @click="interrupt()"
        >
          <LucideSquare class="size-3.5" aria-hidden="true" />
        </Button>
        <Button
          v-else
          :disabled="status !== 'ready' || !draft.trim()"
          :aria-label="t('send')"
          @click="submit"
        >
          <LucideSendHorizontal class="size-4" aria-hidden="true" />
        </Button>
      </div>
    </Card>

    <TooltipProvider :delay-duration="100">
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="icon"
            class="rounded-full shadow-lg"
            :aria-label="t('agent.title')"
            :aria-expanded="open"
            data-test="agent-toggle"
            @click="open = !open"
          >
            <LucideSparkles class="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">{{ t('agent.title') }}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <AlertDialog v-model:open="confirmingPairing">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{{ t('agent.confirm_pairing') }}</AlertDialogTitle>
          <AlertDialogDescription>
            {{
              t('agent.confirm_pairing_description', {
                port: pendingPairing?.port,
              })
            }}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel @click="declinePairing">
            {{ t('cancel') }}
          </AlertDialogCancel>
          <AlertDialogAction
            data-test="agent-confirm-pairing"
            @click="acceptPairing"
          >
            {{ t('agent.connect') }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<style scoped>
.agent-markdown {
  overflow-wrap: anywhere;
}
.agent-markdown :deep(> * + *) {
  margin-top: 0.5rem;
}
.agent-markdown :deep(h1),
.agent-markdown :deep(h2),
.agent-markdown :deep(h3),
.agent-markdown :deep(h4) {
  font-weight: 600;
}
.agent-markdown :deep(ul) {
  list-style: disc;
  padding-left: 1.25rem;
}
.agent-markdown :deep(ol) {
  list-style: decimal;
  padding-left: 1.25rem;
}
.agent-markdown :deep(li + li) {
  margin-top: 0.125rem;
}
.agent-markdown :deep(a) {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.agent-markdown :deep(code) {
  background: var(--muted);
  border-radius: 0.25rem;
  padding: 0.05rem 0.3rem;
  font-size: 0.8em;
}
.agent-markdown :deep(pre) {
  background: var(--muted);
  border-radius: 0.375rem;
  padding: 0.5rem;
  overflow-x: auto;
}
.agent-markdown :deep(pre code) {
  padding: 0;
  background: none;
}
.agent-markdown :deep(table) {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 0.75rem;
}
.agent-markdown :deep(th),
.agent-markdown :deep(td) {
  border: 1px solid var(--border);
  padding: 0.25rem 0.5rem;
  text-align: left;
}
.agent-markdown :deep(th) {
  font-weight: 600;
}
.agent-markdown :deep(blockquote) {
  border-left: 2px solid var(--border);
  padding-left: 0.75rem;
  color: var(--muted-foreground);
}
</style>

<style>
/* Applied by `useAgentCompanion` to rows and fields the agent just touched,
   anywhere on the page — hence unscoped. */
.agent-highlight {
  animation: agent-highlight 2.4s ease-out;
}
@keyframes agent-highlight {
  0%,
  60% {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
    background-color: color-mix(in srgb, var(--ring) 8%, transparent);
  }
  100% {
    outline: 2px solid transparent;
    outline-offset: 2px;
    background-color: transparent;
  }
}
</style>
