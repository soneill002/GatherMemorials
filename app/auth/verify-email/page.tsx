'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'waiting' | 'verifying' | 'success' | 'error'>('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Get parameters
  const email = searchParams.get('email');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');

  useEffect(() => {
    const performVerification = async () => {
      // If we have verification parameters, process them
      if (token_hash || code) {
        setStatus('verifying');
        const supabase = createBrowserClient();
        
        try {
          // Handle token_hash verification (email confirmation)
          if (token_hash && type) {
            console.log('Verifying email with token_hash...');
            const { error } = await supabase.auth.verifyOtp({
              token_hash,
              type: type as 'signup' | 'recovery' | 'invite' | 'email',
            });
            
            if (error) {
              console.error('Token verification error:', error);
              setErrorMessage(error.message);
              setStatus('error');
              // Redirect to signin with error after 3 seconds
              setTimeout(() => {
                router.push('/auth/signin?error=verification_failed');
              }, 3000);
              return;
            }
            
            console.log('Email verified successfully');
            setStatus('success');
            // Redirect to signin with success message after 2 seconds
            setTimeout(() => {
              router.push('/auth/signin?verified=true');
            }, 2000);
            return;
          }
          
          // Handle code verification (OAuth/magic link)
          if (code) {
            console.log('Exchanging code for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Code exchange error:', error);
              setErrorMessage(error.message);
              setStatus('error');
              setTimeout(() => {
                router.push('/auth/signin?error=verification_failed');
              }, 3000);
              return;
            }
            
            console.log('Code exchanged successfully');
            setStatus('success');
            // Go directly to account for code-based auth
            setTimeout(() => {
              router.push('/account');
            }, 2000);
            return;
          }
        } catch (error) {
          console.error('Verification error:', error);
          setErrorMessage('An unexpected error occurred during verification');
          setStatus('error');
          setTimeout(() => {
            router.push('/auth/signin?error=verification_failed');
          }, 3000);
        }
      }
    };
    
    performVerification();
  }, [token_hash, type, code, router]);

  // Show verifying state
  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-blue mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900">Verifying your email...</h2>
            <p className="mt-2 text-gray-600">Please wait while we confirm your email address.</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show success state
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified.
            </p>
            <p className="text-sm text-gray-500">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'Unable to verify your email. The link may have expired.'}
            </p>
            <Link 
              href="/auth/signin"
              className="block w-full bg-marian-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Sign In
            </Link>
            <p className="mt-4 text-sm text-gray-500">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  // Default state - waiting for email verification
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
              className="block w-full bg-marian-blue text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
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
              <a href="mailto:support@gathermemorials.com" className="text-marian-blue hover:text-blue-700">
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marian-blue"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}