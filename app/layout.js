import './globals.css'
import Script from 'next/script'
import NewRelicTenantContext from './components/NewRelicTenantContext'
import AuthGuard from './components/AuthGuard'
import { getNewRelicScript } from './lib/newrelic-browser'

export const metadata = {
  title: 'Smart Fleets - Taxi Management System',
  description: 'Modern taxi fleet management application',
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
        <AuthGuard>{children}</AuthGuard>
      </body>
    </html>
  )
}
