import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import './globals.css'

// Load fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({ 
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

// Metadata for SEO
export const metadata: Metadata = {
  title: {
    default: 'GatherMemorials - Create Beautiful Catholic Memorial Pages',
    template: '%s | GatherMemorials'
  },
  description: 'Honor your loved ones with beautiful, faith-centered digital memorial pages. Create lasting tributes with photo galleries, guestbooks, and prayer lists.',
  keywords: ['memorial', 'obituary', 'Catholic', 'funeral', 'remembrance', 'tribute'],
  authors: [{ name: 'GatherMemorials' }],
  creator: 'GatherMemorials',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://gathermemorials.com',
    title: 'GatherMemorials - Catholic Memorial Pages',
    description: 'Create beautiful, faith-centered digital memorial pages for your loved ones',
    siteName: 'GatherMemorials',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'GatherMemorials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GatherMemorials - Catholic Memorial Pages',
    description: 'Create beautiful, faith-centered digital memorial pages for your loved ones',
    images: ['/og/default.png'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-vatican-50 text-vatican-900 min-h-screen flex flex-col">
        {/* Navigation - Now using the dynamic Navbar component */}
        <Navbar />

        {/* Main content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-vatican-100 border-t border-vatican-200">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {/* Brand Column */}
              <div className="col-span-1 md:col-span-2">
                <Link href="/" className="font-serif text-xl text-marian-500 hover:text-marian-600 transition-colors">
                  GatherMemorials
                </Link>
                <p className="mt-4 text-sm text-vatican-600">
                  Creating beautiful, faith-centered digital memorial pages to honor and remember your loved ones.
                </p>
              </div>
              
              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-semibold text-vatican-900 tracking-wider uppercase">Quick Links</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/how-it-works" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              
              {/* Legal */}
              <div>
                <h3 className="text-sm font-semibold text-vatican-900 tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link href="/privacy" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="text-sm text-vatican-600 hover:text-marian-500 transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="mt-8 pt-8 border-t border-vatican-200">
              <p className="text-center text-sm text-vatican-600">
                © {new Date().getFullYear()} GatherMemorials. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}