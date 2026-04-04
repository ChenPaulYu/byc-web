const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export const getViewSiteUrl = (origin: string): string => {
  const currentUrl = new URL(origin);

  if (LOCAL_HOSTS.has(currentUrl.hostname)) {
    return 'http://localhost:3000';
  }

  return currentUrl.origin;
};

export default getViewSiteUrl;
