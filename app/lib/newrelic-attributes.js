/**
 * New Relic Custom Attributes Utilities
 *
 * This module provides functions to set custom attributes for tenant and user context.
 * These functions are designed to be called from client-side components after hydration.
 *
 * Custom attributes allow you to:
 * - Filter and segment data by tenant in New Relic dashboards
 * - Track user-specific metrics and errors
 * - Correlate issues with specific tenants or users
 */

import { getTenantId, getTenantSchema, getTenantName, getCurrentUser } from './api';

/**
 * Set tenant-specific custom attributes in New Relic
 * Should be called after user is authenticated and tenant context is loaded
 *
 * @returns {boolean} - True if attributes were set, false if New Relic is unavailable
 */
export function setTenantAttributes() {
  if (typeof window === 'undefined' || !window.newrelic) {
    return false;
  }

  try {
    const tenantId = getTenantId();
    const tenantSchema = getTenantSchema();
    const tenantName = getTenantName();

    if (tenantId) {
      window.newrelic.setCustomAttribute('tenantId', tenantId);
    }

    if (tenantSchema) {
      window.newrelic.setCustomAttribute('tenantSchema', tenantSchema);
    }

    if (tenantName) {
      window.newrelic.setCustomAttribute('tenantName', tenantName);
    }

    return true;
  } catch (error) {
    console.warn('[New Relic] Error setting tenant attributes:', error);
    return false;
  }
}

/**
 * Set user-specific custom attributes in New Relic
 * Should be called after user is authenticated
 *
 * @returns {boolean} - True if attributes were set, false if New Relic is unavailable
 */
export function setUserAttributes() {
  if (typeof window === 'undefined' || !window.newrelic) {
    return false;
  }

  try {
    const user = getCurrentUser();

    if (!user) {
      return false;
    }

    // Set user ID (required for user-centric analysis)
    if (user.id) {
      window.newrelic.setCustomAttribute('userId', user.id);
    }

    // Set user email if available
    if (user.email) {
      window.newrelic.setCustomAttribute('userEmail', user.email);
    }

    // Set user role if available (admin, driver, manager, etc.)
    if (user.role) {
      window.newrelic.setCustomAttribute('userRole', user.role);
    }

    // Set user name if available
    if (user.name) {
      window.newrelic.setCustomAttribute('userName', user.name);
    }

    return true;
  } catch (error) {
    console.warn('[New Relic] Error setting user attributes:', error);
    return false;
  }
}

/**
 * Set environment attribute for filtering in New Relic dashboards
 *
 * @param {string} environment - Environment name (development, staging, production, etc.)
 * @returns {boolean} - True if attribute was set, false if New Relic is unavailable
 */
export function setEnvironmentAttribute(environment) {
  if (typeof window === 'undefined' || !window.newrelic) {
    return false;
  }

  try {
    if (environment) {
      window.newrelic.setCustomAttribute('environment', environment);
    }
    return true;
  } catch (error) {
    console.warn('[New Relic] Error setting environment attribute:', error);
    return false;
  }
}

/**
 * Set a custom attribute with key-value pair
 * Generic function for setting any custom attribute
 *
 * @param {string} key - Attribute key
 * @param {*} value - Attribute value (string, number, or boolean)
 * @returns {boolean} - True if attribute was set, false if New Relic is unavailable
 */
export function setCustomAttribute(key, value) {
  if (typeof window === 'undefined' || !window.newrelic) {
    return false;
  }

  try {
    if (key && value !== undefined && value !== null) {
      window.newrelic.setCustomAttribute(key, value);
      return true;
    }
    return false;
  } catch (error) {
    console.warn(`[New Relic] Error setting custom attribute ${key}:`, error);
    return false;
  }
}

/**
 * Check if New Relic is available and ready
 *
 * @returns {boolean} - True if New Relic is loaded and available
 */
export function isNewRelicAvailable() {
  return typeof window !== 'undefined' && !!window.newrelic;
}
