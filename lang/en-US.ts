export default defineI18nLocale(async () => {
  return {
    product: 'product | products',
    category: 'category | categories',
    rows_per_page: '@.capitalize:{entityName} per page',
    rows_found: '{total} {entityName} found.',
    rows_selected: '{selected} of {total} {entityName} selected.',
    page_of: 'Page {page} of {total}',
  };
});
