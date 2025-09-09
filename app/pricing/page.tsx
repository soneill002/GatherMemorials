'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create a beautiful, lasting memorial for your loved one with no recurring fees
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {/* Basic Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">Basic Memorial</h3>
            <p className="mt-4 text-gray-600">Perfect for creating a simple tribute</p>
            <div className="mt-8">
              <span className="text-4xl font-bold text-gray-900">$29</span>
              <span className="text-gray-600">/one-time</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Memorial webpage</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Up to 10 photos</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Guestbook</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Service information</span>
              </li>
            </ul>
            <Link href="/memorials/new">
              <button className="mt-8 w-full bg-gray-800 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition">
                Get Started
              </button>
            </Link>
          </div>

          {/* Premium Plan - Featured */}
          <div className="bg-white rounded-lg shadow-xl p-8 border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900">Premium Memorial</h3>
            <p className="mt-4 text-gray-600">Full-featured memorial with gallery</p>
            <div className="mt-8">
              <span className="text-4xl font-bold text-gray-900">$49</span>
              <span className="text-gray-600">/one-time</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Everything in Basic</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Unlimited photos</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Video tributes</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Photo gallery</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Donation links</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">AI obituary assistant</span>
              </li>
            </ul>
            <Link href="/memorials/new">
              <button className="mt-8 w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition">
                Get Started
              </button>
            </Link>
          </div>

          {/* Eternal Plan */}
          <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-900">Eternal Memorial</h3>
            <p className="mt-4 text-gray-600">Premium features with lifetime hosting</p>
            <div className="mt-8">
              <span className="text-4xl font-bold text-gray-900">$99</span>
              <span className="text-gray-600">/one-time</span>
            </div>
            <ul className="mt-8 space-y-4">
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Everything in Premium</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Custom domain option</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Advanced privacy controls</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Memorial QR code</span>
              </li>
              <li className="flex">
                <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">Lifetime hosting guarantee</span>
              </li>
            </ul>
            <Link href="/memorials/new">
              <button className="mt-8 w-full bg-gray-800 text-white py-3 px-6 rounded-md hover:bg-gray-700 transition">
                Get Started
              </button>
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-serif text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Are there any recurring fees?</h3>
              <p className="mt-2 text-gray-600">
                No! All our plans are one-time payments. Your memorial will remain online forever with no additional charges.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Can I upgrade my plan later?</h3>
              <p className="mt-2 text-gray-600">
                Yes, you can upgrade from Basic to Premium or Eternal at any time by paying the difference.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Is there a money-back guarantee?</h3>
              <p className="mt-2 text-gray-600">
                Yes, we offer a 30-day money-back guarantee if you're not satisfied with your memorial.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Can family members help create the memorial?</h3>
              <p className="mt-2 text-gray-600">
                Yes! You can invite family members to contribute photos, stories, and memories to the memorial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}