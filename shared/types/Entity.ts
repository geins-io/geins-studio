export interface EntityEditSummary {
  createMode?: boolean;
  description?: string;
  formTouched?: boolean;
  summary?: DataItem[];
  settingsSummary?: DataItem[];
  entityName?: string;
  liveStatus?: boolean;
}
