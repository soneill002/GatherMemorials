// features/memorials/components/StudioSkeleton.tsx
// Loading skeleton for the memorial studio

export default function StudioSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="h-16 bg-white border-b border-gray-200" />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Form skeleton */}
        <div className="w-full lg:w-1/2 p-6 space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>

        {/* Preview skeleton (desktop only) */}
        <div className="hidden lg:block w-1/2 p-8">
          <div className="h-full bg-white rounded-lg shadow-xl animate-pulse" />
        </div>
      </div>
    </div>
  )
}