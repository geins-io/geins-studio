import { cva, type VariantProps } from 'class-variance-authority';

export { default as Badge } from './Badge.vue';

export const badgeVariants = cva(
  'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full font-semibold whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      size: {
        default: 'h-6 px-2 py-1 text-xs',
        sm: 'h-5 px-1.5 py-0.5 text-[11px]',
      },
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
        'warning-light': 'bg-warning/20 ring-warning text-warning ring-1',
        'warning-outline':
          'text-warning ring-warning border-warning bg-transparent ring-1',
        inactive:
          'bg-muted text-muted-foreground/60 dark:bg-muted/90 dark:text-muted-foreground/60',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
export type BadgeVariants = VariantProps<typeof badgeVariants>;
