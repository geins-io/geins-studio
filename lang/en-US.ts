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
    dashboard_title: 'Hi, these are your latest stats.',
    dashboard_description:
      'All amounts will be shown excluding VAT. If you keep this page open, your stats will update every 60 seconds.',
    feedback_error: 'Something went wrong',
    feedback_try_again: 'Please try again later.',
    feedback_welcome_back: 'Welcome back {name}!',
    feedback_welcome_back_description: 'You have successfully logged in.',
  };
});
