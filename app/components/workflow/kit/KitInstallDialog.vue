<script setup lang="ts">
import type {
  Kit,
  KitVariableSpec,
  KitWorkflowSpec,
  InstallKitResponse,
} from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import { Badge } from '~/components/ui/badge';

const props = defineProps<{
  open: boolean;
  kitId: string | null;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  installed: [response: InstallKitResponse];
}>();

const { orchestratorApi } = useGeinsRepository();
const { toast } = useToast();
const { t } = useI18n();
const { geinsLog } = useGeinsLog('KitInstallDialog');

const { currentStep, nextStep, previousStep, goToStep, isFirstStep } =
  useStepManagement(4);

const kit = ref<Kit | null>(null);
const loadingKit = ref(false);
const loadError = ref(false);

// refId -> selected, key -> value
const selected = ref<Record<string, boolean>>({});
const values = ref<Record<string, string>>({});

const installing = ref(false);
const result = ref<InstallKitResponse | null>(null);

// ─── Load kit detail when opened ───────────────────────────────────
watch(
  () => [props.open, props.kitId] as const,
  async ([open, id]) => {
    if (!open || !id) return;
    goToStep(1);
    result.value = null;
    kit.value = null;
    loadError.value = false;
    loadingKit.value = true;
    try {
      const detail = await orchestratorApi.kit.get(id);
      kit.value = detail;
      // Default: install every workflow, prefill variable defaults.
      selected.value = Object.fromEntries(
        (detail.workflows ?? []).map((w) => [w.refId, true]),
      );
      values.value = Object.fromEntries(
        (detail.variables ?? []).map((v) => [v.key, v.defaultValue ?? '']),
      );
    } catch (err) {
      geinsLog('failed to load kit detail', err);
      loadError.value = true;
    } finally {
      loadingKit.value = false;
    }
  },
  { immediate: true },
);

// ─── Workflow selection (with dependency locking) ──────────────────
const workflows = computed(() => kit.value?.workflows ?? []);

const selectedRefs = computed(() =>
  workflows.value.filter((w) => selected.value[w.refId]).map((w) => w.refId),
);

/** refIds that are dependencies of a currently-selected workflow. */
const lockedRefs = computed(() => {
  const locked = new Set<string>();
  for (const w of workflows.value) {
    if (!selected.value[w.refId]) continue;
    for (const dep of w.dependencies ?? []) locked.add(dep);
  }
  return locked;
});

const toggleWorkflow = (refId: string, value: boolean) => {
  selected.value = { ...selected.value, [refId]: value };
};

/** Human-readable workflow name from its definition, falling back to refId. */
const workflowName = (w: KitWorkflowSpec): string => {
  const name = w.definition?.name;
  return typeof name === 'string' && name ? name : w.refId;
};

const nameByRef = computed(() =>
  Object.fromEntries(workflows.value.map((w) => [w.refId, workflowName(w)])),
);

/** Names of the workflows that `refId` depends upon. */
const dependencyNames = (refId: string): string => {
  const w = workflows.value.find((x) => x.refId === refId);
  return (w?.dependencies ?? [])
    .map((dep) => nameByRef.value[dep] ?? dep)
    .join(', ');
};

const dependantNames = (refId: string): string => {
  const names = workflows.value
    .filter(
      (w) => selected.value[w.refId] && (w.dependencies ?? []).includes(refId),
    )
    .map((w) => workflowName(w));
  return names.join(', ');
};

// ─── Variables shown for the current selection ─────────────────────
const visibleVariables = computed<KitVariableSpec[]>(() => {
  const refs = new Set(selectedRefs.value);
  return (kit.value?.variables ?? []).filter((v) => {
    // Only required variables need input here; optional ones are created from
    // their defaults automatically on install.
    if (!v.required) return false;
    const usedBy = v.usedBy ?? [];
    // Global variables (no usedBy) always show; otherwise show when at least
    // one consuming workflow is selected.
    if (usedBy.length === 0) return true;
    return usedBy.some((u) => refs.has(u));
  });
});

const missingRequired = computed(() =>
  visibleVariables.value.some(
    (v) => v.required && !(values.value[v.key] ?? '').trim(),
  ),
);

// ─── Step config ───────────────────────────────────────────────────
const steps = computed(() => [
  t('kits.wizard.step_review'),
  t('kits.wizard.step_workflows'),
  t('kits.wizard.step_variables'),
  t('kits.wizard.step_done'),
]);

const canContinue = computed(() => {
  if (currentStep.value === 2) return selectedRefs.value.length > 0;
  return true;
});

// ─── Install ───────────────────────────────────────────────────────
const performInstall = async () => {
  if (!kit.value || !props.kitId || installing.value) return;
  if (missingRequired.value) return;
  installing.value = true;
  try {
    // Variable values must be supplied in the install request — the API creates
    // them on install and rejects with 422 if a required one is missing. Send
    // every non-empty value (user input + prefilled defaults).
    const variables: Record<string, string> = {};
    for (const [key, value] of Object.entries(values.value)) {
      const trimmed = (value ?? '').trim();
      if (trimmed) variables[key] = trimmed;
    }

    const res = await orchestratorApi.kit.install(props.kitId, {
      workflows: selectedRefs.value,
      variables,
    });

    result.value = res;
    emit('installed', res);
    goToStep(4);
    toast({
      title: t('kits.install_success'),
      description: t('kits.install_success_detail', {
        name: kit.value.name,
        workflows: res.workflowsCreated ?? selectedRefs.value.length,
      }),
    });
  } catch (err) {
    geinsLog('install failed', err);
  } finally {
    installing.value = false;
  }
};

const close = () => emit('update:open', false);

const goToInstalled = () => {
  close();
  navigateTo('/settings/orchestrator/kits/installed');
};
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{
            kit
              ? $t('kits.install_titled', { name: kit.name })
              : $t('kits.install')
          }}
        </DialogTitle>
        <DialogDescription v-if="kit">
          {{ $t('kits.by_author', { author: kit.author }) }} · v{{
            kit.version
          }}
        </DialogDescription>
      </DialogHeader>

      <!-- Stepper header -->
      <ol class="flex items-center gap-1 py-1 text-xs">
        <li
          v-for="(label, i) in steps"
          :key="label"
          class="flex flex-1 items-center gap-1.5"
        >
          <span
            class="flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors"
            :class="
              currentStep > i + 1
                ? 'bg-primary border-primary text-primary-foreground'
                : currentStep === i + 1
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground/30 text-muted-foreground'
            "
          >
            <LucideCheck v-if="currentStep > i + 1" class="size-3" />
            <template v-else>{{ i + 1 }}</template>
          </span>
          <span
            class="truncate"
            :class="
              currentStep === i + 1
                ? 'text-foreground font-medium'
                : 'text-muted-foreground'
            "
          >
            {{ label }}
          </span>
          <span
            v-if="i < steps.length - 1"
            class="bg-border ml-1 h-px flex-1"
          />
        </li>
      </ol>

      <!-- Loading / error -->
      <div
        v-if="loadingKit"
        class="text-muted-foreground flex items-center justify-center gap-2 py-10 text-sm"
      >
        <LucideLoader class="size-4 animate-spin" />
        {{ $t('loading') }}
      </div>
      <div
        v-else-if="loadError"
        class="text-muted-foreground flex flex-col items-center gap-2 py-10 text-sm"
      >
        <LucideXCircle class="text-destructive size-8" />
        {{ $t('feedback_error') }}
      </div>

      <div v-else-if="kit" class="max-h-[55vh] space-y-4 overflow-y-auto py-1">
        <!-- Step 1: Review -->
        <div v-if="currentStep === 1" class="space-y-4">
          <p class="text-muted-foreground text-sm">
            {{ kit.description || '—' }}
          </p>
          <div
            class="bg-muted/40 grid grid-cols-2 gap-px overflow-hidden rounded-lg border"
          >
            <div class="bg-background flex flex-col gap-0.5 px-3 py-2.5">
              <span class="text-muted-foreground text-[10px] uppercase">
                {{ $t('kits.workflows') }}
              </span>
              <span class="text-sm font-semibold">{{ workflows.length }}</span>
            </div>
            <div class="bg-background flex flex-col gap-0.5 px-3 py-2.5">
              <span class="text-muted-foreground text-[10px] uppercase">
                {{ $t('kits.variables') }}
              </span>
              <span class="text-sm font-semibold">
                {{ (kit.variables ?? []).length }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 2: Select workflows -->
        <div v-else-if="currentStep === 2" class="space-y-3">
          <p class="text-muted-foreground text-sm">
            {{ $t('kits.wizard.workflows_description') }}
          </p>
          <div
            v-for="w in workflows"
            :key="w.refId"
            class="flex items-start gap-3 rounded-md border p-3"
          >
            <Checkbox
              :id="`wf-${w.refId}`"
              :model-value="!!selected[w.refId] || lockedRefs.has(w.refId)"
              :disabled="lockedRefs.has(w.refId)"
              class="mt-0.5"
              @update:model-value="toggleWorkflow(w.refId, !!$event)"
            />
            <label
              :for="`wf-${w.refId}`"
              class="min-w-0 flex-1 cursor-pointer space-y-1"
            >
              <span class="block text-sm font-medium">
                {{ workflowName(w) }}
              </span>
              <span
                v-if="w.description"
                class="text-muted-foreground block text-xs"
              >
                {{ w.description }}
              </span>
              <span v-if="(w.dependencies ?? []).length" class="block text-xs">
                {{ $t('kits.depends_on', { names: dependencyNames(w.refId) }) }}
              </span>
              <span
                v-if="lockedRefs.has(w.refId)"
                class="text-muted-foreground block text-xs italic"
              >
                {{ $t('kits.required_by', { names: dependantNames(w.refId) }) }}
              </span>
            </label>
          </div>
        </div>

        <!-- Step 3: Configure variables -->
        <div v-else-if="currentStep === 3" class="space-y-3">
          <p class="text-muted-foreground text-sm">
            {{ $t('kits.wizard.variables_description') }}
          </p>
          <p
            v-if="visibleVariables.length === 0"
            class="text-muted-foreground rounded-md border border-dashed py-6 text-center text-sm"
          >
            {{ $t('kits.wizard.no_variables') }}
          </p>
          <div v-for="v in visibleVariables" :key="v.key" class="space-y-1.5">
            <label
              :for="`var-${v.key}`"
              class="flex items-center gap-1.5 text-sm font-medium"
            >
              <code class="bg-muted rounded px-1 py-0.5 text-xs">
                {{ v.key }}
              </code>
              <Badge v-if="v.isSecret" variant="secondary" size="sm">
                <LucideKeyRound class="size-3" />
                {{ $t('kits.secret') }}
              </Badge>
            </label>
            <Input
              :id="`var-${v.key}`"
              v-model="values[v.key]"
              :type="v.isSecret ? 'password' : 'text'"
              :placeholder="v.defaultValue || v.key"
              autocomplete="off"
            />
            <p v-if="v.description" class="text-muted-foreground text-xs">
              {{ v.description }}
            </p>
          </div>
        </div>

        <!-- Step 4: Done -->
        <div v-else-if="currentStep === 4 && result" class="pt-8 pb-2">
          <div class="flex flex-col items-center gap-2 text-center">
            <LucideCircleCheck class="size-10 text-green-500" />
            <p class="text-base font-semibold">{{ $t('kits.done_title') }}</p>
            <p class="text-muted-foreground text-sm">
              {{ $t('kits.done_summary', { name: result.kitName }) }}
            </p>
          </div>
        </div>
      </div>

      <DialogFooter>
        <!-- Result step -->
        <template v-if="currentStep === 4">
          <Button variant="outline" @click="close">{{ $t('close') }}</Button>
          <Button @click="goToInstalled">
            {{ $t('kits.view_installed') }}
          </Button>
        </template>
        <!-- Wizard steps -->
        <template v-else>
          <Button
            v-if="isFirstStep"
            variant="outline"
            :disabled="installing"
            @click="close"
          >
            {{ $t('cancel') }}
          </Button>
          <Button
            v-else
            variant="outline"
            :disabled="installing"
            @click="previousStep"
          >
            {{ $t('kits.back') }}
          </Button>

          <Button
            v-if="currentStep < 3"
            :disabled="!canContinue || loadingKit || loadError"
            @click="nextStep"
          >
            {{ $t('next') }}
          </Button>
          <Button
            v-else
            :disabled="installing || missingRequired"
            @click="performInstall"
          >
            <LucideLoader
              v-if="installing"
              class="mr-1.5 size-3.5 animate-spin"
            />
            <LucideDownload v-else class="mr-1.5 size-3.5" />
            {{ installing ? $t('kits.installing') : $t('kits.install') }}
          </Button>
        </template>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
