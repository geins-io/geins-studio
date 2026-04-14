<script setup lang="ts">
import type { WorkflowVariable } from '#shared/types';
import { useToast } from '@/components/ui/toast/use-toast';
import {
  LucideEye,
  LucideEyeOff,
  LucideTrash2,
  LucideKeyRound,
  LucideCopy,
  LucideCheck,
  LucideMoreHorizontal,
} from '#components';

definePageMeta({
  pageType: 'list',
});

const route = useRoute();
const { orchestratorApi } = useGeinsRepository();
const { toast } = useToast();
const breadcrumbsStore = useBreadcrumbsStore();

const routeKey = computed(() => decodeURIComponent(route.params.id as string));
const isNew = computed(() => routeKey.value === 'new');
const entityName = 'variable';

// ─── Fetch existing variable (skip for new) ────────────────────────
const { data: existing, error, refresh } = await useAsyncData(
  () => `variable-${routeKey.value}`,
  () => (isNew.value ? Promise.resolve(null) : orchestratorApi.variable.get(routeKey.value)),
  {
    watch: [routeKey],
    getCachedData: () => undefined,
  },
);

// ─── Form state ────────────────────────────────────────────────────
const keyField = ref('');
const value = ref('');
const description = ref('');
const isSecret = ref(true);
const showValue = ref(false);
const saving = ref(false);

const resetForm = (v: WorkflowVariable | null) => {
  if (v) {
    keyField.value = v.key;
    value.value = v.value ?? '';
    description.value = v.description ?? '';
    isSecret.value = v.isSecret ?? false;
  }
  else {
    keyField.value = '';
    value.value = '';
    description.value = '';
    isSecret.value = true;
  }
  showValue.value = !isSecret.value;
};

watch(existing, (v) => resetForm(v ?? null), { immediate: true });

// Breadcrumb
watch([isNew, keyField], ([isNewVal, key]) => {
  const label = isNewVal ? 'New variable' : (key || routeKey.value);
  breadcrumbsStore.setCurrentTitle(label);
}, { immediate: true });

const canSave = computed(() => keyField.value.trim().length > 0);

const handleSave = async () => {
  if (!canSave.value) return;
  saving.value = true;
  try {
    await orchestratorApi.variable.save({
      key: keyField.value.trim(),
      value: value.value,
      description: description.value || undefined,
      isSecret: isSecret.value,
    });
    toast({ title: 'Variable saved' });
    if (isNew.value) {
      await navigateTo(`/orchestrator/variables/${encodeURIComponent(keyField.value.trim())}`);
    }
    else {
      await refresh();
    }
  }
  catch (err) {
    toast({
      title: 'Save failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  }
  finally {
    saving.value = false;
  }
};

const deleteEntity = async (): Promise<boolean> => {
  if (isNew.value || !existing.value) return false;
  try {
    await orchestratorApi.variable.delete(existing.value.key);
    toast({ title: 'Variable deleted' });
    return true;
  }
  catch (err) {
    toast({
      title: 'Delete failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
    return false;
  }
};

const { deleteDialogOpen, deleting, openDeleteDialog, confirmDelete } =
  useDeleteDialog(deleteEntity, '/orchestrator/variables/list');

// ─── Copy value ────────────────────────────────────────────────────
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const copyValue = async () => {
  if (!value.value) return;
  try {
    await navigator.clipboard.writeText(value.value);
    copied.value = true;
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => { copied.value = false; }, 1500);
  }
  catch (err) {
    toast({
      title: 'Copy failed',
      description: err instanceof Error ? err.message : String(err),
      variant: 'negative',
    });
  }
};

const pageTitle = computed(() => (isNew.value ? 'New variable' : keyField.value || routeKey.value));
</script>

<template>
  <div v-if="error" class="text-destructive border-destructive/30 bg-destructive/5 rounded-lg border p-4 text-sm">
    Failed to load variable: {{ error.message ?? 'Unknown error' }}
  </div>
  <div v-else class="flex flex-col gap-4">
    <ContentHeader :title="pageTitle" :entity-name="entityName">
      <ContentActionBar>
        <ButtonIcon
          icon="save"
          :disabled="!canSave || saving"
          @click="handleSave">
          {{ $t('save_entity', { entityName }) }}
        </ButtonIcon>
        <DropdownMenu v-if="!isNew">
          <DropdownMenuTrigger as-child>
            <Button size="icon" variant="secondary">
              <LucideMoreHorizontal class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem :disabled="deleting" @click="openDeleteDialog">
              <LucideTrash2 class="text-destructive mr-2 size-4" />
              <span>{{ $t('delete_entity', { entityName }) }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ContentActionBar>
    </ContentHeader>

    <form class="max-w-2xl space-y-5" @submit.prevent="handleSave">
      <div class="space-y-2">
        <Label for="variable-key">Key</Label>
        <Input
          id="variable-key"
          v-model="keyField"
          :disabled="!isNew"
          placeholder="e.g. MONITOR_API_KEY"
          autocomplete="off" />
        <p class="text-muted-foreground text-xs">
          {{ isNew ? 'The key is permanent once the variable is created.' : 'Key cannot be changed. Delete and recreate if you need to rename it.' }}
        </p>
      </div>

      <div class="space-y-2">
        <Label for="variable-value">Value</Label>
        <div class="relative">
          <Input
            id="variable-value"
            v-model="value"
            :type="isSecret && !showValue ? 'password' : 'text'"
            placeholder="Enter value…"
            autocomplete="off"
            class="pr-20" />
          <div class="absolute inset-y-0 right-0 flex items-center gap-0.5 pr-1">
            <button
              v-if="isSecret"
              type="button"
              class="hover:bg-muted text-muted-foreground rounded p-1.5"
              :title="showValue ? 'Hide value' : 'Show value'"
              @click="showValue = !showValue">
              <component :is="showValue ? LucideEyeOff : LucideEye" class="h-4 w-4" />
            </button>
            <button
              type="button"
              class="hover:bg-muted text-muted-foreground rounded p-1.5"
              :disabled="!value"
              :title="copied ? 'Copied!' : 'Copy value'"
              @click="copyValue">
              <component :is="copied ? LucideCheck : LucideCopy" class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="variable-description">Description</Label>
        <Input
          id="variable-description"
          v-model="description"
          placeholder="Optional description" />
      </div>

      <div class="bg-muted/40 flex items-start gap-3 rounded-lg border p-3">
        <LucideKeyRound class="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
        <div class="flex-1 space-y-1">
          <div class="flex items-center justify-between gap-2">
            <Label for="variable-secret" class="text-sm font-medium">
              Secret
            </Label>
            <Switch id="variable-secret" :model-value="isSecret" @update:model-value="isSecret = $event" />
          </div>
          <p class="text-muted-foreground text-xs">
            Secret values are masked in the variable list and stored encrypted. Use for API keys, tokens, and credentials.
          </p>
        </div>
      </div>
    </form>

    <DialogDelete
      v-model:open="deleteDialogOpen"
      :entity-name="entityName"
      :loading="deleting"
      @confirm="confirmDelete" />
  </div>
</template>
