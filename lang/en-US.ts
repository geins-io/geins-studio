export default defineI18nLocale(async () => {
  return {
    product: 'product | products',
    category: 'category | categories',
    new_entity: 'New {entityName}',
    save_entity: 'Save {entityName}',
    rows_per_page: '@.capitalize:{entityName} per page',
    rows_found: '{total} {entityName} found.',
    rows_selected: '{selected} of {total} {entityName} selected.',
    page_of: 'Page {page} of {total}',
    global_search_placeholder: 'Search...',
  };
});
