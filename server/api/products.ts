export default defineEventHandler(async (event) => {
  const { total = 1000, offset = 0 } = getQuery(event);
  return geins.products.list(Number(total) || 100, Number(offset) || 0);
});
