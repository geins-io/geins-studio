<script lang="ts" setup>
import type { LabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { useFormField } from './useFormField';

const { t } = useI18n();

const props = defineProps<
  LabelProps & { class?: HTMLAttributes['class']; optional?: boolean }
>();

const { error, formItemId } = useFormField();
</script>

<template>
  <Label
    :class="cn(error && 'text-destructive', props.class)"
    :for="formItemId"
  >
    <slot />
    <span
      v-if="optional"
      class="ml-1 text-xs font-normal text-muted-foreground"
    >
      ({{ t('form.optional') }})
    </span>
  </Label>
</template>
