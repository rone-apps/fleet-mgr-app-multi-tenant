/**
 * New Relic Browser Agent Configuration
 *
 * This module generates the inline script for New Relic browser monitoring.
 * The script is injected in the <head> with strategy="beforeInteractive" to ensure
 * it loads before the page becomes interactive, capturing all performance metrics.
 *
 * Configuration:
 * - Pro+SPA agent (best for React/Next.js applications)
 * - Distributed tracing enabled (connects with Java backend)
 * - Privacy controls configured
 * - AJAX error handling configured
 */

/**
 * Generate New Relic browser agent inline script
 * Returns null if monitoring is disabled
 *
 * @returns {string|null} - The inline New Relic script or null if disabled
 */
export function getNewRelicScript() {
  // Feature flag to enable/disable monitoring
  if (process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED !== 'true') {
    return null;
  }

  const config = {
    accountId: process.env.NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID,
    trustKey: process.env.NEXT_PUBLIC_NEW_RELIC_TRUST_KEY,
    agentId: process.env.NEXT_PUBLIC_NEW_RELIC_AGENT_ID,
    licenseKey: process.env.NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY,
    applicationId: process.env.NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID,
  };

  // Validate that all required configuration is present
  const requiredFields = ['accountId', 'trustKey', 'agentId', 'licenseKey', 'applicationId'];
  const missingFields = requiredFields.filter(field => !config[field] || config[field].includes('your_'));

  if (missingFields.length > 0) {
    console.warn(
      `[New Relic] Missing or incomplete configuration: ${missingFields.join(', ')}. ` +
      `Browser monitoring will not be initialized. ` +
      `Please update environment variables with actual New Relic values.`
    );
    return null;
  }

  // New Relic Pro+SPA agent initialization
  // This uses the copy/paste method recommended by New Relic for Next.js App Router
  const script = `
    window.NREUM||(NREUM={});NREUM.init={distributed_tracing:{enabled:true},privacy:{cookies_enabled:true},ajax:{deny_list:["bam.nr-data.net"]}};

    (function(){
      var e=window.NREUM||{},t=document.createElement("script");
      t.type="text/javascript";
      t.async=true;
      t.src="https://js-agent.newrelic.com/nr-spa-${config.agentId}.js";
      e.loader_config={accountID:"${config.accountId}",trustKey:"${config.trustKey}",agentID:"${config.agentId}",licenseKey:"${config.licenseKey}",applicationID:"${config.applicationId}"};
      var n=document.getElementsByTagName("head")[0];
      n&&n.appendChild(t);
    })();
  `;

  return script;
}

/**
 * Check if New Relic browser monitoring is enabled
 * Useful for conditional features that depend on New Relic
 *
 * @returns {boolean} - True if monitoring is enabled
 */
export function isNewRelicEnabled() {
  return process.env.NEXT_PUBLIC_NEW_RELIC_BROWSER_ENABLED === 'true';
}

/**
 * Get the New Relic environment setting
 * Used for environment-specific filtering and dashboards
 *
 * @returns {string} - The environment name (development, staging, production, etc.)
 */
export function getEnvironment() {
  return process.env.NEXT_PUBLIC_ENVIRONMENT || 'unknown';
}
