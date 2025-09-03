import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - GatherMemorials',
  description: 'Privacy Policy for GatherMemorials digital memorial platform.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-4xl font-serif text-blue-900 mb-8">
          Privacy Policy
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 space-y-8">
          <div className="text-sm text-gray-600 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              1. Introduction
            </h2>
            <p className="text-gray-700 mb-4">
              GatherMemorials (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and safeguard your information when 
              you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              2. Information We Collect
            </h2>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Personal Information
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li>Name and email address (for account creation)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Memorial content you provide (photos, text, videos)</li>
            </ul>

            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Automatically Collected Information
            </h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Browser type and version</li>
              <li>IP address and location data</li>
              <li>Usage data and analytics</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="text-gray-700 mb-4">
              We use your information to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Create and maintain memorial pages</li>
              <li>Process payments and prevent fraud</li>
              <li>Send service-related communications</li>
              <li>Improve our service and user experience</li>
              <li>Comply with legal obligations</li>
              <li>Provide customer support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              4. Information Sharing
            </h2>
            <p className="text-gray-700 mb-4">
              We do not sell your personal information. We may share information with:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Service providers (Stripe for payments, Cloudinary for media storage)</li>
              <li>Law enforcement when required by law</li>
              <li>Other users as per your privacy settings on memorial pages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              5. Data Security
            </h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your data, 
              including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>SSL encryption for data transmission</li>
              <li>Secure storage with regular backups</li>
              <li>Limited access to personal information</li>
              <li>Regular security assessments</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              6. Your Rights
            </h2>
            <p className="text-gray-700 mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account</li>
              <li>Export your memorial data</li>
              <li>Opt-out of marketing communications</li>
              <li>Control privacy settings on memorial pages</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              7. Cookies
            </h2>
            <p className="text-gray-700 mb-4">
              We use cookies to improve your experience. Essential cookies are required for the 
              service to function. You can control non-essential cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700 mb-4">
              Our service is not intended for children under 13. We do not knowingly collect 
              personal information from children. If you believe we have collected information 
              from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              9. International Data Transfers
            </h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              10. Data Retention
            </h2>
            <p className="text-gray-700 mb-4">
              Memorial pages are retained indefinitely as per our service commitment. Account 
              information is retained as long as your account is active. You may request deletion 
              at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              11. Changes to This Policy
            </h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant 
              changes via email or through the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif text-blue-900 mb-4">
              12. Contact Us
            </h2>
            <p className="text-gray-700">
              For privacy-related questions or concerns, please contact us at:{' '}
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