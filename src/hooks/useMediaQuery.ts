import { useState, useEffect } from 'react';

/**
 * 自适应断点 hook
 * 用于判断当前屏幕是否匹配指定的媒体查询
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/** 是否为桌面端 (>= 1024px) */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

/** 是否为移动端 (< 1024px) */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 1024px)');
}
