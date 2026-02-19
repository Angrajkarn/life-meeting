/**
 * Performance Utilities
 * 
 * Throttle and debounce functions to optimize expensive operations
 * like layout recalculations and event handlers.
 */

/**
 * Throttle function execution to maximum once per interval
 * 
 * Use for: Scroll handlers, resize handlers, frequent state updates
 * 
 * @param func - Function to throttle
 * @param wait - Minimum time between executions (ms)
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Debounce function execution until inactivity period
 * 
 * Use for: Search input, window resize, auto-save
 * 
 * @param func - Function to debounce
 * @param wait - Time to wait after last call (ms)
 * @param immediate - Execute on leading edge instead of trailing
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(this, args);
      }
    };

    const callNow = immediate && !timeout;

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(this, args);
    }
  };
}

/**
 * Request animation frame throttle
 * Ensures function runs at most once per frame (~60fps)
 * 
 * Use for: Animations, scroll-linked effects
 * 
 * @param func - Function to throttle
 * @returns RAF-throttled function
 */
export function rafThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (rafId !== null) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func.apply(this, args);
      rafId = null;
    });
  };
}

/**
 * Batch multiple updates into a single execution
 * Useful for consolidating rapid state updates
 * 
 * @param func - Function to batch
 * @param wait - Time to collect updates (ms)
 * @returns Batched function
 */
export function batch<T extends (...args: any[]) => any>(
  func: T,
  wait: number = 16  // ~1 frame
): (...args: Parameters<T>) => void {
  let pending = false;
  let argsQueue: Parameters<T>[] = [];

  return function (this: any, ...args: Parameters<T>) {
    argsQueue.push(args);

    if (!pending) {
      pending = true;
      setTimeout(() => {
        // Execute once with all accumulated args
        const allArgs = argsQueue;
        argsQueue = [];
        pending = false;
        
        // Execute with latest args (can be customized to process all)
        func.apply(this, allArgs[allArgs.length - 1]);
      }, wait);
    }
  };
}

/**
 * Memoize expensive computations
 * 
 * @param func - Function to memoize
 * @param keyGenerator - Optional function to generate cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = keyGenerator 
      ? keyGenerator(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = func.apply(this, args);
    cache.set(key, result);
    return result;
  } as T;
}

/**
 * Performance monitoring decorator
 * Logs execution time for performance profiling
 * 
 * @param label - Label for the operation
 * @param threshold - Only log if execution exceeds threshold (ms)
 */
export function measurePerformance<T extends (...args: any[]) => any>(
  func: T,
  label: string,
  threshold: number = 0
): T {
  return function (this: any, ...args: Parameters<T>): ReturnType<T> {
    const start = performance.now();
    const result = func.apply(this, args);
    const duration = performance.now() - start;

    if (duration >= threshold) {
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
    }

    return result;
  } as T;
}
