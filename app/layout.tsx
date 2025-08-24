// The root layout wraps every page in your app. It’s required in the Next.js App Router.
// Think of it as the frame around all screens (good place for Navbar/Footer/providers later).

import './globals.css' // Global CSS (resets/base styles) is imported here ONCE for the whole app.

export const metadata = {
  // These values show up in the browser tab and help search engines understand your site.
  title: 'Catholic Memorials',
  description: 'Faith-centered memorials with prayers, candles, and parish support.',
}

export default function RootLayout({
  // Next.js injects the current page content into `children`.
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* You can put global providers here later (e.g., Theme, Analytics) */}
      <body
        // Keeping inline styles for Day One so we don’t need Tailwind configured yet.
        style={{
          margin: 0,
          fontFamily:
            'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          color: '#0f172a', // slate-900-ish
          background: '#ffffff',
        }}
      >
        {/* Later you’ll import a real <Navbar /> and <Footer /> components here */}
        {children}
      </body>
    </html>
  )
}
