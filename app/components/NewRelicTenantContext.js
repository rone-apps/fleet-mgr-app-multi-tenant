'use client';

/**
 * New Relic Tenant Context Component
 *
 * This client component runs after React hydration to set tenant and user attributes.
 * It reads from localStorage to get the current tenant and user context, then
 * sets these as custom attributes in New Relic for proper segmentation and tracking.
 *
 * This component returns null (no visual output) and only performs side effects.
 */

import { useEffect } from 'react';
import {
  setTenantAttributes,
  setUserAttributes,
  setEnvironmentAttribute,
  isNewRelicAvailable,
} from '@/app/lib/newrelic-attributes';
import { getEnvironment } from '@/app/lib/newrelic-browser';

export default function NewRelicTenantContext() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }

    // Wait a tick for New Relic to fully initialize
    // The beforeInteractive script should have loaded by now
    const initializeNewRelic = () => {
      if (!isNewRelicAvailable()) {
        // New Relic not enabled or not available
        return;
      }

      // Set tenant attributes (tenantId, tenantSchema, tenantName)
      const tenantSet = setTenantAttributes();
      if (tenantSet) {
        console.debug('[New Relic] Tenant attributes set');
      }

      // Set user attributes (userId, userRole, userEmail, userName)
      const userSet = setUserAttributes();
      if (userSet) {
        console.debug('[New Relic] User attributes set');
      }

      // Set environment attribute for filtering
      const environment = getEnvironment();
      setEnvironmentAttribute(environment);
      console.debug(`[New Relic] Environment attribute set to: ${environment}`);
    };

    // Use requestIdleCallback for non-critical work if available
    // Falls back to setTimeout for older browsers
    if (typeof window.requestIdleCallback !== 'undefined') {
      window.requestIdleCallback(initializeNewRelic, { timeout: 2000 });
    } else {
      // Small delay to ensure script is loaded
      const timeoutId = setTimeout(initializeNewRelic, 100);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  // This component has no visual output
  return null;
}
