import { cva, type VariantProps } from 'class-variance-authority';

export { default as Alert } from './Alert.vue';
export { default as AlertDescription } from './AlertDescription.vue';
export { default as AlertTitle } from './AlertTitle.vue';

export const alertVariants = cva(
  'text-foreground [&>svg]:text-foreground relative w-full rounded-lg border bg-transparent px-4 py-3 text-sm shadow-xs [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: '',
        info: 'border-info-icon/30 [&>svg]:text-info-icon dark:[&>svg]:text-info-icon/80',
        destructive: 'border-destructive/35 [&>svg]:text-destructive',
        positive: 'border-positive/40 [&>svg]:text-positive',
        warning: 'border-warning/40 [&>svg]:text-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;
