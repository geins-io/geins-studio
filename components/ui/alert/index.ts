import { type VariantProps, cva } from 'class-variance-authority';

export { default as Alert } from './Alert.vue';
export { default as AlertTitle } from './AlertTitle.vue';
export { default as AlertDescription } from './AlertDescription.vue';

export const alertVariants = cva(
  'relative w-full rounded-md text-foreground shadow-md px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive: 'bg-destructive-muted [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;
