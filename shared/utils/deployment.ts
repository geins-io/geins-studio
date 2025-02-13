export function getAuthBaseUrlVercel() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return undefined;
  }
  if (process.env.VERCEL) {
    if (process.env.VERCEL_ENV === 'production') {
      return (
        process.env.AUTH_ORIGIN ??
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      );
    } else {
      return `https://${process.env.VERCEL_BRANCH_URL}`;
    }
  }
  return process.env.AUTH_ORIGIN;
}
