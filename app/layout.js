import './globals.css'
import Script from 'next/script'
import NewRelicTenantContext from './components/NewRelicTenantContext'
import AuthGuard from './components/AuthGuard'
import AuthInterceptor from './components/AuthInterceptor'
import { getNewRelicScript } from './lib/newrelic-browser'

export const metadata = {
  title: 'Smart Fleets - AI-Powered Taxi Fleet Management Software | Automated Financial Operations',
  description: 'AI-driven taxi fleet management system for automated financial reconciliation, driver settlements, and real-time analytics. Eliminate manual work, reduce errors, and scale your taxi or ride-hailing fleet operations with intelligent automation.',
  keywords: [
    'AI taxi fleet management',
    'taxi fleet management software',
    'automated fleet financial management',
    'taxi driver settlement software',
    'fleet reconciliation automation',
    'AI-powered fleet operations',
    'taxi dispatch management',
    'fleet financial intelligence',
    'automated driver statements',
    'taxi fleet analytics',
    'ride-hailing fleet management',
    'fleet payment automation',
    'taxi accounting software',
    'multi-tenant fleet platform',
    'fleet management SaaS'
  ].join(', '),
  authors: [{ name: 'Smart Fleets' }],
  creator: 'Smart Fleets',
  publisher: 'Smart Fleets',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://smartfleets.ai',
    siteName: 'Smart Fleets',
    title: 'Smart Fleets - AI-Powered Taxi Fleet Management Software',
    description: 'Automate your taxi fleet financial operations with AI. Eliminate manual reconciliation, reduce errors by 95%, and save 20+ hours per week.',
    images: [
      {
        url: 'https://smartfleets.ai/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Smart Fleets - AI Fleet Management Dashboard',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Fleets - AI-Powered Taxi Fleet Management',
    description: 'Automate fleet finances with AI. Real-time reconciliation, driver settlements, and predictive analytics.',
    images: ['https://smartfleets.ai/twitter-image.png'],
    creator: '@smartfleets',
  },
  alternates: {
    canonical: 'https://smartfleets.ai',
  },
  category: 'Fleet Management Software',
}

export default function RootLayout({ children }) {
  const newRelicScript = getNewRelicScript()

  return (
    <html lang="en">
      <head>
        {/* New Relic Browser Agent - Loads before page becomes interactive */}
        {newRelicScript && (
          <Script
            id="newrelic-browser-agent"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: newRelicScript,
            }}
          />
        )}
      </head>
      <body>
        {/* New Relic Tenant Context - Sets custom attributes after hydration */}
        <NewRelicTenantContext />
        {/* Auth Interceptor - Detects token expiry and 401 responses globally */}
        <AuthInterceptor />
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  )
}
