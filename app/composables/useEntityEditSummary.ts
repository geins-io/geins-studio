import type { StatusBadgeStatus } from '#shared/types';
import type { ComputedRef, Ref } from 'vue';

interface EntityEditSummaryProps {
  createMode: Ref<boolean> | ComputedRef<boolean>;
  formTouched: Ref<boolean> | ComputedRef<boolean>;
  summary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
  settingsSummary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
  entityName: string;
  entityLiveStatus: Ref<boolean> | ComputedRef<boolean>;
  showActiveStatus?: boolean;
  status?: Ref<StatusBadgeStatus> | ComputedRef<StatusBadgeStatus> | StatusBadgeStatus;
}

/** Return type for {@link useEntityEditSummary}. */
interface UseEntityEditSummaryReturnType {
  summaryProps: ComputedRef<{
    createMode: boolean;
    formTouched: boolean;
    summary: DataItem[];
    settingsSummary?: DataItem[];
    entityName: string;
    entityLiveStatus: boolean;
    showActiveStatus?: boolean;
    status?: StatusBadgeStatus;
  }>;
}

/**
 * Composable for generating entity edit summary properties.
 *
 * Transforms reactive properties into a computed object with unwrapped values
 * for use in entity edit summary components.
 *
 * @param props - Configuration object with entity edit summary data
 * @returns {UseEntityEditSummaryReturnType} - An object containing computed summary properties
 * @property {ComputedRef} summaryProps - Computed object with unwrapped summary data
 */
export const useEntityEditSummary = (
  props: EntityEditSummaryProps,
): UseEntityEditSummaryReturnType => {
  const summaryProps = computed(() => ({
    createMode: unref(props.createMode),
    formTouched: unref(props.formTouched),
    summary: unref(props.summary),
    settingsSummary: unref(props.settingsSummary),
    entityName: props.entityName,
    entityLiveStatus: unref(props.entityLiveStatus),
    ...(props.showActiveStatus !== undefined && {
      showActiveStatus: props.showActiveStatus,
    }),
    ...(props.status !== undefined && { status: unref(props.status) }),
  }));

  return { summaryProps };
};
