<script setup lang="ts">
import type { LocalizedText } from '#shared/types';

/**
 * A translatable text field: an inline input for the current language + a flag
 * affordance that opens the global translation panel ([PanelTranslation]) to
 * edit every configured language. The panel auto-stacks (panel-on-panel) when
 * this field lives inside another panel, or opens as a normal sheet on a plain
 * page — driven by `usePanelStack`, no wiring needed.
 *
 * Drop it inside a vee-validate `FormField`/`FormItem` and bind `v-model` to the
 * field's `LocalizedText` value (the caller owns the `FormLabel`).
 */
defineProps<{
  /** Field label — the translation panel's subtitle + per-language placeholder. */
  label?: string;
  placeholder?: string;
  /** Context before the fill count in the panel subtitle (e.g. the entity name). */
  subject?: string;
  disabled?: boolean;
}>();

const model = defineModel<LocalizedText>({ default: () => ({}) });
const open = ref(false);

const { currentLanguage } = storeToRefs(useAccountStore());

// The inline input edits the current language; the panel edits every language.
const current = computed<string>({
  get: () => model.value[currentLanguage.value] ?? '',
  set: (value) => {
    if (value) {
      model.value = { ...model.value, [currentLanguage.value]: value };
    } else {
      // Drop the current language without a dynamic delete.
      const { [currentLanguage.value]: _removed, ...rest } = model.value;
      model.value = rest;
    }
  },
});
</script>

<template>
  <div class="relative">
    <Input
      v-model="current"
      :placeholder="placeholder"
      :disabled="disabled"
      class="pr-11"
    />
    <button
      type="button"
      class="absolute top-1/2 right-3 -translate-y-1/2 transition-opacity hover:opacity-80 disabled:opacity-50"
      :disabled="disabled"
      :aria-label="$t('translations')"
      @click="open = true"
    >
      <FlagIcon :country-code="languageToCountryCode(currentLanguage)" />
    </button>
  </div>

  <PanelTranslation
    v-model:open="open"
    v-model="model"
    :field-label="label"
    :subject="subject"
  />
</template>
