export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-gray-50 to-white pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Honor Their Memory<br/>
            <span className="bg-gradient-to-r from-marian-500 to-liturgical-500 bg-clip-text text-transparent">
              In Faith & Love
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create beautiful, faith-centered digital memorials that celebrate life, 
            preserve memories, and unite families in prayer.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a 
              href="/memorials/new"
              className="px-8 py-4 rounded-full text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 bg-gradient-to-r from-marian-500 to-blue-600"
            >
              Start Creating →
            </a>
            <a 
              href="/memorials/example"
              className="px-8 py-4 rounded-full bg-white text-gray-800 font-semibold text-lg border border-gray-300 hover:border-gray-400 transition-all"
            >
              View Example Memorial
            </a>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Simple, Guided Process
            </h2>
            <p className="text-xl text-gray-600">Create a memorial in minutes with our 9-step journey</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-marian-500 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-marian-500/10 to-liturgical-500/10">
                <span className="font-bold text-marian-500">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Begin with Basics</h3>
              <p className="text-gray-600 text-sm">Add name, dates, and choose from beautiful Catholic-themed cover photos</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-marian-500 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-marian-500/10 to-liturgical-500/10">
                <span className="font-bold text-marian-500">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Write Their Story</h3>
              <p className="text-gray-600 text-sm">Craft a beautiful obituary with optional AI assistance</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-gray-200 hover:border-marian-500 hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-gradient-to-br from-marian-500/10 to-liturgical-500/10">
                <span className="font-bold text-marian-500">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Share & Unite</h3>
              <p className="text-gray-600 text-sm">Add service details, photos, and enable the guestbook for condolences</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Faith at the Center
            </h2>
            <p className="text-xl text-gray-600">Every feature designed with Catholic families in mind</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-marian-500/10">
                  <svg className="w-6 h-6 text-marian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Prayer List Integration</h3>
                <p className="text-gray-600">Visitors can add your loved one to their personal prayer list with daily reminder options</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-marian-500/10">
                  <svg className="w-6 h-6 text-marian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Mass Intentions</h3>
                <p className="text-gray-600">Share Mass times and allow visitors to offer Mass intentions</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-marian-500/10">
                  <svg className="w-6 h-6 text-marian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Catholic Imagery</h3>
                <p className="text-gray-600">Beautiful selection of sacred art, stained glass, and peaceful Catholic scenes</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-marian-500/10">
                  <svg className="w-6 h-6 text-marian-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-xl mb-2">Charity Links</h3>
                <p className="text-gray-600">Direct visitors to donate to your chosen Catholic charities in memory</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">One-time payment, eternal memorial</p>
          
          <div className="max-w-md mx-auto bg-gradient-to-br from-marian-500 to-liturgical-500 p-[1px] rounded-2xl">
            <div className="bg-white rounded-2xl p-8">
              <div className="text-center">
                <div className="mb-4">
                  <span className="text-5xl font-bold">$49</span>
                  <span className="text-gray-600">/forever</span>
                </div>
                <ul className="text-left space-y-3 mb-8">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-liturgical-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span>Permanent memorial page</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-liturgical-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span>Unlimited photos & videos</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-liturgical-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span>Guestbook with moderation</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-liturgical-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span>Prayer list integration</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 mr-3 mt-0.5 text-liturgical-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                    <span>No ads, ever</span>
                  </li>
                </ul>
                <a 
                  href="/memorials/new" 
                  className="block w-full px-8 py-3 rounded-full text-white font-semibold shadow-lg hover:shadow-xl transition-all bg-marian-500 hover:bg-marian-600"
                >
                  Create Memorial Now
                </a>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-gray-600">
            <span className="font-semibold">Our Promise:</span> If you're not completely satisfied, 
            we offer a 30-day money-back guarantee.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-marian-500 to-blue-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6">
            Begin Their Digital Legacy Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Catholic families preserving memories with faith and love
          </p>
          <a 
            href="/memorials/new"
            className="inline-block px-8 py-4 rounded-full bg-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 text-marian-500"
          >
            Start Creating Memorial →
          </a>
          <p className="mt-6 text-sm opacity-75">
            No credit card required to begin • Pay only when you're ready to publish
          </p>
        </div>
      </section>
    </div>
  )
}