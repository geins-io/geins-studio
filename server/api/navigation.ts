import { geins } from '../../server/utils/geins';

export default defineEventHandler(async (event) => {
  const { userTypeId = 1 } = getQuery(event);

  return geins.merchantCenter.navigation(Number(userTypeId) || 1);
});
