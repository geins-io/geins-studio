<script setup lang="ts">
import type { StorefrontSchema, StorefrontSettings } from '#shared/types';
import defaultSchemaJson from '@/assets/schemas/storefront-settings-default.json';

const props = defineProps<{
  schema: StorefrontSchema;
  modelValue: StorefrontSettings;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: StorefrontSettings];
  'open-schema-editor': [];
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

function onSettingsUpdate(value: StorefrontSettings) {
  emit('update:modelValue', value);
}
</script>

<template>
  <ContentEditCard :title="t('channels.storefront_settings')">
    <template #header-action>
      <div class="flex items-center gap-2">
        <TooltipProvider :delay-duration="100">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" size="sm" disabled>
                <LucideEye class="mr-2 size-4" />
                {{ t('channels.preview_storefront') }}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {{ t('channels.preview_storefront_coming_soon') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

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
          </DropdownMenuContent>
        </DropdownMenu>
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
