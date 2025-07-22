export function getBaseUrl() {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.BASE_URL ?? 'http://localhost:3000';
  }

  if (process.env.VERCEL) {
    const isVercelProduction = process.env.VERCEL_ENV === 'production';
    return isVercelProduction
      ? (process.env.BASE_URL ??
          `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
      : `https://${process.env.VERCEL_BRANCH_URL}`;
  }

  return process.env.BASE_URL ?? 'http://localhost:3000';
}

export function getAuthBaseUrl() {
  const baseURl = getBaseUrl();
  if (process.env.AUTH_PATH) {
    return `${baseURl}${process.env.AUTH_PATH}`;
  }
  return `${baseURl}/api/auth`;
}
