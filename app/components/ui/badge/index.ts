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
        // Status tones (docs/guides/ui/colors.md). Tints get a ring in dark
        // mode only, where a low tint alone doesn't lift off the card.
        positive: 'bg-positive text-positive-foreground',
        success:
          'bg-tone-success/8 text-tone-success dark:ring-tone-success/30 dark:ring-1',
        'success-solid': 'bg-tone-success text-tone-solid-foreground',
        info: 'bg-tone-info/10 text-tone-info dark:ring-tone-info/30 dark:ring-1',
        'info-solid': 'bg-tone-info text-tone-solid-foreground',
        warning:
          'bg-tone-warning-bg text-tone-warning dark:ring-tone-warning/30 dark:ring-1',
        danger:
          'bg-tone-danger/10 text-tone-danger dark:ring-tone-danger/30 dark:ring-1',
        neutral:
          'bg-tone-neutral/10 text-tone-neutral-foreground dark:ring-tone-neutral/30 dark:ring-1',
        draft:
          'border-border-dark text-tone-neutral border border-dashed bg-transparent',
        // Tag tones: categories that aren't a state (asset types).
        purple:
          'bg-tone-purple/10 text-tone-purple dark:ring-tone-purple/30 dark:ring-1',
        teal: 'bg-tone-teal/10 text-tone-teal dark:ring-tone-teal/30 dark:ring-1',
        indigo:
          'bg-tone-indigo/10 text-tone-indigo dark:ring-tone-indigo/30 dark:ring-1',
        pink: 'bg-tone-pink/10 text-tone-pink dark:ring-tone-pink/30 dark:ring-1',
        slate:
          'bg-tone-slate/10 text-tone-slate dark:ring-tone-slate/30 dark:ring-1',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
export type BadgeVariants = VariantProps<typeof badgeVariants>;
