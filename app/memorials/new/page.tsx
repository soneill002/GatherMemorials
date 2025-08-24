// Placeholder for the memorial creation page
// This demonstrates mobile-first form design

export default function NewMemorialPage() {
  return (
    <div className="container-mobile py-8 sm:py-12">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator for multi-step form */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-marian-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium">Basic Info</span>
            </div>
            <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm text-gray-400">Details</span>
            </div>
          </div>
        </div>

        {/* Form header */}
        <div className="text-center mb-8">
          <h1 className="text-title text-gray-900 mb-2">
            Create a Memorial
          </h1>
          <p className="text-body text-gray-600">
            Let's start with some basic information
          </p>
        </div>

        {/* Mobile-first form */}
        <form className="space-y-6">
          {/* Name fields - stack on mobile, inline on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marian-blue-500 focus:border-transparent"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marian-blue-500 focus:border-transparent"
                placeholder="Smith"
              />
            </div>
          </div>

          {/* Date fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                id="birthDate"
                name="birthDate"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marian-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="deathDate" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Passing
              </label>
              <input
                type="date"
                id="deathDate"
                name="deathDate"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marian-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Memorial title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Memorial Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marian-blue-500 focus:border-transparent"
              placeholder="In Loving Memory of John Smith"
            />
            <p className="mt-1 text-sm text-gray-500">
              This will appear at the top of the memorial page
            </p>
          </div>

          {/* Action buttons - full width on mobile */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              className="btn-secondary w-full sm:w-auto"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto sm:ml-auto"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}