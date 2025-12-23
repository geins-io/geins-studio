<script lang="ts" setup>
import type { LabelProps } from 'reka-ui';
import type { HTMLAttributes } from 'vue';
import { cn } from '@/utils/index';
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
    data-slot="form-label"
    :data-error="!!error"
    :class="cn('data-[error=true]:text-destructive', props.class)"
    :for="formItemId"
  >
    <slot />
    <span
      v-if="optional"
      class="text-muted-foreground ml-1 text-xs font-normal"
    >
      ({{ $t('form.optional') }})
    </span>
  </Label>
</template>
