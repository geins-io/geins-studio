<script lang="ts" setup>
import ItemDescription from '../ui/item/ItemDescription.vue';

const props = withDefaults(
  defineProps<{
    title: string;
    description?: string;
    icon?: string;
    mediaVariant?: 'icon' | 'image';
    size?: 'lg' | 'md' | 'sm';
    headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  }>(),
  {
    size: 'lg',
    headingLevel: 'h2',
    mediaVariant: 'icon',
  },
);

const { resolveIcon } = useLucideIcon();

const headerClasses = ref('');
const descriptionClasses = ref('');

switch (props.size) {
  case 'md':
    headerClasses.value = 'text-sm sm:text-base';
    descriptionClasses.value = 'text-xs sm:text-sm';
    break;
  case 'sm':
    headerClasses.value = 'text-sm ';
    descriptionClasses.value = 'text-xs sm:mt-1';
    break;
  case 'lg':
  default:
    headerClasses.value = 'text-md sm:text-xl';
    descriptionClasses.value = 'text-xs sm:text-sm sm:mt-1';
}
</script>
<template>
  <Item :class="cn('p-0 text-left', icon || $slots.icon ? 'flex gap-4' : '')">
    <ItemMedia
      v-if="icon || $slots.icon"
      class="size-9"
      :variant="mediaVariant"
    >
      <slot name="icon">
        <component :is="resolveIcon(icon!)" class="size-5" />
      </slot>
    </ItemMedia>
    <ItemContent>
      <ItemTitle as-child>
        <component
          :is="headingLevel"
          :class="cn('font-semibold', headerClasses)"
        >
          {{ title }}
        </component>
      </ItemTitle>
      <ItemDescription
        v-if="description"
        :class="cn('text-muted-foreground', descriptionClasses)"
      >
        {{ description }}
      </ItemDescription>
    </ItemContent>
  </Item>
</template>
