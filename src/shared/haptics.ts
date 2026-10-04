/**
 * Web Vibration API helper for kid-friendly tactile feedback.
 * Gracefully falls back on unsupported devices without errors.
 */
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning'): void {
  if (typeof window === 'undefined' || !navigator.vibrate) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(50);
        break;
      case 'success':
        navigator.vibrate([15, 30, 25, 40, 20]);
        break;
      case 'warning':
        navigator.vibrate([40, 60, 40]);
        break;
    }
  } catch {
    // Ignore unsupported hardware errors
  }
}
