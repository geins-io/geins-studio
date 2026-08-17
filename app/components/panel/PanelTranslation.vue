<script setup lang="ts">
import type { LocalizedText } from '#shared/types';

/**
 * Global translation panel — edits a locale-keyed value ({@link LocalizedText})
 * across the account's configured languages. Built on `PanelEdit`, so it stacks
 * over a base panel (panel-on-panel) with the shared unsaved-changes guard.
 *
 * Locales come from the account language setup (not a fixed list); the current
 * language sorts first and is marked as default. Opened programmatically from a
 * translatable field via `v-model:open`; `v-model` carries the value.
 */
const props = defineProps<{
  /** Field being translated; used in each locale input's placeholder. */
  fieldLabel?: string;
  /** Context shown before the fill count in the subtitle (e.g. asset name). */
  subject?: string;
}>();

const open = defineModel<boolean>('open', { default: false });
const model = defineModel<LocalizedText>({ default: () => ({}) });

const { t } = useI18n();
const { languages, currentLanguage } = storeToRefs(useAccountStore());

// Active languages with the current/default language first.
const orderedLanguages = computed(() =>
  [...languages.value.filter((lang) => lang.active)].sort((a, b) => {
    if (a._id === currentLanguage.value) return -1;
    if (b._id === currentLanguage.value) return 1;
    return a.name.localeCompare(b.name);
  }),
);

const canTranslate = computed(() => orderedLanguages.value.length > 1);

// Working copy: seed every locale so inputs are controlled strings.
const working = ref<LocalizedText>({});
watch(open, (value) => {
  if (!value) return;
  const seeded: LocalizedText = {};
  for (const lang of orderedLanguages.value) {
    seeded[lang._id] = model.value?.[lang._id] ?? '';
  }
  working.value = seeded;
});

const filledCount = computed(
  () => Object.values(working.value).filter((value) => value?.trim()).length,
);
const subtitle = computed(() => {
  const count = t('languages_filled', {
    filled: filledCount.value,
    total: orderedLanguages.value.length,
  });
  return props.subject ? `${props.subject} · ${count}` : count;
});

// Drop blank locales so we never persist empty strings.
const cleaned = computed<LocalizedText>(() => {
  const out: LocalizedText = {};
  for (const [code, value] of Object.entries(working.value)) {
    if (value?.trim()) out[code] = value;
  }
  return out;
});

// Order-independent compare so re-ordered keys don't read as dirty.
function stable(value: LocalizedText): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, value[key]]),
    ),
  );
}
const isDirty = computed(
  () => stable(cleaned.value) !== stable(model.value ?? {}),
);

function handleSave() {
  model.value = { ...cleaned.value };
  open.value = false;
}

function handleDiscard() {
  working.value = {};
}
</script>

<template>
  <PanelEdit
    v-model:open="open"
    width="narrow"
    :title="$t('translations')"
    :description="subtitle"
    :dirty="isDirty"
    :hide-footer="!canTranslate"
    @save="handleSave"
    @discard="handleDiscard"
  >
    <div v-if="canTranslate" class="space-y-4">
      <div v-for="lang in orderedLanguages" :key="lang._id" class="space-y-1.5">
        <Label :for="`translation-${lang._id}`" class="flex items-center gap-2">
          <FlagIcon
            :country-code="languageToCountryCode(lang._id)"
            :name="lang.name"
          />
          <span
            v-if="lang._id === currentLanguage"
            class="text-muted-foreground font-normal"
          >
            · {{ $t('default') }}
          </span>
        </Label>
        <Input
          :id="`translation-${lang._id}`"
          v-model="working[lang._id]"
          type="text"
          :placeholder="
            $t('translation_field_placeholder', {
              field: fieldLabel,
              language: lang.name,
            })
          "
        />
      </div>
    </div>

    <Empty v-else>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <LucideLanguages />
        </EmptyMedia>
        <EmptyTitle>{{ $t('translations') }}</EmptyTitle>
        <EmptyDescription>
          {{ $t('translations_single_language') }}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  </PanelEdit>
</template>
