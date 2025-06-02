interface TooltipOptions<T> {
  items?: T[];
  entityName: string;
  formatter?: (item: T) => string;
  emptyMessage?: string;
}

export const createTooltip = <T>(options: TooltipOptions<T>): Tooltip => {
  const { items = [], entityName, formatter, emptyMessage } = options;
  const { t } = useI18n();

  const hasItems = items && items.length > 0;

  return {
    disabled: !hasItems,
    displayValue: hasItems
      ? t('nr_of_entity', { count: items.length, entityName }, items.length)
      : emptyMessage || t('no_entity', { entityName }, 2),
    contentValue: hasItems && formatter ? items.map(formatter).join(', ') : '',
  };
};
