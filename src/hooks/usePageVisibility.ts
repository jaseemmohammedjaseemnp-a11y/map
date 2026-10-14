import { useState, useEffect } from 'react';
import { wakeLockService } from '../services/wakeLock';

export interface PageVisibilityInfo {
  isVisible: boolean;
  hasBeenBackgrounded: boolean;
  backgroundInterruptionCount: number;
  lastBackgroundedAt: number | null;
}

export function usePageVisibility(): PageVisibilityInfo {
  const [isVisible, setIsVisible] = useState<boolean>(
    typeof document !== 'undefined' ? document.visibilityState === 'visible' : true
  );
  const [hasBeenBackgrounded, setHasBeenBackgrounded] = useState<boolean>(false);
  const [backgroundInterruptionCount, setBackgroundInterruptionCount] = useState<number>(0);
  const [lastBackgroundedAt, setLastBackgroundedAt] = useState<number | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);

      if (!visible) {
        setHasBeenBackgrounded(true);
        setBackgroundInterruptionCount((prev) => prev + 1);
        setLastBackgroundedAt(Date.now());
      } else {
        // Tab restored to foreground, attempt to resume wake lock
        wakeLockService.handleVisibilityResume();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    isVisible,
    hasBeenBackgrounded,
    backgroundInterruptionCount,
    lastBackgroundedAt,
  };
}
