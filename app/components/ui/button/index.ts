import { cva, type VariantProps } from 'class-variance-authority';

export { default as Button } from './Button.vue';

export const buttonVariants = cva(
  'focus-visible:ring-ring inline-flex items-center justify-center rounded-lg text-xs font-normal whitespace-nowrap transition-all focus-visible:ring-1 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 dark:disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'bg-background hover:bg-background/80 dark:bg-muted dark:hover:bg-primary/10 border',
        secondary:
          'bg-card hover:bg-secondary/90 dark:bg-secondary/80 dark:hover:bg-secondary border',
        ghost:
          'hover:secondary-foreground hover:border-border hover:bg-secondary border border-transparent',
        link: 'text-primary dark:text-foreground px-0! underline underline-offset-4',
      },
      size: {
        default: 'h-8 px-3 py-2 sm:h-9 sm:px-4',
        xs: 'h-7 rounded-lg px-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-10 rounded-lg px-4',
        icon: 'size-8 sm:size-9',
        'icon-xs': 'size-6 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
