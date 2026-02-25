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
    class="flex items-center gap-1 rounded-lg border px-1.5 py-0.5 shadow-xs transition-all hover:shadow-sm"
    type="button"
    @click="copyValue"
    @mouseover="hovered = true"
    @mouseleave="hovered = false"
  >
    <slot />
    <span class="relative size-3">
      <LucideCopy
        :class="
          cn('absolute inset-0 size-3 transition-all', hovered && !copied ? 'text-positive' : '', copied ? 'opacity-0 scale-75' : 'opacity-100 scale-100')
        "
      />
      <LucideCopyCheck
        :class="
          cn('absolute inset-0 size-3 text-positive transition-all', copied ? 'opacity-100 scale-100' : 'opacity-0 scale-75')
        "
      />
    </span>
  </button>
</template>
