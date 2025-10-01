<script setup lang="ts">
import { useToast } from '@/components/ui/toast/use-toast';
const props = defineProps<{
  label?: string;
  value: unknown;
}>();
const { toast } = useToast();
const { t } = useI18n();
const copied = ref(false);
const hovered = ref(false);
const copyValue = () => {
  navigator.clipboard.writeText(String(props.value));
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 5000);
  toast({
    title: t('copied_to_clipboard', { label: props.label }),
    variant: 'positive',
  });
};
</script>
<template>
  <button
    v-auto-animate
    class="flex items-center gap-1 rounded-lg border px-1.5 py-0.5 shadow-xs transition-all hover:shadow-sm"
    type="button"
    @click="copyValue"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <slot />
    <LucideCopy
      v-if="!copied"
      :class="
        cn('size-3 transition-colors', `${hovered ? 'text-positive' : ''}`)
      "
    />
    <LucideCopyCheck v-else class="size-3 text-positive" />
  </button>
</template>
