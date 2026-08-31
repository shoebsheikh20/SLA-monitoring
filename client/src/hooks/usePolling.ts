import { useEffect, useRef, useCallback } from 'react';

export const usePolling = (
  callback: () => void,
  intervalMs: number = 30000,
  enabled: boolean = true
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    if (enabled) {
      intervalRef.current = setInterval(() => {
        callbackRef.current();
      }, intervalMs);
    }
  }, [enabled, intervalMs, stop]);

  useEffect(() => {
    start();
    return stop;
  }, [start, stop]);

  return { stop, start };
};

export default usePolling;
