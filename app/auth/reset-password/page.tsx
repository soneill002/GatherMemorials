'use client';

import { Suspense, useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';

type ResetStage = 'request' | 'reset';

interface RequestFormData {
  email: string;
}

interface ResetFormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

// Move the main component logic to a separate component that uses useSearchParams
function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stage, setStage] = useState<ResetStage>('request');
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState<RequestFormData>({ email: '' });
  const [resetData, setResetData] = useState<ResetFormData>({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);

  // Check for reset token in URL
  useEffect(() => {
    const checkResetToken = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');
      
      if (token && type === 'recovery') {
        setCheckingToken(true);
        try {
          const supabase = createBrowserClient();
          
          // Verify the token is valid
          const { error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery',
          });

          if (!error) {
            setStage('reset');
            setTokenValid(true);
          } else {
            setErrors({ 
              general: 'This password reset link is invalid or has expired. Please request a new one.' 
            });
            setTokenValid(false);
          }
        } catch (error) {
          console.error('Token verification error:', error);
          setErrors({ 
            general: 'Unable to verify reset link. Please request a new password reset.' 
          });
          setTokenValid(false);
        }
      }
      setCheckingToken(false);
    };

    checkResetToken();
  }, [searchParams]);

  const validateRequestForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!requestData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(requestData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateResetForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Password validation
    if (!resetData.password) {
      newErrors.password = 'Password is required';
    } else if (resetData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(resetData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and a number';
    }

    // Confirm password validation
    if (!resetData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (resetData.password !== resetData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateRequestForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const supabase = createBrowserClient();

      // Request password reset
      const { error } = await supabase.auth.resetPasswordForEmail(requestData.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        if (error.message.includes('Rate limit')) {
          setErrors({ 
            general: 'Too many reset attempts. Please wait a few minutes before trying again.' 
          });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      // Show success message even if email doesn't exist (security best practice)
      setSuccessMessage(
        'If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder.'
      );
      
      // Clear the form
      setRequestData({ email: '' });
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateResetForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const supabase = createBrowserClient();

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: resetData.password,
      });

      if (error) {
        if (error.message.includes('same as the old')) {
          setErrors({ 
            general: 'New password must be different from your current password.' 
          });
        } else {
          setErrors({ general: error.message });
        }
        return;
      }

      // Password updated successfully
      setSuccessMessage('Password updated successfully! Redirecting to sign in...');
      
      // Sign out to ensure clean state
      await supabase.auth.signOut();
      
      // Redirect to sign in with success message
      setTimeout(() => {
        router.push('/auth/signin?reset=true');
      }, 2000);
    } catch (error) {
      console.error('Password update error:', error);
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestInputChange = (field: keyof RequestFormData, value: string) => {
    setRequestData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleResetInputChange = (field: keyof ResetFormData, value: string) => {
    setResetData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (checkingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-marian-blue"></div>
            </div>
            <p className="mt-4 text-center text-sm text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo/Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-marian-blue">
            <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-serif font-bold text-gray-900">
            {stage === 'request' ? 'Reset your password' : 'Create new password'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {stage === 'request' 
              ? "Enter your email and we'll send you a reset link"
              : 'Choose a strong password for your account'
            }
          </p>
        </div>

        {/* Form Container */}
        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
          {stage === 'request' ? (
            <form className="space-y-6" onSubmit={handleRequestSubmit}>
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>{successMessage}</div>
                  </div>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={requestData.email}
                  onChange={(e) => handleRequestInputChange('email', e.target.value)}
                  className={`mt-1 block w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marian-blue focus:border-marian-blue sm:text-sm`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  loading={loading}
                  disabled={loading || !!successMessage}
                  className="w-full"
                >
                  {loading ? 'Sending reset link...' : 'Send Reset Link'}
                </Button>
              </div>

              {/* Back to Sign In */}
              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm font-medium text-marian-blue hover:text-blue-700"
                >
                  ← Back to sign in
                </Link>
              </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleResetSubmit}>
              {/* Success Message */}
              {successMessage && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
                  <div className="flex">
                    <svg className="h-5 w-5 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>{successMessage}</div>
                  </div>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {errors.general}
                </div>
              )}

              {tokenValid && (
                <>
                  {/* New Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={resetData.password}
                        onChange={(e) => handleResetInputChange('password', e.target.value)}
                        className={`block w-full px-3 py-2 border ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marian-blue focus:border-marian-blue sm:text-sm pr-10`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Must be at least 8 characters with uppercase, lowercase, and a number
                    </p>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={resetData.confirmPassword}
                        onChange={(e) => handleResetInputChange('confirmPassword', e.target.value)}
                        className={`block w-full px-3 py-2 border ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marian-blue focus:border-marian-blue sm:text-sm pr-10`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div>
                    <Button
                      type="submit"
                      variant="primary"
                      size="large"
                      loading={loading}
                      disabled={loading || !!successMessage}
                      className="w-full"
                    >
                      {loading ? 'Updating password...' : 'Update Password'}
                    </Button>
                  </div>
                </>
              )}

              {/* Request New Link */}
              {!tokenValid && (
                <div className="text-center space-y-4">
                  <Link
                    href="/auth/reset-password"
                    className="inline-block px-4 py-2 border border-marian-blue text-marian-blue rounded-md hover:bg-blue-50"
                  >
                    Request New Reset Link
                  </Link>
                  <div>
                    <Link
                      href="/auth/signin"
                      className="text-sm font-medium text-gray-600 hover:text-gray-900"
                    >
                      ← Back to sign in
                    </Link>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            <svg className="inline-block h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
            </svg>
            Password reset links expire after 1 hour for security
          </p>
        </div>
      </div>
    </div>
  );
}

// Main export wraps the component in Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-100">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
              <p className="mt-4 text-center text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}