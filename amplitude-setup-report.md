<wizard-report>

# Amplitude Setup Report

**Date:** 2026-05-16  
**Project:** FareFlow / Smart Fleets Fleet Management  
**Amplitude Project:** default (org: smartfleets-274007)  
**Amplitude App ID:** 818027  
**Data Region:** US — [https://app.amplitude.com](https://app.amplitude.com)

---

## What Was Installed

| Package | Version | Purpose |
|---|---|---|
| `@amplitude/unified` | ^1.1.7 | Browser SDK (analytics + Session Replay + Guides & Surveys) |
| `@amplitude/analytics-node` | ^1.5.57 | Server-side SDK for API routes |

---

## SDK Initialization

### Browser — `instrumentation-client.js` (repo root)

Next.js 15.5.7 automatically loads this file as the client-side instrumentation entry point. The `initAll()` call enables:

- **Analytics** with full autocapture (page views, sessions, form interactions, clicks, frustration signals, network tracking, web vitals, UTM attribution)
- **Remote Config** — SDK config is pulled from the Amplitude dashboard
- **Session Replay** — `sampleRate: 1` (records every session; lower in production if volume is a concern)
- **Guides & Surveys (Engagement)** — in-product messaging enabled with Amplitude remote config

### Server — `lib/amplitude-server.js`

Singleton `@amplitude/analytics-node` client initialized on first use. Import `getAmplitudeClient()` from this module in API routes and server actions. The same `NEXT_PUBLIC_AMPLITUDE_API_KEY` is used for both surfaces.

---

## Environment Variable

| Variable | File | Status |
|---|---|---|
| `NEXT_PUBLIC_AMPLITUDE_API_KEY` | `.env.local` | ✅ Set |

---

## Analytics Patterns Honored

No pre-existing analytics wrapper was found in the codebase. All instrumentation uses direct namespace imports from `@amplitude/unified`:

```js
import * as amplitude from "@amplitude/unified";
amplitude.track("Event Name", { prop: value });
```

---

## Events Instrumented

| Event | File | Trigger |
|---|---|---|
| **User Signed In** | `app/signin/page.js` | Successful login — also calls `setUserId` + `identify` to link user properties |
| **User Sign In Failed** | `app/signin/page.js` | Invalid credentials or server error |
| **User Signed Out** | `app/components/GlobalNav.js` | User confirms logout in dialog |
| **Payment Batch Created** | `app/driver-payments/page.js` | New batch created via dialog |
| **Payment Batch Posted** | `app/driver-payments/page.js` | Batch posted and locked |
| **Payment Batch Completed** | `app/driver-payments/page.js` | Batch marked complete; statements set to PAID |
| **EFT File Generated** | `app/driver-payments/components/dialogs/GenerateEftDialog.js` | CPA 005 EFT file generated from posted batch |
| **Credit Card CSV Uploaded** | `app/data-uploads/components/CreditCardUploadTab.js` | CSV parsed and previewed (step 1 complete) |
| **Credit Card Transactions Imported** | `app/data-uploads/components/CreditCardUploadTab.js` | Transactions confirmed and imported (step 3) |
| **Airport Trips CSV Uploaded** | `app/data-uploads/components/AirportTripsUploadTab.js` | Airport trips CSV parsed and split by shift |
| **Mileage CSV Uploaded** | `app/data-uploads/components/MileageUploadTab.js` | Mileage CSV parsed and previewed |
| **Invoice Generated** | `app/account-management/hooks/useAccountManagement.js` | Invoice generated for account customer |
| **Payment Recorded** | `app/account-management/hooks/useAccountManagement.js` | Payment recorded against a customer account |
| **Driver Created** | `app/drivers/page.js` | New driver added to fleet |
| **Driver Updated** | `app/drivers/page.js` | Existing driver profile modified |
| **Data Export Downloaded** | `app/drivers/page.js` | Driver list exported as CSV or PDF |

**Events in plan not yet instrumented** (surfaces require backend/server-side or were out of scope for this run):

- `Financial Statement Generated` — triggered by `statement-builder` page; can be added to `app/statement-builder/page.js`
- `Statement Recalled` — triggered in `app/driver-payments/components/dialogs/RecallStatementDialog.js`
- `Error Encountered` — can be wired to a global error boundary

---

## User Identity

On successful login, the SDK:
1. Calls `amplitude.setUserId(data.username)` to link all subsequent events to the user
2. Calls `amplitude.identify(identifyObj)` with `role`, `tenant_id`, and `tenant_schema` user properties

This means events from both the browser and any future server-side tracking will stitch to the same Amplitude user when `user_id` is forwarded on server events.

---

## Next Steps

1. **Dashboard** — run `amplitude-wizard dashboard` once events appear in Amplitude (typically within minutes of first user action) to auto-create charts and a dashboard from the event plan
2. **Statement Recalled** — add `amplitude.track("Statement Recalled", {...})` in `app/driver-payments/components/dialogs/RecallStatementDialog.js` inside the recall success handler
3. **Financial Statement Generated** — add `amplitude.track("Financial Statement Generated", {...})` in `app/statement-builder/page.js`
4. **Session Replay sample rate** — lower `sampleRate` from `1` to `0.1` or `0.2` before heavy production traffic to manage replay volume

</wizard-report>
