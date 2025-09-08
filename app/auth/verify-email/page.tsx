'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
            Check Your Email
          </h1>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification link to:
            <br />
            <span className="font-semibold text-gray-900">
              {email || 'your email address'}
            </span>
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              Please check your inbox and click the verification link to activate your account. 
              The link will expire in 24 hours.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/auth/signin"
              className="block w-full bg-marian-500 text-white py-2 px-4 rounded-md hover:bg-marian-600 transition-colors"
            >
              Go to Sign In
            </Link>
            
            <Link 
              href="/"
              className="block w-full text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="inline-block h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or contact support at{' '}
              <a href="mailto:support@gathermemorials.com" className="text-marian-500 hover:text-marian-600">
                support@gathermemorials.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-500"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}