"use client";

import { useEffect } from 'react';
import { initializeAuthProtection } from '../lib/authInterceptor';

/**
 * Auth Interceptor Component
 * Initializes global authentication protection mechanisms:
 * - Intercepts all fetch calls to detect 401 responses
 * - Periodically checks for token expiry
 * - Automatically redirects to login when session expires
 */
export default function AuthInterceptor() {
  useEffect(() => {
    // Initialize auth protection on client side only
    if (typeof window !== 'undefined') {
      initializeAuthProtection();
    }
  }, []); // Run once on mount

  // This component doesn't render anything
  return null;
}
