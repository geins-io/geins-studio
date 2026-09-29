<script setup lang="ts">
import type {
  SchemaApplyOptions,
  SchemaChangeAnalysis,
  StorefrontSchema,
  StorefrontSettings,
} from '#shared/types';
import { analyzeSchemaChange } from '@/utils/storefront';

const props = defineProps<{
  open: boolean;
  schema: StorefrontSchema;
  /** Current settings — analyzed against the edited schema before applying. */
  settings: StorefrontSettings;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  apply: [schema: StorefrontSchema, options: SchemaApplyOptions];
}>();

const { t } = useI18n();

const editorContent = ref('');

// Initialize editor content when sheet opens
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      editorContent.value = JSON.stringify(props.schema, null, 2);
    }
  },
);

// Live JSON validation
const jsonError = computed<string | null>(() => {
  try {
    const parsed = JSON.parse(editorContent.value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return t('channels.schema_editor_invalid_schema');
    }
    if (Object.keys(parsed).length === 0) {
      return t('channels.schema_editor_invalid_schema');
    }
    return null;
  } catch {
    return t('channels.schema_editor_invalid_json');
  }
});

const applyDialogOpen = ref(false);
const pendingSchema = ref<StorefrontSchema | null>(null);
const pendingAnalysis = ref<SchemaChangeAnalysis>({
  added: [],
  typeReset: [],
  orphaned: [],
});

// The sheet stays open behind the dialog so cancelling keeps the edited JSON.
function handleApply() {
  if (jsonError.value) return;
  const parsed = JSON.parse(editorContent.value) as StorefrontSchema;
  pendingSchema.value = parsed;
  pendingAnalysis.value = analyzeSchemaChange(
    props.schema,
    parsed,
    props.settings,
  );
  applyDialogOpen.value = true;
}

function handleConfirm(options: SchemaApplyOptions) {
  if (!pendingSchema.value) return;
  emit('apply', pendingSchema.value, options);
  applyDialogOpen.value = false;
  emit('update:open', false);
}
</script>

<template>
  <Sheet :open="props.open" @update:open="emit('update:open', $event)">
    <SheetContent width="medium">
      <SheetHeader>
        <SheetTitle>{{ t('channels.schema_editor_title') }}</SheetTitle>
        <SheetDescription>
          {{ t('channels.schema_editor_description') }}
        </SheetDescription>
      </SheetHeader>
      <SheetBody class="flex flex-1 flex-col gap-4 overflow-hidden">
        <Feedback type="warning">
          <template #title>
            {{ t('channels.schema_editor_warning_title') }}
          </template>
          <template #description>
            {{ t('channels.schema_editor_warning_description') }}
          </template>
        </Feedback>
        <LazySharedJsonCodeEditor
          v-model="editorContent"
          class="min-h-0 flex-1"
        />
        <Feedback v-if="jsonError" type="negative">
          <template #title>
            {{ t('channels.schema_editor_invalid_title') }}
          </template>
          <template #description>
            {{ jsonError }}
          </template>
        </Feedback>
      </SheetBody>
      <SheetFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t('cancel') }}
        </Button>
        <Button :disabled="!!jsonError" @click="handleApply">
          {{ t('channels.schema_editor_apply') }}
        </Button>
      </SheetFooter>
      <ChannelSchemaApplyDialog
        v-model:open="applyDialogOpen"
        :analysis="pendingAnalysis"
        @confirm="handleConfirm"
      />
    </SheetContent>
  </Sheet>
</template>
