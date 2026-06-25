import { useEffect, useRef, useCallback } from 'react';
import { logout } from '../lib/api';

/**
 * Custom hook for automatic logout after idle period
 *
 * Monitors user activity (mouse, keyboard, touch) and automatically
 * logs out the user after specified idle time.
 *
 * @param {number} timeoutMinutes - Idle timeout in minutes (default: 5)
 * @param {function} onWarning - Optional callback fired 1 minute before timeout (pass null to disable)
 * @param {boolean} enabled - Whether the idle timeout is active (default: true)
 */
export function useIdleTimeout(timeoutMinutes = 5, onWarning = null, enabled = true) {
  const timeoutId = useRef(null);
  const warningTimeoutId = useRef(null);
  const TIMEOUT_MS = timeoutMinutes * 60 * 1000; // Convert minutes to milliseconds
  const WARNING_MS = TIMEOUT_MS - (60 * 1000); // Warning 1 minute before logout

  const handleLogout = useCallback(() => {
    console.warn('User idle timeout - logging out');
    logout();
  }, []);

  const handleWarning = useCallback(() => {
    if (onWarning) {
      onWarning();
    }
  }, [onWarning]);

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    if (warningTimeoutId.current) {
      clearTimeout(warningTimeoutId.current);
    }

    // Set warning timer (1 minute before logout)
    if (onWarning) {
      warningTimeoutId.current = setTimeout(handleWarning, WARNING_MS);
    }

    // Set logout timer
    timeoutId.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [TIMEOUT_MS, WARNING_MS, handleLogout, handleWarning, onWarning]);

  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Start the timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
      if (warningTimeoutId.current) {
        clearTimeout(warningTimeoutId.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [resetTimer, enabled]);
}
