import { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Shield, Users, Church } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About GatherMemorials - Catholic Digital Memorial Platform',
  description: 'Learn about our mission to help families create beautiful, faith-centered digital memorials for their loved ones.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-serif text-blue-900 mb-6">
            About GatherMemorials
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Creating lasting digital tributes that honor lives lived in faith
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
            <h2 className="text-3xl font-serif text-blue-900 mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              At GatherMemorials, we believe every life deserves to be remembered with dignity, 
              love, and faith. Our platform provides Catholic families with a sacred digital 
              space to honor their loved ones, share memories, and keep their legacy alive 
              for generations to come.
            </p>
            <p className="text-lg text-gray-700">
              We understand that losing someone you love is one of life&apos;s most difficult 
              moments. That&apos;s why we&apos;ve created a simple, respectful way to create 
              beautiful memorial pages that reflect your loved one&apos;s faith journey and 
              the impact they had on others.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 bg-blue-50/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif text-blue-900 mb-12 text-center">
            Our Values
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Church className="w-10 h-10 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Faith-Centered</h3>
              <p className="text-gray-700">
                Rooted in Catholic tradition and values
              </p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-amber-700" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Compassionate</h3>
              <p className="text-gray-700">
                Supporting families with empathy and care
              </p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-blue-900" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Respectful</h3>
              <p className="text-gray-700">
                No ads on memorial pages, ever
              </p>
            </div>
            <div className="text-center">
              <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-amber-700" />
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Community</h3>
              <p className="text-gray-700">
                Bringing people together in remembrance
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-serif text-blue-900 mb-6">
            Honor Your Loved One Today
          </h2>
          <p className="text-lg text-gray-700 mb-8">
            Create a beautiful, lasting memorial that celebrates a life well-lived
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/memorials/new"
              className="bg-blue-900 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition-colors font-medium"
            >
              Create a Memorial
            </Link>
            <Link
              href="/how-it-works"
              className="bg-white text-blue-900 px-8 py-4 rounded-lg border-2 border-blue-900 hover:bg-blue-50 transition-colors font-medium"
            >
              Learn How It Works
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}