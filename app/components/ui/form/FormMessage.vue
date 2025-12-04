<script lang="ts" setup>
import { ErrorMessage } from 'vee-validate';
import { type HTMLAttributes, toValue } from 'vue';
import { cn } from '@/utils/index';
import { useFormField } from './useFormField';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const { name, formMessageId } = useFormField();
</script>

<template>
  <ErrorMessage
    :id="formMessageId"
    data-slot="form-message"
    as="p"
    :name="toValue(name)"
    :class="
      cn(
        'text-destructive pl-1.5 text-xs text-[0.8rem] font-medium',
        props.class,
      )
    "
  />
</template>
