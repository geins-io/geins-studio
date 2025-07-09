export function getBaseUrl() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    return process.env.BASE_URL;
  }
  if (process.env.VERCEL) {
    if (process.env.VERCEL_ENV === 'production') {
      return (
        process.env.BASE_URL ??
        `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      );
    } else {
      return `https://${process.env.VERCEL_BRANCH_URL}`;
    }
  }
  return process.env.BASE_URL;
}

export function getAuthBaseUrl() {
  const baseURl = getBaseUrl();
  if (process.env.AUTH_ORIGIN) {
    return `${baseURl}${process.env.AUTH_ORIGIN}`;
  }
  return `${baseURl}/api/auth`;
}
