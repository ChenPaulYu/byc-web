import { useEffect } from 'react';

const BASE_TITLE = 'Bo-Yu Chen';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} | Researcher // Engineer // Creator`;
    return () => {
      document.title = `${BASE_TITLE} | Researcher // Engineer // Creator`;
    };
  }, [title]);
}
