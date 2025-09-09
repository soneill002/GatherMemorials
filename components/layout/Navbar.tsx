// components/layout/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

} ${profile.last_name || ''}`.trim();
            setUserName(fullName || session.user.email?.split('@')[0] || 'User');
          } else {
            setUserName(session.user.email?.split('@')[0] || 'User');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // Update user name when auth state changes
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          setUserName(fullName || session.user.email?.split('@')[0] || 'User');
        }
      } else {
        setUserName('');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    setShowDropdown(false);
    setMobileMenuOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown && !(event.target as Element).closest('.user-dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  // Check if current page is active
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo and Nav Links */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="font-serif text-2xl text-blue-600 hover:text-blue-700 transition-colors duration-200"
              >
                GatherMemorials
              </Link>
            </div>
            <div className="hidden sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`${
                  isActive('/') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                } px-3 py-2 text-sm font-medium transition-colors duration-200 inline-flex items-center`}
              >
                Home
              </Link>
              <Link 
                href="/how-it-works" 
                className={`${
                  isActive('/how-it-works') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                } px-3 py-2 text-sm font-medium transition-colors duration-200 inline-flex items-center`}
              >
                How It Works
              </Link>
              <Link 
                href="/pricing" 
                className={`${
                  isActive('/pricing') 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-700 hover:text-blue-600'
                } px-3 py-2 text-sm font-medium transition-colors duration-200 inline-flex items-center`}
              >
                Pricing
              </Link>
            </div>
          </div>

          {/* Right side - Auth Section */}
          <div className="hidden sm:flex sm:items-center sm:space-x-3">
            {loading ? (
              <div className="animate-pulse flex space-x-3">
                <div className="h-9 w-20 bg-gray-200 rounded"></div>
                <div className="h-9 w-20 bg-gray-200 rounded"></div>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                {/* Create Memorial Button */}
                <Link 
                  href="/memorials/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  <span>Create Memorial</span>
                </Link>

                {/* User Dropdown */}
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-gray-50"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="hidden md:block max-w-[150px] truncate">{userName}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        
                        <Link
                          href="/account"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
                          My Dashboard
                        </Link>
                        
                        <Link
                          href="/account/memorials"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <FileTextIcon className="w-4 h-4 mr-3 text-gray-400" />
                          My Memorials
                        </Link>
                        
                        <Link
                          href="/account/prayer-list"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <HeartIcon className="w-4 h-4 mr-3 text-gray-400" />
                          Prayer List
                        </Link>
                        
                        <Link
                          href="/account/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <SettingsIcon className="w-4 h-4 mr-3 text-gray-400" />
                          Settings
                        </Link>
                        
                        <hr className="my-1 border-gray-100" />
                        
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                        >
                          <LogOutIcon className="w-4 h-4 mr-3" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <Link 
                  href="/auth/signin" 
                  className="text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-colors duration-200 border border-gray-300 rounded-md hover:border-blue-600"
                >
                  Log In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden">
            <button 
              type="button" 
              className="text-gray-700 hover:text-blue-600 p-2"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XIcon className="h-6 w-6" />
              ) : (
                <MenuIcon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className={`${
                isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/how-it-works"
              className={`${
                isActive('/how-it-works') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className={`${
                isActive('/pricing') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
          </div>

          {/* Mobile Auth Section */}
          <div className="border-t border-gray-200 px-2 py-3">
            {loading ? (
              <div className="animate-pulse">
                <div className="h-10 bg-gray-200 rounded mb-2"></div>
              </div>
            ) : user ? (
              <div className="space-y-1">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <Link
                  href="/memorials/new"
                  className="flex items-center px-3 py-2 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusIcon className="w-5 h-5 mr-3" />
                  Create Memorial
                </Link>
                <Link
                  href="/account"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon className="w-5 h-5 mr-3" />
                  My Dashboard
                </Link>
                <Link
                  href="/account/prayer-list"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <HeartIcon className="w-5 h-5 mr-3" />
                  Prayer List
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <SettingsIcon className="w-5 h-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md text-left"
                >
                  <LogOutIcon className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/signin"
                  className="block w-full text-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full text-center px-3 py-2 text-base font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Simple icon components to avoid external dependencies
function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}