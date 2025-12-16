import { cva, type VariantProps } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'inline-flex h-6 items-center justify-center rounded-full px-2 py-1 text-xs font-semibold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-muted-foreground dark:bg-secondary',
        outline:
          'border bg-secondary text-primary/70 dark:border-muted-foreground/30',
        positive: 'bg-positive text-positive-foreground',
        negative: 'bg-negative text-negative-foreground',
        warning: 'bg-warning text-warning-foreground',
        inactive:
          'bg-muted text-muted-foreground/60 dark:bg-muted/90 dark:text-muted-foreground/60',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);
export type BadgeVariants = VariantProps<typeof badgeVariants>;
