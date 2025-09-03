import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - GatherMemorials',
  description: 'Terms of Service for GatherMemorials digital memorial platform.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-serif text-blue-900 mb-8">
          Terms of Service
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8">
          <div className="text-sm text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 mb-4">
              By accessing and using GatherMemorials (&quot;the Service&quot;), you agree to be bound by these 
              Terms of Service. If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              2. Service Description
            </h2>
            <p className="text-gray-700 mb-4">
              GatherMemorials provides a platform for creating and maintaining digital memorial pages. 
              Our service includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Memorial page creation and hosting</li>
              <li>Photo and video storage</li>
              <li>Guestbook functionality</li>
              <li>Prayer list features</li>
              <li>Content moderation tools</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-700 mb-4">
              To create a memorial, you must register for an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Providing accurate account information</li>
              <li>Maintaining the security of your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              4. Content Guidelines
            </h2>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you upload. By posting content, you grant us a license to 
              host and display it. Content must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Be respectful and appropriate for a memorial context</li>
              <li>Not violate any copyright or intellectual property rights</li>
              <li>Not contain harmful, offensive, or illegal material</li>
              <li>Be truthful and accurate to the best of your knowledge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              5. Payment Terms
            </h2>
            <p className="text-gray-700 mb-4">
              Memorial pages require a one-time payment of $149. This payment:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provides lifetime hosting of the memorial page</li>
              <li>Includes unlimited storage for photos and videos</li>
              <li>Is non-refundable after 30 days</li>
              <li>Is processed securely through Stripe</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              6. Privacy & Data Protection
            </h2>
            <p className="text-gray-700 mb-4">
              We are committed to protecting your privacy. Please review our{' '}
              <Link href="/privacy" className="text-blue-900 hover:underline">
                Privacy Policy
              </Link>{' '}
              for details on how we collect and use your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              7. Service Availability
            </h2>
            <p className="text-gray-700 mb-4">
              We strive to provide continuous access to memorial pages. However, we do not guarantee 
              uninterrupted service and are not liable for temporary unavailability due to maintenance 
              or technical issues.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              8. Prohibited Uses
            </h2>
            <p className="text-gray-700 mb-4">
              You may not use our Service to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Violate any laws or regulations</li>
              <li>Harass, abuse, or harm others</li>
              <li>Impersonate any person or entity</li>
              <li>Upload malicious code or interfere with the Service</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-700 mb-4">
              GatherMemorials is provided &quot;as is&quot; without warranties of any kind. We are not liable 
              for any indirect, incidental, or consequential damages arising from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-700 mb-4">
              We may update these Terms of Service from time to time. We will notify users of significant 
              changes via email or through the Service. Your continued use constitutes acceptance of the 
              updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700">
              For questions about these Terms of Service, please contact us at:{' '}
              <Link href="/contact" className="text-blue-900 hover:underline">
                Contact Support
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}