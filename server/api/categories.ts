export default defineEventHandler(async (event) => {
  const { total = 10, offset = 0 } = getQuery(event);
  return geins.categories.list(Number(total) || 100, Number(offset) || 0);
});
