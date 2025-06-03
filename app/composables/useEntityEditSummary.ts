import type { ComputedRef, Ref } from 'vue';

interface EntityEditSummaryProps {
  createMode: Ref<boolean> | ComputedRef<boolean>;
  formTouched: Ref<boolean> | ComputedRef<boolean>;
  summary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
  settingsSummary: Ref<DataItem[]> | ComputedRef<DataItem[]>;
  entityName: string;
  liveStatus: Ref<boolean> | ComputedRef<boolean>;
}

export const useEntityEditSummary = (props: EntityEditSummaryProps) => {
  const summaryProps = computed(() => ({
    createMode: unref(props.createMode),
    formTouched: unref(props.formTouched),
    summary: unref(props.summary),
    settingsSummary: unref(props.settingsSummary),
    entityName: props.entityName,
    liveStatus: unref(props.liveStatus),
  }));

  return { summaryProps };
};
