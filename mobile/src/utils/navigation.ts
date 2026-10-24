import { router } from 'expo-router';

/**
 * Safely navigates back if there is a previous screen in history;
 * otherwise gracefully falls back to the specified fallback route (default: '/').
 */
export function safeBack(fallbackRoute: string = '/') {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallbackRoute as any);
  }
}
