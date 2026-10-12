<script setup lang="ts">
import type { EntityBaseWithName } from '#shared/types';
import { ASSET_LABEL_LIMITS, assetLabelLimitError } from '#shared/utils/asset';

/**
 * Properties pane of the bulk "Add tags" / "Add channels" / "Add content
 * languages" actions: the same inputs the detail panel uses, plus a line saying
 * the values are added to what each asset already has. A breached limit shows
 * inline; the action's `isValid` keeps Run disabled until it's fixed.
 */
const props = defineProps<{ kind: 'tags' | 'channels' | 'languages' }>();
const values = defineModel<string[]>({ default: () => [] });

const { t } = useI18n();
const { assetApi } = useGeinsRepository();

const ENTITY_KEYS = {
  tags: 'tag',
  channels: 'channel',
  languages: 'content_language',
} as const;
const entityKey = computed(() => ENTITY_KEYS[props.kind]);

// Same key as the detail panel, so an open there reuses this fetch.
const { data: allTags } = useAsyncData<string[]>(
  'asset-tags',
  () => assetApi.listTags(),
  { default: () => [], immediate: props.kind === 'tags' },
);
const tagOptions = computed<EntityBaseWithName[]>(() =>
  (allTags.value ?? []).map((tag) => ({ _id: tag, name: tag })),
);

const limitMessage = computed(() => {
  const error = assetLabelLimitError(values.value, props.kind);
  if (!error) return undefined;
  const { maxCount, maxLength } = ASSET_LABEL_LIMITS[props.kind];
  return error === 'count'
    ? t('max_count_entity', { entityKey: entityKey.value, max: maxCount }, 2)
    : t('max_length_entity', { entityKey: entityKey.value, max: maxLength });
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-muted-foreground text-sm">
      {{ $t('asset_library.bulk_add_hint', { entityKey }, 2) }}
    </p>
    <FormInputTagsSearch
      v-if="kind === 'tags'"
      v-model="values"
      entity-key="tag"
      :data-set="tagOptions"
      :allow-custom-tags="true"
    />
    <FormInputChannels v-else-if="kind === 'channels'" v-model="values" />
    <FormInputLanguages v-else v-model="values" />
    <p v-if="limitMessage" class="text-destructive text-sm">
      {{ limitMessage }}
    </p>
  </div>
</template>
