// components/layout/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/Button';
import { ChevronDown, User as UserIcon, LogOut, Settings, Heart, FileText, Plus, Menu, X } from 'lucide-react';

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();
    
    // Check initial auth state
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          
          // Try to get the user's name from profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, full_name')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUserName(profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() || session.user.email?.split('@')[0] || 'User');
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
          .select('first_name, last_name, full_name')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() || session.user.email?.split('@')[0] || 'User');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
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
    <nav className="border-b border-vatican-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left side - Logo and Nav Links */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link 
                href="/" 
                className="font-serif text-2xl text-marian-500 hover:text-marian-600 transition-colors duration-200"
              >
                GatherMemorials
              </Link>
            </div>
            <div className="hidden sm:flex sm:space-x-8">
              <Link 
                href="/" 
                className={`${isActive('/') ? 'text-marian-500 border-b-2 border-marian-500' : 'text-vatican-700 hover:text-marian-500'} px-3 py-2 text-sm font-medium transition-colors duration-200 inline-flex items-center`}
              >
                Home
              </Link>
              <Link 
                href="/how-it-works" 
                className={`${isActive('/how-it-works') ? 'text-marian-500 border-b-2 border-marian-500' : 'text-vatican-700 hover:text-marian-500'} px-3 py-2 text-sm font-medium transition-colors duration-200 inline-flex items-center`}
              >
                How It Works
              </Link>
              <Link 
                href="/pricing" 
                className={`${isActive('/pricing') ? 'text-marian-500 border-b-2 border-marian-500' : 'text-vatican-700 hover:text-marian-500'} px-3 py-2 text-sm font-medium transition-colors duration-200 inline-flex items-center`}
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
                <Link href="/memorials/new">
                  <Button variant="primary" size="sm" className="flex items-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>Create Memorial</span>
                  </Button>
                </Link>

                {/* User Dropdown */}
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 text-vatican-700 hover:text-marian-500 px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md hover:bg-vatican-50"
                  >
                    <div className="w-8 h-8 bg-marian-100 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-marian-600" />
                    </div>
                    <span className="hidden md:block max-w-[150px] truncate">{userName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
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
                          <FileText className="w-4 h-4 mr-3 text-gray-400" />
                          My Memorials
                        </Link>
                        
                        <Link
                          href="/account/prayer-list"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Heart className="w-4 h-4 mr-3 text-gray-400" />
                          Prayer List
                        </Link>
                        
                        <Link
                          href="/account/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-400" />
                          Settings
                        </Link>
                        
                        <hr className="my-1 border-gray-100" />
                        
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
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
                  className="text-vatican-700 hover:text-marian-500 px-4 py-2 text-sm font-medium transition-colors duration-200 border border-vatican-300 rounded-md hover:border-marian-500"
                >
                  Log In
                </Link>
                <Link 
                  href="/auth/signup" 
                  className="bg-marian-500 text-white hover:bg-marian-600 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
              className="text-vatican-700 hover:text-marian-500 p-2"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
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
              className={`${isActive('/') ? 'bg-marian-50 text-marian-600' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/how-it-works"
              className={`${isActive('/how-it-works') ? 'bg-marian-50 text-marian-600' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="/pricing"
              className={`${isActive('/pricing') ? 'bg-marian-50 text-marian-600' : 'text-gray-700 hover:bg-gray-50'} block px-3 py-2 rounded-md text-base font-medium`}
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
                  className="flex items-center px-3 py-2 text-base font-medium text-marian-600 hover:bg-marian-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="w-5 h-5 mr-3" />
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
                  <Heart className="w-5 h-5 mr-3" />
                  Prayer List
                </Link>
                <Link
                  href="/account/settings"
                  className="flex items-center px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md text-left"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/signin"
                  className="block w-full text-center px-3 py-2 text-base font-medium text-vatican-700 hover:bg-gray-50 border border-vatican-300 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block w-full text-center px-3 py-2 text-base font-medium text-white bg-marian-500 hover:bg-marian-600 rounded-md"
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