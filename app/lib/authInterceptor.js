// Global Authentication Interceptor
// Automatically detects token expiry and redirects to login
// Works for all fetch calls, even those not using apiRequest()

import { isTokenExpired } from './api';

/**
 * Clear all authentication data and redirect to signin
 */
export function handleAuthExpiry(reason = 'Session expired') {
  if (typeof window === 'undefined') return;

  console.warn(`Auth expiry detected: ${reason}`);

  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();

  // Clear cookies
  document.cookie.split(";").forEach((c) => {
    document.cookie = c
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
  });

  // Redirect to signin (use replace to prevent back button issues)
  window.location.replace('/signin?expired=true');
}

/**
 * Check token expiry periodically (every 30 seconds)
 */
export function startTokenExpiryCheck() {
  if (typeof window === 'undefined') return;

  // Check immediately on load
  checkTokenExpiry();

  // Then check every 30 seconds
  const interval = setInterval(checkTokenExpiry, 30000);

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    clearInterval(interval);
  });

  return interval;
}

/**
 * Check if current token is expired
 */
function checkTokenExpiry() {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem('token');

  // No token means not logged in (allow access to public pages)
  if (!token) return;

  // Token exists but is expired
  if (isTokenExpired(token)) {
    handleAuthExpiry('Token expired');
  }
}

/**
 * Intercept all fetch calls to detect 401 responses
 */
export function setupFetchInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);

      // Clone response so we can read it
      const clonedResponse = response.clone();

      // Check for 401 Unauthorized
      if (response.status === 401) {
        console.warn('Received 401 Unauthorized response');
        handleAuthExpiry('Authentication failed (401)');

        // Still return the response for proper error handling in components
        return response;
      }

      return response;
    } catch (error) {
      // Network errors or other fetch errors
      throw error;
    }
  };

  console.log('✓ Fetch interceptor installed - will auto-redirect on 401');
}

/**
 * Initialize all auth protection mechanisms
 * Call this once on app startup
 */
export function initializeAuthProtection() {
  if (typeof window === 'undefined') return;

  // Setup fetch interceptor
  setupFetchInterceptor();

  // Start periodic token expiry checks
  startTokenExpiryCheck();

  console.log('✓ Auth protection initialized');
}
