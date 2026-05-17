import * as amplitude from "@amplitude/unified";

void amplitude.initAll(process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY, {
  analytics: {
    remoteConfig: { fetchRemoteConfig: true }, // pull SDK config from Amplitude dashboard
    logLevel:
      process.env.NODE_ENV === "development"
        ? amplitude.Types.LogLevel.Debug // verbose in dev
        : amplitude.Types.LogLevel.None, // silent in prod
    autocapture: {
      attribution: true,              // UTM / referrer attribution events
      pageViews: true,                // SPA route changes + initial load
      sessions: true,                 // Session start / end events
      formInteractions: true,         // Form starts + submits
      fileDownloads: true,            // Downloads of common file types
      elementInteractions: true,      // Click + change on instrumented els
      frustrationInteractions: true,  // Rage clicks, dead clicks
      pageUrlEnrichment: true,        // Adds path / search to event props
      networkTracking: true,          // XHR + fetch request events
      webVitals: true,                // CWV (LCP, INP, CLS) on page hide
    },
  },
  sessionReplay: { sampleRate: 1 }, // record user sessions; lower in prod to reduce volume
  engagement: {},                   // in-product Guides & Surveys; comment out to disable
});
