import { cva, type VariantProps } from 'class-variance-authority';

export { default as Alert } from './Alert.vue';
export { default as AlertDescription } from './AlertDescription.vue';
export { default as AlertTitle } from './AlertTitle.vue';

export const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm [&>svg]:absolute [&>svg]:top-4 [&>svg]:left-4 [&>svg+div]:translate-y-[-3px] [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default:
          'text-foreground [&>svg]:text-foreground bg-transparent shadow-xs',
        // Filled in the type's color (docs/guides/ui/colors.md).
        info: 'bg-info-callout-bg border-info-callout-border text-info-callout-foreground [&>svg]:text-info-callout-icon',
        destructive:
          'bg-negative-callout-bg border-negative-callout-border text-negative-callout-foreground [&>svg]:text-negative-callout-icon',
        positive:
          'bg-positive-callout-bg border-positive-callout-border text-positive-callout-foreground [&>svg]:text-positive-callout-icon',
        warning:
          'bg-warning-callout-bg border-warning-callout-border text-warning-callout-foreground [&>svg]:text-warning-callout-icon',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export type AlertVariants = VariantProps<typeof alertVariants>;
