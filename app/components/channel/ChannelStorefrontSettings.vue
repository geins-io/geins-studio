<script setup lang="ts">
import type { StorefrontSchema, StorefrontSettings } from '#shared/types';
import defaultSchemaJson from '@/assets/schemas/storefront-settings-default.json';

const props = defineProps<{
  schema: StorefrontSchema;
  modelValue: StorefrontSettings;
  resetting?: boolean;
  previewing?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: StorefrontSettings];
  'open-schema-editor': [];
  'reset-to-default': [];
  preview: [];
}>();

const { t } = useI18n();
const { geinsLog } = useGeinsLog('ChannelStorefrontSettings');

// Resolve the active schema — fall back to default if empty
const activeSchema = computed<StorefrontSchema>(() => {
  if (props.schema && Object.keys(props.schema).length > 0) {
    return props.schema;
  }
  geinsLog('Schema prop is empty — falling back to default schema');
  return defaultSchemaJson as StorefrontSchema;
});

// Dynamic sub-tabs from schema keys
const tabKeys = computed(() => Object.keys(activeSchema.value));
const activeTab = ref(tabKeys.value[0] ?? '');

// Keep activeTab valid when schema changes
watch(tabKeys, (keys) => {
  if (!keys.includes(activeTab.value)) {
    activeTab.value = keys[0] ?? '';
  }
});

const resetConfirmOpen = ref(false);

function onSettingsUpdate(value: StorefrontSettings) {
  emit('update:modelValue', value);
}
</script>

<template>
  <ContentEditCard :title="t('channels.storefront_settings')">
    <template #header-action>
      <div class="flex items-center gap-2">
        <Button
          variant="secondary"
          :loading="props.previewing"
          :disabled="props.disabled"
          @click="emit('preview')"
        >
          <LucideScanEye class="mr-2 size-4" />
          {{ t('channels.preview_storefront') }}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="secondary" size="icon" class="p-1">
              <LucideMoreHorizontal class="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem @click="emit('open-schema-editor')">
              <LucideBraces class="mr-2 size-4" />
              <span>{{ t('channels.change_schema') }}</span>
            </DropdownMenuItem>
            <DropdownMenuItem @click="resetConfirmOpen = true">
              <LucideRotateCcw class="mr-2 size-4" />
              <span>{{ t('channels.reset_schema') }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog v-model:open="resetConfirmOpen">
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{{
                t('channels.reset_schema_confirm_title')
              }}</AlertDialogTitle>
              <AlertDialogDescription>{{
                t('channels.reset_schema_confirm_description')
              }}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{{ t('cancel') }}</AlertDialogCancel>
              <Button
                variant="destructive"
                :loading="props.resetting"
                @click.prevent.stop="
                  emit('reset-to-default');
                  resetConfirmOpen = false;
                "
              >
                {{ t('continue') }}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </template>

    <Tabs v-model="activeTab">
      <TabsList>
        <TabsTrigger v-for="key in tabKeys" :key="key" :value="key">
          {{ activeSchema[key]?.label ?? key }}
        </TabsTrigger>
      </TabsList>

      <TabsContent v-for="key in tabKeys" :key="key" :value="key" class="mt-4">
        <ChannelStorefrontSchemaRenderer
          :schema="activeSchema[key]!"
          :model-value="modelValue"
          @update:model-value="onSettingsUpdate"
        />
      </TabsContent>
    </Tabs>
  </ContentEditCard>
</template>
