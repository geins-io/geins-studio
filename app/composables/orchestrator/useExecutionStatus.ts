import type { Component } from 'vue';
import {
  LucideCircleCheck,
  LucideCircleX,
  LucideLoader,
  LucideBan,
  LucideTimer,
  LucidePause,
  LucidePlay,
  LucideCircleAlert,
} from '#components';

export interface ExecutionStatusVisual {
  icon: Component;
  class: string;
}

interface UseExecutionStatusReturnType {
  resolveStatusIcon: (status: string | null | undefined) => ExecutionStatusVisual;
}

const STATUS_ICON_MAP: Record<string, ExecutionStatusVisual> = {
  completed: { icon: LucideCircleCheck, class: 'text-green-500' },
  running: { icon: LucideLoader, class: 'text-blue-500 animate-spin' },
  failed: { icon: LucideCircleX, class: 'text-destructive' },
  canceled: { icon: LucideBan, class: 'text-muted-foreground' },
  cancelled: { icon: LucideBan, class: 'text-muted-foreground' },
  timedout: { icon: LucideTimer, class: 'text-yellow-500' },
  suspended: { icon: LucidePause, class: 'text-yellow-500' },
  pending: { icon: LucidePlay, class: 'text-muted-foreground' },
};

const FALLBACK: ExecutionStatusVisual = {
  icon: LucideCircleAlert,
  class: 'text-muted-foreground',
};

/**
 * Single source of truth for execution status → icon/color.
 *
 * Accepts any casing (the upstream API is inconsistent: `Running`,
 * `running`, `RUNNING`) and returns a fallback icon for unknown values.
 * Used by the execution detail header, the executions list table, and
 * the node executions panel.
 */
export const useExecutionStatus = (): UseExecutionStatusReturnType => {
  const resolveStatusIcon = (status: string | null | undefined): ExecutionStatusVisual => {
    return STATUS_ICON_MAP[status?.toLowerCase() ?? ''] ?? FALLBACK;
  };

  return { resolveStatusIcon };
};
