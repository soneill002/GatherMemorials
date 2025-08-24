import Link from 'next/link'

export default function Home() {
  return (
    <>
      {/* Hero Section - Mobile-first design */}
      <section className="container-mobile py-12 sm:py-16 lg:py-24">
        <div className="text-center space-y-6 animate-fade-in">
          {/* Main headline with fluid typography */}
          <h1 className="text-hero text-gray-900 leading-tight">
            Honor a life in the{' '}
            <span className="text-marian-blue-500">Catholic tradition</span>
          </h1>
          
          {/* Subtitle with responsive sizing */}
          <p className="text-subtitle max-w-2xl mx-auto">
            Create a beautiful digital memorial with prayers, virtual candles, 
            and parish support. Share memories and celebrate a life of faith.
          </p>
          
          {/* CTA Buttons - Stack on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link 
              href="/memorials/new" 
              className="btn-primary inline-flex items-center justify-center"
            >
              Create a Memorial
            </Link>
            <Link 
              href="/examples" 
              className="btn-secondary inline-flex items-center justify-center"
            >
              View Examples
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section - Mobile-first grid */}
      <section className="bg-gray-50 py-12 sm:py-16 lg:py-20">
        <div className="container-mobile">
          <h2 className="text-title text-center mb-8 sm:mb-12">
            Faith-Centered Features
          </h2>
          
          {/* Responsive grid - single column on mobile, 3 columns on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="memorial-card text-center">
              <div className="w-16 h-16 bg-marian-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {/* You'll add an icon here later */}
                <span className="text-2xl">🙏</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Prayer Requests</h3>
              <p className="text-body">
                Visitors can light virtual candles and leave prayer intentions
              </p>
            </div>

            {/* Feature 2 */}
            <div className="memorial-card text-center">
              <div className="w-16 h-16 bg-marian-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⛪</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Parish Connection</h3>
              <p className="text-body">
                Link to your parish for Mass intentions and community support
              </p>
            </div>

            {/* Feature 3 */}
            <div className="memorial-card text-center">
              <div className="w-16 h-16 bg-marian-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📿</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Catholic Prayers</h3>
              <p className="text-body">
                Include traditional prayers, novenas, and scripture passages
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators - Mobile-first layout */}
      <section className="container-mobile py-12 sm:py-16">
        <div className="text-center space-y-8">
          <h2 className="text-title">Trusted by Catholic Families</h2>
          
          {/* Stats - Stack on mobile, inline on tablet+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-marian-blue-500">1,000+</p>
              <p className="text-sm text-gray-600">Memorials Created</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-marian-blue-500">50+</p>
              <p className="text-sm text-gray-600">Partner Parishes</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-marian-blue-500">10,000+</p>
              <p className="text-sm text-gray-600">Prayers Shared</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-marian-blue-500">4.9★</p>
              <p className="text-sm text-gray-600">Family Rating</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-marian-blue-500 text-white py-12 sm:py-16">
        <div className="container-mobile text-center space-y-6">
          <h2 className="text-title">Ready to create a lasting tribute?</h2>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            Start with our free plan. Upgrade anytime for additional features.
          </p>
          <Link 
            href="/memorials/new" 
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-marian-blue-500 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  )
}