export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-marian-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-serif text-marian-500 mb-6">
            Honor Their Memory with Faith
          </h1>
          <p className="text-xl text-vatican-700 mb-8 max-w-3xl mx-auto">
            Create beautiful, faith-centered digital memorial pages for your loved ones. 
            Share memories, photos, and prayers in a sacred online space.
          </p>
          <div className="flex gap-4 justify-center">
            <a 
              href="/memorials/new" 
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Create a Memorial
            </a>
            <a 
              href="/how-it-works" 
              className="btn btn-ghost px-8 py-3 text-lg border border-vatican-300"
            >
              Learn How It Works
            </a>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 flex justify-center items-center gap-8 text-sm text-vatican-600">
            <span className="flex items-center gap-2">
              ✝ Catholic-Focused
            </span>
            <span className="flex items-center gap-2">
              🕊️ Respectful & Sacred
            </span>
            <span className="flex items-center gap-2">
              💛 One-Time Payment
            </span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif text-center text-vatican-900 mb-4">
            Everything You Need to Honor Their Life
          </h2>
          <p className="text-center text-vatican-600 mb-12 max-w-2xl mx-auto">
            Our guided 9-step process makes it easy to create a beautiful memorial in minutes
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">📸</div>
              <h3 className="text-xl font-serif text-marian-500 mb-3">
                Photo & Video Gallery
              </h3>
              <p className="text-vatican-600">
                Share unlimited photos and videos. Create a visual celebration of their life with 
                captions and memories.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-serif text-marian-500 mb-3">
                Interactive Guestbook
              </h3>
              <p className="text-vatican-600">
                Let friends and family leave messages of love and support. Moderation tools keep 
                everything respectful.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">🙏</div>
              <h3 className="text-xl font-serif text-marian-500 mb-3">
                Prayer List & Reminders
              </h3>
              <p className="text-vatican-600">
                Visitors can add your loved one to their prayer list. Receive reminders on 
                anniversaries and holy days.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-serif text-marian-500 mb-3">
                AI Writing Assistant
              </h3>
              <p className="text-vatican-600">
                Get help writing a beautiful obituary with our thoughtful AI assistant that 
                respects Catholic traditions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-serif text-marian-500 mb-3">
                Service Information
              </h3>
              <p className="text-vatican-600">
                Share details about funeral Mass, visitation, and burial. Include maps and 
                directions for attendees.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-xl font-serif text-marian-500 mb-3">
                Memorial Donations
              </h3>
              <p className="text-vatican-600">
                Link to preferred charities, parishes, or memorial funds. Help continue their 
                legacy of giving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-vatican-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-serif text-center text-vatican-900 mb-12">
            Simple 9-Step Process
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Basic Information</h3>
                <p className="text-sm text-vatican-600">Name, dates, and photos</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Headline</h3>
                <p className="text-sm text-vatican-600">A meaningful tribute headline</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Obituary</h3>
                <p className="text-sm text-vatican-600">Life story with AI assistance</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Service Details</h3>
                <p className="text-sm text-vatican-600">Mass and burial information</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                5
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Donations</h3>
                <p className="text-sm text-vatican-600">Memorial contribution links</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                6
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Gallery</h3>
                <p className="text-sm text-vatican-600">Photos and videos</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                7
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Guestbook</h3>
                <p className="text-sm text-vatican-600">Enable visitor messages</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                8
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Privacy</h3>
                <p className="text-sm text-vatican-600">Set viewing permissions</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-marian-500 text-white flex items-center justify-center font-semibold">
                9
              </div>
              <div>
                <h3 className="font-semibold text-vatican-900">Review & Publish</h3>
                <p className="text-sm text-vatican-600">Preview and payment</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <a href="/how-it-works" className="text-marian-500 hover:text-marian-600 font-medium">
              Learn more about our process →
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-serif text-vatican-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-vatican-600 mb-12">
            One price, one time. No subscriptions or hidden fees.
          </p>

          <div className="card max-w-md mx-auto">
            <div className="text-center">
              <div className="text-5xl font-bold text-marian-500 mb-4">$149</div>
              <p className="text-xl font-serif text-vatican-900 mb-2">Complete Memorial Package</p>
              <p className="text-vatican-600 mb-6">One-time payment, memorial lives forever</p>
              
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">Unlimited photos & videos</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">Interactive guestbook</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">Prayer list feature</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">AI obituary assistant</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">Service & donation info</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">Privacy controls</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-liturgical-500">✓</span>
                  <span className="text-vatican-700">No ads ever</span>
                </li>
              </ul>

              <a href="/memorials/new" className="btn btn-primary w-full py-3 text-lg">
                Start Creating Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial/Trust Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-marian-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-serif text-vatican-900 mb-12">
            Created with Catholic Values in Mind
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-3xl mb-3">⛪</div>
              <h3 className="font-serif text-lg text-marian-500 mb-2">Faith-Centered</h3>
              <p className="text-sm text-vatican-600">
                Designed specifically for Catholic families with prayers and religious imagery
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">🤝</div>
              <h3 className="font-serif text-lg text-marian-500 mb-2">Respectful</h3>
              <p className="text-sm text-vatican-600">
                No advertisements or distractions. A sacred space for remembrance
              </p>
            </div>
            <div>
              <div className="text-3xl mb-3">♾️</div>
              <h3 className="font-serif text-lg text-marian-500 mb-2">Eternal</h3>
              <p className="text-sm text-vatican-600">
                Your memorial stays online forever with no recurring fees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-marian-500">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl font-serif mb-6">
            Ready to Create a Beautiful Memorial?
          </h2>
          <p className="text-xl mb-8 text-marian-100">
            Honor your loved one's memory with a dignified online tribute
          </p>
          <a 
            href="/memorials/new" 
            className="inline-block bg-white text-marian-500 hover:bg-vatican-50 px-8 py-3 rounded-md text-lg font-semibold transition-colors"
          >
            Get Started Now
          </a>
        </div>
      </section>
    </div>
  )
}