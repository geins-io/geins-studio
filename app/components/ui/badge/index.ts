import { cva, type VariantProps } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-muted text-muted-foreground dark:bg-secondary',
        outline:
          'bg-secondary text-primary/70 dark:border-muted-foreground/30 border',
        positive: 'bg-positive text-positive-foreground',
        'positive-light': 'bg-positive/20 ring-positive text-positive ring-1',
        'positive-outline':
          'text-positive ring-positive border-positive bg-transparent ring-1',
        negative: 'bg-negative text-negative-foreground',
        'negative-light': 'bg-negative/20 ring-negative text-negative ring-1',
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
